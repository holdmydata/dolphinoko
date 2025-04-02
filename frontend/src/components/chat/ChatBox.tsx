import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

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

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50/50 backdrop-blur-sm">
        {messages.map((message) => (
          <motion.div 
            key={message.id}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-kawaii-purple-100 text-kawaii-purple-900 rounded-tr-none border border-kawaii-purple-200' 
                  : 'bg-kawaii-pink-100 text-kawaii-pink-900 rounded-tl-none border border-kawaii-pink-200'
              } backdrop-blur-md shadow-sm`}
            >
              {message.sender === 'character' && (
                <div className="font-bold text-xs mb-1 text-kawaii-pink-700 flex items-center">
                  {characterName} <span className="ml-2">{characterExpression}</span>
                </div>
              )}
              <p className="leading-snug">{message.text}</p>
              <div className="text-right mt-1">
                <span className="text-xs opacity-70">
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
            <div className="bg-kawaii-pink-100 text-kawaii-pink-900 rounded-lg border border-kawaii-pink-200 p-3 backdrop-blur-md">
              <div className="flex items-center">
                <div className="text-xs font-bold text-kawaii-pink-700 mr-2">
                  {characterName}
                </div>
                <div className="flex space-x-1">
                  <motion.div 
                    className="w-2 h-2 bg-kawaii-pink-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-kawaii-pink-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-kawaii-pink-400 rounded-full"
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
      
      {/* Input area - glass morphism style */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200/50 bg-white/60 backdrop-blur-md">
        <div className="flex rounded-full bg-white/80 overflow-hidden p-1 border border-kawaii-purple-100 shadow-inner">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow bg-transparent px-4 py-2 focus:outline-none"
            placeholder={`Message ${characterName}...`}
          />
          <motion.button
            type="submit"
            className="bg-gradient-to-r from-kawaii-purple-500 to-kawaii-pink-500 text-white px-4 py-2 rounded-full shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!inputValue.trim()}
          >
            <span className="flex items-center">
              <span className="mr-1">Send</span>
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