import React, { useState, useEffect } from "react";
import { Tool } from "../../context/ToolContext";
import { motion } from "framer-motion";

interface ToolEditorProps {
  tool: Tool;
  onSave: (tool: Tool) => void;
  onCancel: () => void;
  categories: string[];
  categoriesMap: Array<{ name: string; subcategories: string[] }>;
}

const ToolEditor: React.FC<ToolEditorProps> = ({
  tool,
  onSave,
  onCancel,
  categories,
  categoriesMap,
}) => {
  const [editedTool, setEditedTool] = useState<Tool>({ ...tool });
  const [availableSubcategories, setAvailableSubcategories] = useState<
    string[]
  >([]);
  const [customCategory, setCustomCategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState(false);

  // Update editedTool when the tool prop changes
  useEffect(() => {
    setEditedTool({ ...tool });
  }, [tool]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (editedTool.category) {
      const categoryData = categoriesMap.find(
        (c) => c.name === editedTool.category
      );
      setAvailableSubcategories(categoryData?.subcategories || []);

      // If the current subcategory isn't in the list and not empty, assume it's custom
      if (
        editedTool.subcategory &&
        !categoryData?.subcategories.includes(editedTool.subcategory)
      ) {
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
    setCustomCategory(
      editedTool.category ? !categories.includes(editedTool.category) : false
    );
  }, [editedTool.category, categories]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // If changing category, reset subcategory
    if (name === "category" && value !== editedTool.category) {
      setEditedTool((prev) => ({
        ...prev,
        [name]: value,
        subcategory: "",
      }));
    } else {
      setEditedTool((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedTool((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [name]: name === "max_tokens" ? parseInt(value) : parseFloat(value),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTool);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.form 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onSubmit={handleSubmit} 
      className="space-y-6 bg-white p-6 rounded-lg border-2 border-farm-brown-light shadow-md"
    >
      <motion.div variants={containerVariants} className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-farm-brown-dark mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={editedTool.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
            placeholder="Tool name"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-farm-brown-dark mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={editedTool.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
            rows={2}
            placeholder="Short description of what this tool does"
          />
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
              Category
            </label>
            <div className="flex items-center space-x-2">
              {!customCategory ? (
                <select
                  name="category"
                  value={editedTool.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="category"
                  value={editedTool.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
                  placeholder="Custom category"
                />
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setCustomCategory(!customCategory);
                  if (customCategory) {
                    setEditedTool((prev) => ({ ...prev, category: "" }));
                  }
                }}
                className="px-3 py-2 text-sm bg-farm-brown-light hover:bg-farm-brown 
                           text-farm-brown-dark rounded-md border border-farm-brown transition-colors"
              >
                {customCategory ? "Select" : "Custom"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
              Subcategory
            </label>
            <div className="flex items-center space-x-2">
              {!customSubcategory ? (
                <select
                  name="subcategory"
                  value={editedTool.subcategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark
                             disabled:bg-farm-brown-light/10 disabled:text-farm-brown/50 disabled:cursor-not-allowed"
                  disabled={
                    !editedTool.category || availableSubcategories.length === 0
                  }
                >
                  <option value="">Select a subcategory</option>
                  {availableSubcategories.map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="subcategory"
                  value={editedTool.subcategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark
                             disabled:bg-farm-brown-light/10 disabled:text-farm-brown/50 disabled:cursor-not-allowed"
                  placeholder="Custom subcategory"
                  disabled={!editedTool.category}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setCustomSubcategory(!customSubcategory);
                  if (customSubcategory) {
                    setEditedTool((prev) => ({ ...prev, subcategory: "" }));
                  }
                }}
                className="px-3 py-2 text-sm bg-farm-brown-light hover:bg-farm-brown 
                           text-farm-brown-dark rounded-md border border-farm-brown transition-colors
                           disabled:bg-farm-brown-light/30 disabled:text-farm-brown/50 disabled:cursor-not-allowed"
                disabled={!editedTool.category}
              >
                {customSubcategory ? "Select" : "Custom"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
              Provider
            </label>
            <select
              name="provider"
              value={editedTool.provider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
            >
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={editedTool.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
              placeholder="e.g., llama3:latest"
              required
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-farm-brown-dark mb-1">
            Prompt Template
          </label>
          <div className="relative">
            <textarea
              name="prompt_template"
              value={editedTool.prompt_template}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark font-mono"
              rows={8}
              placeholder="Template with {input} placeholders"
              required
            />
            <div className="absolute bottom-2 right-2">
              <div className="bg-farm-brown-light/10 text-xs text-farm-brown px-2 py-1 rounded border border-farm-brown-light">
                Use {"{input}"} for single value or {"{input.field}"} for
                structured input
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
              Temperature
              <span className="ml-1 text-farm-brown">(0-1)</span>
            </label>
            <input
              type="number"
              name="temperature"
              value={editedTool.parameters.temperature}
              onChange={handleParameterChange}
              min="0"
              max="1"
              step="0.1"
              className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-farm-brown-dark mb-1">
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
              className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown-dark"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="pt-4 border-t border-farm-brown-light flex justify-end space-x-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-farm-brown-dark bg-farm-brown-light 
                     border border-farm-brown rounded-md hover:bg-farm-brown transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-farm-green 
                     border border-farm-green-dark rounded-md hover:bg-farm-green-dark transition-colors"
        >
          <span className="flex items-center">
            <span className="mr-2">{tool.id ? "🔧" : "🌱"}</span>
            {tool.id ? "Update Tool" : "Plant Tool"}
          </span>
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default ToolEditor;
