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

  // Connect to Blender via MCP
  const connectToBlender = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Test connection to MCP server
      const response = await fetch('/mcp/test');
      if (!response.ok) {
        throw new Error('Failed to connect to MCP server');
      }
      
      // If successful, check if Blender is available
      const checkBlender = await fetch('/mcp/info');
      const infoData = await checkBlender.json();
      
      if (infoData?.models && infoData.models.some((model: any) => model.name.toLowerCase().includes('blender'))) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setBlenderStatus("Blender connected");
      } else {
        setConnectionStatus('error');
        setErrorMessage("Blender MCP not detected. Please make sure Blender is running with the MCP add-on installed.");
      }
    } catch (error) {
      console.error('Error connecting to Blender:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Send a command to Blender via MCP
  const sendBlenderCommand = async (command: string) => {
    try {
      // Add command to history
      setBlenderCommands(prev => [...prev, command]);
      
      // Prepare the MCP message
      const request = {
        model: "blender",
        messages: [
          {
            role: "user",
            content: command
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      };
      
      const response = await fetch('/mcp/raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      // Update status with response
      if (data.error) {
        setBlenderStatus(`Error: ${data.error}`);
      } else if (data.choices && data.choices[0].message) {
        setBlenderStatus(`Command executed: ${data.choices[0].message.content}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error sending command to Blender:', error);
      setBlenderStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Example commands for Blender
  const exampleCommands = [
    'Create a cube at origin',
    'Set render engine to Cycles',
    'Add a sun light to the scene',
    'Apply subdivision surface to selected object',
    'Show available materials'
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