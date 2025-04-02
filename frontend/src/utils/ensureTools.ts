// frontend/src/utils/ensureTools.ts
import { Tool, ToolContext } from "../context/ToolContext";
import { v4 as uuidv4 } from "uuid";

// Function to get the default model from settings
const getDefaultModel = (provider: string): string => {
  try {
    const savedSettings = localStorage.getItem("mcp-toolbox-settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.defaultModel) {
        return settings.defaultModel;
      }
    }
    // Fallback defaults if settings aren't available
    return provider === "ollama" ? "dolphin3:latest" : "claude-3-sonnet-20240229";
  } catch (e) {
    console.error("Error reading settings:", e);
    return provider === "ollama" ? "dolphin3:latest" : "claude-3-sonnet-20240229";
  }
};

// Function to ensure a chat tool exists for a provider
export const ensureChatTool = async (
    toolContext: ToolContext,
    provider: string,
    modelName: string
  ): Promise<Tool | undefined> => {
    if (!toolContext || toolContext.loading) return undefined;
  
    // Check if a chat tool already exists for this provider
    const existingTool = toolContext.tools.find(
      (t) => t.name.toLowerCase().includes("chat") && t.provider === provider
    );
  
    if (existingTool) {
      return existingTool;
    }
  
    // Create a new chat tool
    try {
      // Use the provided model name or get the default from settings
      const defaultModel = getDefaultModel(provider);
      
      const newTool: Tool = {
        id: uuidv4(), // Generate a unique UUID v4
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Chat`,
        description: `Chat with ${provider} models`,
        category: "chat",
        subcategory: provider,
        provider,
        model: modelName || defaultModel,
        prompt_template: "{input}",
        system_prompt: "", // Add required empty system prompt
        version: 1, // Add version number
        schema: {}, // Add empty schema
        parameters: {
          temperature: 0.7,
          max_tokens: 2000, // Increased from 1000 to allow longer responses
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        },
      };
      
      const createdTool = await toolContext.createTool(newTool);
      console.log(`Created chat tool for ${provider}`);
      return createdTool;
    } catch (err) {
      console.error(`Failed to create chat tool for ${provider}:`, err);
      return undefined;
    }
  };
