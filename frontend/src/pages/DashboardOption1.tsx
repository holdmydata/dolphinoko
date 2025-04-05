import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import BlenderTool from '../components/tools/BlenderTool';
import ChatBox from '../components/chat/ChatBox';

// Dashboard Option 1: Enhanced Tool Shed
// This design maintains the farm aesthetic while organizing tools by category
// and adding the Blender integration as a special tool

const DashboardOption1: React.FC = () => {
  const navigate = useNavigate();
  const { tools } = useTools();
  const { characters, selectedCharacter, setSelectedCharacter, updateCharacter } = useCharacter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBlenderTool, setShowBlenderTool] = useState(false);
  const chatBoxRef = React.useRef<any>(null);
  
  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);
  
  // Get category icons/emojis
  const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'assistant': return '🧠';
      case 'web': return '🌐';
      case 'document': return '📄';
      case 'communication': return '💬';
      case 'creative': return '🎨';
      case 'security': return '🔒';
      case 'blender': return '📐';
      case 'uncategorized': return '🔧';
      default: return '🛠️';
    }
  };
  
  // Helper function to update character expression
  const updateCharacterExpression = (characterId: string) => {
    const expressions = ['(◕‿◕)', '(✿◠‿◠)', '(◕ᴗ◕✿)', '(。◕‿◕。)', '(„ᵕᴗᵕ„)', '(≧◡≦)'];
    const newExpression = expressions[Math.floor(Math.random() * expressions.length)];
    updateCharacter(characterId, { expression: newExpression });
  };
  
  // Handle tool selection
  const handleToolSelect = (tool: any) => {
    setSelectedTool(tool);
    
    // Special case for blender tool
    if (tool.category === 'blender' || tool.id === 'blender-connect') {
      setShowBlenderTool(true);
      return;
    }
    
    // Find related character based on tool category
    const relatedCharacter = characters.find(c => c.toolCategory === tool.category);
    if (relatedCharacter) {
      setSelectedCharacter(relatedCharacter);
      updateCharacterExpression(relatedCharacter.id);
      setIsChatOpen(true);
    }
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
            Dolphinoko Dashboard
            <span className="text-2xl ml-2">🌾</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-2 text-farm-brown">
            Your farm of AI tools and assistants ready to help
          </motion.p>
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <motion.div 
            variants={itemVariants}
            className="col-span-1 farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">🪴</span>
              Quick Access
            </div>
            <div className="farm-panel-content p-4">
              {/* Search input */}
              <motion.div 
                variants={itemVariants}
                className="relative mb-6"
                whileHover={{ scale: 1.02 }}
              >
                <input
                  type="text"
                  placeholder="Search tools..."
                  className="w-full px-3 py-2 pl-10 text-sm border border-farm-brown rounded-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </motion.div>
              
              {/* Quick actions */}
              <div className="space-y-4">
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigate('/tools')}
                  className="w-full bg-farm-brown hover:bg-farm-brown-dark text-white py-2.5 px-4 font-medium rounded-md flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                  </svg>
                  Tool Shed
                </motion.button>
                
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigate('/tools/new')}
                  className="w-full bg-farm-green hover:bg-farm-green-dark text-white py-2.5 px-4 font-medium rounded-md flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Tool
                </motion.button>
                
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowBlenderTool(true)}
                  className="w-full bg-farm-blue hover:bg-farm-blue-dark text-white py-2.5 px-4 font-medium rounded-md flex items-center justify-center transition-colors"
                >
                  <span className="mr-2">📐</span>
                  Connect to Blender
                </motion.button>
              </div>
              
              {/* Character selection */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-farm-brown-dark mb-3">Your Assistants</h3>
                <div className="space-y-2">
                  {characters.map(character => (
                    <motion.div
                      key={character.id}
                      variants={itemVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className={`flex items-center p-2 rounded-md cursor-pointer border ${
                        selectedCharacter?.id === character.id 
                          ? 'bg-farm-green-light border-farm-green' 
                          : 'bg-white border-farm-brown-light hover:bg-farm-brown-light/30'
                      }`}
                      onClick={() => {
                        setSelectedCharacter(character);
                        updateCharacterExpression(character.id);
                        setIsChatOpen(true);
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xl mr-3"
                        style={{ backgroundColor: character.color }}
                      >
                        {getCharacterEmoji(character.type)}
                      </div>
                      <div>
                        <div className="font-medium text-farm-brown-dark">{character.name}</div>
                        <div className="text-xs text-farm-brown">{character.role}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right content area */}
          <div className="col-span-1 lg:col-span-3 relative">
            {/* Tool Categories */}
            <motion.div 
              variants={containerVariants}
              className="space-y-6"
            >
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <motion.div 
                  key={category}
                  variants={itemVariants}
                  className="farm-panel"
                >
                  <div className="farm-panel-title flex items-center">
                    <span className="mr-2 text-lg">
                      {getCategoryIcon(category)}
                    </span>
                    {category}
                    <span className="ml-2 text-sm text-white/80">
                      ({categoryTools.length})
                    </span>
                  </div>
                  
                  <motion.div 
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 farm-panel-content"
                  >
                    {categoryTools.map(tool => (
                      <motion.div
                        key={tool.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="border border-farm-brown rounded-md p-4 hover:shadow-md transition-shadow duration-200 bg-white cursor-pointer"
                        onClick={() => handleToolSelect(tool)}
                      >
                        <h4 className="font-medium text-farm-brown-dark text-lg flex items-center">
                          <span className="text-sm mr-2">{getCategoryIcon(tool.category || 'uncategorized')}</span>
                          {tool.name}
                        </h4>
                        <p className="text-sm text-farm-brown mt-1 line-clamp-2">{tool.description}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tool.subcategory && (
                            <span className="bg-farm-green-light px-2 py-1 text-xs rounded-full text-farm-brown">
                              {tool.subcategory}
                            </span>
                          )}
                          <span className="bg-farm-blue-light px-2 py-1 text-xs rounded text-farm-brown">
                            {tool.model}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Add a "Create New Tool" card in each category */}
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className="border border-dashed border-farm-brown rounded-md p-4 flex flex-col items-center justify-center bg-white/50 hover:bg-white cursor-pointer min-h-[150px]"
                      onClick={() => navigate(`/tools/new?category=${category}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-farm-green-light flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-farm-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-farm-brown">Add New {category} Tool</p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
              
              {/* Special Blender Integration Panel */}
              <motion.div 
                variants={itemVariants}
                className="farm-panel"
              >
                <div className="farm-panel-title flex items-center">
                  <span className="mr-2 text-lg">📐</span>
                  Blender Integration
                </div>
                
                <div className="p-4 farm-panel-content">
                  <div className="bg-white border border-farm-blue/30 rounded-lg p-4 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                      <div className="w-24 h-24 rounded-lg bg-farm-blue-light flex items-center justify-center text-4xl border-2 border-farm-blue">
                        📐
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-farm-brown-dark">Blender 3D Integration</h3>
                        <p className="text-farm-brown mt-1">
                          Connect to Blender for 3D modeling assistance and automation through our MCP (Model Control Protocol)
                        </p>
                        <div className="mt-4">
                          <motion.button
                            whileHover="hover"
                            whileTap="tap"
                            variants={itemVariants}
                            onClick={() => setShowBlenderTool(true)}
                            className="bg-farm-blue hover:bg-farm-blue-dark text-white py-2 px-4 rounded-md flex items-center border border-farm-blue-dark"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            Open Blender Interface
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="text-farm-blue-dark">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Chat box overlay */}
            <AnimatePresence>
              {isChatOpen && selectedCharacter && (
                <motion.div 
                  className="absolute bottom-4 right-4 w-1/3 max-w-md z-10 farm-panel"
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 20, height: 0 }}
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
                  
                  <div className="max-h-80 farm-panel-content overflow-hidden">
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
          </div>
        </div>
      </motion.div>
      
      {/* Blender Tool Modal */}
      <AnimatePresence>
        {showBlenderTool && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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

export default DashboardOption1; 