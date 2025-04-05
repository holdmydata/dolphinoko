import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import BlenderTool from '../components/tools/BlenderTool';
import ChatBox from '../components/chat/ChatBox';

// Dashboard Option 3: Visual Card-Based Approach
// This design uses a more visual card-based layout with emphasis on tool categories
// and a floating chat feature that follows as you scroll

const DashboardOption3: React.FC = () => {
  const navigate = useNavigate();
  const { tools } = useTools();
  const { characters, selectedCharacter, setSelectedCharacter, updateCharacter } = useCharacter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBlenderTool, setShowBlenderTool] = useState(false);
  const [recentlyUsedTools, setRecentlyUsedTools] = useState<any[]>([]);
  const [animalsVisible, setAnimalsVisible] = useState(true);
  const chatBoxRef = React.useRef<any>(null);
  
  // Tool categories with emojis
  const categories = [
    { id: 'all', name: 'All Tools', emoji: '🧰' },
    { id: 'farming', name: 'Farming', emoji: '🌱' },
    { id: 'animals', name: 'Animals', emoji: '🐄' },
    { id: 'building', name: 'Building', emoji: '🏗️' },
    { id: 'blender', name: 'Blender', emoji: '📐' },
    { id: 'ai', name: 'AI Tools', emoji: '🧠' },
  ];
  
  // Group tools by category
  const toolsByCategory = tools.reduce((acc: Record<string, any[]>, tool) => {
    const category = tool.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {});
  
  // Filter tools based on search and category
  const filteredTools = React.useMemo(() => {
    let filtered = tools;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    
    return filtered;
  }, [tools, searchQuery, selectedCategory]);
  
  // Handle selecting a tool
  const handleSelectTool = (tool: any) => {
    if (tool.category === 'blender') {
      setShowBlenderTool(true);
    } else {
      setSelectedTool(tool);
      
      // Find related character
      const relatedCharacter = characters.find(c => c.toolCategory === tool.category);
      if (relatedCharacter) {
        setSelectedCharacter(relatedCharacter);
        setIsChatOpen(true);
      }
    }
    
    // Add to recently used, avoiding duplicates
    setRecentlyUsedTools(prev => {
      const filtered = prev.filter(t => t.id !== tool.id);
      return [tool, ...filtered].slice(0, 4);
    });
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
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { 
      y: -5, 
      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 500, damping: 15 }
    },
    tap: { scale: 0.98 }
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
  
  // Random pastel colors for cards
  const getRandomPastelColor = (seed: number) => {
    const colors = [
      'bg-farm-green-light', 'bg-farm-blue-light', 'bg-farm-brown-light',
      'bg-yellow-100', 'bg-red-100', 'bg-purple-100', 'bg-pink-100'
    ];
    return colors[seed % colors.length];
  };
  
  // Animals for the farm aesthetic
  const animals = [
    { type: 'chicken', emoji: '🐔', position: { top: '10%', left: '5%' }, size: 'text-2xl' },
    { type: 'cow', emoji: '🐄', position: { top: '70%', left: '20%' }, size: 'text-3xl' },
    { type: 'pig', emoji: '🐖', position: { top: '50%', right: '10%' }, size: 'text-2xl' },
    { type: 'sheep', emoji: '🐑', position: { bottom: '15%', left: '15%' }, size: 'text-2xl' },
    { type: 'duck', emoji: '🦆', position: { top: '20%', right: '15%' }, size: 'text-xl' },
  ];
  
  return (
    <MainLayout>
      {/* Floating animals */}
      {animalsVisible && (
        <>
          {animals.map((animal, index) => (
            <motion.div
              key={index}
              className={`fixed ${animal.size} z-10 cursor-pointer`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: 0.2 + index * 0.1 }
              }}
              whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
              style={animal.position as React.CSSProperties}
              onClick={() => {
                // Find character that matches this animal type
                const character = characters.find(c => c.type.includes(animal.type));
                if (character) {
                  setSelectedCharacter(character);
                  setIsChatOpen(true);
                }
              }}
            >
              {animal.emoji}
            </motion.div>
          ))}
        </>
      )}
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8 relative"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 text-center relative">
          <motion.div 
            className="absolute top-0 right-4 flex space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1 rounded-md text-sm ${animalsVisible ? 'bg-farm-brown text-white' : 'bg-white text-farm-brown border border-farm-brown'}`}
              onClick={() => setAnimalsVisible(!animalsVisible)}
            >
              {animalsVisible ? 'Hide Animals' : 'Show Animals'}
            </motion.button>
          </motion.div>
        
          <motion.h1 
            className="text-4xl font-bold text-farm-brown-dark retro-text mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <span className="text-3xl mr-2">🌾</span>
            Dolphinoko Dashboard
            <span className="text-3xl ml-2">🌾</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-2 text-farm-brown max-w-2xl mx-auto">
            Your friendly farming assistant with advanced tools for crop management, animal care, and 3D design
          </motion.p>
        </motion.div>

        {/* Search and category selector */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search for tools, features, or ask for help..."
              className="w-full px-3 py-3 pl-10 text-farm-brown border-2 border-farm-brown rounded-full focus:outline-none focus:ring-2 focus:ring-farm-green bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-3.5 text-farm-brown">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
          </div>
          
          {/* Category selector */}
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <motion.button
                key={category.id}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === category.id ? 
                  'bg-farm-brown text-white border-2 border-farm-brown' : 
                  'bg-white text-farm-brown border-2 border-farm-brown-light hover:border-farm-brown'
                }`}
                onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* Recently used tools */}
        {recentlyUsedTools.length > 0 && (
          <motion.div 
            variants={containerVariants}
            className="mb-10 farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">⭐</span>
              Recently Used Tools
            </div>
            <div className="p-4 farm-panel-content">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recentlyUsedTools.map((tool, index) => (
                  <motion.div
                    key={`recent-${tool.id}`}
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="border-2 border-farm-brown rounded-xl p-3 bg-white cursor-pointer"
                    onClick={() => handleSelectTool(tool)}
                  >
                    <div className="text-xl mb-1">
                      {getCategoryEmoji(tool.category || 'other')}
                    </div>
                    <h3 className="font-medium text-farm-brown-dark">{tool.name}</h3>
                    <p className="text-xs text-farm-brown truncate">{tool.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Blender special feature */}
        <motion.div 
          variants={containerVariants}
          className="mb-10"
        >
          <div className="bg-gradient-to-r from-farm-blue/20 to-farm-blue-light/30 border-2 border-farm-blue rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="p-6 md:col-span-8">
                <motion.h2 
                  className="text-2xl font-bold text-farm-brown-dark mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="mr-2">📐</span>
                  Blender Integration
                </motion.h2>
                <motion.p 
                  className="text-farm-brown mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Connect Dolphinoko to Blender for 3D modeling assistance. Create, modify, and animate 3D models with ease!
                </motion.p>
                <motion.button
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="bg-farm-blue hover:bg-farm-blue-dark text-white py-2 px-6 rounded-full border-2 border-farm-blue-dark"
                  onClick={() => setShowBlenderTool(true)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Connect to Blender
                </motion.button>
                <motion.div 
                  className="mt-4 grid grid-cols-2 gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center text-sm text-farm-blue-dark">
                    <span className="h-1.5 w-1.5 bg-farm-blue-dark rounded-full mr-2"></span>
                    Control Blender remotely
                  </div>
                  <div className="flex items-center text-sm text-farm-blue-dark">
                    <span className="h-1.5 w-1.5 bg-farm-blue-dark rounded-full mr-2"></span>
                    Send commands directly
                  </div>
                  <div className="flex items-center text-sm text-farm-blue-dark">
                    <span className="h-1.5 w-1.5 bg-farm-blue-dark rounded-full mr-2"></span>
                    Create 3D models with AI
                  </div>
                  <div className="flex items-center text-sm text-farm-blue-dark">
                    <span className="h-1.5 w-1.5 bg-farm-blue-dark rounded-full mr-2"></span>
                    Automate repetitive tasks
                  </div>
                </motion.div>
              </div>
              <motion.div 
                className="md:col-span-4 flex items-center justify-center relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="absolute inset-0 bg-farm-blue-light/40"></div>
                <div className="relative z-10 p-4">
                  <div className="rounded-full bg-white border-4 border-farm-blue p-6 w-32 h-32 flex items-center justify-center mx-auto">
                    <span className="text-5xl">📐</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Main tool grid */}
        <motion.div variants={containerVariants} className="mb-10">
          <h2 className="text-2xl font-bold text-farm-brown-dark mb-4 flex items-center">
            <span className="mr-2">🧰</span>
            {selectedCategory ? 
              `${categories.find(c => c.id === selectedCategory)?.name || 'Tools'}` : 
              'All Tools'
            }
            {searchQuery && ` matching "${searchQuery}"`}
          </h2>
          
          {filteredTools.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-8 border-2 border-dashed border-farm-brown-light rounded-xl"
            >
              <p className="text-farm-brown mb-4">No tools found matching your search criteria.</p>
              <button 
                className="px-4 py-2 bg-farm-brown text-white rounded-md"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool, idx) => (
                <motion.div
                  key={tool.id}
                  layoutId={`tool-${tool.id}`}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`rounded-xl overflow-hidden shadow-md border-2 border-farm-brown-light cursor-pointer transition-all duration-200 ${getRandomPastelColor(idx)}`}
                  onClick={() => handleSelectTool(tool)}
                >
                  <div className="h-32 flex items-center justify-center">
                    <span className="text-5xl">{getCategoryEmoji(tool.category || 'other')}</span>
                  </div>
                  <div className="p-4 bg-white border-t-2 border-farm-brown-light">
                    <h3 className="font-bold text-farm-brown-dark text-lg">{tool.name}</h3>
                    <p className="text-sm text-farm-brown mt-1 h-12 overflow-hidden">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      {tool.category && (
                        <span className="bg-farm-brown-light/50 px-2 py-1 text-xs rounded-full text-farm-brown">
                          {tool.category}
                        </span>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-farm-green flex items-center justify-center text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Help section */}
        <motion.div 
          variants={itemVariants}
          className="rounded-xl border-2 border-farm-brown p-6 text-center bg-white"
        >
          <h3 className="text-xl font-bold text-farm-brown-dark mb-2">Need Help?</h3>
          <p className="text-farm-brown mb-4">
            Click on any of our friendly farm animals floating on the screen to start a chat!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {characters.slice(0, 4).map((character, index) => (
              <motion.button
                key={index}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-2 flex flex-col items-center"
                onClick={() => {
                  setSelectedCharacter(character);
                  setIsChatOpen(true);
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1"
                  style={{ backgroundColor: character.color + '40' }}
                >
                  {getCharacterEmoji(character.type)}
                </div>
                <span className="text-xs text-farm-brown">{character.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
      
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
      
      {/* Floating chat */}
      <AnimatePresence>
        {isChatOpen && selectedCharacter && (
          <motion.div 
            className="fixed bottom-6 right-6 w-80 z-30 rounded-xl overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="bg-gradient-to-r from-farm-brown to-farm-brown-dark text-white p-3 flex items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-2xl mr-2"
                style={{ backgroundColor: selectedCharacter.color }}
              >
                {getCharacterEmoji(selectedCharacter.type)}
              </div>
              <span className="font-medium">{selectedCharacter.name}</span>
              <div className="ml-auto flex space-x-2">
                <button 
                  onClick={() => updateCharacter(selectedCharacter.id, { expression: (selectedCharacter.expression === 'happy' ? 'neutral' : 'happy') })}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  😊
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="h-96 bg-white border-2 border-t-0 border-farm-brown">
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

// Helper function to get emoji based on category
const getCategoryEmoji = (category: string): string => {
  if (!category) return '🧰';
  
  switch (category) {
    case 'farming': return '🌱';
    case 'animals': return '🐄';
    case 'building': return '🏗️';
    case 'blender': return '📐';
    case 'ai': return '🧠';
    default: return '🧰';
  }
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

export default DashboardOption3; 