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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolExecution?: ToolExecutionEvent;
}

interface ChatInterfaceProps {
  modelName: string;
  provider: string;
  className?: string;
  onToolExecution?: (event: ToolExecutionEvent) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  modelName,
  provider,
  className = "",
  onToolExecution,
}) => {
  const toolContext = useContext(ToolContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState<{ [key: string]: boolean }>(
    {}
  );

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
  }, [provider, modelName, toolContext?.loading]);

  // Generate a unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

  // Send message to the LLM
  const sendMessage = async () => {
    if (!input.trim() || !modelName) return;

    const messageId = generateId();
    const userMessage: Message = {
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
      const assistantMessage: Message = {
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
