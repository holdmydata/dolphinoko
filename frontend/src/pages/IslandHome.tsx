import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useCharacter } from '../context/CharacterContext';
import IslandView from '../components/island/IslandView';
import WebSearchTool from '../components/tools/WebSearchTool';
import '../styles/pixelCharacters.css';
import ChatBox from '../components/chat/ChatBox';
import MainLayout from '../components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useModelSettings } from '../context/ModelSettingsContext';
import { api } from '../utils/api';

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
  const { modelSettings } = useModelSettings();
  const navigate = useNavigate();
  const [characterPositions, setCharacterPositions] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [showSearchTool, setShowSearchTool] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const chatBoxRef = useRef<{ addCharacterMessage: (message: string) => void; setTyping: (typing: boolean) => void; } | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  
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
Your responses should emphasize safety, protection, and careful consideration of risks.`
    };
    
    return personas[character.id] || 
      `You are ${character.name}, a helpful ${character.type} assistant with the role of ${character.role}. 
      Respond in a friendly, helpful manner that matches your character type.`;
  };
  
  // Fallback response generator (uses our previous function) when API fails
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
          return `Of course I can help with that! For "${firstWords}...", here's what you should do: first, check if you have the right tools selected. I'm here to assist with daily tasks! What specifically would you like to know? Nya~`;
        } else if (containsKeyword(['thank', 'thanks', 'appreciate'])) {
          return `You're very welcome! I'm always happy to help. Is there anything else you need assistance with today? Purr~`;
        } else {
          return `I'd be happy to assist you with that! As your friendly assistant, I can help organize your tasks, provide information, or just chat. What would you like to focus on first? Nya~`;
        }
      
      case 'tanuki': // Shopkeeper/Web Search
        if (containsKeyword(['find', 'search', 'look for', 'where'])) {
          return `I'll search the web for information about "${firstWords}..."! Give me just a moment to gather the most relevant results. My merchant networks have connections everywhere!`;
        } else if (containsKeyword(['buy', 'purchase', 'store', 'shop'])) {
          return `Ah! Looking to make a purchase? While I can't directly sell items, I can certainly help you find the best places to buy "${firstWords}..." online. Let me know if you need recommendations!`;
        } else {
          return `Welcome to my shop of knowledge! I specialize in finding information from across the web. What treasures of knowledge are you seeking today?`;
        }
      
      case 'kitsune': // Scholar/Document Analysis
        if (containsKeyword(['analyze', 'document', 'read', 'summary'])) {
          return `I'd be delighted to analyze that document for you. My scholarly expertise allows me to extract the key insights from any text. Would you like a detailed analysis or just the main points?`;
        } else if (containsKeyword(['meaning', 'explain', 'understand'])) {
          return `The question about "${firstWords}..." is quite intriguing. From my scholarly perspective, I can offer several interpretations. Would you like me to explain in more detail?`;
        } else {
          return `Greetings, knowledge-seeker. As a scholarly fox, I specialize in deep analysis and understanding of documents and concepts. What wisdom are you pursuing today?`;
        }
      
      case 'tori': // Messenger/Communication
        if (containsKeyword(['message', 'send', 'email', 'communicate'])) {
          return `I'll happily help you draft and send that message! As the messenger bird, I can ensure your communications are clear and reach their destination. Would you like to review before sending?`;
        } else if (containsKeyword(['connect', 'contact', 'reach'])) {
          return `Looking to connect with someone about "${firstWords}..."? I can help establish that communication channel. Just let me know who you'd like to reach and the message!`;
        } else {
          return `Swift greetings! As your messenger bird, I'm here to help with all your communication needs. Need to send a message, draft an email, or connect with someone?`;
        }
      
      case 'usagi': // Creator/Content Creation
        if (containsKeyword(['create', 'make', 'design', 'draw'])) {
          return `I'd love to help you create something related to "${firstWords}..."! My creative energy is flowing today. What kind of content are you envisioning? I can assist with ideas, drafting, or design concepts.`;
        } else if (containsKeyword(['inspiration', 'idea', 'creative'])) {
          return `Looking for creative inspiration? I have plenty to share! For "${firstWords}...", have you considered approaching it from multiple perspectives? Sometimes the best ideas come from unexpected angles.`;
        } else {
          return `Greetings, fellow creator! My creative energy is at your service. Whether you need help with content creation, design ideas, or just a spark of inspiration, I'm here to help your vision come to life!`;
        }
      
      case 'kuma': // Guardian/Security
        if (containsKeyword(['protect', 'secure', 'privacy', 'safe'])) {
          return `I take your security concerns about "${firstWords}..." very seriously. As your guardian, I recommend implementing strong authentication and regular security reviews. Would you like more specific security advice?`;
        } else if (containsKeyword(['threat', 'risk', 'danger', 'hack'])) {
          return `I've analyzed the potential risks regarding "${firstWords}..." and can provide protective measures. Remember, preparation is key to security. Let me know which aspects you'd like me to focus on.`;
        } else {
          return `Standing guard! As your security and privacy guardian, I'm here to protect your digital world. Do you have specific concerns, or would you like a general security assessment?`;
        }
        
      default:
        // Generic response for any other character
        return `I find what you said about "${firstWords}..." quite interesting! As a ${character.role}, I'm happy to continue our conversation and learn more about your thoughts on this.`;
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
                ref={chatBoxRef}
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