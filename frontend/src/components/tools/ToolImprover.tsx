import React, { useState } from 'react';
import { Tool, LLMResponse } from '../../context/ToolContext';

interface ToolImproverProps {
  tool: Tool;
  lastResponse?: LLMResponse;
  onSaveImprovement: (improvedTool: Tool) => void;
}

const ToolImprover: React.FC<ToolImproverProps> = ({ 
  tool, 
  lastResponse, 
  onSaveImprovement 
}) => {
  const [improving, setImproving] = useState(false);
  const [improvement, setImprovement] = useState<Partial<Tool> | null>(null);
  
  const startImprovement = async () => {
    setImproving(true);
    
    // This could be a call to a special "meta-tool" that analyzes
    // tool performance and suggests improvements
    try {
      // Simulated API call to get improvements
      // In reality, this would call your LLM with context about the tool and its last runs
      const suggestedImprovements = {
        ...tool,
        system_prompt: tool.system_prompt + "\n\nAdditional context: Be more specific and detailed in responses.",
        description: tool.description + " (Improved version)"
      };
      
      setImprovement(suggestedImprovements);
    } catch (error) {
      console.error("Failed to generate improvements", error);
    } finally {
      setImproving(false);
    }
  };
  
  const saveImprovement = () => {
    if (improvement) {
      onSaveImprovement({
        ...tool,
        ...improvement,
        id: undefined, // Create as new tool
        name: improvement.name || `${tool.name} (Improved)`,
        version: (tool.version || 1) + 1
      });
      setImprovement(null);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Tool Improver</h3>
      
      {lastResponse && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Last Run Performance</h4>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Processing time: {lastResponse.metadata.processing_time.toFixed(2)}s
          </div>
        </div>
      )}
      
      {!improvement ? (
        <button
          onClick={startImprovement}
          disabled={improving}
          className={`w-full py-2 px-4 rounded ${
            improving 
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {improving ? 'Analyzing...' : 'Suggest Improvements'}
        </button>
      ) : (
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Suggested Improvements</h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
              {/* Show diff of changes */}
              <div className="mb-2">
                <span className="font-medium">Name:</span> {improvement.name || tool.name}
              </div>
              {improvement.description !== tool.description && (
                <div className="mb-2">
                  <span className="font-medium">Description:</span> {improvement.description}
                </div>
              )}
              {improvement.system_prompt !== tool.system_prompt && (
                <div>
                  <span className="font-medium">System Prompt Changes:</span>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono whitespace-pre-wrap">
                    {improvement.system_prompt}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={saveImprovement}
              className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Save as New Version
            </button>
            <button
              onClick={() => setImprovement(null)}
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolImprover;