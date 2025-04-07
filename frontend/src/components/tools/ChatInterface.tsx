import React, { useState, useRef, useEffect, useContext } from "react";
import { Button, Card, TextArea, Badge } from "../common";
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
import { Message as ApiMessage, Conversation } from "../../utils/api";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";
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

// Add a new type for the extended message that includes thinking steps
export interface MessageThinkingStep {
  id: string;
  step: string;
  timestamp: Date;
}

// Update the UIMessage type to include thinking steps
interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolExecution?: ToolExecutionEvent;
  thinkingSteps?: MessageThinkingStep[];
  isThinking?: boolean;
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
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [showMetrics, setShowMetrics] = useState<{ [key: string]: boolean }>(
    {}
  );
  // Add state for parameter collection
  const [collectingParameters, setCollectingParameters] =
    useState<ParameterCollectionState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Try to scroll the message container to the bottom
    if (messagesEndRef.current) {
      setTimeout(() => {
        // Get the parent scroll container
        const scrollContainer = messagesEndRef.current?.closest('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          // Fallback to scrolling the element into view
          messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest" 
          });
        }
      }, 100); // Small delay to ensure content is rendered
    }
  }, [messages, isStreaming, streamingMessage]);

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
        .get<Conversation>(`/api/conversations/${conversationId}`)
        .then((response) => {
          // Convert API message format to your internal format
          const convertedMessages: UIMessage[] = response.messages.map(
            (apiMsg) => {
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
            }
          );
          
          // Set messages in state
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

    // Store user message if conversation exists
    if (conversationId) {
      try {
        const messageData = {
          content: userMessage.content,
          role: userMessage.role,
        };
        console.log("Sending message to server:", messageData);
        await api.post(
          `/api/conversations/${conversationId}/messages`,
          messageData
        );
      } catch (persistError) {
        console.error("Failed to store user message:", persistError);
      }
    }

    // Simulate thinking steps for the assistant (in a real implementation, these would come from the backend)
    // Add a placeholder for the assistant's "thinking" state
    const assistantThinkingId = generateId();
    const assistantThinking: UIMessage = {
      id: assistantThinkingId,
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
      isThinking: true,
      thinkingSteps: []
    };

    // Add the thinking message to the chat
    setMessages(prev => [...prev, assistantThinking]);

    // If we're using a tool via message processor, show the thinking process
    if (messageProcessor) {
      try {
        const processed = await messageProcessor(userMessage.content);
        if (processed.type === "tool" && processed.toolId) {
          await handleToolProcessing(processed);
          setIsLoading(false);
          return;
        }
        if (processed.type === "parameter_request") {
          setCollectingParameters({
            toolId: processed.toolId || "",
            currentParams: processed.currentParameters || {},
            missingParams: processed.missingParameters || [],
          });
          setIsLoading(false);
          return;
        }

        // Add thinking steps gradually if processing with a tool
        if (processed.type === "tool" && processed.toolId) {
          // Add thinking steps with a delay between each
          const steps = [
            "Analyzing your request...",
            `Selecting appropriate tool: ${processed.toolId}`,
            "Preparing parameters...",
            "Executing tool..."
          ];
          
          // Update the thinking steps one by one
          steps.forEach((step, index) => {
            setTimeout(() => {
              setMessages(prev => {
                const newMessages = [...prev];
                const thinkingMessageIndex = newMessages.findIndex(m => m.id === assistantThinkingId);
                
                if (thinkingMessageIndex !== -1) {
                  const newThinkingSteps = [
                    ...(newMessages[thinkingMessageIndex].thinkingSteps || []),
                    {
                      id: generateId(),
                      step,
                      timestamp: new Date()
                    }
                  ];
                  
                  newMessages[thinkingMessageIndex] = {
                    ...newMessages[thinkingMessageIndex],
                    thinkingSteps: newThinkingSteps
                  };
                }
                
                return newMessages;
              });
            }, (index + 1) * 800);
          });
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    }

    // If no tool triggered or processor available, proceed with normal chat
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
    const responseId = generateId();

    try {
      // Create a placeholder for streaming response
      setIsStreaming(true);
      setStreamingMessage("");

      // Add placeholder message
      const placeholderMessage: UIMessage = {
        id: responseId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      let chatTool = toolContext?.tools.find(
        (t) => t.name.toLowerCase().includes("chat") && t.provider === provider
      );

      // If no chat tool exists yet, try to create one
      if (!chatTool && toolContext && !toolContext.loading) {
        try {
          const newChatTool = await ensureChatTool(toolContext, provider, modelName);
          if (newChatTool) {
            chatTool = newChatTool;
          }
        } catch (err) {
          console.warn(
            "Failed to create chat tool, falling back to direct API call:",
            err
          );
        }
      }

      let toolExecution: ToolExecutionEvent | undefined;
      let response: any = {};

      if (chatTool && toolContext?.runTool) {
        // Setup for streaming
        const controller = new AbortController();
        const signal = controller.signal;

        // Create tool execution event
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

        // Report pending execution
        onToolExecution && onToolExecution(toolExecution);

        // Run tool with streaming
        try {
          // Make streaming request
          const streamResponse = await fetch(`/api/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tool_id: chatTool.id!,
              input: userMessage.content,
              parameters: {
                model: modelName,
                temperature: 0.7,
                stream: true,
              },
              conversation_id: conversationId || v4(),
            }),
            signal,
          });
        
          if (!streamResponse.ok) {
            throw new Error(`HTTP error! status: ${streamResponse.status}`);
          }
        
          const reader = streamResponse.body?.getReader();
          if (!reader) throw new Error("Response body is null");
        
          // Start streaming
          let fullText = "";
          let noContentReceived = true;
        
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            // Decode chunk
            const chunk = new TextDecoder().decode(value);
            console.log("Chunk received:", chunk);
            
            try {
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                console.log("Processing line:", line);
                
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6);
                  console.log("JSON string:", jsonStr);
                  
                  if (jsonStr === '[DONE]') {
                    console.log("Done marker received");
                    continue;
                  }
                  
                  try {
                    const data = JSON.parse(jsonStr);
                    console.log("Parsed data:", data);
                    
                    if (data.content) {
                      noContentReceived = false;
                      fullText += data.content;
                      setStreamingMessage(fullText);
                      
                      // Update the message in the UI
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === responseId
                            ? { ...msg, content: fullText }
                            : msg
                        )
                      );
                    } else if (data.error) {
                      console.error("Received error from streaming:", data.error);
                      throw new Error(data.error);
                    }
                  } catch (e) {
                    console.error("Error parsing JSON:", e, jsonStr);
                  }
                }
              }
            } catch (e) {
              console.error("Error processing chunk:", e);
            }
          }
          
          // If we got to the end but received no content
          if (noContentReceived) {
            console.warn("No content received in streaming response");
            fullText = "No response received from the model. Please try again.";
            
            // Update the placeholder message
            setMessages(prev =>
              prev.map(msg =>
                msg.id === responseId
                  ? { ...msg, content: fullText }
                  : msg
              )
            );
          }
        
          // Streaming complete
          toolExecution = {
            ...toolExecution,
            output: fullText,
            endTime: new Date(),
            status: "success",
            metrics: {
              processingTime: new Date().getTime() - startTime.getTime(),
            },
          };
          
          // Report final execution
          onToolExecution && onToolExecution(toolExecution);
          
          // Set response for consistent handling below
          response = {
            text: fullText,
            model: modelName,
            metadata: {
              processingTime: new Date().getTime() - startTime.getTime(),
            },
          };
          
        } catch (err) {
          console.error("Streaming error:", err);
          controller.abort();
          throw err;
        }
      } else if (chatTool && toolContext?.runTool) {
        // Create request object for non-streaming flow
        const request: LLMRequest = {
          tool_id: chatTool.id!,
          input: userMessage.content,
          parameters: {
            model: modelName,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9
          },
          conversation_id: conversationId || v4(),
        };

        // Create tool execution event
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

        // Report pending execution
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
              max_tokens: 2000,
              top_p: 0.9
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
              temperature: 0.7,
              max_tokens: 2000,
              top_p: 0.9
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

      // For streaming, we've already updated the message in place
      if (!isStreaming) {
        // Add assistant response to chat (for non-streaming responses)
        const assistantMessage: UIMessage = {
          id: responseId, // Use the same ID as the placeholder for update
          role: "assistant",
          content: response.text || response.output || "No response received",
          timestamp: new Date(),
          toolExecution,
        };

        setMessages((prev) =>
          prev.map((msg) => (msg.id === responseId ? assistantMessage : msg))
        );

        // Auto-show metrics for this message
        setShowMetrics((prev) => ({
          ...prev,
          [responseId]: true,
        }));
      }

      // Set streaming state to false
      setIsStreaming(false);
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to get a response. Please try again.");
      setIsStreaming(false);

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

      // Update the placeholder message with the error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === responseId
            ? {
                ...msg,
                content: `Error: ${err.message || "An error occurred"}`,
                toolExecution: errorExecution,
              }
            : msg
        )
      );
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
      const startTime = new Date(); // Add this
      const responseId = generateId(); // Add this

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
          startTime: startTime,
          endTime: new Date(),
          status: "success",
          metrics: response.metadata,
        };

        // Report execution
        onToolExecution(executionEvent);

        // Add assistant message
        const assistantMessage: UIMessage = {
          id: responseId,
          role: "assistant",
          content: response.output,
          timestamp: new Date(),
          toolExecution: executionEvent,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Auto-show metrics for this message
        setShowMetrics((prev) => ({
          ...prev,
          [responseId]: true,
        }));
      } catch (err: any) {
        console.error("Parameter submission failed:", err);

        // Create an error execution
        const errorExecution: ToolExecutionEvent = {
          id: generateId(),
          toolId: collectingParameters.toolId,
          toolName:
            toolContext.tools.find((t) => t.id === collectingParameters.toolId)
              ?.name || "Unknown Tool",
          input: combinedParams,
          output: err.message || "An error occurred",
          startTime: startTime,
          endTime: new Date(),
          status: "error",
          metrics: {
            error: err.message,
          },
        };

        // Report the error
        onToolExecution && onToolExecution(errorExecution);

        // Add error message
        const errorMessage: UIMessage = {
          id: responseId,
          role: "assistant",
          content: `Error: ${err.message || "Unknown error"}`,
          timestamp: new Date(),
          toolExecution: errorExecution,
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
    <Card className={`flex flex-col ${className}`}>
      {/* Clear chat button */}
      <div className="flex justify-between items-center p-3 border-b border-farm-brown/20 bg-farm-earth-light/50">
        <h2 className="text-lg font-semibold text-farm-brown flex items-center">
          <span className="mr-2">🚜</span>
          {modelName || "Select a model"}
        </h2>
        <Button
          variant="ghost"
          onClick={clearChat}
          className="text-farm-brown-dark/70 hover:text-farm-brown-dark"
          disabled={messages.length === 0}
        >
          Clear Field
        </Button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-farm-earth-light/10 min-h-[300px] h-[calc(100vh-320px)]" style={{overflowY: 'auto'}}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-farm-brown-dark/60">
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
                Start growing a conversation with {modelName || "the Farm AI"}
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
                <div className="mt-6 w-full max-w-md p-3 bg-farm-earth-light/50 border border-farm-brown/20 rounded-md text-sm text-farm-brown">
                  <p className="font-medium mb-1">Farming Tip:</p>
                  <p>
                    For better harvesting of information, you can create a chat tool.
                  </p>
                  <button
                    onClick={() =>
                      ensureChatTool(toolContext, provider, modelName)
                    }
                    className="mt-2 px-3 py-1 bg-farm-green text-white rounded-md text-xs hover:bg-farm-green-dark"
                    disabled={toolContext.loading}
                  >
                    Plant Chat Tool for {provider}
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
                    ? "bg-farm-green-light text-farm-brown-dark"
                    : message.isThinking
                    ? "bg-farm-wood-light/80 text-farm-brown-dark"
                    : "bg-farm-earth-light text-farm-brown-dark"
                } border border-farm-brown/10 shadow-sm`}
              >
                {message.isThinking ? (
                  <div className="thinking-message">
                    <div className="flex items-center">
                      <div className="animate-pulse mr-2">💭</div>
                      <div className="font-medium">Thinking...</div>
                    </div>
                    
                    {message.thinkingSteps && message.thinkingSteps.length > 0 && (
                      <div className="mt-2 border-t border-farm-brown/10 pt-2">
                        <div className="text-xs text-farm-brown mb-1">Processing steps:</div>
                        <ul className="space-y-1">
                          {message.thinkingSteps.map((step) => (
                            <motion.li
                              key={step.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="text-sm flex items-start"
                            >
                              <span className="text-farm-green mr-1">✓</span>
                              <span>{step.step}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={{
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: {
                          node?: any;
                          inline?: boolean;
                          className?: string;
                          children: React.ReactNode;
                          [key: string]: any;
                        }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {message.toolExecution && (
                  <div className="mt-2 pt-2 border-t border-farm-brown/10">
                    <div className="flex items-center text-xs text-farm-brown">
                      <div className="mr-1">🔧</div>
                      <div>
                        <span className="font-medium">Tool used:</span> {message.toolExecution.toolName}
                      </div>
                    </div>
                    {message.toolExecution.metrics.processingTime && (
                      <div className="text-xs text-farm-brown mt-0.5">
                        <span className="font-medium">Processing time:</span> {message.toolExecution.metrics.processingTime.toFixed(0)}ms
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp and metrics toggle */}
                <div
                  className={`flex justify-between items-center text-xs mt-1`}
                >
                  <div
                    className={`${
                      message.role === "user"
                      ? "text-farm-green-dark"
                      : "text-farm-brown/70"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                  
                  {message.role === "assistant" && message.toolExecution && !message.isThinking && (
                    <button
                      className="ml-2 text-farm-green flex items-center hover:text-farm-green-dark"
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
                
                {/* Metrics display (if toggled) */}
                {message.role === "assistant" && message.toolExecution && showMetrics[message.id] && !message.isThinking && (
                  <div className="mt-2 pt-2 border-t border-farm-brown/10 text-xs text-farm-brown/80">
                    {/* Metrics content here */}
                    <div className="mb-1">
                      <span className="font-medium">Tool:</span>{" "}
                      {message.toolExecution.toolName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t border-farm-brown/20 bg-white/80 sticky bottom-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end"
        >
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              modelName ? `Plant a message for ${modelName}...` : "Select a model first..."
            }
            disabled={!modelName || isLoading}
            className="flex-1 min-h-16 max-h-32 resize-y border-farm-brown/20 focus:ring-farm-green"
            fullWidth
          />
          <Button
            type="submit"
            variant="primary"
            className="ml-3 self-end bg-farm-green hover:bg-farm-green-dark"
            disabled={!input.trim() || !modelName || isLoading}
            isLoading={isLoading}
          >
            Harvest
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatInterface;