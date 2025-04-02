import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ChatBoxProps {
  characterName: string;
  onSubmit: (message: string) => void;
  characterExpression?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'character';
  timestamp: Date;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  characterName, 
  onSubmit,
  characterExpression = '(◕‿◕)'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `こんにちは! Hello! I'm ${characterName}. How can I help you today?`,
      sender: 'character',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    onSubmit(inputValue);
    setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate character response with delay
    setTimeout(() => {
      setIsTyping(false);
      
      const responses = [
        "I'll help you with that right away!",
        "Let me think about that for a moment...",
        "That's a great question!",
        "I've got just the solution for you!",
        "I'm working on it! Give me a moment.",
        "はい！ Yes, I can definitely assist with that!"
      ];
      
      const characterMessage: Message = {
        id: Date.now().toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'character',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, characterMessage]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-farm-green-light/10 to-farm-blue-light/10">
      {/* Header */}
      <div className="p-3 bg-farm-earth-light/90 backdrop-blur-md border-b border-farm-brown shadow-sm">
        <div className="flex items-center">
          <motion.div 
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-sm relative mr-3"
            style={{ 
              backgroundColor: '#FFB7C5',
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
            }}
            animate={{ 
              borderRadius: [
                "30% 70% 70% 30% / 30% 30% 70% 70%",
                "40% 60% 60% 40% / 40% 40% 60% 60%",
                "30% 70% 70% 30% / 30% 30% 70% 70%"
              ]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <span className="text-xl">{characterExpression}</span>
          </motion.div>
          <div>
            <h2 className="text-lg font-medium text-farm-brown">{characterName}</h2>
            <p className="text-xs text-farm-brown-dark/70">Farm Friend</p>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-grow p-4 overflow-y-auto bg-farm-wood-light/20 backdrop-blur-sm">
        {messages.map((message) => (
          <motion.div 
            key={message.id}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                message.sender === 'user' 
                  ? 'bg-farm-blue-light/70 text-farm-brown-dark rounded-br-none border border-farm-blue/20' 
                  : 'bg-white/90 text-farm-brown-dark rounded-bl-none border border-farm-green/10'
              }`}
            >
              {message.sender === 'character' && (
                <div className="font-bold text-sm mb-1.5 text-farm-brown flex items-center">
                  {characterName} <span className="ml-2 text-farm-green">{characterExpression}</span>
                </div>
              )}
              <div className="prose prose-sm max-w-none text-[15px] leading-relaxed">
                <ReactMarkdown>
                  {message.text}
                </ReactMarkdown>
              </div>
              <div className="text-right mt-2">
                <span className="text-xs text-farm-brown-dark/60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div 
            className="flex justify-start mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white/80 text-farm-brown rounded-2xl border border-farm-green/10 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="text-sm font-medium text-farm-brown mr-2">
                  {characterName}
                </div>
                <div className="flex space-x-1.5">
                  <motion.div 
                    className="w-2 h-2 bg-farm-green rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-farm-green rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-farm-green rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-farm-brown/10 bg-farm-earth-light/90 backdrop-blur-md">
        <div className="flex rounded-xl bg-white/90 overflow-hidden p-1 border border-farm-brown/20 shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow bg-transparent px-4 py-3 focus:outline-none text-farm-brown-dark placeholder:text-farm-brown/50"
            placeholder={`Message ${characterName}...`}
          />
          <motion.button
            type="submit"
            className="bg-farm-green text-white px-5 py-2.5 rounded-lg shadow-sm font-medium text-sm"
            whileHover={{ scale: 1.03, backgroundColor: "#5A9E4B" }}
            whileTap={{ scale: 0.98 }}
            disabled={!inputValue.trim()}
          >
            <span className="flex items-center">
              <span className="mr-1.5">Send</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </span>
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox; 