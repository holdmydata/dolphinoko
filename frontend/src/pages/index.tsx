import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import { useCharacter } from '../context/CharacterContext';

const IndexPage: React.FC = () => {
  const { characters } = useCharacter();
  const [activeCharacter, setActiveCharacter] = useState<number | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" },
    tap: { scale: 0.98 }
  };
  
  const characterVariants = {
    idle: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    },
    hover: {
      scale: 1.1,
      y: -15,
      transition: {
        duration: 0.3
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    },
    active: {
      scale: 1.15,
      y: -20,
      filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))",
      transition: {
        duration: 0.5
      }
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
  
  // Sample welcome messages from characters
  const characterMessages = [
    "Welcome to Dolphinoko! I'm here to help with the farm tools. Click on one of the dashboard options below!",
    "Hey there! Check out our new Blender integration. I can help you create 3D models!",
    "Welcome! Need help organizing your tools? Try our different dashboard layouts!",
    "Hi farmer! I can help you connect your tools through our MCP protocol. Which dashboard would you like?"
  ];
  
  return (
    <MainLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto p-6 relative"
      >
        {/* Main title */}
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <motion.h1 
            className="text-4xl font-bold text-farm-brown-dark retro-text mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <span className="text-3xl mr-2">🐬</span>
            Dolphinoko AgentVerse
            <span className="text-3xl ml-2">🐬</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-2 text-farm-brown max-w-2xl mx-auto">
            Your farm of AI assistants and tools with three interactive dashboard options
          </motion.p>
        </motion.div>
        
        {/* Character showcase - AgentVerse style */}
        <motion.div
          variants={containerVariants}
          className="mb-12 relative py-12"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-farm-green-light/20 to-farm-brown-light/20 rounded-2xl"></div>
          
          {/* Character selection */}
          <div className="flex justify-center items-end space-x-8 mb-8 relative z-10">
            {characters.slice(0, 4).map((character, index) => (
              <motion.div
                key={index}
                variants={characterVariants}
                animate={activeCharacter === index ? "active" : "idle"}
                whileHover="hover"
                whileTap="tap"
                className="cursor-pointer flex flex-col items-center"
                onClick={() => {
                  setActiveCharacter(index);
                  setShowMessage(true);
                  // Auto hide message after 6 seconds
                  setTimeout(() => setShowMessage(false), 6000);
                }}
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-6xl mb-2 relative"
                  style={{ backgroundColor: character.color + '40' }}
                >
                  {getCharacterEmoji(character.type)}
                  {activeCharacter === index && (
                    <motion.div 
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-farm-brown rounded-full"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 48 }}
                    />
                  )}
                </div>
                <span className="font-medium text-farm-brown-dark">{character.name}</span>
                <span className="text-xs text-farm-brown">{character.role}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Character message bubble */}
          <AnimatePresence>
            {showMessage && activeCharacter !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="max-w-2xl mx-auto bg-white p-5 rounded-xl relative border-2 border-farm-brown shadow-lg"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rotate-45 bg-white border-l-2 border-t-2 border-farm-brown"></div>
                <p className="text-farm-brown text-lg">
                  {characterMessages[activeCharacter] || "Hi there! How can I help you today?"}
                </p>
                <div className="mt-4 text-right">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-farm-green text-white rounded-full text-sm"
                    onClick={() => setShowMessage(false)}
                  >
                    Got it!
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dashboard options */}
        <motion.h2 
          variants={itemVariants}
          className="text-2xl font-bold text-farm-brown-dark mb-6 text-center flex items-center justify-center"
        >
          <span className="mr-2">🧩</span>
          Your Complete Agent Development Environment
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Option 1 */}
          <motion.div 
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            className="farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">1️⃣</span>
              Browse &amp; Discover
            </div>
            <div className="farm-panel-content p-6 flex flex-col">
              <div className="h-48 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-farm-brown-light/10 rounded-md"></div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-farm-brown-light/50 h-16 rounded"></div>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold text-farm-brown-dark mb-2">
                Tool Shed Experience
              </h3>
              <p className="text-farm-brown mb-6 flex-grow">
                Browse existing tools, agents, and templates. Perfect for discovering what's possible before creating your own custom solutions.
              </p>
              <div className="mt-4">
                <Link 
                  to="/DashboardOption1" 
                  className="block w-full text-center bg-farm-brown hover:bg-farm-brown-dark text-white py-2 px-4 rounded-md transition-colors"
                >
                  Browse Tools
                </Link>
              </div>
            </div>
          </motion.div>
          
          {/* Option 2 */}
          <motion.div 
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            className="farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">2️⃣</span>
              Create &amp; Develop
            </div>
            <div className="farm-panel-content p-6 flex flex-col">
              <div className="h-48 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-farm-blue-light/10 rounded-md"></div>
                <div className="grid grid-cols-12 gap-2 p-4">
                  <div className="col-span-3 bg-farm-blue-light/50 h-full rounded"></div>
                  <div className="col-span-9 space-y-2">
                    <div className="bg-farm-blue-light/30 h-8 rounded"></div>
                    <div className="bg-farm-blue-light/20 h-28 rounded"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-farm-brown-dark mb-2">
                Developer Workshop
              </h3>
              <p className="text-farm-brown mb-6 flex-grow">
                Build your own tools, custom agents, and Python-based automations. Connect to Blender, setup MCP integrations, and manage packages.
              </p>
              <div className="mt-4">
                <Link 
                  to="/DashboardOption2" 
                  className="block w-full text-center bg-farm-blue hover:bg-farm-blue-dark text-white py-2 px-4 rounded-md transition-colors"
                >
                  Start Building
                </Link>
              </div>
            </div>
          </motion.div>
          
          {/* Option 3 */}
          <motion.div 
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            className="farm-panel"
          >
            <div className="farm-panel-title">
              <span className="mr-2">3️⃣</span>
              Use &amp; Interact
            </div>
            <div className="farm-panel-content p-6 flex flex-col">
              <div className="h-48 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-farm-green-light/10 rounded-md"></div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="bg-yellow-100/80 h-32 rounded-xl"></div>
                  <div className="bg-red-100/80 h-32 rounded-xl"></div>
                  <div className="bg-purple-100/80 h-8 rounded-full"></div>
                  <div className="bg-pink-100/80 h-8 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-farm-brown-dark mb-2">
                Interactive Dashboard
              </h3>
              <p className="text-farm-brown mb-6 flex-grow">
                Your main workspace with visual character helpers. Use your created tools, interact with agents, and enjoy the full interactive experience.
              </p>
              <div className="mt-4">
                <Link 
                  to="/DashboardOption3" 
                  className="block w-full text-center bg-farm-green hover:bg-farm-green-dark text-white py-2 px-4 rounded-md transition-colors"
                >
                  Start Using
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* AgentVerse Concept Section */}
        <motion.div
          variants={itemVariants} 
          className="mt-6 mb-12 p-6 bg-white border-2 border-farm-brown-light rounded-xl"
        >
          <h3 className="text-xl font-bold text-farm-brown-dark mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            Complete Agent Development Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-farm-brown mb-4">
                Dolphinoko provides a complete end-to-end workflow for creating and using AI agents - from browsing existing tools to building custom agents in Blender to interacting with them in your personalized dashboard.
              </p>
              <div className="space-y-3 mt-4">
                <div className="flex items-start">
                  <div className="bg-farm-brown text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 shrink-0">1</div>
                  <p className="text-farm-brown"><span className="font-medium text-farm-brown-dark">Browse existing tools</span> in the Tool Shed to get inspiration</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-farm-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 shrink-0">2</div>
                  <p className="text-farm-brown"><span className="font-medium text-farm-brown-dark">Create your own tools and agents</span> in the Developer Workshop</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-farm-green text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 shrink-0">3</div>
                  <p className="text-farm-brown"><span className="font-medium text-farm-brown-dark">Use your creations</span> in the visual interactive dashboard</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-farm-brown-light/20 p-4 rounded-xl h-full flex flex-col justify-center">
                <div className="text-center mb-4">
                  <span className="text-farm-brown-dark font-medium">The Complete Workflow</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gradient-to-r from-farm-brown via-farm-blue to-farm-green rounded-full mb-6"></div>
                  <div className="flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-farm-brown text-white flex items-center justify-center text-sm mb-2">1</div>
                      <div className="text-xs text-farm-brown text-center">Browse</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-farm-blue text-white flex items-center justify-center text-sm mb-2">2</div>
                      <div className="text-xs text-farm-brown text-center">Create</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-farm-green text-white flex items-center justify-center text-sm mb-2">3</div>
                      <div className="text-xs text-farm-brown text-center">Use</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-farm-brown text-sm mt-6 text-center">
                  Switch between views at any time in your workflow
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Footer section */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <p className="text-farm-brown text-sm">
            Pick any dashboard design to get started with Dolphinoko!
          </p>
          <div className="mt-4">
            <Link 
              to="/tools" 
              className="inline-flex items-center px-4 py-2 bg-farm-brown-light hover:bg-farm-brown text-farm-brown hover:text-white rounded-md transition-colors mx-2"
            >
              <span className="mr-2">🧰</span>
              View All Tools
            </Link>
            <Link 
              to="/character-creator" 
              className="inline-flex items-center px-4 py-2 bg-farm-green-light hover:bg-farm-green text-farm-green-dark hover:text-white rounded-md transition-colors mx-2"
            >
              <span className="mr-2">🐾</span>
              Character Creator
            </Link>
            <Link 
              to="/workflow" 
              className="inline-flex items-center px-4 py-2 bg-farm-blue-light hover:bg-farm-blue text-farm-blue-dark hover:text-white rounded-md transition-colors mx-2"
            >
              <span className="mr-2">🔄</span>
              Learn Complete Workflow
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
};

export default IndexPage; 