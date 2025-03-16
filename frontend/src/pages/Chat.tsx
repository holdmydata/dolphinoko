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
import { ensureChatTool } from "../utils/ensureTools";
import ChatProcessor, {ProcessedMessage} from "../utils/ChatProcessor";

const Chat: React.FC = () => {
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

  // Initialize chat processor once tools are loaded
  useEffect(() => {
    if (!toolContext.loading && toolContext.tools.length > 0) {
      chatProcessorRef.current = new ChatProcessor(toolContext.tools);
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

  // Process chat messages for tool intents
  const processMessage = async (message: string) => {
    if (!chatProcessorRef.current) {
      return { type: "chat", content: message };
    }

    return await chatProcessorRef.current.processMessage(message);
  };

  // Callback to add a new tool execution event
  const handleToolExecution = (event: ToolExecutionEvent) => {
    // Add to state for immediate display
    setExecutionEvents((prev) => [event, ...prev]);

    // Store in local storage for persistence
    if (event.status !== "pending") {
      // Only store completed events
      addStoredEvent(event);
    }

    // Auto-expand monitor when new events occur
    if (!isMonitorExpanded && event.status !== "pending") {
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          AI Chat
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Chat with AI models and automatically detect when to use tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with model selection */}
        <div className="col-span-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-500 mb-1">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedModel(""); // Reset model when provider changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-600 mb-4">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              Tips
            </h3>
            <ul className="text-xs text-gray-800 dark:text-gray-200 space-y-1">
              <li>• Select a model from the list</li>
              <li>• Tools are automatically detected based on your messages</li>
              <li>
                • You can use /tool_name to directly invoke a specific tool
              </li>
              <li>• Press Enter to send messages (Shift+Enter for new line)</li>
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
              className="w-full text-sm text-red-600 hover:text-red-800"
            >
              Clear Execution History
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
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
