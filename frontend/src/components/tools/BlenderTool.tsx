import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BlenderToolProps {
  className?: string;
  onClose?: () => void;
}

const BlenderTool: React.FC<BlenderToolProps> = ({ 
  className = '',
  onClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blenderStatus, setBlenderStatus] = useState<string | null>(null);
  const [blenderCommands, setBlenderCommands] = useState<string[]>([]);
  const [sceneInfo, setSceneInfo] = useState<any>(null);
  const [blenderBaseUrl, setBlenderBaseUrl] = useState<string>('/blender');
  const [useMcp, setUseMcp] = useState<boolean>(false);  // Disable MCP by default

  // Check connection status on component mount
  useEffect(() => {
    testAndCheckBlenderConnection();
  }, []);

  // First test the connection to find the right URL pattern
  const testAndCheckBlenderConnection = async () => {
    // Try different base URLs for the blender API
    // First with relative paths, then with absolute paths
    const baseUrls = [
      '/blender',
      '/api/blender',
      'http://localhost:8080/blender',
      'http://localhost:8080/api/blender'
    ];
    
    // Try different ports for direct connections
    // This tests both our backend API and direct socket connections
    const testPorts = async () => {
      const ports = [9334, 8080];
      for (const port of ports) {
        try {
          // Try direct connection to the socket
          console.log(`Testing direct socket connection to localhost:${port}`);
          const socket = new WebSocket(`ws://localhost:${port}`);
          
          // Set a timeout to close the socket if it doesn't connect
          const timeoutId = setTimeout(() => {
            if (socket.readyState !== WebSocket.OPEN) {
              socket.close();
            }
          }, 1000);
          
          // Set up event handlers
          socket.onopen = () => {
            console.log(`WebSocket connection established on port ${port}`);
            clearTimeout(timeoutId);
            socket.close();
          };
          
          socket.onerror = () => {
            console.warn(`WebSocket connection failed on port ${port}`);
            clearTimeout(timeoutId);
          };
        } catch (error) {
          console.warn(`Error testing WebSocket on port ${port}:`, error);
        }
      }
    };
    
    // Try WebSocket connections (non-blocking)
    testPorts();
    
    // Try API endpoints
    let workingBaseUrl: string | null = null;
    
    // Test each base URL with the /test endpoint
    for (const baseUrl of baseUrls) {
      try {
        console.log(`Testing Blender connection at ${baseUrl}/test`);
        const response = await fetch(`${baseUrl}/test`, {
          // Allow CORS for absolute URLs
          mode: baseUrl.startsWith('http') ? 'cors' : 'same-origin'
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          // Don't strictly require JSON content type - some servers might not set it correctly
          const data = await response.json().catch(() => ({ status: 'error' }));
          if (data.status === 'success') {
            console.log(`Found working Blender API at ${baseUrl}`);
            workingBaseUrl = baseUrl;
            
            // Now test direct socket connection to Blender
            try {
              console.log(`Testing Blender socket at ${baseUrl}/socket_test`);
              const socketResponse = await fetch(`${baseUrl}/socket_test`, {
                mode: baseUrl.startsWith('http') ? 'cors' : 'same-origin'
              });
              
              if (socketResponse.ok) {
                const socketData = await socketResponse.json().catch(() => ({ status: 'error' }));
                if (socketData.status === 'success' && socketData.connected === true) {
                  console.log('Blender socket connection test succeeded');
                  // Blender is running and we have a good API URL
                  break;
                } else {
                  console.warn('Blender socket connection test failed:', socketData.message);
                  // We found a working API but Blender isn't connected yet
                  // Continue using this API
                }
              }
            } catch (socketError) {
              console.warn('Error testing Blender socket:', socketError);
              // Still use this API even if socket test fails
            }
            
            break;
          }
        }
      } catch (error) {
        console.warn(`URL ${baseUrl} failed:`, error);
      }
    }
    
    if (workingBaseUrl) {
      // Set the working URL and check connection
      setBlenderBaseUrl(workingBaseUrl);
      checkBlenderConnection(workingBaseUrl);
    } else {
      console.error('Could not find working Blender API URL');
      setConnectionStatus('disconnected');
      setErrorMessage('Failed to connect to Blender API. Ensure the backend server is running and the Blender addon is active.');
    }
  };

  // Check if blender is connected
  const checkBlenderConnection = async (baseUrl: string = blenderBaseUrl) => {
    try {
      console.log(`Checking Blender connection at ${baseUrl}/status`);
      const response = await fetch(`${baseUrl}/status`, {
        // Allow CORS for absolute URLs
        mode: baseUrl.startsWith('http') ? 'cors' : 'same-origin'
      });
      
      if (!response.ok) {
        console.warn(`Blender status endpoint returned ${response.status}`);
        setConnectionStatus('disconnected');
        return;
      }
      
      // Try to parse as JSON, but don't fail if it's not
      try {
        const status = await response.json();
        
        if (status.connected) {
          setIsConnected(true);
          setConnectionStatus('connected');
          setBlenderStatus("Connected to Blender");
          // Get scene info
          getSceneInfo();
        } else {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setErrorMessage(status.message || "Blender is not connected. Make sure the Blender addon is running.");
        }
      } catch (jsonError) {
        // Handle non-JSON response
        console.warn('Non-JSON response from status endpoint', jsonError);
        const text = await response.text();
        setConnectionStatus('disconnected');
        setErrorMessage(`Unexpected response from server: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error checking Blender connection:', error);
      setConnectionStatus('disconnected');
      setErrorMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test direct WebSocket connection to Blender
  const testDirectBlenderConnection = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        console.log('Testing direct WebSocket connection to Blender on port 9334');
        const socket = new WebSocket('ws://localhost:9334');
        
        // Set a timeout to close the socket if it doesn't connect
        const timeoutId = setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            console.warn('WebSocket connection timeout');
            resolve(false);
          }
        }, 1000);
        
        // Set up event handlers
        socket.onopen = () => {
          console.log('WebSocket connection established directly to Blender');
          clearTimeout(timeoutId);
          socket.close();
          resolve(true);
        };
        
        socket.onerror = () => {
          console.warn('WebSocket connection failed to Blender');
          clearTimeout(timeoutId);
          resolve(false);
        };
      } catch (error) {
        console.warn('Error testing WebSocket to Blender:', error);
        resolve(false);
      }
    });
  };

  // Connect to Blender
  const connectToBlender = async () => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage(null);
      
      // Instead of direct WebSocket check, use the socket_test endpoint
      console.log(`Testing socket connection via API at ${blenderBaseUrl}/socket_test`);
      let isBlenderRunning = false;
      
      try {
        const socketResponse = await fetch(`${blenderBaseUrl}/socket_test`, {
          mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
        });
        
        if (socketResponse.ok) {
          const socketData = await socketResponse.json();
          isBlenderRunning = socketData.status === 'success' && socketData.connected === true;
          console.log(`Socket test via API: ${isBlenderRunning ? 'SUCCESS' : 'FAILED'}`);
        }
      } catch (socketError) {
        console.warn('Error testing Blender socket via API:', socketError);
      }
      
      // If API socket test failed, try direct connection as fallback
      if (!isBlenderRunning) {
        isBlenderRunning = await testDirectBlenderConnection();
      }
      
      if (!isBlenderRunning) {
        setConnectionStatus('error');
        setErrorMessage("Blender is not running or the addon is not active. Please start Blender, enable the addon, and click 'Connect to Dolphinoko' in the Blender UI.");
        return;
      }
      
      console.log(`Connecting to Blender at ${blenderBaseUrl}/connect`);
      const response = await fetch(`${blenderBaseUrl}/connect`, {
        // Allow CORS for absolute URLs
        mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
      });
      
      // Try to parse as JSON, but don't fail if it's not
      try {
        const result = await response.json();
        
        if (result.status === 'success') {
          setIsConnected(true);
          setConnectionStatus('connected');
          setBlenderStatus("Connected to Blender");
          
          // Get scene info after connecting
          getSceneInfo();
          
          // Check MCP info
          checkMcpInfo();
        } else {
          setConnectionStatus('error');
          setErrorMessage(result.message || "Failed to connect to Blender. Make sure it's running with the addon activated.");
        }
      } catch (jsonError) {
        // Handle non-JSON response
        console.warn('Non-JSON response from connect endpoint', jsonError);
        const text = await response.text();
        
        if (response.ok && text.includes('success')) {
          // Assume success even without proper JSON
          setIsConnected(true);
          setConnectionStatus('connected');
          setBlenderStatus("Connected to Blender");
          getSceneInfo();
        } else {
          setConnectionStatus('error');
          setErrorMessage(`Unexpected response from server: ${text.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.error('Error connecting to Blender:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  // Check MCP info to see if Blender is in the models list
  const checkMcpInfo = async () => {
    try {
      // Extract base origin from the blenderBaseUrl
      const baseOrigin = blenderBaseUrl.startsWith('http') 
        ? blenderBaseUrl.split('/').slice(0, 3).join('/') 
        : window.location.origin;
      
      const mcpInfoUrl = `${baseOrigin}/mcp/info`;
      console.log(`Checking MCP info at ${mcpInfoUrl}`);
      
      const response = await fetch(mcpInfoUrl, {
        mode: baseOrigin !== window.location.origin ? 'cors' : 'same-origin'
      });
      
      if (!response.ok) {
        console.warn('MCP info endpoint returned error:', response.status);
        return;
      }
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.models && data.models.includes('blender')) {
            console.log('Blender is available in MCP models');
          } else {
            console.warn('Blender not found in MCP models:', data.models);
          }
        } else {
          console.warn('MCP info endpoint returned non-JSON response');
          const text = await response.text();
          console.warn('Response text:', text.substring(0, 100));
        }
      } catch (jsonError) {
        console.warn('MCP info endpoint returned invalid JSON', jsonError);
      }
    } catch (error) {
      console.error('Error checking MCP info:', error);
    }
  };
  
  // Get scene info from Blender
  const getSceneInfo = async () => {
    try {
      console.log(`Getting scene info from ${blenderBaseUrl}/scene`);
      const response = await fetch(`${blenderBaseUrl}/scene`, {
        mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
      });
      
      if (!response.ok) {
        console.warn(`Scene info endpoint returned ${response.status}`);
        return;
      }
      
      try {
        const sceneData = await response.json();
        
        // Some Blender endpoints might return direct result objects without a status field
        if (sceneData.status === 'success' && sceneData.result) {
          setSceneInfo(sceneData.result);
          setBlenderStatus(`Blender scene: ${sceneData.result.scene_name} with ${sceneData.result.object_count} objects`);
        } 
        // Direct result with scene_name (likely direct result object)
        else if (sceneData.scene_name) {
          setSceneInfo(sceneData);
          setBlenderStatus(`Blender scene: ${sceneData.scene_name} with ${sceneData.object_count || 0} objects`);
        }
        else if (sceneData.status === 'error') {
          console.error('Error getting scene info:', sceneData.message);
        }
        else {
          console.warn('Unexpected scene info format:', sceneData);
        }
      } catch (jsonError) {
        console.warn('Scene info endpoint returned non-JSON response', jsonError);
        const text = await response.text();
        console.warn('Response text:', text.substring(0, 100));
      }
    } catch (error) {
      console.error('Error fetching scene info:', error);
    }
  };

  // Execute code in Blender
  const executeBlenderCode = async (code: string) => {
    try {
      console.log(`Executing code in Blender at ${blenderBaseUrl}/execute`);
      const response = await fetch(`${blenderBaseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code }),
        mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      try {
        const result = await response.json();
        return result;
      } catch (jsonError) {
        console.warn('Non-JSON response from execute endpoint', jsonError);
        const text = await response.text();
        return { status: 'error', message: `Invalid response: ${text.substring(0, 100)}...` };
      }
    } catch (error) {
      console.error('Error executing code in Blender:', error);
      throw error;
    }
  };

  // Create object in Blender
  const createObject = async (objectType: string, name?: string, location?: number[]) => {
    try {
      console.log(`Creating object in Blender at ${blenderBaseUrl}/objects`);
      const response = await fetch(`${blenderBaseUrl}/objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          object_type: objectType,
          name: name,
          location: location || [0, 0, 0]
        }),
        mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      try {
        const result = await response.json();
        return result;
      } catch (jsonError) {
        console.warn('Non-JSON response from objects endpoint', jsonError);
        const text = await response.text();
        return { status: 'error', message: `Invalid response: ${text.substring(0, 100)}...` };
      }
    } catch (error) {
      console.error('Error creating object in Blender:', error);
      throw error;
    }
  };

  // Send a command to Blender - parse natural language commands
  const sendBlenderCommand = async (command: string) => {
    try {
      // Add command to history
      setBlenderCommands(prev => [...prev, command]);
      
      // Try both methods - use the direct API for UI feedback
      const directApiPromise = handleDirectCommand(command);
      
      // Also try the MCP route for AI integration (only if enabled)
      if (useMcp) {
        try {
          // Extract base origin from the blenderBaseUrl
          const baseOrigin = blenderBaseUrl.startsWith('http') 
            ? blenderBaseUrl.split('/').slice(0, 3).join('/') 
            : window.location.origin;
          
          const mcpUrl = `${baseOrigin}/mcp/raw`;
          console.log(`Sending MCP command to ${mcpUrl}`);
          
          const mcpPromise = fetch(mcpUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "blender",
              messages: [
                {
                  role: "user",
                  content: command
                }
              ]
            }),
            mode: baseOrigin !== window.location.origin ? 'cors' : 'same-origin'
          });
          
          // Don't wait for MCP response, but log it
          mcpPromise.then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
            }
            return res.json();
          }).then(data => {
            console.log('MCP Blender response:', data);
          }).catch(err => {
            console.warn('MCP Blender error:', err);
          });
        } catch (mcpError) {
          console.warn('Failed to send command via MCP:', mcpError);
        }
      }
      
      // Wait for direct API result for UI feedback
      return await directApiPromise;
    } catch (error) {
      console.error('Error sending command to Blender:', error);
      setBlenderStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { status: 'error', error: String(error) };
    }
  };
  
  // Handle command through direct API
  const handleDirectCommand = async (command: string) => {
    // Handle basic commands directly
    const lowerCommand = command.toLowerCase();
    let result;
    
    if (lowerCommand.includes('create cube') || lowerCommand.includes('add cube')) {
      result = await createObject('CUBE', 'Cube_' + Math.floor(Math.random() * 1000));
      setBlenderStatus(`Created cube: ${result.result?.name || 'unknown'}`);
    }
    else if (lowerCommand.includes('create sphere') || lowerCommand.includes('add sphere')) {
      result = await createObject('SPHERE', 'Sphere_' + Math.floor(Math.random() * 1000));
      setBlenderStatus(`Created sphere: ${result.result?.name || 'unknown'}`);
    }
    else if (lowerCommand.includes('create plane') || lowerCommand.includes('add plane')) {
      result = await createObject('PLANE', 'Plane_' + Math.floor(Math.random() * 1000));
      setBlenderStatus(`Created plane: ${result.result?.name || 'unknown'}`);
    }
    else if (lowerCommand.includes('create cylinder') || lowerCommand.includes('add cylinder')) {
      result = await createObject('CYLINDER', 'Cylinder_' + Math.floor(Math.random() * 1000));
      setBlenderStatus(`Created cylinder: ${result.result?.name || 'unknown'}`);
    }
    else if (lowerCommand.includes('set render engine') || lowerCommand.includes('change render engine')) {
      const engine = lowerCommand.includes('cycles') ? 'CYCLES' : 'BLENDER_EEVEE';
      result = await executeBlenderCode(`bpy.context.scene.render.engine = '${engine}'; result = f"Render engine set to {bpy.context.scene.render.engine}"`);
      setBlenderStatus(result.result || 'Command executed');
    }
    else if (lowerCommand.includes('add light') || lowerCommand.includes('create light')) {
      // Determine light type
      let lightType = 'POINT';
      if (lowerCommand.includes('sun')) lightType = 'SUN';
      if (lowerCommand.includes('area')) lightType = 'AREA';
      if (lowerCommand.includes('spot')) lightType = 'SPOT';
      
      result = await executeBlenderCode(`
bpy.ops.object.light_add(type='${lightType}', location=(0, 0, 3))
light = bpy.context.active_object
light.name = '${lightType}_Light'
result = f"Created {light.name}"
`);
      setBlenderStatus(result.result || 'Light created');
    }
    else if (lowerCommand.includes('add camera') || lowerCommand.includes('create camera')) {
      result = await executeBlenderCode(`
bpy.ops.object.camera_add(location=(0, -10, 3), rotation=(1.2, 0, 0))
camera = bpy.context.active_object
bpy.context.scene.camera = camera
result = f"Created camera: {camera.name} and set as active camera"
`);
      setBlenderStatus(result.result || 'Camera created');
    }
    else if (lowerCommand.includes('subdivision') || lowerCommand.includes('add modifier')) {
      result = await executeBlenderCode(`
obj = bpy.context.active_object
if obj and obj.type == 'MESH':
    mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    mod.levels = 2
    result = f"Added subdivision modifier to {obj.name}"
else:
    result = "No active mesh object selected"
`);
      setBlenderStatus(result.result || 'Modifier added');
    }
    else if (lowerCommand.includes('show materials') || lowerCommand.includes('list materials')) {
      try {
        const materialsResponse = await fetch(`${blenderBaseUrl}/materials`, {
          mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
        });
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          if (materialsData.status === 'success') {
            const materialNames = materialsData.result.map((mat: any) => mat.name).join(', ');
            setBlenderStatus(`Materials: ${materialNames || 'None'}`);
          } else {
            setBlenderStatus(`Error getting materials: ${materialsData.message}`);
          }
        } else {
          setBlenderStatus(`Error getting materials: ${materialsResponse.status}`);
        }
      } catch (error) {
        setBlenderStatus(`Error listing materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    else if (lowerCommand.includes('show objects') || lowerCommand.includes('list objects')) {
      try {
        const objectsResponse = await fetch(`${blenderBaseUrl}/objects`, {
          mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
        });
        if (objectsResponse.ok) {
          const objectsData = await objectsResponse.json();
          if (objectsData.status === 'success') {
            const objectNames = objectsData.result.map((obj: any) => obj.name).join(', ');
            setBlenderStatus(`Objects: ${objectNames || 'None'}`);
          } else {
            setBlenderStatus(`Error getting objects: ${objectsData.message}`);
          }
        } else {
          setBlenderStatus(`Error getting objects: ${objectsResponse.status}`);
        }
      } catch (error) {
        setBlenderStatus(`Error listing objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    else if (lowerCommand.includes('studio lighting') || lowerCommand.includes('set lighting to studio')) {
      try {
        const lightingResponse = await fetch(`${blenderBaseUrl}/lighting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lighting_type: 'STUDIO' }),
          mode: blenderBaseUrl.startsWith('http') ? 'cors' : 'same-origin'
        });
        if (lightingResponse.ok) {
          const lightingData = await lightingResponse.json();
          if (lightingData.status === 'success') {
            setBlenderStatus('Applied studio lighting');
          } else {
            setBlenderStatus(`Error applying lighting: ${lightingData.message}`);
          }
        } else {
          setBlenderStatus(`Error applying lighting: ${lightingResponse.status}`);
        }
      } catch (error) {
        setBlenderStatus(`Error applying lighting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    else {
      // For any other command, execute it as Python code
      try {
        result = await executeBlenderCode(`
try:
    # Try your best to execute this command
    ${command}
    result = "Command executed successfully"
except Exception as e:
    result = f"Error: {str(e)}"
`);
        setBlenderStatus(result.result || 'Command executed');
      } catch (error) {
        setBlenderStatus(`Error: Could not execute command`);
      }
    }
    
    // Refresh scene info after command
    getSceneInfo();
    
    return { status: 'success' };
  };

  // Example commands for Blender
  const exampleCommands = [
    'Create a cube',
    'Create a sphere',
    'Set render engine to Cycles',
    'Add a sun light',
    'Apply subdivision to selected object',
    'Show materials',
    'Studio lighting'
  ];

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <div className={`farm-panel ${className}`}>
      <div className="farm-panel-title flex items-center">
        <span className="mr-2">📐</span>
        Blender Integration
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-auto p-1 hover:bg-farm-brown-dark rounded-full"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="farm-panel-content p-4">
        {/* Connection status */}
        <motion.div 
          variants={itemVariants}
          className="mb-4"
        >
          <div className="flex items-center mb-2 bg-farm-brown-light/30 p-2 rounded-md">
            <div 
              className={`w-3 h-3 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-farm-green' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} 
            />
            <span className="text-sm font-medium text-farm-brown-dark">
              {connectionStatus === 'connected' ? 'Connected to Blender' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Disconnected'}
            </span>
          </div>
          
          {errorMessage && (
            <p className="text-sm text-red-500 mb-2 p-2 bg-red-100 rounded-md">{errorMessage}</p>
          )}
          
          {!isConnected && (
            <motion.button
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={connectToBlender}
              className="w-full mt-2 bg-farm-green hover:bg-farm-green-dark text-white py-2 px-4 font-medium rounded-md flex items-center justify-center border border-farm-green-dark transition-colors"
              disabled={connectionStatus === 'connecting'}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Blender'}
            </motion.button>
          )}

          {/* Scene info */}
          {isConnected && sceneInfo && (
            <div className="mt-3 text-xs text-farm-brown bg-white p-2 rounded-md border border-farm-brown-light">
              <p><strong>Scene:</strong> {sceneInfo.scene_name}</p>
              <p><strong>Objects:</strong> {sceneInfo.object_count}</p>
              <p><strong>Render:</strong> {sceneInfo.render_engine}</p>
            </div>
          )}
        </motion.div>
        
        {/* Command interface - only show when connected */}
        {isConnected && (
          <div>
            <motion.div 
              variants={itemVariants}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                Blender Command
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  className="flex-grow px-3 py-2 border border-farm-brown rounded-l-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown"
                  placeholder="Enter Blender command..."
                  id="blender-command"
                />
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-2 bg-farm-blue hover:bg-farm-blue-dark text-white rounded-r-md border border-farm-blue-dark"
                  onClick={() => {
                    const commandInput = document.getElementById('blender-command') as HTMLInputElement;
                    if (commandInput && commandInput.value) {
                      sendBlenderCommand(commandInput.value);
                      commandInput.value = '';
                    }
                  }}
                >
                  Send
                </motion.button>
              </div>
            </motion.div>
            
            {/* Status display */}
            {blenderStatus && (
              <motion.div 
                variants={itemVariants}
                className="mb-4 p-3 bg-farm-brown-light/30 border border-farm-brown-light rounded-md"
              >
                <p className="text-sm text-farm-brown-dark">{blenderStatus}</p>
              </motion.div>
            )}
            
            {/* Example commands */}
            <motion.div 
              variants={itemVariants}
              className="mb-4"
            >
              <h3 className="text-sm font-medium text-farm-brown-dark mb-2">Example Commands:</h3>
              <div className="flex flex-wrap gap-2">
                {exampleCommands.map((command, index) => (
                  <motion.button
                    key={index}
                    variants={itemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="text-xs px-3 py-1.5 rounded-md bg-farm-blue-light hover:bg-farm-blue text-farm-brown border border-farm-blue"
                    onClick={() => sendBlenderCommand(command)}
                  >
                    {command}
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            {/* Command history */}
            {blenderCommands.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-medium text-farm-brown-dark mb-2">Command History:</h3>
                <div className="max-h-40 overflow-y-auto border border-farm-brown-light rounded-md bg-white">
                  <ul className="divide-y divide-farm-brown-light/50">
                    {blenderCommands.map((cmd, index) => (
                      <li key={index} className="px-3 py-2 text-sm hover:bg-farm-brown-light/20 text-farm-brown">
                        {cmd}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlenderTool; 