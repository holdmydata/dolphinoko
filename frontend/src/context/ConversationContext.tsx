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
      // Convert API message format to UIMessage format
      const convertedMessages: UIMessage[] = conversation.messages.map((apiMsg) => {
        // Create base message
        const message: UIMessage = {
          id: apiMsg.id,
          role: apiMsg.role as "user" | "assistant",
          content: apiMsg.content,
          timestamp: new Date(apiMsg.timestamp),
        };
        
        // Check for tool execution data in metadata
        if (apiMsg.metadata && apiMsg.tool_id) {
          // If we have metadata and a tool ID, try to reconstruct the tool execution
          const toolExecution: ToolExecutionEvent = {
            id: apiMsg.id,
            toolId: apiMsg.tool_id,
            toolName: apiMsg.metadata.toolName || apiMsg.tool_id,
            input: apiMsg.metadata.input || {},
            output: apiMsg.metadata.output || apiMsg.content,
            startTime: new Date(apiMsg.metadata.startTime || apiMsg.timestamp),
            endTime: apiMsg.metadata.endTime ? new Date(apiMsg.metadata.endTime) : undefined,
            status: apiMsg.metadata.status || "success",
            metrics: apiMsg.metadata.metrics || {}
          };
          
          // Add tool execution to message
          message.toolExecution = toolExecution;
        }
        
        return message;
      });
      
      setMessages(convertedMessages);
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