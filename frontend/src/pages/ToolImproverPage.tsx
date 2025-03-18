import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { Tool } from '../context/ToolContext';

const ToolImproverPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tools, updateTool, createTool } = useTools();
  const [tool, setTool] = useState<Tool | null>(null);
  const [improving, setImproving] = useState(false);
  const [improvements, setImprovements] = useState<Partial<Tool> | null>(null);
  const [improved, setImproved] = useState(false);

  const updateExistingTool = async () => {
    if (!tool || !improvements) return;
    
    try {
      const updatedTool: Tool = {
        ...tool,
        ...improvements,
        version: (tool.version || 1) + 1,
      };
      
      // Pass the id first, then the updated tool
      await updateTool(tool.id!, updatedTool);
      
      setImproved(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/tools');
      }, 2000);
    } catch (error) {
      console.error("Failed to update tool", error);
    }
  };
  // Find the tool on mount
  useEffect(() => {
    if (id) {
      const foundTool = tools.find(t => t.id === id);
      if (foundTool) {
        setTool(foundTool);
      } else {
        navigate('/tools');
      }
    }
  }, [id, tools, navigate]);

  const startImprovement = async () => {
    if (!tool) return;
    
    setImproving(true);
    
    try {
      // In a real implementation, this would call your AI to suggest improvements
      // For now, we'll simulate an improvement with a timeout
      
      setTimeout(() => {
        const suggestedImprovements: Partial<Tool> = {
          system_prompt: tool.system_prompt + "\n\nAdditional context: Provide more detailed responses with examples when possible.",
          description: tool.description + " (Improved version with more detailed responses)",
        };
        
        setImprovements(suggestedImprovements);
        setImproving(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to generate improvements", error);
      setImproving(false);
    }
  };
  
  const saveAsNewVersion = async () => {
    if (!tool || !improvements) return;
    
    try {
      const newTool: Tool = {
        ...tool,
        id: undefined, // Will generate a new ID
        name: `${tool.name} (Improved)`,
        version: (tool.version || 1) + 1,
        ...improvements,
      };
      
      await createTool(newTool);
      setImproved(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/tools');
      }, 2000);
    } catch (error) {
      console.error("Failed to save improved tool", error);
    }
  };
  

  if (!tool) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p>Loading tool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tool Improver</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Analyze and improve your existing tools
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {tool.name}
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md flex items-center text-sm">
              {tool.category}
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">{tool.description}</p>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Prompt</h3>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              {tool.system_prompt}
            </pre>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Prompt Template</h3>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              {tool.prompt_template || 'No template set'}
            </pre>
          </div>
        </div>
        
        <div className="p-6">
          {improved ? (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md text-green-700 dark:text-green-300 text-center">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Tool successfully improved! Redirecting...</p>
            </div>
          ) : !improvements ? (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI can analyze this tool and suggest improvements to make it more effective.
              </p>
              <button
                onClick={startImprovement}
                disabled={improving}
                className={`px-4 py-2 rounded-md ${
                  improving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {improving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Tool...
                  </span>
                ) : 'Get AI Suggestions'}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Suggested Improvements</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
                {improvements.description !== tool.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Improved Description</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{improvements.description}</p>
                  </div>
                )}
                
                {improvements.system_prompt !== tool.system_prompt && (
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">System Prompt Changes</h4>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-800">
                      <pre className="whitespace-pre-wrap text-xs text-blue-700 dark:text-blue-300">{improvements.system_prompt}</pre>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={saveAsNewVersion}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                >
                  Save as New Tool
                </button>
                <button
                  onClick={updateExistingTool}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Update Existing Tool
                </button>
                <button
                  onClick={() => setImprovements(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolImproverPage;