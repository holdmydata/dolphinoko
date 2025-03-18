import React, { useState, useRef, useEffect, useContext } from "react";
import { Button, Card, Textarea, Badge } from "../common";
import { api } from "../../utils/api";
import {
  ToolContext,
  LLMRequest,
  LLMResponse,
} from "../../context/ToolContext";
import { ToolExecutionEvent } from "./ToolMonitor";
import { ensureChatTool } from "../../utils/ensureTools";
import { v4 as uuidv4, v4 } from "uuid";
import { useConversation } from "../../context/ConversationContext";
import { Message as ApiMessage } from "../../utils/api";
// Add these type definitions
interface ProcessedMessage {
  type: "chat" | "tool" | "parameter_request";
  content?: string;
  toolId?: string;
  parameters?: any;
  currentParameters?: Record<string, any>;
  missingParameters?: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
  }>;
}

interface ParameterCollectionState {
  toolId: string;
  currentParams: Record<string, any>;
  missingParams: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
  }>;
}

interface ChatInterfaceProps {
  modelName: string;
  provider: string;
  conversationId: string | null;
  messages: UIMessage[];
  isLoading: boolean;
  className?: string;
  onToolExecution: (event: ToolExecutionEvent) => void;
  messageProcessor?: (message: string) => Promise<ProcessedMessage>;
  toolContext?: ToolContext;
  sendMessage?: (content: string, toolId?: string) => Promise<void>;
}

// Extended message type for UI needs
interface UIMessage extends ApiMessage {
  timestamp: Date; // Override timestamp to be a Date instead of string
  toolExecution?: ToolExecutionEvent;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  modelName,
  provider,
  conversationId,
  className = "",
  onToolExecution,
  messageProcessor, // Add this parameter
}) => {
  const toolContext = useContext(ToolContext);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState<{ [key: string]: boolean }>(
    {}
  );
  // Add state for parameter collection
  const [collectingParameters, setCollectingParameters] =
    useState<ParameterCollectionState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add a new useEffect to ensure a chat tool exists when provider/model changes
  useEffect(() => {
    if (provider && modelName && toolContext && !toolContext.loading) {
      ensureChatTool(toolContext, provider, modelName)
        .then((tool) => {
          console.log(
            `Ensured chat tool exists for ${provider}/${modelName}:`,
            tool
          );
        })
        .catch((err) => {
          console.error(`Error ensuring chat tool:`, err);
        });
    }
  }, [provider, modelName, toolContext]);

  // Load conversation on initial mount if conversationId exists
  useEffect(() => {
    if (conversationId) {
      // Load messages from existing conversation
      api
        .get<{ messages: ApiMessage[] }>(`/api/conversations/${conversationId}`)
        .then((response) => {
          // Convert API message format to your internal format
          const convertedMessages: UIMessage[] = response.messages.map(
            (apiMsg) => ({
              id: apiMsg.id,
              role: apiMsg.role as "user" | "assistant",
              content: apiMsg.content,
              timestamp: new Date(apiMsg.timestamp),
              // Map other fields if needed
            })
          );
          setMessages(convertedMessages);
        })
        .catch((err) => {
          console.error("Failed to load conversation:", err);
        });
    }
  }, [conversationId]);

  // Generate a unique ID
  const generateId = (): string => {
    return uuidv4();
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Toggle metrics display for a specific message
  const toggleMetrics = (messageId: string) => {
    setShowMetrics((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Send message to the LLM - UPDATED to include message processing
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Create user message
    const messageId = generateId();
    const userMessage: UIMessage = {
      id: messageId,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    // Store user message in Neo4j
    if (conversationId) {
      try {
        // Create a simplified message object with only the fields the server expects
        const messageData = {
          content: userMessage.content,
          role: userMessage.role,
          // Don't include other fields like timestamp that might cause issues
        };

        console.log("Sending message to server:", messageData);

        await api.post(
          `/api/conversations/${conversationId}/messages`,
          messageData
        );
      } catch (persistError) {
        console.error(
          "Failed to store user message in conversation:",
          persistError
        );
        if (persistError.response) {
          console.error("Server response:", persistError.response.data);
        }
        // We continue with the flow despite persistence errors
      }
    }

    // Try to process with message processor first (for tool detection)
    if (messageProcessor) {
      try {
        const processed = await messageProcessor(userMessage.content);

        if (processed.type === "tool" && processed.toolId) {
          await handleToolProcessing(processed);
          setIsLoading(false);
          return;
        }

        if (processed.type === "parameter_request") {
          // Handle parameter collection UI
          setCollectingParameters({
            toolId: processed.toolId || "",
            currentParams: processed.currentParameters || {},
            missingParams: processed.missingParameters || [],
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error processing message:", err);
        // Fall through to normal chat processing
      }
    }

    // If no tool was triggered or no processor is available, proceed with normal chat
    if (!modelName) {
      const errorMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        content: "Please select a model first.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    const startTime = new Date();

    try {
      let response;
      let toolExecution: ToolExecutionEvent | undefined;
      let chatTool = toolContext?.tools.find(
        (t) => t.name.toLowerCase().includes("chat") && t.provider === provider
      );

      // If no chat tool exists yet, try to create one
      if (!chatTool && toolContext && !toolContext.loading) {
        try {
          // Try to create the tool
          chatTool = await ensureChatTool(toolContext, provider, modelName);
        } catch (err) {
          console.warn(
            "Failed to create chat tool, falling back to direct API call:",
            err
          );
        }
      }

      if (chatTool && toolContext?.runTool) {
        // If we have a chat tool, use the tool execution framework
        const request: LLMRequest = {
          tool_id: chatTool.id!,
          input: userMessage.content,
          parameters: {
            model: modelName,
            temperature: 0.7,
            max_tokens: 1000,
          },
          // Add conversation_id for memory
          conversation_id: conversationId || v4(),
        };

        // Create and track the tool execution event
        toolExecution = {
          id: generateId(),
          toolId: chatTool.id!,
          toolName: chatTool.name,
          input: userMessage.content,
          output: "",
          startTime,
          status: "pending",
          metrics: {},
        };

        // Report the pending execution
        onToolExecution && onToolExecution(toolExecution);

        // Run the tool
        const apiStartTime = Date.now();
        const toolResponse = await toolContext.runTool(request);
        const processingTime = Date.now() - apiStartTime;

        // Update the tool execution with results
        toolExecution = {
          ...toolExecution,
          output: toolResponse.output,
          endTime: new Date(),
          status: "success",
          metrics: {
            processingTime,
            ...toolResponse.metadata,
          },
        };

        // Create assistant message
        response = {
          text: toolResponse.output,
          model: modelName,
          metadata: toolResponse.metadata,
        };
      } else {
        // Fallback to direct API call if no suitable tool is found
        const apiStartTime = Date.now();

        if (provider === "ollama") {
          response = await api.post("/api/chat/ollama", {
            model: modelName,
            message: userMessage.content,
            parameters: {
              temperature: 0.7,
              max_tokens: 1000,
            },
            // Add conversation_id for memory
            conversation_id: conversationId,
          });
        } else {
          // Fallback to generic endpoint
          response = await api.post("/api/llm/generate", {
            tool_id: "chat",
            input: userMessage.content,
            parameters: {
              model: modelName,
              provider: provider,
            },
            // Add conversation_id for memory
            conversation_id: conversationId,
          });
        }

        const processingTime = Date.now() - apiStartTime;

        // Create a manual tool execution event
        toolExecution = {
          id: generateId(),
          toolId: "direct-api-call",
          toolName: `${provider}/${modelName}`,
          input: userMessage.content,
          output: response.text || response.output || "No response received",
          startTime,
          endTime: new Date(),
          status: "success",
          metrics: {
            processingTime,
            ...response.metadata,
          },
        };
      }

      // Report the execution
      if (toolExecution) {
        onToolExecution && onToolExecution(toolExecution);
      }

      // Add assistant response to chat
      const assistantMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        content: response.text || response.output || "No response received",
        timestamp: new Date(),
        toolExecution,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-show metrics for this message
      setShowMetrics((prev) => ({
        ...prev,
        [assistantMessage.id]: true,
      }));
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to get a response. Please try again.");

      // Create an error tool execution
      const errorExecution: ToolExecutionEvent = {
        id: generateId(),
        toolId: "error",
        toolName: `${provider}/${modelName}`,
        input: userMessage.content,
        output: err.message || "An error occurred",
        startTime,
        endTime: new Date(),
        status: "error",
        metrics: {
          error: err.message,
        },
      };

      // Report the error execution
      onToolExecution && onToolExecution(errorExecution);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tool processing
  const handleToolProcessing = async (processed: ProcessedMessage) => {
    if (!processed.toolId) return;

    console.log("Starting tool processing:", processed);

    // Create execution ID
    const executionId = uuidv4();

    // Get tool name
    const toolName =
      toolContext?.tools.find((t) => t.id === processed.toolId)?.name ||
      "Unknown Tool";
    console.log("Found tool:", toolName);

    // Create pending event
    const pendingExecution: ToolExecutionEvent = {
      id: executionId,
      toolId: processed.toolId,
      toolName: toolName,
      input: processed.parameters,
      output: "",
      startTime: new Date(),
      status: "pending",
      metrics: {},
    };

    // Report pending execution
    console.log("Reporting pending execution:", pendingExecution);
    onToolExecution(pendingExecution);

    try {
      // Execute the tool
      if (!toolContext?.runTool) {
        throw new Error("Tool execution not available");
      }

      console.log("Calling toolContext.runTool with:", {
        tool_id: processed.toolId,
        input: processed.parameters,
      });

      const response = await toolContext.runTool({
        tool_id: processed.toolId,
        input: processed.parameters,
      });

      console.log("Tool execution response:", response);

      // Create success execution
      const successExecution: ToolExecutionEvent = {
        id: executionId,
        toolId: processed.toolId,
        toolName: toolName,
        input: processed.parameters,
        output: response.output,
        startTime: pendingExecution.startTime,
        endTime: new Date(),
        status: "success",
        metrics: {
          processingTime: response.metadata?.processing_time || 0,
          ...response.metadata,
        },
      };

      // Report success execution
      console.log("Reporting success execution:", successExecution);
      onToolExecution(successExecution);

      // Add assistant message
      const assistantMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        content: response.output,
        timestamp: new Date(),
        toolExecution: successExecution,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Tool execution failed:", error);
      console.log("Error details:", error.message, error.stack);

      // Create error execution (this part is correct)
      const errorExecution: ToolExecutionEvent = {
        id: executionId,
        toolId: processed.toolId,
        toolName: toolName,
        input: processed.parameters,
        output: error.message || "Unknown error",
        startTime: pendingExecution.startTime,
        endTime: new Date(),
        status: "error",
        metrics: {
          error: error.message,
        },
      };

      // Report error execution
      console.log("Reporting error execution:", errorExecution);
      onToolExecution(errorExecution);

      // Add error message
      const errorMessage: UIMessage = {
        // Use UIMessage here
        id: generateId(),
        role: "assistant",
        content: `Error executing tool: ${error.message || "Unknown error"}`,
        timestamp: new Date(),
        toolExecution: errorExecution,
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Store in Neo4j - here's where you had errors
      if (conversationId) {
        try {
          // Ensure metadata is a valid object and safely extract properties
          const safeMetadata: Record<string, any> = {};

          // Only add metrics if they exist
          if (
            errorExecution.metrics &&
            typeof errorExecution.metrics === "object"
          ) {
            // Copy simple properties that will serialize correctly
            Object.keys(errorExecution.metrics).forEach((key) => {
              const value = errorExecution.metrics[key];
              // Only include primitive values and simple objects
              if (
                value !== undefined &&
                (typeof value === "string" ||
                  typeof value === "number" ||
                  typeof value === "boolean" ||
                  (typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)))
              ) {
                safeMetadata[key] = value;
              }
            });
          }

          // Add error information to metadata
          safeMetadata.error_message = error.message || "Unknown error";
          safeMetadata.error_timestamp = new Date().toISOString();

          await api.post(`/api/conversations/${conversationId}/messages`, {
            content: errorMessage.content,
            role: errorMessage.role,
            tool_id: errorExecution.toolId,
            metadata: safeMetadata,
          });
        } catch (persistError) {
          console.error(
            "Failed to store error message in conversation:",
            persistError
          );
          console.error("Error details:", persistError.message);
        }
      }
    }
  };
  // Submit parameters for a tool
  const handleParameterSubmit = async (parameters: Record<string, any>) => {
    if (!collectingParameters) return;

    // Combine current and new parameters
    const combinedParams = {
      ...collectingParameters.currentParams,
      ...parameters,
    };

    // Reset parameter collection state
    setCollectingParameters(null);

    // Process with the tool
    if (toolContext) {
      setIsLoading(true);

      try {
        const response = await toolContext.runTool({
          tool_id: collectingParameters.toolId,
          input: combinedParams,
        });

        // Create execution event
        const executionEvent: ToolExecutionEvent = {
          id: generateId(),
          toolId: collectingParameters.toolId,
          toolName:
            toolContext.tools.find((t) => t.id === collectingParameters.toolId)
              ?.name || "Unknown Tool",
          input: combinedParams,
          output: response.output,
          startTime: new Date(),
          endTime: new Date(),
          status: "success",
          metrics: response.metadata,
        };

        // Report execution
        onToolExecution(executionEvent);

        // Add assistant message
        const assistantMessage: UIMessage = {
          id: generateId(),
          role: "assistant",
          content: response.output,
          timestamp: new Date(),
          toolExecution: executionEvent,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        console.error("Parameter submission failed:", error);

        // Add error message
        const errorMessage: UIMessage = {
          id: generateId(),
          role: "assistant",
          content: `Error: ${error.message || "Unknown error"}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    if (
      messages.length > 0 &&
      window.confirm("Are you sure you want to clear the chat?")
    ) {
      setMessages([]);
      setShowMetrics({});
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`} noPadding>
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-800">Chat</h3>
          {modelName && (
            <Badge variant="primary" size="sm" className="ml-2">
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
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-lg">
                Start a conversation with {modelName || "the AI"}
              </p>
            </div>

            {/* Tool Creation Prompt - only show if there's no chat tool for this provider */}
            {modelName &&
              toolContext &&
              !toolContext.tools.some(
                (t) =>
                  t.name.toLowerCase().includes("chat") &&
                  t.provider === provider
              ) && (
                <div className="mt-6 w-full max-w-md p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                  <p className="font-medium mb-1">Monitoring Tip:</p>
                  <p>
                    For better metrics and monitoring, you can create a chat
                    tool.
                  </p>
                  <button
                    onClick={() =>
                      ensureChatTool(toolContext, provider, modelName)
                    }
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                    disabled={toolContext.loading}
                  >
                    Create Chat Tool for {provider}
                  </button>
                </div>
              )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Timestamp and metrics toggle */}
                <div
                  className={`flex justify-between items-center text-xs mt-1`}
                >
                  <div
                    className={`${
                      message.role === "user"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>

                  {message.role === "assistant" && message.toolExecution && (
                    <button
                      className="ml-2 text-blue-600 flex items-center hover:text-blue-800"
                      onClick={() => toggleMetrics(message.id)}
                    >
                      <span className="mr-1">Metrics</span>
                      <svg
                        className={`w-3 h-3 transform transition-transform ${
                          showMetrics[message.id] ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Inline metrics */}
                {message.role === "assistant" &&
                  message.toolExecution &&
                  showMetrics[message.id] && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                      <div className="mb-1">
                        <span className="font-medium">Tool:</span>{" "}
                        {message.toolExecution.toolName}
                        {message.toolExecution.toolId?.startsWith(
                          "direct-api-call"
                        ) && (
                          <span className="text-yellow-600 ml-1">
                            (direct API call)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        {message.toolExecution.metrics.processingTime !==
                          undefined && (
                          <div>
                            <span>Processing time:</span>{" "}
                            <span className="font-medium">
                              {message.toolExecution.metrics.processingTime.toFixed(
                                0
                              )}{" "}
                              ms
                            </span>
                          </div>
                        )}

                        {message.toolExecution.metrics.tokenCount !==
                          undefined && (
                          <div>
                            <span>Tokens:</span>{" "}
                            <span className="font-medium">
                              {message.toolExecution.metrics.tokenCount}
                            </span>
                          </div>
                        )}

                        {message.toolExecution.metrics.total_duration !==
                          undefined && (
                          <div>
                            <span>Model time:</span>{" "}
                            <span className="font-medium">
                              {(
                                message.toolExecution.metrics.total_duration /
                                1e9
                              ).toFixed(2)}{" "}
                              s
                            </span>
                          </div>
                        )}
                        {message.toolExecution?.metrics?.used_memories > 0 && (
                          <div className="mb-1 text-emerald-700">
                            <span className="font-medium">Memory:</span> Used{" "}
                            {message.toolExecution.metrics.used_memories}{" "}
                            relevant memories
                          </div>
                        )}
                        {message.toolExecution.metrics.eval_count !==
                          undefined && (
                          <div>
                            <span>Tokens generated:</span>{" "}
                            <span className="font-medium">
                              {message.toolExecution.metrics.eval_count}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Additional metrics that might be available */}
                      {Object.entries(message.toolExecution.metrics).filter(
                        ([key]) =>
                          ![
                            "processingTime",
                            "tokenCount",
                            "total_duration",
                            "eval_count",
                            "error",
                          ].includes(key)
                      ).length > 0 && (
                        <div className="mt-2">
                          <details>
                            <summary className="cursor-pointer hover:text-blue-600">
                              Additional metrics
                            </summary>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 pl-2">
                              {Object.entries(message.toolExecution.metrics)
                                .filter(
                                  ([key]) =>
                                    ![
                                      "processingTime",
                                      "tokenCount",
                                      "total_duration",
                                      "eval_count",
                                      "error",
                                    ].includes(key)
                                )
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span>{key}:</span>{" "}
                                    <span className="font-medium">
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))
        )}

        {/* Parameter Collection UI */}
        {collectingParameters && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              Additional information needed
            </h4>
            <p className="text-sm text-blue-700 mb-4">
              Please provide the following information to continue:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Extract form data and submit
                const formData = new FormData(e.currentTarget);
                const parameters: Record<string, any> = {};

                collectingParameters.missingParams.forEach((param) => {
                  const value = formData.get(param.name);
                  if (value) {
                    // Convert types as needed
                    if (param.type === "number") {
                      parameters[param.name] = Number(value);
                    } else if (param.type === "boolean") {
                      parameters[param.name] = value === "true";
                    } else {
                      parameters[param.name] = value;
                    }
                  }
                });

                handleParameterSubmit(parameters);
              }}
            >
              <div className="space-y-3">
                {collectingParameters.missingParams.map((param) => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      {param.name}
                      {param.required ? " *" : ""}
                      {param.description && (
                        <span className="ml-1 text-xs font-normal text-blue-500">
                          ({param.description})
                        </span>
                      )}
                    </label>
                    {param.type === "boolean" ? (
                      <select
                        name={param.name}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={param.required}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        name={param.name}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={param.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                  onClick={() => setCollectingParameters(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
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
          <div className="p-2 text-center text-red-500 text-sm">{error}</div>
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
            placeholder={
              modelName ? `Message ${modelName}...` : "Select a model first..."
            }
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
