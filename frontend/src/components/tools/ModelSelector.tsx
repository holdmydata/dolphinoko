import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../common';
import { api } from '../../utils/api';

interface ModelInfo {
  name: string;
  size?: number;
  modified_at?: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface ModelSelectorProps {
  provider: string;
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  value,
  onChange,
  className = '',
}) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPullingModel, setPullingModel] = useState<boolean>(false);
  const [newModelName, setNewModelName] = useState<string>('');

  // Fetch models
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (provider === 'ollama') {
        const response = await api.get<{ models: ModelInfo[] }>('/api/models/ollama');
        setModels(response.models);
      } else {
        setModels([]);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  // Pull a new model
  const pullModel = async () => {
    if (!newModelName.trim()) {
      setError('Please enter a model name');
      return;
    }
    
    try {
      setPullingModel(true);
      setError(null);
      
      const response = await api.post<{ success: boolean, message: string }>(
        '/api/models/ollama/pull',
        { name: newModelName.trim() }
      );
      
      if (response.success) {
        // Refetch models after successful pull
        fetchModels();
        setNewModelName('');
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error pulling model:', err);
      setError('Failed to pull model');
    } finally {
      setPullingModel(false);
    }
  };

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Load models on mount or when provider changes
  useEffect(() => {
    fetchModels();
  }, [provider]);

  // Only show UI for Ollama for now
  if (provider !== 'ollama') {
    return (
      <div className={`bg-white p-4 rounded-md border border-gray-200 ${className}`}>
        <p className="text-gray-600">
          Model selection for {provider} is not yet supported.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card 
        title="Available Models" 
        className="mb-4"
        footer={
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchModels}
              isLoading={loading}
            >
              Refresh
            </Button>
            <div className="text-xs text-gray-500">
              {models.length} models available
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="py-6 flex justify-center items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">
            {error}
          </div>
        ) : models.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            No models found. Pull a model first.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {models.map((model) => (
              <div 
                key={model.name}
                className={`
                  p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                  ${value === model.name ? 'bg-blue-50' : ''}
                `}
                onClick={() => onChange(model.name)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-800">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {model.details?.family && (
                        <Badge variant="info" size="sm" className="mr-1">
                          {model.details.family}
                        </Badge>
                      )}
                      {model.details?.parameter_size && (
                        <Badge variant="primary" size="sm" className="mr-1">
                          {model.details.parameter_size}
                        </Badge>
                      )}
                      <Badge variant="default" size="sm">
                        {formatSize(model.size)}
                      </Badge>
                    </div>
                  </div>
                  
                  {value === model.name && (
                    <Badge variant="success" size="sm">Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <Card title="Pull New Model" className="bg-gray-50">
        <div className="flex items-center">
          <input
            type="text"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="Enter model name (e.g., llama3, mistral)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant="primary"
            className="ml-3"
            onClick={pullModel}
            isLoading={isPullingModel}
            disabled={isPullingModel || !newModelName.trim()}
          >
            Pull Model
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          This will download the model from Ollama's registry. Large models may take a while to download.
        </p>
      </Card>
    </div>
    );
}

export default ModelSelector;