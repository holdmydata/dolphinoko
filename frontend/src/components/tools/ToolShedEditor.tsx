import React, { useState, useEffect } from "react";
import { Tool } from "../../context/ToolContext";
import { CATEGORIES } from "../../types/categories";

interface ToolShedEditorProps {
  tool: Partial<Tool>;
  onSave: (tool: Tool) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const ToolShedEditor: React.FC<ToolShedEditorProps> = ({
  tool,
  onSave,
  onCancel,
  isNew = false
}) => {
  const defaultParams = { temperature: 0.7, max_tokens: 500 };
  
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    provider: "ollama",
    model: "",
    prompt_template: "",
    system_prompt: "",
    version: 1, // Default version
    parameters: defaultParams,
    schema: {},
    ...tool
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    model?: string;
    prompt_template?: string;
  }>({});

  // Get subcategories for the selected category
  const availableSubcategories = formData.category
    ? CATEGORIES.find(c => c.name === formData.category)?.subcategories || []
    : [];

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle parameter changes
  const handleParameterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    const paramValue = type === 'number' ? parseFloat(value) : value;
    
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...(prev.parameters || defaultParams),
        [name]: paramValue
      }
    }));
  };

  // Handle category change
  const handleCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: "" // Reset subcategory when category changes
    }));
  };

  // Validate the form before submission
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      description?: string;
      model?: string;
      prompt_template?: string;
    } = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.model?.trim()) {
      newErrors.model = "Model is required";
    }

    if (!formData.prompt_template?.trim()) {
      newErrors.prompt_template = "Prompt template is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData as Tool);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto border-2 border-farm-brown">
        <div className="p-6 border-b border-farm-brown-light">
          <h2 className="text-2xl font-bold text-farm-brown-dark flex items-center">
            <span className="text-xl mr-3">{isNew ? "🌱" : "🔧"}</span>
            {isNew ? "Plant New Tool" : "Modify Tool"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md bg-white text-farm-brown-dark ${
                    errors.name ? "border-red-500" : "border-farm-brown-light focus:border-farm-green"
                  }`}
                  placeholder="My Tool Name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full p-2 border rounded-md bg-white text-farm-brown-dark ${
                    errors.description ? "border-red-500" : "border-farm-brown-light focus:border-farm-green"
                  }`}
                  placeholder="What does this tool do?"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Subcategory
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                  >
                    <option value="">Select a subcategory</option>
                    {availableSubcategories.map(subcat => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* AI Model Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Provider
                </label>
                <select
                  name="provider"
                  value={formData.provider || "ollama"}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                >
                  <option value="ollama">Ollama</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model || ""}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md bg-white text-farm-brown-dark ${
                    errors.model ? "border-red-500" : "border-farm-brown-light focus:border-farm-green"
                  }`}
                  placeholder="e.g., llama3, gpt-4, claude-3-opus"
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-500">{errors.model}</p>
                )}
              </div>

              {/* Parameters */}
              <div className="p-4 bg-farm-brown-light/10 rounded-md border border-farm-brown-light">
                <h3 className="text-sm font-medium text-farm-brown-dark mb-3">
                  Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-farm-brown mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      name="temperature"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.parameters?.temperature || 0.7}
                      onChange={handleParameterChange}
                      className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-farm-brown mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      name="max_tokens"
                      step="1"
                      min="1"
                      value={formData.parameters?.max_tokens || 500}
                      onChange={handleParameterChange}
                      className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompts Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                System Prompt
              </label>
              <textarea
                name="system_prompt"
                value={formData.system_prompt || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-farm-brown-light rounded-md bg-white text-farm-brown-dark focus:border-farm-green"
                placeholder="You are a helpful assistant that..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                Prompt Template *
              </label>
              <textarea
                name="prompt_template"
                value={formData.prompt_template || ""}
                onChange={handleInputChange}
                rows={5}
                className={`w-full p-2 border rounded-md bg-white text-farm-brown-dark ${
                  errors.prompt_template ? "border-red-500" : "border-farm-brown-light focus:border-farm-green"
                }`}
                placeholder="Enter your prompt template here..."
              />
              {errors.prompt_template && (
                <p className="mt-1 text-sm text-red-500">{errors.prompt_template}</p>
              )}
              <p className="mt-1 text-xs text-farm-brown">
                You can use variables in your template.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-farm-brown-light">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-farm-brown-light hover:bg-farm-brown text-farm-brown-dark rounded-md border border-farm-brown transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-farm-green hover:bg-farm-green-dark text-white rounded-md border border-farm-green-dark transition-colors"
            >
              {isNew ? "Plant Tool" : "Update Tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolShedEditor; 