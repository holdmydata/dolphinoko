// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { LLMRequest, LLMResponse } from '../context/ToolContext';
import { useTools } from '../hooks/useTools';

// Predefined categories and subcategories
const CATEGORIES = [
  {
    name: 'Development',
    subcategories: ['Code Generation', 'Documentation', 'Testing', 'Debugging'],
    icon: '💻'
  },
  {
    name: 'Productivity',
    subcategories: ['Writing', 'Research', 'Organization', 'Communication'],
    icon: '⏱️'
  },
  {
    name: 'Data',
    subcategories: ['Analysis', 'Visualization', 'Cleaning', 'Transformation'],
    icon: '📊'
  },
  {
    name: 'Content',
    subcategories: ['Creation', 'Editing', 'SEO', 'Translation'],
    icon: '✏️'
  },
  {
    name: 'Entertainment',
    subcategories: ['Comedy', 'Storytelling', 'Games', 'Trivia'],
    icon: '🎮'
  }
];

const Dashboard: React.FC = () => {
  const { tools, runTool } = useTools();
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [response, setResponse] = useState<LLMResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const baseStyles = 'font-medium rounded transition-colors duration-200 focus:outline-none';
  
  // Get the selected tool
  const selectedTool = tools.find(tool => tool.id === selectedToolId);

  // Filter tools based on category, subcategory, and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || tool.subcategory === subcategoryFilter;
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Reset subcategory filter when category changes
  useEffect(() => {
    setSubcategoryFilter(null);
  }, [categoryFilter]);

  // Group tools by category
  const toolsByCategory = filteredTools.reduce((acc, tool) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  // Run the selected tool
  const handleRunTool = async () => {
    if (!selectedToolId || !input.trim()) {
      setError('Please select a tool and enter some input');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: LLMRequest = {
        tool_id: selectedToolId,
        input: input.trim()
      };
      
      const result = await runTool(request);
      setResponse(result);
    } catch (err) {
      console.error('Error running tool:', err);
      setError('Failed to run tool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get available subcategories for the selected category
  const availableSubcategories = categoryFilter 
    ? CATEGORIES.find(c => c.name === categoryFilter)?.subcategories || []
    : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dolphinoko - Dolphin's Storage Buddy!</h1>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">ドルフィのこ</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Use your custom AI tools powered by local models through MCP
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool selector */}
        <div className="col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Select a Tool</h2>
            <a 
              href="/tools" 
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Create New
            </a>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
          </div>
          
          {/* Category filters */}
          <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                  categoryFilter === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => setCategoryFilter(null)}
              >
                All
              </button>
              
              {CATEGORIES.map(category => (
                <button
                  key={category.name}
                  className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 flex items-center ${
                    categoryFilter === category.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setCategoryFilter(category.name)}
                >
                  <span className="mr-1">{category.icon}</span> {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Subcategory filters - only when a category is selected */}
          {categoryFilter && (
            <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subcategories</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                    subcategoryFilter === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setSubcategoryFilter(null)}
                >
                  All
                </button>
                
                {availableSubcategories.map(subcat => (
                  <button
                    key={subcat}
                    className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                      subcategoryFilter === subcat
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => setSubcategoryFilter(subcat)}
                  >
                    {subcat}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Tool list */}
          {tools.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any tools yet</p>
              <a 
                href="/tools" 
                className="inline-block bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
              >
                Create Your First Tool
              </a>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">No tools match your filters</p>
              <button
                onClick={() => {
                  setCategoryFilter(null);
                  setSubcategoryFilter(null);
                  setSearchQuery('');
                }}
                className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              {/* If not filtering, show by category */}
              {!categoryFilter && !searchQuery ? (
                Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                  <div key={category} className="mb-4">
                    <div className="flex items-center mb-2">
                      <span className="mr-2 text-lg">
                        {CATEGORIES.find(c => c.name === category)?.icon || '🔧'}
                      </span>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">{category}</h3>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                      {categoryTools.map(tool => (
                        <div
                          key={tool.id}
                          className={`p-3 border rounded-md cursor-pointer transition-all duration-150 ${
                            selectedToolId === tool.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => setSelectedToolId(tool.id!)}
                        >
                          <h3 className="font-medium text-gray-800 dark:text-white">{tool.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                          <div className="mt-2 text-xs flex items-center flex-wrap gap-1">
                            {tool.subcategory && (
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                                {tool.subcategory}
                              </span>
                            )}
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                              {tool.model}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {filteredTools.map(tool => (
                    <div
                      key={tool.id}
                      className={`p-3 border rounded-md cursor-pointer transition-all duration-150 ${
                        selectedToolId === tool.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedToolId(tool.id!)}
                    >
                      <h3 className="font-medium text-gray-800 dark:text-white">{tool.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                      <div className="mt-2 text-xs flex items-center flex-wrap gap-1">
                        {tool.category && (
                          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full flex items-center">
                            {CATEGORIES.find(c => c.name === tool.category)?.icon || '🔧'} {tool.category}
                          </span>
                        )}
                        {tool.subcategory && (
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                            {tool.subcategory}
                          </span>
                        )}
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                          {tool.model}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input and response area */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tool Playground</h2>
              {selectedTool && (
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md flex items-center text-sm">
                  <span className="mr-1">
                    {CATEGORIES.find(c => c.name === selectedTool.category)?.icon || '🔧'}
                  </span> 
                  {selectedTool.name}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedTool 
                  ? "Enter your input for this tool..." 
                  : "Select a tool first..."
                }
                disabled={!selectedTool}
                className="w-full p-4 min-h-32 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTool 
                    ? `Using: ${selectedTool.provider} / ${selectedTool.model}` 
                    : 'No tool selected'
                  }
                </div>
                <button
                  onClick={handleRunTool}
                  disabled={!selectedTool || loading}
                  className={`px-4 py-2 rounded-md text-white ${
                    !selectedTool || loading 
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Run Tool'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Response</h3>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md mb-4">
                {error}
              </div>
            )}
            
            {response ? (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700 min-h-40">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                  {response.output}
                </pre>
                
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      Provider: {response.metadata.provider}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      Model: {response.metadata.model}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      Processing time: {response.metadata.processing_time.toFixed(2)}s
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8 rounded-md min-h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg text-gray-500 dark:text-gray-400">Run a tool to see the response here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;