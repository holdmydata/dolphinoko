import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import ChatBox from '../components/chat/ChatBox';
import MainLayout from '../components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useModelSettings } from '../context/ModelSettingsContext';
import { api } from '../utils/api';
import BlenderTool from '../components/tools/BlenderTool';

// Tool category icons with a more professional style
const toolCategoryIcons: Record<string, string> = {
  assistant: '🧠',
  web: '🌐',
  document: '📄',
  communication: '💬',
  creative: '🎨',
  security: '🔒',
  blender: '📐', // New icon for Blender tool
  default: '🛠️'
};

const IslandHome: React.FC = () => {
  const { tools } = useTools();
  const { characters, selectedCharacter, setSelectedCharacter, updateCharacter } = useCharacter();
  const { modelSettings } = useModelSettings();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const chatBoxRef = useRef<{ addCharacterMessage: (message: string) => void; setTyping: (typing: boolean) => void; } | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [showBlenderTool, setShowBlenderTool] = useState(false);
  
  // Set a default character if none is selected
  useEffect(() => {
    if (!selectedCharacter && characters.length > 0) {
      setSelectedCharacter(characters[0]);
    }
  }, [selectedCharacter, characters, setSelectedCharacter]);

  const handleToolSelect = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setSelectedTool(tool);
      
      // Special case for blender tool
      if (toolId === 'blender-connect') {
        setShowBlenderTool(true);
        return;
      }
      
      // Find the related character based on tool category
      const relatedCharacter = characters.find(c => c.toolCategory === tool.category);
      if (relatedCharacter) {
        setSelectedCharacter(relatedCharacter);
        updateCharacterExpression(relatedCharacter.id);
      }
      
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

  const handleChatSubmit = async (message: string) => {
    setLastMessage(message);
    // Update character expression on chat
    if (selectedCharacter) {
      updateCharacterExpression(selectedCharacter.id);
      
      // Show typing indicator
      if (chatBoxRef.current) {
        chatBoxRef.current.setTyping(true);
      }
      
      try {
        setIsLoadingResponse(true);
        
        // Create a persona-specific system prompt
        const characterPersona = getCharacterPersona(selectedCharacter);
        
        // Get model settings
        const model = modelSettings.baseModel || 'llama3';
        
        // Call the LLM API with streaming
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool_id: 'system-chat',
            input: message,
            parameters: {
              model: model,
              temperature: 0.7,
              stream: true,
              system: characterPersona,
            },
            conversation_id: `character-${selectedCharacter.id}-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is null');
        }

        let fullResponse = '';
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              
              if (jsonStr === '[DONE]') {
                continue;
              }
              
              try {
                const data = JSON.parse(jsonStr);
                if (data.content) {
                  fullResponse += data.content;
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
        
        // Add the full response to the chat
        if (chatBoxRef.current && fullResponse) {
          chatBoxRef.current.addCharacterMessage(fullResponse);
        } else {
          // Fallback to default responses if API fails
          const response = generateFallbackResponse(selectedCharacter, message);
          if (chatBoxRef.current) {
            chatBoxRef.current.addCharacterMessage(response);
          }
        }
      } catch (error) {
        console.error('Error calling chat API:', error);
        
        // Use fallback response generation if API fails
        const response = generateFallbackResponse(selectedCharacter, message);
        if (chatBoxRef.current) {
          chatBoxRef.current.addCharacterMessage(response);
        }
      } finally {
        setIsLoadingResponse(false);
        if (chatBoxRef.current) {
          chatBoxRef.current.setTyping(false);
        }
      }
    }
  };

  // Character persona definitions
  const getCharacterPersona = (character: any): string => {
    const personas: {[key: string]: string} = {
      'neko': `You are Neko-san, a helpful and energetic cat assistant who helps with daily tasks. 
Your personality is friendly, efficient, and slightly playful. You use gentle humor and are always eager to help.
You should respond with practical, helpful advice and occasionally use cat-related metaphors.
Keep your responses fairly concise and focused on being helpful. End some of your messages with a cute cat expression like "nya~" or "purr~".`,
      
      'tanuki': `You are Tanuki-chan, a wise tanuki shopkeeper who searches the web for information.
Your personality is knowledgeable, strategic, and slightly mischievous. You pride yourself on finding rare information.
You present information like a merchant showing treasures, highlighting the value of what you've found.
Use occasional tanuki-related references and have a merchant-like flair in your responses.`,
      
      'kitsune': `You are Kitsune-sama, a mystical fox scholar who analyzes documents and information.
Your personality is intellectual, scholarly, and slightly mysterious. You speak with elegant phrasing and depth.
You analyze information deeply, finding patterns and providing multiple perspectives on topics.
Reference your centuries of wisdom occasionally and maintain a dignified, slightly formal tone.`,
      
      'tori': `You are Tori-kun, a quick messenger bird who helps with email and communication.
Your personality is efficient, concise, and slightly impatient. You value clear, direct communication.
You're especially helpful with drafting messages, improving written communication, and connecting people.
Occasionally reference your speed and ability to connect distant points in your responses.`,
      
      'usagi': `You are Usagi-chan, a creative rabbit who assists with content creation.
Your personality is imaginative, energetic, and artistic. You're enthusiastic about all forms of creation.
You provide creative ideas, help with design concepts, and inspire artistic thinking.
Your responses should be colorful, contain creative metaphors, and show excitement for new ideas.`,
      
      'kuma': `You are Kuma-san, a protective bear who manages security and privacy.
Your personality is cautious, strong, and reliable. You take protection very seriously.
You provide security advice, help with privacy concerns, and guard against digital threats.
Your responses should emphasize safety, protection, and careful consideration of risks.`,

      'blender': `You are Blender-san, a 3D modeling specialist who helps with Blender operations.
Your personality is technical, precise, and helpful. You are knowledgeable about 3D modeling concepts.
You provide assistance with Blender commands, 3D modeling techniques, and scene setup.
Your responses should be clear, accurate, and focused on helping the user achieve their 3D modeling goals.`
    };
    
    return personas[character.id] || 
      `You are ${character.name}, a helpful ${character.type} assistant with the role of ${character.role}. 
      Respond in a friendly, helpful manner that matches your character type.`;
  };
  
  // Fallback response generator when API fails
  const generateFallbackResponse = (character: any, userMessage: string) => {
    const messageLower = userMessage.toLowerCase();
    const firstWords = userMessage.split(' ').slice(0, 3).join(' ');
    
    // Check for keywords to provide relevant responses
    const containsKeyword = (keywords: string[]) => 
      keywords.some(keyword => messageLower.includes(keyword));
    
    // Response based on character role
    switch (character.id) {
      case 'neko': // Assistant
        if (containsKeyword(['help', 'how do i', 'can you', 'what is'])) {
          return `Of course I can help with that! For "${firstWords}...", here's what you should do: first, check if you have the right tools selected. I'm here to assist with daily tasks! What specifically would you like to know?`;
        } else {
          return `I'd be happy to assist you with that! As your assistant, I can help organize your tasks, provide information, or just chat. What would you like to focus on first?`;
        }
      
      case 'blender': // Blender specialist
        if (containsKeyword(['model', '3d', 'render', 'blender'])) {
          return `I can help you with your "${firstWords}..." task in Blender. Would you like me to explain the technique or send commands to Blender directly?`;
        } else {
          return `As your 3D modeling specialist, I can help with Blender operations, modeling techniques, and scene setup. What aspect of 3D are you working on today?`;
        }
      
      default:
        // Generic response for any other character
        return `I find what you said about "${firstWords}..." quite interesting! As a ${character.role}, I'm happy to continue our conversation and learn more about your thoughts on this.`;
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };
  
  // Group tools by category
  const toolsByCategory: Record<string, any[]> = {};
  tools.forEach(tool => {
    const category = tool.category || 'default';
    if (!toolsByCategory[category]) {
      toolsByCategory[category] = [];
    }
    toolsByCategory[category].push(tool);
  });
  
  return (
    <MainLayout>
      <div className="flex flex-col h-full w-full">
        {/* Main content with tool dashboard and chat */}
        <div className="flex-grow flex flex-col md:flex-row relative overflow-hidden">
          {/* Tool Dashboard */}
          <motion.div 
            className="flex-grow p-6 bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Tool Shed</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Render tool categories */}
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center">
                    <span className="text-2xl mr-2">
                      {toolCategoryIcons[category] || toolCategoryIcons.default}
                    </span>
                    <h3 className="text-lg font-medium text-gray-800 capitalize">
                      {category === 'default' ? 'Miscellaneous' : category}
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      {categoryTools.map(tool => (
                        <motion.button
                          key={tool.id}
                          className="w-full text-left px-4 py-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center"
                          onClick={() => handleToolSelect(tool.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{tool.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{tool.description}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Blender integration card */}
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md overflow-hidden border border-blue-100"
                whileHover={{ scale: 1.02 }}
              >
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-3 border-b border-blue-200 flex items-center">
                  <span className="text-2xl mr-2">📐</span>
                  <h3 className="text-lg font-medium text-gray-800">Blender Integration</h3>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-700 mb-4">Connect to Blender for 3D modeling assistance and automation</p>
                  <motion.button
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    onClick={() => handleToolSelect('blender-connect')}
                    whileTap={{ scale: 0.98 }}
                  >
                    Connect to Blender
                  </motion.button>
                </div>
              </motion.div>
            </div>
            
            {/* Show Blender Tool when requested */}
            {showBlenderTool && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBlenderTool(false)}
              >
                <motion.div 
                  className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                >
                  <BlenderTool
                    className="p-6"
                    onClose={() => setShowBlenderTool(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Chat box */}
          {isChatOpen && selectedCharacter && (
            <motion.div 
              className="md:w-1/3 lg:w-1/4 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Character info header */}
              <div className="bg-blue-50 p-4 flex items-center space-x-3 border-b border-gray-200">
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-2xl shadow-sm">
                  {toolCategoryIcons[selectedCharacter.toolCategory || 'default']}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedCharacter.name}</h3>
                  <p className="text-xs text-gray-600">{selectedCharacter.role}</p>
                </div>
                <button 
                  onClick={handleChatClose}
                  className="ml-auto bg-white hover:bg-gray-100 rounded-full p-1.5 text-gray-500"
                >
                  ✕
                </button>
              </div>
              
              <ChatBox
                ref={chatBoxRef}
                characterName={selectedCharacter.name}
                onSubmit={handleChatSubmit}
                characterExpression={selectedCharacter.expression || ''}
              />
            </motion.div>
          )}
          
          {/* Chat toggle button */}
          {selectedCharacter && !isChatOpen && (
            <motion.button
              className="absolute bottom-4 right-4 z-10 p-3 rounded-full shadow-lg 
                bg-blue-500 hover:bg-blue-600
                text-white font-bold"
              onClick={handleChatToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              💬
            </motion.button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default IslandHome; 