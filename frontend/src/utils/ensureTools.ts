// frontend/src/utils/ensureTools.ts
import { Tool, ToolContext } from "../context/ToolContext";
import { v4 as uuidv4 } from "uuid";

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
      const newTool: Tool = {
        id: uuidv4(), // Generate a unique UUID v4
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Chat`,
        description: `Chat with ${provider} models`,
        category: "chat",
        subcategory: provider,
        provider,
        model: modelName || (provider === "ollama" ? "llama2" : "claude-2"), // Default models
        prompt_template: "{input}",
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
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
