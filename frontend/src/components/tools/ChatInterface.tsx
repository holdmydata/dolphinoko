import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Textarea, Badge } from '../common';
import { api } from '../../utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  modelName: string;
  provider: string;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  modelName,
  provider,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Generate a unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Send message to the LLM
  const sendMessage = async () => {
    if (!input.trim() || !modelName) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);
    
    try {
      // Create request based on provider
      let response;
      
      if (provider === 'ollama') {
        response = await api.post('/api/chat/ollama', {
          model: modelName,
          message: userMessage.content,
          parameters: {
            temperature: 0.7,
            max_tokens: 1000,
          }
        });
      } else {
        // Fallback to generic endpoint
        response = await api.post('/llm/generate', {
          tool_id: 'chat', // This would need to be created as a tool first
          input: userMessage.content,
          parameters: {
            model: modelName,
            provider: provider,
          }
        });
      }
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.text || response.output || 'No response received',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Clear chat
  const clearChat = () => {
    if (messages.length > 0 && window.confirm('Are you sure you want to clear the chat?')) {
      setMessages([]);
    }
  };

  return (
    <Card
      className={`flex flex-col h-full ${className}`}
      noPadding
    >
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-800">Chat</h3>
          {modelName && (
            <Badge
              variant="primary"
              size="sm"
              className="ml-2"
            >
              {modelName}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          disabled={messages.length === 0}
        >
          Clear
        </Button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <p className="text-lg">Start a conversation with {modelName || 'the AI'}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center p-2">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="p-2 text-center text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modelName ? `Message ${modelName}...` : "Select a model first..."}
            disabled={!modelName || isLoading}
            className="flex-1 min-h-20 max-h-60 resize-y"
            fullWidth
          />
          <Button
            type="submit"
            variant="primary"
            className="ml-3 self-end"
            disabled={!input.trim() || !modelName || isLoading}
            isLoading={isLoading}
          >
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatInterface;