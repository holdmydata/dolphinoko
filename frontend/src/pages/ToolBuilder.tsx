import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Tool } from '../context/ToolContext';
import { useTools } from '../hooks/useTools';
import ToolList from '../components/tools/ToolList';
import ToolEditor from '../components/tools/ToolEditor';
import { CATEGORIES } from '../types/categories';

const ToolBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
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
    system_prompt: '',
    version: 1,
    parameters: { temperature: 0.7, max_tokens: 500 },
    schema: {}
  };

  // Handle direct navigation from URL
  useEffect(() => {
    if (location.pathname === '/tools/new') {
      setSelectedTool(null);
      setIsCreating(true);
    } else if (id) {
      const tool = tools.find(t => t.id === id);
      if (tool) {
        setSelectedTool(tool);
        setIsCreating(false);
      }
    }
  }, [id, tools, location.pathname, setSelectedTool]);

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
      const newTool = await createTool(tool);
      setIsCreating(false);
      navigate('/tools'); // Navigate back to tool shed after creation
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
      navigate('/tools'); // Navigate back to tool shed after update
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

  // Mock functions for ToolList component
  const handleClone = (id: string) => {
    console.log('Clone not implemented');
  };

  const handleEdit = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (tool) {
      setSelectedTool(tool);
      setIsCreating(false);
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
      <div className="bg-white p-4 border-b border-farm-brown-light">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-farm-brown-dark flex items-center">
            <span className="text-xl mr-2">🛠️</span>
            Tool Builder
          </h1>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search tools..."
              className="px-3 py-2 border border-farm-brown-light rounded-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter(null);
                setSubcategoryFilter(null);
              }}
              className="px-3 py-2 text-sm bg-farm-brown-light hover:bg-farm-brown text-farm-brown-dark rounded-md transition-colors duration-200 border border-farm-brown"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Category quick filters */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm font-medium text-farm-brown">Categories:</span>
          {CATEGORIES.map(category => (
            <button
              key={category.name}
              onClick={() => setCategoryFilter(categoryFilter === category.name ? null : category.name)}
              className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 flex items-center ${
                categoryFilter === category.name 
                  ? 'bg-farm-brown text-white' 
                  : 'bg-farm-brown-light/20 hover:bg-farm-brown-light/50 text-farm-brown-dark border border-farm-brown-light'
              }`}
            >
              <span className="mr-1">{category.icon}</span> {category.name}
            </button>
          ))}
        </div>
        
        {/* Subcategory filters - only show when a category is selected */}
        {categoryFilter && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-farm-brown">Subcategories:</span>
            {availableSubcategories.map(subcat => (
              <button
                key={subcat}
                onClick={() => setSubcategoryFilter(subcategoryFilter === subcat ? null : subcat)}
                className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 ${
                  subcategoryFilter === subcat 
                    ? 'bg-farm-green text-white' 
                    : 'bg-farm-green-light/20 hover:bg-farm-green-light/50 text-farm-brown-dark border border-farm-green-light'
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
        <div className="w-64 h-full bg-white border-r border-farm-brown-light overflow-y-auto">
          <div className="p-4 border-b border-farm-brown-light">
            <button
              onClick={() => {
                setSelectedTool(null);
                setIsCreating(true);
              }}
              className="w-full bg-farm-green hover:bg-farm-green-dark text-white py-2 px-4 rounded-md transition-colors duration-200 border border-farm-green-dark"
            >
              <span className="flex items-center justify-center">
                <span className="mr-2">🌱</span>
                Plant New Tool
              </span>
            </button>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-farm-brown">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farm-brown mx-auto"></div>
              <p className="mt-2">Loading tools...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : filteredTools.length === 0 ? (
            <div className="p-4 text-center text-farm-brown">
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
              onClone={handleClone}
              onEdit={handleEdit}
              showCategory={true}
            />
          )}
        </div>
        
        {/* Tool Editor */}
        <div className="flex-1 h-full overflow-y-auto p-6 bg-farm-brown-light/10">
          {isCreating ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-farm-brown-dark flex items-center">
                <span className="text-xl mr-2">🌱</span>
                Plant New Tool
              </h2>
              <ToolEditor 
                tool={emptyTool}
                onSave={handleCreate}
                onCancel={() => {
                  setIsCreating(false);
                  navigate('/tools');
                }}
                categories={allCategories as string[]}
                categoriesMap={CATEGORIES}
              />
            </>
          ) : selectedTool ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-farm-brown-dark flex items-center">
                <span className="text-xl mr-2">🔧</span>
                Edit Tool: {selectedTool.name}
              </h2>
              <ToolEditor 
                tool={selectedTool}
                onSave={handleUpdate}
                onCancel={() => {
                  setSelectedTool(null);
                  navigate('/tools');
                }}
                categories={allCategories as string[]}
                categoriesMap={CATEGORIES}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-farm-brown">
              <div className="text-center max-w-lg bg-white p-8 rounded-lg border-2 border-farm-brown-light">
                <div className="text-6xl mb-4">🌾</div>
                <p className="text-xl mb-4 text-farm-brown-dark">Select a tool to edit or plant a new one</p>
                
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setIsCreating(true);
                  }}
                  className="mt-4 px-4 py-2 bg-farm-green hover:bg-farm-green-dark text-white rounded-md transition-colors duration-200 border border-farm-green-dark"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🌱</span>
                    Plant New Tool
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolBuilder;