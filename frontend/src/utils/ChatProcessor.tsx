import { Tool } from '../context/ToolContext';

class SimpleKeywordModel {
    detectIntent(message: string, tools: Tool[]): { tool: Tool | null; confidence: number } {
      // Simple keyword-based detection
      for (const tool of tools) {
        const keywords = [
          tool.name.toLowerCase(),
          ...tool.description.toLowerCase().split(/\s+/).filter(w => w.length > 4)
        ];
        
        const messageWords = message.toLowerCase().split(/\s+/);
        const matchCount = keywords.filter(k => messageWords.includes(k)).length;
        
        if (matchCount > 1) {
          return { tool, confidence: 0.8 };
        }
      }
      
      return { tool: null, confidence: 0 };
    }

    async classifyIntent(message: string, tools: Tool[]): Promise<{ tool: Tool | null; confidence: number }> {
        return this.detectIntent(message, tools);
    }
  }

export interface ProcessedMessage {
    type: 'chat' | 'tool' | 'parameter_request';
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

class ChatProcessor {
    private tools: Tool[];
    private model: SimpleKeywordModel; // Optional: A small model for intent detection

    constructor(tools: Tool[]) {
      this.tools = tools;
      // Optionally initialize a small model for intent detection
      this.model = new SimpleKeywordModel();
    }

    async processMessage(message: string): Promise<ProcessedMessage> {
      // Check for explicit tool invocation (command-like)
      if (message.startsWith('/')) {
        return this.handleExplicitToolCall(message);
      }
      
      // Otherwise, try to detect intent and match to tools
      const matchedTool = await this.detectToolIntent(message);
      if (matchedTool) {
        return this.handleImplicitToolCall(message, matchedTool);
      }
      
      // If no tool matches, just process as regular chat
      return {
        type: 'chat',
        content: message
      };
    }
  
    private async detectToolIntent(message: string): Promise<Tool | null> {
      // Simple approach: Check activation phrases
      for (const tool of this.tools) {
        if (tool.activation_phrases?.some(phrase => 
          message.toLowerCase().includes(phrase.toLowerCase())
        )) {
          return tool;
        }
      }
      
    //   Advanced approach: Use a small model to detect intent
      if (this.model) {
        const intent = await this.model.classifyIntent(message, this.tools);
        if (intent.confidence > 0.7) {
          return intent.tool;
        }
      }
      
      return null;
    }
  
    private async handleImplicitToolCall(message: string, tool: Tool): Promise<ProcessedMessage> {
        // Extract parameters from the message when possible
        const extractedParams = this.extractParameters(message, tool);
        
        // If we have all required parameters, execute the tool
        const missingParams = this.getMissingRequiredParameters(extractedParams, tool);
        if (missingParams.length === 0) {
          return {
            type: 'tool',
            toolId: tool.id,
            parameters: extractedParams
          };
        }
        
        // Otherwise, we need to ask for missing parameters
        return {
          type: 'parameter_request',
          toolId: tool.id,
          currentParameters: extractedParams,
          missingParameters: missingParams
        };
      }
    
      // Add this method to extract parameters from a message
      private extractParameters(message: string, tool: Tool): Record<string, any> {
        const params: Record<string, any> = {};
        
        // Get parameter definitions from the tool schema
        const paramDefs = this.getParameterDefinitions(tool);
        
        // Simple parameter extraction logic - you can make this more sophisticated
        for (const param of paramDefs) {
          // Try to find parameter patterns like "parameter: value" or "parameter=value"
          const paramRegex = new RegExp(`${param.name}[:\\s=]\\s*([^\\s,;]+|"[^"]+"|'[^']+')`);
          const match = message.match(paramRegex);
          
          if (match) {
            let value = match[1];
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            
            // Convert value to appropriate type
            if (param.type === 'number') {
              params[param.name] = Number(value);
            } else if (param.type === 'boolean') {
              params[param.name] = value.toLowerCase() === 'true';
            } else {
              params[param.name] = value;
            }
          }
        }
        
        return params;
      }
    
      // Add this method to check for missing required parameters
      private getMissingRequiredParameters(
        extractedParams: Record<string, any>,
        tool: Tool
      ): Array<{name: string, description: string, type: string, required: boolean}> {
        // Get parameter definitions
        const paramDefs = this.getParameterDefinitions(tool);
        
        // Find parameters that are required but missing
        return paramDefs.filter(param => 
          param.required && !extractedParams.hasOwnProperty(param.name)
        );
      }
    
      // Helper method to get parameter definitions from a tool
      private getParameterDefinitions(tool: Tool): Array<{name: string, description: string, type: string, required: boolean}> {
        const params: Array<{name: string, description: string, type: string, required: boolean}> = [];
        
        // Check if tool has schema
        if (tool.schema) {
          // For simple input
          if (tool.schema.input && typeof tool.schema.input === 'object') {
            params.push({
              name: 'input',
              type: tool.schema.input.type || 'string',
              required: tool.schema.input.required || false,
              description: tool.schema.input.description || ''
            });
          }
          
          // For structured inputs
          if (tool.schema.parameters && Array.isArray(tool.schema.parameters)) {
            tool.schema.parameters.forEach(param => {
              params.push({
                name: param.name,
                type: param.type || 'string',
                required: param.required || false,
                description: param.description || ''
              });
            });
          }
        } else {
          // Extract parameters from prompt template
          const paramRegex = /{input\.([a-zA-Z0-9_]+)}/g;
          const matches = [...tool.prompt_template.matchAll(paramRegex)];
          
          if (matches.length > 0) {
            // Extract unique parameter names
            const paramNames = [...new Set(matches.map(match => match[1]))];
            paramNames.forEach(name => {
              params.push({
                name,
                type: 'string',
                required: true,
                description: `Parameter: ${name}`
              });
            });
          } else if (tool.prompt_template.includes('{input}')) {
            // Simple input
            params.push({
              name: 'input',
              type: 'string',
              required: true,
              description: 'Input for this tool'
            });
          }
        }
        
        return params;
      }

      private handleExplicitToolCall(message: string): ProcessedMessage {
        // Check if message starts with a tool command (e.g., /tool_name)
        if (!message.startsWith('/')) {
          // Not an explicit tool call
          return {
            type: 'chat',
            content: message
          };
        }
      
        // Extract the command and potential parameters
        const commandParts = message.substring(1).split(' ');
        const toolName = commandParts[0].toLowerCase();
        
        // Find the tool by name
        const tool = this.tools.find(t => 
          t.name.toLowerCase() === toolName || 
          t.name.toLowerCase().replace(/\s+/g, '_') === toolName
        );
        
        if (!tool) {
          // Tool not found
          return {
            type: 'chat',
            content: message,
          };
        }
        
        // Extract parameters from the message
        const paramText = message.substring(toolName.length + 2); // +2 for '/' and space
        const extractedParams = this.extractParameters(paramText, tool);
        
        // Check for missing required parameters
        const missingParams = this.getMissingRequiredParameters(extractedParams, tool);
        
        if (missingParams.length === 0) {
          // All required parameters are provided, execute the tool
          return {
            type: 'tool',
            toolId: tool.id,
            parameters: extractedParams
          };
        } else {
          // Need to collect missing parameters
          return {
            type: 'parameter_request',
            toolId: tool.id,
            currentParameters: extractedParams,
            missingParameters: missingParams
          };
        }
      }
}

export default ChatProcessor;
  