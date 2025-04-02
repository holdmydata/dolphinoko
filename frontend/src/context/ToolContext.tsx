import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";
import { useNotification } from "./NotificationContext";

// Define types
export interface Tool {
  id?: string;
  name: string;
  description: string;
  category?: string;
  subcategory?: string;
  provider: string;
  model: string;
  prompt_template: string;
  system_prompt: string;
  activation_phrases?: string[];
  version: number;
  parameters: {
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
  schema: {
    [key: string]: any; // Security? >.<
  }
  created_at?: string;
  updated_at?: string;
}

export interface LLMRequest {
  tool_id: string;
  input: string | Record<string, any>;
  parameters?: any;
  metadata?: any;
  conversation_id?: string;
  [key: string]: any;
}

export interface LLMResponse {
  tool_id: string;
  input: string | Record<string, any>;
  output: string;
  metadata: {
    provider: string;
    model: string;
    processing_time: number;
    model_fallback?: boolean;
    original_model?: string;
    error?: boolean;
    [key: string]: any;
  };
}

interface ToolContextType {
  tools: Tool[];
  loading: boolean;
  error: string | null;
  selectedTool: Tool | null;
  setSelectedTool: (tool: Tool | null) => void;
  createTool: (tool: Tool) => Promise<Tool>;
  updateTool: (id: string, tool: Tool) => Promise<Tool>;
  deleteTool: (id: string) => Promise<void>;
  runTool: (request: LLMRequest) => Promise<LLMResponse>;
}
export type ToolContext = ToolContextType;
export const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const ToolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const { showModelFallback, showError } = useNotification();

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await api.get<Tool[]>("/api/tools");
      setTools(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
      setError('Failed to load tools. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const createTool = async (tool: Tool): Promise<Tool> => {
    try {
      const response = await api.post<Tool>("/api/tools", tool);
      
      // Reload tools on the server
      await api.post("/api/tools/reload", {});
      
      // Update local state
      setTools(prev => [...prev, response]);
      return response;
    } catch (err) {
      console.error('Failed to create tool:', err);
      throw err;
    }
  };
  
  const updateTool = async (id: string, tool: Tool): Promise<Tool> => {
    try {
      // Make sure category and subcategory are properly included
      const toolToUpdate = {
        ...tool,
        category: tool.category || undefined,
        subcategory: tool.subcategory || undefined
      };
      
      console.log("Updating tool with data:", toolToUpdate); // Add logging
      
      const response = await api.put<Tool>(`/api/tools/${id}`, toolToUpdate);
      
      // Reload tools on the server
      await api.post("/api/tools/reload", {});
      
      // Update local state
      setTools(prev => prev.map(t => t.id === id ? response : t));
      return response;
    } catch (err) {
      console.error('Failed to update tool:', err);
      throw err;
    }
  };
  
  const deleteTool = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/tools/${id}`);
      
      // Reload tools on the server
      await api.post("/api/tools/reload", {});
      
      // Update local state
      setTools(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete tool:', err);
      throw err;
    }
  };

  const runTool = async (request: LLMRequest): Promise<LLMResponse> => {
    try {
      // Add the type parameter to api.post
      const response = await api.post<LLMResponse>("/api/tools/execute", request);
      
      // Check for model fallback and show notification
      if (response.metadata?.model_fallback) {
        showModelFallback(
          response.metadata.original_model || "Unknown", 
          response.metadata.model || "Unknown"
        );
      }
      
      // Check for errors
      if (response.metadata?.error) {
        showError(
          "Tool Execution Error", 
          response.output || "An error occurred while executing the tool"
        );
      }
      
      return response;
    } catch (err) {
      console.error("Failed to run tool:", err);
      showError("Tool Execution Failed", "Could not execute the tool. Please try again.");
      throw err;
    }
  };

  return (
    <ToolContext.Provider
      value={{
        tools,
        loading,
        error,
        selectedTool,
        setSelectedTool,
        createTool,
        updateTool,
        deleteTool,
        runTool,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
};
