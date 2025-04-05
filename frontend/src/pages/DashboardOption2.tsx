import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import BlenderTool from '../components/tools/BlenderTool';
import ChatBox from '../components/chat/ChatBox';

// Dashboard Option 2: API & Package Integration Focus
// This design emphasizes package installations and MCP connections
// with a terminal-like interface for more advanced operations

const DashboardOption2: React.FC = () => {
  const navigate = useNavigate();
  const { tools } = useTools();
  const { characters, selectedCharacter, setSelectedCharacter, updateCharacter } = useCharacter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBlenderTool, setShowBlenderTool] = useState(false);
  const chatBoxRef = React.useRef<any>(null);
  
  // Terminal state
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Welcome to Dolphinoko Package Manager",
    "Type 'help' to see available commands"
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  
  // Package installation state
  const [packageUrl, setPackageUrl] = useState('');
  const [installedPackages, setInstalledPackages] = useState<Array<{name: string, version: string, type: string}>>([
    { name: 'dolphin-mcp', version: '1.0.0', type: 'core' },
    { name: 'ollama-api', version: '2.1.3', type: 'model' },
    { name: 'blender-connector', version: '0.8.2', type: 'integration' },
  ]);
  
  // Connect states
  const [connections, setConnections] = useState<Array<{name: string, status: 'connected' | 'disconnected', icon: string}>>([
    { name: 'Ollama', status: 'connected', icon: '🧠' },
    { name: 'Blender', status: 'disconnected', icon: '📐' },
    { name: 'Neo4j', status: 'disconnected', icon: '🔄' },
  ]);
  
  // Handle terminal command
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    
    const cmd = terminalInput.trim();
    const cmdOutput: string[] = [`> ${cmd}`];
    
    // Simple command handling
    if (cmd === 'help') {
      cmdOutput.push(
        "Available commands:",
        "help               - Show this help message",
        "clear              - Clear terminal",
        "list               - List installed packages",
        "install <package>  - Install a package",
        "connect <service>  - Connect to a service (blender, neo4j)",
        "status             - Show connection status"
      );
    } else if (cmd === 'clear') {
      setTerminalOutput([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'list') {
      cmdOutput.push("Installed packages:");
      installedPackages.forEach(pkg => {
        cmdOutput.push(`${pkg.name} (${pkg.version}) - ${pkg.type}`);
      });
    } else if (cmd.startsWith('install ')) {
      const pkgName = cmd.substring(8).trim();
      if (pkgName) {
        cmdOutput.push(`Installing ${pkgName}...`);
        cmdOutput.push(`Successfully installed ${pkgName}!`);
        
        // Add to installed packages
        setInstalledPackages(prev => [
          ...prev, 
          { name: pkgName, version: '1.0.0', type: 'custom' }
        ]);
      } else {
        cmdOutput.push("Error: Please specify a package name");
      }
    } else if (cmd.startsWith('connect ')) {
      const serviceName = cmd.substring(8).trim();
      
      if (serviceName.toLowerCase() === 'blender') {
        cmdOutput.push("Connecting to Blender...");
        setShowBlenderTool(true);
        
        // Update connection status
        setConnections(prev => prev.map(conn => 
          conn.name === 'Blender' ? { ...conn, status: 'connected' } : conn
        ));
      } else if (serviceName.toLowerCase() === 'neo4j') {
        cmdOutput.push("Connecting to Neo4j...");
        cmdOutput.push("Connection established!");
        
        // Update connection status
        setConnections(prev => prev.map(conn => 
          conn.name === 'Neo4j' ? { ...conn, status: 'connected' } : conn
        ));
      } else {
        cmdOutput.push(`Error: Unknown service '${serviceName}'`);
      }
    } else if (cmd === 'status') {
      cmdOutput.push("Connection status:");
      connections.forEach(conn => {
        cmdOutput.push(`${conn.icon} ${conn.name}: ${conn.status.toUpperCase()}`);
      });
    } else {
      cmdOutput.push(`Unknown command: ${cmd}`);
      cmdOutput.push("Type 'help' to see available commands");
    }
    
    setTerminalOutput(prev => [...prev, ...cmdOutput]);
    setTerminalInput('');
  };
  
  // Handle package install
  const handlePackageInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageUrl.trim()) return;
    
    // Add to installed packages
    setInstalledPackages(prev => [
      ...prev, 
      { 
        name: packageUrl.includes('/') 
          ? packageUrl.split('/').pop() || 'unknown' 
          : packageUrl, 
        version: '1.0.0', 
        type: 'github' 
      }
    ]);
    
    setPackageUrl('');
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  const slideVariants = {
    hidden: { x: "100%" },
    visible: { 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
      x: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };
  
  return (
    <MainLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto p-6"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <motion.h1 
            className="text-3xl font-bold text-farm-brown-dark retro-text mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <span className="text-2xl mr-2">🌾</span>
            Dolphinoko Workshop
            <span className="text-2xl ml-2">🌾</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-2 text-farm-brown">
            Your farm's advanced tool workshop and package manager
          </motion.p>
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Quick access */}
          <motion.div 
            variants={itemVariants}
            className="col-span-1 lg:col-span-3 farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">🔌</span>
              Connections
            </div>
            <div className="farm-panel-content p-4">
              {/* Connection status */}
              <div className="space-y-3 mb-6">
                {connections.map((connection, index) => (
                  <motion.div 
                    key={index}
                    variants={itemVariants}
                    className="flex items-center justify-between p-2 rounded-md border border-farm-brown-light bg-white"
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{connection.icon}</span>
                      <span className="text-farm-brown-dark">{connection.name}</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-2 ${
                          connection.status === 'connected' ? 'bg-farm-green' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className={`text-xs ${
                        connection.status === 'connected' ? 'text-farm-green-dark' : 'text-red-600'
                      }`}>
                        {connection.status.toUpperCase()}
                      </span>
                      
                      {connection.status === 'disconnected' && (
                        <motion.button
                          variants={itemVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="ml-2 p-1 bg-farm-blue-light hover:bg-farm-blue text-farm-blue-dark hover:text-white rounded text-xs border border-farm-blue"
                          onClick={() => {
                            if (connection.name === 'Blender') {
                              setShowBlenderTool(true);
                              setConnections(prev => prev.map(conn => 
                                conn.name === 'Blender' ? { ...conn, status: 'connected' } : conn
                              ));
                            }
                          }}
                        >
                          Connect
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Package Manager */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-farm-brown-dark mb-3">Package Manager</h3>
                
                <form onSubmit={handlePackageInstall} className="mb-4">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Package URL or name..."
                      className="flex-grow px-3 py-2 border border-farm-brown rounded-l-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown text-sm"
                      value={packageUrl}
                      onChange={(e) => setPackageUrl(e.target.value)}
                    />
                    <motion.button
                      variants={itemVariants}
                      whileHover="hover"
                      whileTap="tap"
                      type="submit"
                      className="px-3 py-2 bg-farm-green hover:bg-farm-green-dark text-white rounded-r-md border border-farm-green-dark"
                    >
                      Install
                    </motion.button>
                  </div>
                </form>
                
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setTerminalVisible(true)}
                  className="w-full bg-farm-brown hover:bg-farm-brown-dark text-white py-2 px-4 font-medium rounded-md flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Open Terminal
                </motion.button>
              </div>
              
              {/* Installed Packages */}
              <div>
                <h3 className="text-sm font-medium text-farm-brown-dark mb-3">Installed Packages</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {installedPackages.map((pkg, index) => (
                    <motion.div 
                      key={index}
                      variants={itemVariants}
                      className={`p-2 rounded-md border text-sm ${
                        pkg.type === 'core' 
                          ? 'bg-farm-blue-light/20 border-farm-blue' 
                          : pkg.type === 'model' 
                            ? 'bg-farm-green-light/20 border-farm-green'
                            : 'bg-white border-farm-brown-light'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-farm-brown-dark">{pkg.name}</div>
                        <div className="text-xs bg-farm-brown-light px-2 py-0.5 rounded-full text-farm-brown">
                          v{pkg.version}
                        </div>
                      </div>
                      <div className="text-xs text-farm-brown mt-1">Type: {pkg.type}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center - Tool grid */}
          <motion.div 
            variants={containerVariants}
            className="col-span-1 lg:col-span-9 farm-panel"
          >
            <div className="farm-panel-title flex items-center">
              <span className="mr-2">🔧</span>
              Tool Dashboard
              <span className="ml-auto">
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  variants={itemVariants}
                  onClick={() => navigate('/tools')}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                >
                  View All Tools
                </motion.button>
              </span>
            </div>
            
            <div className="p-4 farm-panel-content">
              {/* Search bar */}
              <motion.div 
                variants={itemVariants}
                className="relative mb-6"
              >
                <input
                  type="text"
                  placeholder="Search tools or type a command (e.g., /blender, /install)..."
                  className="w-full px-3 py-3 pl-10 text-farm-brown border border-farm-brown rounded-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </motion.div>
              
              {/* Integration Showcase */}
              <motion.div 
                variants={itemVariants}
                className="mb-6"
              >
                <div className="bg-white border border-farm-blue/30 rounded-lg p-4 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-24 h-24 rounded-lg bg-farm-blue-light flex items-center justify-center text-4xl border-2 border-farm-blue">
                      📐
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-farm-brown-dark">MCP Integration Hub</h3>
                      <p className="text-farm-brown mt-1">
                        Connect your tools to external applications like Blender, VSCode, and more using our Model Control Protocol
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <motion.button
                          whileHover="hover"
                          whileTap="tap"
                          variants={itemVariants}
                          onClick={() => setShowBlenderTool(true)}
                          className="bg-farm-blue hover:bg-farm-blue-dark text-white py-2 px-4 rounded-md flex items-center border border-farm-blue-dark"
                        >
                          <span className="mr-2">📐</span>
                          Connect to Blender
                        </motion.button>
                        
                        <motion.button
                          whileHover="hover"
                          whileTap="tap"
                          variants={itemVariants}
                          className="bg-farm-green-light hover:bg-farm-green text-farm-green-dark hover:text-white py-2 px-4 rounded-md flex items-center border border-farm-green"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Add New Connection
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Recent Tools */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-farm-brown-dark mb-3">Recent Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.slice(0, 6).map(tool => (
                    <motion.div
                      key={tool.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className="border border-farm-brown rounded-md p-4 hover:shadow-md transition-shadow duration-200 bg-white cursor-pointer"
                      onClick={() => {
                        if (tool.category === 'blender') {
                          setShowBlenderTool(true);
                          return;
                        }
                        
                        setSelectedTool(tool);
                        
                        // Find related character
                        const relatedCharacter = characters.find(c => c.toolCategory === tool.category);
                        if (relatedCharacter) {
                          setSelectedCharacter(relatedCharacter);
                          setIsChatOpen(true);
                        }
                      }}
                    >
                      <h4 className="font-medium text-farm-brown-dark text-lg">{tool.name}</h4>
                      <p className="text-sm text-farm-brown mt-1 line-clamp-2">{tool.description}</p>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tool.category && (
                          <span className="bg-farm-brown-light/50 px-2 py-1 text-xs rounded-full text-farm-brown">
                            {tool.category}
                          </span>
                        )}
                        <span className="bg-farm-blue-light px-2 py-1 text-xs rounded text-farm-brown">
                          {tool.model}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Quick Setup Guide */}
              <motion.div 
                variants={itemVariants}
                className="bg-farm-brown-light/20 border border-farm-brown-light rounded-lg p-4"
              >
                <h3 className="text-lg font-medium text-farm-brown-dark mb-2">Quick Setup Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md border border-farm-brown-light">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-farm-green-light flex items-center justify-center text-xl mr-2">
                        1
                      </div>
                      <h4 className="font-medium text-farm-brown-dark">Install Package</h4>
                    </div>
                    <p className="text-sm text-farm-brown">
                      Install packages from GitHub or package registry
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-farm-brown-light">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-farm-green-light flex items-center justify-center text-xl mr-2">
                        2
                      </div>
                      <h4 className="font-medium text-farm-brown-dark">Connect Service</h4>
                    </div>
                    <p className="text-sm text-farm-brown">
                      Connect to external services like Blender, Neo4j, etc.
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-farm-brown-light">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-farm-green-light flex items-center justify-center text-xl mr-2">
                        3
                      </div>
                      <h4 className="font-medium text-farm-brown-dark">Create Tool</h4>
                    </div>
                    <p className="text-sm text-farm-brown">
                      Create a new tool that uses your connected services
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Terminal Overlay */}
      <AnimatePresence>
        {terminalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center p-4"
            onClick={() => setTerminalVisible(false)}
          >
            <motion.div 
              className="w-full max-w-3xl max-h-[80vh] bg-black rounded-md overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center bg-farm-brown-dark px-4 py-2">
                <div className="text-white text-sm font-medium">Dolphinoko Terminal</div>
                <button 
                  onClick={() => setTerminalVisible(false)}
                  className="text-white hover:text-white/80"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-black text-green-400 p-4 font-mono text-sm h-96 overflow-y-auto">
                {terminalOutput.map((line, index) => (
                  <div key={index}>
                    {line}
                  </div>
                ))}
                <form onSubmit={handleTerminalCommand} className="mt-2 flex">
                  <span className="mr-2">$</span>
                  <input
                    type="text"
                    className="flex-grow bg-transparent focus:outline-none text-green-400"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    autoFocus
                  />
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Blender Tool Modal */}
      <AnimatePresence>
        {showBlenderTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center p-4"
            onClick={() => setShowBlenderTool(false)}
          >
            <motion.div 
              className="max-w-2xl w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <BlenderTool
                onClose={() => setShowBlenderTool(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat box slide-in */}
      <AnimatePresence>
        {isChatOpen && selectedCharacter && (
          <motion.div 
            className="fixed bottom-0 right-0 w-80 z-30 farm-panel"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="farm-panel-title flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-2"
                style={{ backgroundColor: selectedCharacter.color }}
              >
                {getCharacterEmoji(selectedCharacter.type)}
              </div>
              <span>{selectedCharacter.name}</span>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="ml-auto p-1 hover:bg-farm-brown-dark rounded-full"
              >
                ✕
              </button>
            </div>
            
            <div className="h-96 farm-panel-content overflow-hidden">
              <ChatBox
                ref={chatBoxRef}
                characterName={selectedCharacter.name}
                onSubmit={() => {}}
                characterExpression={selectedCharacter.expression || ''}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

// Helper function to get emoji based on animal type
const getCharacterEmoji = (type: string): string => {
  switch (type) {
    case 'cat': return '🐱';
    case 'dog': return '🐶';
    case 'bird': return '🐦';
    case 'rabbit': return '🐰';
    case 'fox': return '🦊';
    case 'bear': return '🐻';
    default: return '🐾';
  }
};

export default DashboardOption2; 