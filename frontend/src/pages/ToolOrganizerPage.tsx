import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { Tool } from '../context/ToolContext';
import { CATEGORIES } from '../types/categories'; // Import your categories

const ToolOrganizerPage: React.FC = () => {
  const navigate = useNavigate();
  const { tools, updateTool } = useTools();
  const [organizingTools, setOrganizingTools] = useState<Tool[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize with current tools
  useEffect(() => {
    setOrganizingTools([...tools]);
  }, [tools]);

  // Group tools by category
  const toolsByCategory = organizingTools.reduce((acc, tool) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  // Update a tool's category and subcategory
  const handleUpdateToolCategory = (toolId: string, category: string | undefined, subcategory: string | undefined) => {
    setOrganizingTools(prev => 
      prev.map(tool => 
        tool.id === toolId 
          ? { ...tool, category, subcategory } 
          : tool
      )
    );
  };

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // Find tools that have changed
      const changedTools = organizingTools.filter(newTool => {
        const originalTool = tools.find(t => t.id === newTool.id);
        return originalTool && 
          (originalTool.category !== newTool.category || 
           originalTool.subcategory !== newTool.subcategory);
      });
      
      // Update each changed tool
      for (const tool of changedTools) {
        await updateTool(tool.id!, tool);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save changes", error);
    }
  };

  // Get available subcategories for a category
  const getSubcategoriesForCategory = (category: string) => {
    return CATEGORIES.find(c => c.name === category)?.subcategories || [];
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tool Organizer</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Organize your tools into categories
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Save Changes
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-md">
          Changes saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Uncategorized tools */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-gray-800 dark:text-white flex items-center">
              <span className="mr-2 text-lg">🔧</span>
              Uncategorized
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({(toolsByCategory['Uncategorized'] || []).length})
              </span>
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {(toolsByCategory['Uncategorized'] || []).length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No uncategorized tools
              </div>
            ) : (
              toolsByCategory['Uncategorized'].map(tool => (
                <div key={tool.id} className="p-4">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">{tool.name}</div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Category
                      </label>
                      <select
                        value={tool.category || ''}
                        onChange={(e) => handleUpdateToolCategory(
                          tool.id!, 
                          e.target.value || undefined, 
                          undefined
                        )}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(category => (
                          <option key={category.name} value={category.name}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={tool.subcategory || ''}
                        disabled={!tool.category}
                        onChange={(e) => handleUpdateToolCategory(
                          tool.id!, 
                          tool.category, 
                          e.target.value || undefined, 
                        )}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      >
                        <option value="">Select a subcategory</option>
                        {tool.category && getSubcategoriesForCategory(tool.category).map(subcategory => (
                          <option key={subcategory} value={subcategory}>
                            {subcategory}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Categorized tools */}
        {CATEGORIES.map(category => {
          const categoryTools = toolsByCategory[category.name] || [];
          return (
            <div key={category.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-medium text-gray-800 dark:text-white flex items-center">
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.name}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({categoryTools.length})
                  </span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryTools.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No tools in this category
                  </div>
                ) : (
                  categoryTools.map(tool => (
                    <div key={tool.id} className="p-4">
                      <div className="font-medium text-gray-800 dark:text-white mb-2">{tool.name}</div>
                      
                      <div className="mb-2">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Subcategory
                        </label>
                        <select
                          value={tool.subcategory || ''}
                          onChange={(e) => handleUpdateToolCategory(
                            tool.id!, 
                            tool.category, 
                            e.target.value || undefined
                          )}
                          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          <option value="">No subcategory</option>
                          {getSubcategoriesForCategory(category.name).map(subcategory => (
                            <option key={subcategory} value={subcategory}>
                              {subcategory}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={() => handleUpdateToolCategory(tool.id!, undefined, undefined)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove from category
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolOrganizerPage;