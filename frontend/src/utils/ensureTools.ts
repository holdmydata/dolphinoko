// frontend/src/utils/ensureTools.ts
import { Tool } from '../context/ToolContext';
import { api } from './api';
import { v4 as uuidv4 } from 'uuid';

const MODEL_SETTINGS_KEY = 'dolphinoko-model-settings';

/**
 * Ensure that a chat tool exists for the given provider and model.
 * If it doesn't exist, create it.
 */
export const ensureChatTool = async (
  toolContext: any,
  provider: string,
  model: string
): Promise<Tool | null> => {
  // Early return if no context
  if (!toolContext) {
    console.warn('ensureChatTool: toolContext is missing');
    return null;
  }

  const { tools, createTool } = toolContext;

  // First, check if the requested model is a fallback
  if (!model || model.trim() === '') {
    // Try to load the model settings from localStorage
    try {
      const modelSettings = localStorage.getItem(MODEL_SETTINGS_KEY);
      if (modelSettings) {
        const settings = JSON.parse(modelSettings);
        if (settings.baseModel) {
          model = settings.baseModel;
          // If provider is not set or doesn't match model settings provider, update it
          if (!provider || provider.trim() === '') {
            provider = settings.baseProvider || 'ollama';
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse model settings:', error);
    }
    
    // If still no model, use a default
    if (!model || model.trim() === '') {
      model = 'dolphin3:latest';
      provider = 'ollama';
      console.warn('No model provided to ensureChatTool, using default:', model);
    }
  }

  // Check if a chat tool already exists for this provider/model
  let chatTool = tools.find(
    (tool: Tool) => 
      tool.name.toLowerCase().includes('chat') && 
      tool.provider === provider &&
      tool.model === model
  );

  // If not found, check for any chat tool with this provider
  if (!chatTool) {
    chatTool = tools.find(
      (tool: Tool) => 
        tool.name.toLowerCase().includes('chat') && 
        tool.provider === provider
    );
  }

  // If a chat tool exists, return it
  if (chatTool) {
    return chatTool;
  }

  // No chat tool exists, so create one
  if (createTool) {
    console.log(`Creating new chat tool for ${provider}/${model}`);
    
    try {
      const newTool: Tool = {
        id: uuidv4(),
        name: `${provider} Chat`,
        description: `Chat with ${provider} models`,
        category: 'chat',
        provider,
        model,
        prompt_template: '{input}',
        system_prompt: '', // Required field
        version: 1, // Required field
        parameters: {
          temperature: 0.7,
          max_tokens: 1000
        },
        schema: {}, // Required field
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await createTool(newTool);
      return newTool;
    } catch (err) {
      console.error('Failed to create chat tool:', err);
      return null;
    }
  }
  
  console.warn('ensureChatTool: createTool function not available');
  return null;
};
