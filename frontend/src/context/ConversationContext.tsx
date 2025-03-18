// frontend/src/context/ConversationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { conversations, Message, Conversation } from '../utils/api';
import { ToolExecutionEvent } from '../components/tools/ToolMonitor';

// Types


interface ConversationContextType {
  currentConversationId: string | null;
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  createNewConversation: () => Promise<string>;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, toolId?: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);
// Create a type specifically for your UI needs
export interface UIMessage extends Message {
    toolExecution?: ToolExecutionEvent;
  }
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      setMessages([]);
    }
  }, [conversation]);

  // Create a new conversation
  const createNewConversation = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newConversation = await conversations.create();
      setCurrentConversationId(newConversation.id);
      setConversation(newConversation);
      return newConversation.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing conversation
  const loadConversation = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedConversation = await conversations.get(id);
      setCurrentConversationId(id);
      setConversation(loadedConversation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a new message and add it to the current conversation
  const sendMessage = async (content: string, toolId?: string): Promise<void> => {
    if (!currentConversationId) {
      throw new Error('No active conversation');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message to conversation
      const userMessage = await conversations.addMessage(
        currentConversationId,
        { content, role: 'user', tool_id: toolId }
      );
      
      // Update local messages list
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Get updated conversation (optional, you could just update the local state)
      const updatedConversation = await conversations.get(currentConversationId);
      setConversation(updatedConversation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentConversationId,
    conversation,
    messages,
    isLoading,
    error,
    createNewConversation,
    loadConversation,
    sendMessage
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};