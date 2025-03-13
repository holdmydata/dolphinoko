import React, { useState, useEffect } from 'react';
import { Tool } from '../context/ToolContext';
import { useTools } from '../hooks/useTools';
import ToolList from '../components/tools/ToolList';
import ToolEditor from '../components/tools/ToolEditor';

// Predefined categories and subcategories
const CATEGORIES = [
  {
    name: 'Development',
    subcategories: ['Code Generation', 'Documentation', 'Testing', 'Debugging']
  },
  {
    name: 'Productivity',
    subcategories: ['Writing', 'Research', 'Organization', 'Communication']
  },
  {
    name: 'Data',
    subcategories: ['Analysis', 'Visualization', 'Cleaning', 'Transformation']
  },
  {
    name: 'Content',
    subcategories: ['Creation', 'Editing', 'SEO', 'Translation']
  },
  {
    name: 'Entertainment',
    subcategories: ['Comedy', 'Storytelling', 'Games', 'Trivia']
  }
];

const ToolBuilder: React.FC = () => {
  const { tools, loading, error, createTool, updateTool, deleteTool, selectedTool, setSelectedTool } = useTools();
  const [isCreating, setIsCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial empty tool template
  const emptyTool: Tool = {
    name: '',
    description: '',
    category: '',
    subcategory: '',
    provider: 'ollama',
    model: '',
    prompt_template: '',
    parameters: { temperature: 0.7, max_tokens: 500 }
  };

  // Filter tools based on category, subcategory, and search query
  const filteredTools = tools.filter(tool => {
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || tool.subcategory === subcategoryFilter;
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Handle tool creation
  const handleCreate = async (tool: Tool) => {
    try {
      await createTool(tool);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create tool:', err);
    }
  };

  // Handle tool update
  const handleUpdate = async (tool: Tool) => {
    if (!selectedTool?.id) return;
    
    try {
      await updateTool(selectedTool.id, tool);
      setSelectedTool(null);
    } catch (err) {
      console.error('Failed to update tool:', err);
    }
  };

  // Handle tool deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteTool(id);
      if (selectedTool?.id === id) {
        setSelectedTool(null);
      }
    } catch (err) {
      console.error('Failed to delete tool:', err);
    }
  };

  // Reset filters when changing category
  useEffect(() => {
    setSubcategoryFilter(null);
  }, [categoryFilter]);

  // Get available subcategories for the selected category
  const availableSubcategories = categoryFilter 
    ? CATEGORIES.find(c => c.name === categoryFilter)?.subcategories || []
    : [];

  // Get all unique categories from existing tools
  const existingCategories = [...new Set(tools.map(tool => tool.category))];
  const allCategories = [...new Set([...CATEGORIES.map(c => c.name), ...existingCategories])];

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Tool Builder</h1>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search tools..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter(null);
                setSubcategoryFilter(null);
              }}
              className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Category quick filters */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm font-medium text-gray-500">Categories:</span>
          {CATEGORIES.map(category => (
            <button
              key={category.name}
              onClick={() => setCategoryFilter(categoryFilter === category.name ? null : category.name)}
              className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 ${
                categoryFilter === category.name 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Subcategory filters - only show when a category is selected */}
        {categoryFilter && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500">Subcategories:</span>
            {availableSubcategories.map(subcat => (
              <button
                key={subcat}
                onClick={() => setSubcategoryFilter(subcategoryFilter === subcat ? null : subcat)}
                className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 ${
                  subcategoryFilter === subcat 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Tool List Sidebar */}
        <div className="w-64 h-full bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => {
                setSelectedTool(null);
                setIsCreating(true);
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors duration-200"
            >
              Create New Tool
            </button>
          </div>
          
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : filteredTools.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tools found with the current filters
            </div>
          ) : (
            <ToolList 
              tools={filteredTools}
              selectedId={selectedTool?.id}
              onSelect={(tool) => {
                setIsCreating(false);
                setSelectedTool(tool);
              }}
              onDelete={handleDelete}
              showCategory={true}
            />
          )}
        </div>
        
        {/* Tool Editor */}
        <div className="flex-1 h-full overflow-y-auto p-6 bg-gray-50">
          {isCreating ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Create New Tool</h2>
              <ToolEditor 
                tool={emptyTool}
                onSave={handleCreate}
                onCancel={() => setIsCreating(false)}
                categories={allCategories}
                categoriesMap={CATEGORIES}
              />
            </>
          ) : selectedTool ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Edit Tool: {selectedTool.name}</h2>
              <ToolEditor 
                tool={selectedTool}
                onSave={handleUpdate}
                onCancel={() => setSelectedTool(null)}
                categories={allCategories}
                categoriesMap={CATEGORIES}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-center max-w-lg">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                <p className="text-xl mb-4">Select a tool to edit or create a new one</p>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {/* Quick start templates */}
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setIsCreating(true);
                      // Preset for text generation tool
                      emptyTool.name = "Text Generator";
                      emptyTool.category = "Content";
                      emptyTool.subcategory = "Creation";
                      emptyTool.description = "Generates creative text based on a prompt";
                      emptyTool.prompt_template = "Generate creative text based on the following prompt:\n\n{input}\n";
                    }}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors duration-200"
                  >
                    <h3 className="font-medium text-gray-900">Text Generator</h3>
                    <p className="text-sm text-gray-500">Create a basic text generation tool</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setIsCreating(true);
                      // Preset for code helper
                      emptyTool.name = "Code Helper";
                      emptyTool.category = "Development";
                      emptyTool.subcategory = "Code Generation";
                      emptyTool.description = "Helps write and fix code";
                      emptyTool.prompt_template = "Help with the following code task:\n\nLanguage: {input.language}\nTask: {input.task}\nCurrent code (if any):\n{input.code}\n";
                    }}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors duration-200"
                  >
                    <h3 className="font-medium text-gray-900">Code Helper</h3>
                    <p className="text-sm text-gray-500">Create a tool for coding assistance</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setIsCreating(true);
                      // Preset for summarizer
                      emptyTool.name = "Summarizer";
                      emptyTool.category = "Productivity";
                      emptyTool.subcategory = "Research";
                      emptyTool.description = "Summarizes lengthy content";
                      emptyTool.prompt_template = "Summarize the following text:\n\n{input}\n";
                    }}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors duration-200"
                  >
                    <h3 className="font-medium text-gray-900">Summarizer</h3>
                    <p className="text-sm text-gray-500">Create a content summarization tool</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setIsCreating(true);
                      // Preset for data analyzer
                      emptyTool.name = "Data Analyzer";
                      emptyTool.category = "Data";
                      emptyTool.subcategory = "Analysis";
                      emptyTool.description = "Analyzes data and provides insights";
                      emptyTool.prompt_template = "Analyze this data and provide insights:\n\n{input}\n";
                    }}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors duration-200"
                  >
                    <h3 className="font-medium text-gray-900">Data Analyzer</h3>
                    <p className="text-sm text-gray-500">Create a data analysis tool</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolBuilder;