// frontend/src/pages/Chat.tsx
import React, { useState, useEffect, useRef } from "react";
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
import { useConversation } from "../context/ConversationContext";
import { ensureChatTool } from "../utils/ensureTools";
import ChatProcessor, { ProcessedMessage } from "../utils/ChatProcessor";

const Chat: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ollama");
  const [executionEvents, setExecutionEvents] = useState<ToolExecutionEvent[]>(
    []
  );
  const [isMonitorExpanded, setIsMonitorExpanded] = useState<boolean>(false);
  const toolContext = useTools();
  const chatProcessorRef = useRef<ChatProcessor | null>(null);
  const [messageProcessor, setMessageProcessor] = useState<
    ((message: string) => Promise<ProcessedMessage>) | undefined
  >(undefined);

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

  // Initialize chat processor and set message processor - SINGLE USEEFFECT
  useEffect(() => {
    console.log("Tool context changed, tools count:", toolContext.tools.length);
    if (!toolContext.loading && toolContext.tools.length > 0) {
      console.log("Initializing ChatProcessor with tools");
      chatProcessorRef.current = new ChatProcessor(toolContext.tools);

      // Create a properly typed message processor function
      const processor = async (message: string): Promise<ProcessedMessage> => {
        console.log("Processing message:", message);
        if (!chatProcessorRef.current) {
          console.log("No ChatProcessor available, returning default");
          return { type: "chat", content: message };
        }
        console.log("Using ChatProcessor to process message");
        return await chatProcessorRef.current.processMessage(message);
      };

      // Set the processor
      setMessageProcessor(() => processor);
      console.log("Message processor set");
    }
  }, [toolContext.loading, toolContext.tools]);

  // Ensure a chat tool exists for the selected provider and model
  useEffect(() => {
    if (selectedProvider && selectedModel) {
      ensureChatTool(toolContext, selectedProvider, selectedModel)
        .then((tool) => {
          if (tool) {
            console.log(`Chat tool for ${selectedProvider} is ready`);
          }
        })
        .catch((err) => {
          console.error("Failed to ensure chat tool:", err);
        });
    }
  }, [selectedProvider, selectedModel, toolContext]);

  // Load stored execution events on initial render
  useEffect(() => {
    const storedEvents = getStoredEvents();
    if (storedEvents.length > 0) {
      setExecutionEvents(storedEvents);
    }
  }, []);

  // Callback to add a new tool execution event
  const handleToolExecution = (event: ToolExecutionEvent) => {
    console.log("Tool execution event:", event);
    
    // Create a new event object with a unique ID that includes timestamp
    const uniqueEvent = {
      ...event,
      // Add timestamp to the ID to ensure uniqueness
      id: `${event.id}-${Date.now()}`
    };
    
    // Add to state for immediate display
    setExecutionEvents((prev) => {
      // Check if we already have this event
      const existingIndex = prev.findIndex(e => e.id === uniqueEvent.id);
      if (existingIndex >= 0) {
        // Update the existing event
        const updated = [...prev];
        updated[existingIndex] = uniqueEvent;
        return updated;
      } else {
        // Add as a new event
        return [uniqueEvent, ...prev];
      }
    });
  
    // Store in local storage for persistence
    if (uniqueEvent.status !== "pending") {
      addStoredEvent(uniqueEvent);
    }
  
    // Auto-expand monitor when new events occur
    if (!isMonitorExpanded && uniqueEvent.status !== "pending") {
      setIsMonitorExpanded(true);
    }
  };

  // Clear tool execution events
  const clearExecutionEvents = () => {
    if (
      executionEvents.length > 0 &&
      window.confirm(
        "Are you sure you want to clear all tool execution events?"
      )
    ) {
      setExecutionEvents([]);
      clearStoredEvents(); // Also clear from storage
    }
  };

  useEffect(() => {
    if (!currentConversationId && !isLoading) {
      console.log("Creating new conversation");
      createNewConversation()
        .then((id) => console.log("Created conversation:", id))
        .catch((err) => console.error("Failed to create conversation:", err));
    }
  }, [currentConversationId, isLoading, createNewConversation]);

  // Log when messageProcessor changes
  useEffect(() => {
    console.log("Message processor state updated:", !!messageProcessor);
  }, [messageProcessor]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-farm-brown">
          Farmer's Chat Station
        </h1>
        <p className="mt-2 text-farm-brown-dark/80">
          Chat with AI models to help with your farming and tool tasks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with model selection */}
        <div className="col-span-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-farm-brown mb-1">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedModel(""); // Reset model when provider changes
              }}
              className="w-full px-3 py-2 border border-farm-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-farm-green bg-white/90"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <ModelSelector
            provider={selectedProvider}
            value={selectedModel}
            onChange={setSelectedModel}
            className="mb-4"
          />

          <div className="bg-farm-earth-light/50 p-4 rounded-lg border border-farm-brown/20 mb-4 shadow-sm">
            <h3 className="text-sm font-medium text-farm-brown mb-2 flex items-center">
              <span className="mr-2 text-lg">🌱</span>Planting Tips
            </h3>
            <ul className="text-sm text-farm-brown space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-farm-green">•</span> 
                <span>Select a model to help with your farming</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-farm-green">•</span> 
                <span>Tools are automatically detected based on your needs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-farm-green">•</span> 
                <span>Use /tool_name to directly call a specific tool</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-farm-green">•</span> 
                <span>Press Enter to send (Shift+Enter for new line)</span>
              </li>
            </ul>
          </div>

          {/* Tool Monitor Panel */}
          <ToolMonitor
            events={executionEvents}
            isExpanded={isMonitorExpanded}
            onToggle={() => setIsMonitorExpanded(!isMonitorExpanded)}
            className="mb-4"
          />

          {executionEvents.length > 0 && (
            <button
              onClick={clearExecutionEvents}
              className="w-full text-sm text-farm-brown-dark/80 hover:text-farm-brown-dark border border-farm-brown/20 rounded-lg p-2 transition-colors bg-white/50 hover:bg-white/80"
            >
              Clear Tool History
            </button>
          )}
        </div>

        {/* Chat interface */}
        <div className="col-span-1 lg:col-span-3">
          <ChatInterface
            modelName={selectedModel}
            provider={selectedProvider}
            onToolExecution={handleToolExecution}
            messageProcessor={messageProcessor}
            toolContext={toolContext}
            className="h-[75vh] bg-farm-earth-light/10 border-farm-brown/20 shadow-lg rounded-xl overflow-hidden"
            // Add these props
            conversationId={currentConversationId}
            messages={messages}
            isLoading={isLoading}
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
