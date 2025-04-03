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
  const [input, setInput] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(modelSettings.baseModel);
  const [selectedProvider, setSelectedProvider] = useState<string>(modelSettings.baseProvider);
  const [executionEvents, setExecutionEvents] = useState<ToolExecutionEvent[]>(
    []
  );
  const [isMonitorExpanded, setIsMonitorExpanded] = useState<boolean>(false);
  const toolContext = useTools();
  const { selectedCharacter } = useCharacter();
  const chatProcessorRef = useRef<ExtendedChatProcessor | null>(null);
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
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
          className="h-full"
        />
      </div>

      <ToolMonitor
        events={executionEvents}
        isExpanded={isMonitorExpanded}
        onToggle={() => setIsMonitorExpanded(!isMonitorExpanded)}
        className="mb-4"
      />
    </div>
  );
};

export default Chat;
