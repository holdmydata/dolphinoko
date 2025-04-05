// frontend/src/pages/Chat.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModelSelector from "../components/tools/ModelSelector";
import ChatInterface from "../components/tools/ChatInterface";
import ToolMonitor, {
  ToolExecutionEvent,
} from "../components/tools/ToolMonitor";
import {
  getStoredEvents,
  addStoredEvent,
  clearStoredEvents,
} from "../utils/toolMonitoringStorage";
import { useTools } from "../hooks/useTools";
import { useCharacter } from "../context/CharacterContext";
import { useConversation } from "../context/ConversationContext";
import { ensureChatTool } from "../utils/ensureTools";
import ChatProcessor, { ProcessedMessage } from "../utils/ChatProcessor";
import { useModelSettings } from "../context/ModelSettingsContext";

// Update ChatProcessor to include necessary methods
class ExtendedChatProcessor extends ChatProcessor {
  updateTools(tools: any[]) {
    // @ts-ignore - we're extending the class with new methods
    this.tools = tools;
  }

  updateProcessor(toolCategory: string | undefined) {
    // @ts-ignore - we're extending the class with new methods
    this.characterToolCategory = toolCategory;
  }
}

const Chat: React.FC = () => {
  const { modelSettings } = useModelSettings();
  const [selectedModel, setSelectedModel] = useState<string>(modelSettings.baseModel);
  const [selectedProvider, setSelectedProvider] = useState<string>(modelSettings.baseProvider);
  const [executionEvents, setExecutionEvents] = useState<ToolExecutionEvent[]>(
    []
  );
  const [isMonitorExpanded, setIsMonitorExpanded] = useState<boolean>(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState<boolean>(false);
  const toolContext = useTools();
  const { characters, selectedCharacter, setSelectedCharacter } = useCharacter();
  const chatProcessorRef = useRef<ExtendedChatProcessor | null>(null);
  const [messageProcessor, setMessageProcessor] = useState<
    ((message: string) => Promise<ProcessedMessage>) | undefined
  >(undefined);

  // Animation variants
  const characterPickerVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
      y: "100%", 
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  // Providers available
  const providers = [
    { value: "ollama", label: "Ollama (Local)" },
    { value: "claude", label: "Claude (Anthropic)" },
  ];

  const {
    currentConversationId,
    messages,
    isLoading,
    createNewConversation,
    sendMessage,
  } = useConversation();

  // Load execution events from storage
  useEffect(() => {
    setExecutionEvents(getStoredEvents());
  }, []);

  // Update model settings if the base model changes
  useEffect(() => {
    setSelectedModel(modelSettings.baseModel);
    setSelectedProvider(modelSettings.baseProvider);
  }, [modelSettings]);

  // Create a new conversation when the component mounts
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

  // Initialize chat processor for the selected character
  useEffect(() => {
    if (
      selectedCharacter &&
      selectedCharacter.toolCategory &&
      toolContext &&
      !toolContext.loading
    ) {
      if (!chatProcessorRef.current) {
        chatProcessorRef.current = new ExtendedChatProcessor(
          toolContext.tools,
          selectedCharacter.toolCategory
        );
      } else {
        chatProcessorRef.current.updateTools(toolContext.tools);
        chatProcessorRef.current.updateProcessor(selectedCharacter.toolCategory);
      }

      // Create processor function once tools are loaded
      setMessageProcessor(() => async (message: string) => {
        if (!chatProcessorRef.current) {
          throw new Error("Chat processor not initialized");
        }
        return chatProcessorRef.current.processMessage(message);
      });
    }
  }, [selectedCharacter, toolContext]);

  // Handle tool execution events
  const handleToolExecution = (event: ToolExecutionEvent) => {
    // Add to state
    setExecutionEvents((prev) => {
      const newEvents = [event, ...prev];
      addStoredEvent(event);
      return newEvents;
    });
  };

  // Clear execution history
  const handleClearExecutions = () => {
    if (window.confirm("Clear all execution history?")) {
      setExecutionEvents([]);
      clearStoredEvents();
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

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Character selector button (floating) */}
      <motion.button
        className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full shadow-lg bg-white border-2 border-farm-brown flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCharacterPickerOpen(true)}
      >
        {selectedCharacter ? (
          <span className="text-xl" role="img" aria-label={selectedCharacter.name}>
            {getCharacterEmoji(selectedCharacter.type)}
          </span>
        ) : (
          <span className="text-xl">🐾</span>
        )}
      </motion.button>
      
      {/* Settings button (floating) for LLM settings */}
      <motion.button
        className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full shadow-lg bg-farm-brown-light border-2 border-farm-brown flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMonitorExpanded(!isMonitorExpanded)}
      >
        <svg className="w-6 h-6 text-farm-brown-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </motion.button>
      
      {/* Main Chat Interface */}
      <div className="h-full flex-1 overflow-hidden">
        <ChatInterface
          provider={selectedProvider}
          modelName={selectedModel}
          onToolExecution={handleToolExecution}
          messageProcessor={messageProcessor}
          toolContext={toolContext}
          conversationId={currentConversationId}
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          className="h-full flex flex-col"
        />
      </div>
      
      {/* LLM Settings & Tool Monitor Panel (slide-in) */}
      <AnimatePresence>
        {isMonitorExpanded && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMonitorExpanded(false)}
            />
          
            {/* Settings panel */}
            <motion.div 
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-farm-wood-light z-50 overflow-y-auto farm-panel border-l border-farm-brown/20 shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="farm-panel-title flex items-center">
                <span className="mr-2">⚙️</span>
                Chat Settings
                <button
                  onClick={() => setIsMonitorExpanded(false)}
                  className="ml-auto p-1 hover:bg-farm-brown-dark rounded-full"
                >
                  ✕
                </button>
              </div>
              
              <div className="farm-panel-content p-4">
                <h3 className="text-sm font-medium text-farm-brown-dark mb-2">LLM Settings</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-xs text-farm-brown mb-1">Provider</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-farm-brown-light rounded-md text-farm-brown text-sm"
                    >
                      {providers.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-farm-brown mb-1">Model</label>
                    <ModelSelector
                      provider={selectedProvider}
                      value={selectedModel}
                      onChange={(newModel) => setSelectedModel(newModel)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {selectedCharacter && (
                  <>
                    <div className="border-t border-farm-brown-light my-4"></div>
                    <h3 className="text-sm font-medium text-farm-brown-dark mb-2">Current Character</h3>
                    <div className="farm-panel-content-inner p-3 bg-white/50 rounded-lg border border-farm-brown-light mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: selectedCharacter.color + '40' }}
                        >
                          {getCharacterEmoji(selectedCharacter.type)}
                        </div>
                        <div>
                          <div className="font-medium text-farm-brown-dark">{selectedCharacter.name}</div>
                          <div className="text-xs text-farm-brown">{selectedCharacter.role}</div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsCharacterPickerOpen(true)}
                      className="w-full px-3 py-2 bg-farm-brown-light hover:bg-farm-brown text-farm-brown hover:text-white rounded-md text-sm transition-colors mb-4"
                    >
                      Change Character
                    </button>
                  </>
                )}
                
                {executionEvents.length > 0 && (
                  <>
                    <div className="border-t border-farm-brown-light my-4"></div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-farm-brown-dark">Tool Executions</h3>
                      <button 
                        onClick={handleClearExecutions}
                        className="text-xs text-farm-brown hover:text-farm-brown-dark"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="max-h-[40vh] overflow-y-auto border border-farm-brown-light/50 rounded-lg">
                      <ToolMonitor
                        events={executionEvents}
                        isExpanded={true}
                        onToggle={() => {}}
                        onClear={handleClearExecutions}
                        className="h-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Character picker (slide up from bottom) */}
      <AnimatePresence>
        {isCharacterPickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCharacterPickerOpen(false)}
            />
            
            {/* Character picker panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-farm-wood-light z-50 overflow-y-auto rounded-t-xl border-t border-farm-brown/20 shadow-xl"
              variants={characterPickerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="sticky top-0 farm-panel-title flex items-center border-b border-farm-brown/20">
                <span className="mr-2">🐄</span>
                Select Character
                <button
                  onClick={() => setIsCharacterPickerOpen(false)}
                  className="ml-auto p-1 hover:bg-farm-brown-dark rounded-full"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {characters.map((character) => (
                  <motion.div
                    key={character.id}
                    className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                      selectedCharacter?.id === character.id 
                        ? 'border-farm-green bg-farm-green-light/20' 
                        : 'border-farm-brown-light/50 bg-white/50 hover:bg-white/80'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCharacter(character);
                      setIsCharacterPickerOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: character.color + '40' }}
                      >
                        {getCharacterEmoji(character.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-farm-brown-dark">{character.name}</div>
                        <div className="text-xs text-farm-brown">{character.role}</div>
                      </div>
                      {selectedCharacter?.id === character.id && (
                        <div className="text-farm-green">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {selectedCharacter?.id !== character.id && (
                      <div className="mt-2 text-xs text-farm-brown line-clamp-2">{character.description}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
