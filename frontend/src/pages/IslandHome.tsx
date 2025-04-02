import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import IslandView from '../components/island/IslandView';
import WebSearchTool from '../components/tools/WebSearchTool';
import '../styles/pixelCharacters.css';
import ChatBox from '../components/chat/ChatBox';
import MainLayout from '../components/layout/MainLayout';
import { motion } from 'framer-motion';

// Character sprite styles - pixel art inspired
const characterSprites = [
  // Cat sprite
  { 
    emoji: '🐱',
    color: '#FF7777', 
    shadowColor: '#DD5555',
    style: 'cat-sprite'
  },
  // Dog sprite
  { 
    emoji: '🐶',
    color: '#77AAFF', 
    shadowColor: '#5577DD',
    style: 'dog-sprite'
  },
  // Bird sprite
  { 
    emoji: '🐦',
    color: '#FFAA77', 
    shadowColor: '#DD8855',
    style: 'bird-sprite'
  },
  // Rabbit sprite
  { 
    emoji: '🐰',
    color: '#BB77FF', 
    shadowColor: '#9955DD',
    style: 'rabbit-sprite'
  },
  // Fox sprite
  { 
    emoji: '🦊',
    color: '#FF9944', 
    shadowColor: '#DD7722',
    style: 'fox-sprite'
  },
  // Bear sprite
  { 
    emoji: '🐻',
    color: '#AA8866', 
    shadowColor: '#886644',
    style: 'bear-sprite'
  },
  // Panda sprite
  { 
    emoji: '🐼',
    color: '#EEEEEE', 
    shadowColor: '#AAAAAA',
    style: 'panda-sprite'
  },
  // Koala sprite
  { 
    emoji: '🐨',
    color: '#AABBCC', 
    shadowColor: '#8899AA',
    style: 'koala-sprite'
  }
];

// Tool icons with a more modern style
const toolIcons = ['🌐', '💻', '📊', '✏️', '🔍', '📱', '🤖', '🎨'];

// Function to generate a deterministic color from a string
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

const IslandHome: React.FC = () => {
  const { tools } = useTools();
  const { characters, selectedCharacter, setSelectedCharacter, updateCharacter } = useCharacter();
  const navigate = useNavigate();
  const [characterPositions, setCharacterPositions] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [showSearchTool, setShowSearchTool] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  
  // Place characters (tools) around the island
  useEffect(() => {
    if (tools.length > 0) {
      // Create character positions based on tools
      const positions = tools.slice(0, 8).map((tool, index) => {
        // Place characters in key island locations
        let position;
        switch (index % 8) {
          case 0: // Center left
            position = { x: 25, y: 30 };
            break;
          case 1: // Center
            position = { x: 45, y: 35 };
            break;
          case 2: // Top right
            position = { x: 70, y: 25 };
            break;
          case 3: // Bottom center
            position = { x: 50, y: 55 };
            break;
          case 4: // Top center
            position = { x: 30, y: 20 };
            break;
          case 5: // Right side
            position = { x: 75, y: 40 };
            break;
          case 6: // Center
            position = { x: 55, y: 30 };
            break;
          case 7: // Bottom left
          default:
            position = { x: 20, y: 45 };
            break;
        }
        
        // Determine animal type based on tool name or ID
        const animalType = tool.id 
          ? (tool.id.charCodeAt(0) + tool.id.charCodeAt(tool.id.length - 1)) % 8
          : index % 8;
        
        return {
          position,
          color: stringToColor(tool.name || tool.id || `tool-${index}`),
          toolId: tool.id || `generated-id-${index}`,
          tool: tool,
          name: tool.name || `Tool ${index + 1}`,
          animalType
        };
      });
      
      setCharacterPositions(positions);
    }
  }, [tools]);
  
  // Set a default character if none is selected
  useEffect(() => {
    if (!selectedCharacter && characters.length > 0) {
      setSelectedCharacter(characters[0]);
    }
  }, [selectedCharacter, characters, setSelectedCharacter]);

  const handleCharacterClick = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setSelectedTool(tool);
      
      // Show web search tool for the Shopkeeper character (animalType 1)
      const character = characterPositions.find(c => c.toolId === toolId);
      if (character && character.animalType === 1) {
        setShowSearchTool(true);
      } else {
        setShowSearchTool(false);
      }
    }
  };
  
  const handleCharacterSelect = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setSelectedCharacter(character);
      // Generate new random expression
      updateCharacterExpression(characterId);
      setIsChatOpen(true);
    }
  };

  // Helper function to update character expression
  const updateCharacterExpression = (characterId: string) => {
    const expressions = ['(◕‿◕)', '(✿◠‿◠)', '(◕ᴗ◕✿)', '(。◕‿◕。)', '(„ᵕᴗᵕ„)', '(≧◡≦)'];
    const newExpression = expressions[Math.floor(Math.random() * expressions.length)];
    updateCharacter(characterId, { expression: newExpression });
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleChatSubmit = (message: string) => {
    setLastMessage(message);
    // Update character expression on chat
    if (selectedCharacter) {
      updateCharacterExpression(selectedCharacter.id);
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };
  
  const navigateTo = (path: string) => {
    navigate(path);
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col h-full w-full">
        {/* Main content with island view and chat */}
        <div className="flex-grow flex flex-col md:flex-row relative overflow-hidden">
          {/* Island View */}
          <motion.div 
            className="flex-grow relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <IslandView 
              onCharacterSelect={handleCharacterSelect}
              selectedCharacterId={selectedCharacter?.id}
            />
            
            {/* Chat toggle button with anime styling */}
            <motion.button
              className="absolute bottom-4 right-4 z-10 p-3 rounded-full shadow-lg 
                bg-gradient-to-r from-kawaii-purple-400 to-kawaii-pink-400 
                text-white font-bold"
              onClick={handleChatToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isChatOpen ? '✕' : '💬'}
            </motion.button>
            
            {/* Last message bubble */}
            {!isChatOpen && lastMessage && (
              <motion.div 
                className="absolute bottom-16 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md max-w-xs text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-gray-700">{lastMessage}</p>
                <div className="absolute bottom-0 right-4 w-4 h-4 bg-white transform rotate-45 translate-y-2"></div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Chat box */}
          {isChatOpen && selectedCharacter && (
            <motion.div 
              className="md:w-1/3 lg:w-1/4 bg-white/90 backdrop-blur-sm shadow-lg border border-kawaii-purple-100 rounded-lg overflow-hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Character info header */}
              <div className="bg-gradient-to-r from-kawaii-purple-100 to-kawaii-pink-100 p-4 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-kawaii-pink-300 to-kawaii-purple-400 flex items-center justify-center text-2xl shadow-inner">
                  {getAnimalEmoji(selectedCharacter.type)}
                </div>
                <div>
                  <h3 className="font-bold text-kawaii-purple-800">{selectedCharacter.name}</h3>
                  <p className="text-xs text-kawaii-purple-600">{selectedCharacter.role}</p>
                </div>
                <button 
                  onClick={handleChatClose}
                  className="ml-auto bg-kawaii-pink-100 hover:bg-kawaii-pink-200 rounded-full p-1"
                >
                  ✕
                </button>
              </div>
              
              <ChatBox
                characterName={selectedCharacter.name}
                onSubmit={handleChatSubmit}
                characterExpression={selectedCharacter.expression || '(◕‿◕)'}
              />
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

// Helper function to get emoji based on animal type
const getAnimalEmoji = (type: string): string => {
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

export default IslandHome; 