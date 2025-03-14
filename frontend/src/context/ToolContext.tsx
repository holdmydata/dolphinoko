import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";

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
  parameters: {
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LLMRequest {
  tool_id: string;
  input: string;
  parameters?: any;
}

export interface LLMResponse {
  tool_id: string;
  input: string;
  output: string;
  metadata: {
    provider: string;
    model: string;
    processing_time: number;
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
      setTools(prev => [...prev, response]);
      return response;
    } catch (err) {
      console.error('Failed to create tool:', err);
      throw err;
    }
  };
  
  const updateTool = async (id: string, tool: Tool): Promise<Tool> => {
    try {
      const response = await api.put<Tool>(`/api/tools/${id}`, tool);
      setTools(prev => prev.map(t => t.id === id ? response : t));
      return response;
    } catch (err) {
      console.error('Failed to update tool:', err);
      throw err;
    }
  };

  const deleteTool = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/tools/${id}`); // Add /api prefix
      setTools((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete tool:", err);
      throw err;
    }
  };

  const runTool = async (request: LLMRequest): Promise<LLMResponse> => {
    try {
      // Add the type parameter to api.post
      const response = await api.post<LLMResponse>("/api/llm/generate", request);
      return response;
    } catch (err) {
      console.error("Failed to run tool:", err);
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
