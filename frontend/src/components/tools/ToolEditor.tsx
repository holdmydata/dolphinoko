import React, { useState, useEffect } from 'react';
import { Tool } from '../../context/ToolContext';

interface ToolEditorProps {
  tool: Tool;
  onSave: (tool: Tool) => void;
  onCancel: () => void;
  categories: string[];
  categoriesMap: Array<{ name: string, subcategories: string[] }>;
}

const ToolEditor: React.FC<ToolEditorProps> = ({ 
  tool, 
  onSave, 
  onCancel,
  categories,
  categoriesMap
}) => {
  const [editedTool, setEditedTool] = useState<Tool>({ ...tool });
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState(false);

  // Update available subcategories when category changes
  useEffect(() => {
    if (editedTool.category) {
      const categoryData = categoriesMap.find(c => c.name === editedTool.category);
      setAvailableSubcategories(categoryData?.subcategories || []);
      
      // If the current subcategory isn't in the list and not empty, assume it's custom
      if (editedTool.subcategory && 
          !categoryData?.subcategories.includes(editedTool.subcategory)) {
        setCustomSubcategory(true);
      } else {
        setCustomSubcategory(false);
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [editedTool.category, categoriesMap]);

  // Check if category is custom when tool loads
  useEffect(() => {
    setCustomCategory(!categories.includes(editedTool.category) && !!editedTool.category);
  }, [editedTool.category, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If changing category, reset subcategory
    if (name === 'category' && value !== editedTool.category) {
      setEditedTool(prev => ({
        ...prev,
        [name]: value,
        subcategory: ''
      }));
    } else {
      setEditedTool(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedTool(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [name]: name === 'max_tokens' ? parseInt(value) : parseFloat(value)
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTool);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={editedTool.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tool name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={editedTool.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Short description of what this tool does"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex items-center space-x-2">
              {!customCategory ? (
                <select
                  name="category"
                  value={editedTool.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="category"
                  value={editedTool.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom category"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setCustomCategory(!customCategory);
                  if (customCategory) {
                    setEditedTool(prev => ({ ...prev, category: '' }));
                  }
                }}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                {customCategory ? 'Select' : 'Custom'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <div className="flex items-center space-x-2">
              {!customSubcategory ? (
                <select
                  name="subcategory"
                  value={editedTool.subcategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!editedTool.category || availableSubcategories.length === 0}
                >
                  <option value="">Select a subcategory</option>
                  {availableSubcategories.map(subcat => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="subcategory"
                  value={editedTool.subcategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom subcategory"
                  disabled={!editedTool.category}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setCustomSubcategory(!customSubcategory);
                  if (customSubcategory) {
                    setEditedTool(prev => ({ ...prev, subcategory: '' }));
                  }
                }}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
                disabled={!editedTool.category}
              >
                {customSubcategory ? 'Select' : 'Custom'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              name="provider"
              value={editedTool.provider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              name="model"
              value={editedTool.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., llama3:latest"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
          <div className="relative">
            <textarea
              name="prompt_template"
              value={editedTool.prompt_template}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              rows={8}
              placeholder="Template with {input} placeholders"
              required
            />
            <div className="absolute bottom-2 right-2">
              <div className="bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded">
                Use {'{input}'} for single value or {'{input.field}'} for structured input
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
              <span className="ml-1 text-gray-400">(0-1)</span>
            </label>
            <input
              type="number"
              name="temperature"
              value={editedTool.parameters.temperature}
              onChange={handleParameterChange}
              min="0"
              max="1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              name="max_tokens"
              value={editedTool.parameters.max_tokens}
              onChange={handleParameterChange}
              min="1"
              max="4000"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Tool
        </button>
      </div>
    </form>
  );
};

export default ToolEditor;