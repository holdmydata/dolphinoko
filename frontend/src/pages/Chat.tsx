import React, { useState } from 'react';
import ModelSelector from '../components/tools/ModelSelector';
import ChatInterface from '../components/tools/ChatInterface';

const Chat: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');

  // Providers available
  const providers = [
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'claude', label: 'Claude (Anthropic)' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">AI Chat</h1>
        <p className="mt-2 text-gray-600">
          Chat with local AI models through Ollama
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with model selection */}
        <div className="col-span-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedModel(''); // Reset model when provider changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <ModelSelector
            provider={selectedProvider}
            value={selectedModel}
            onChange={setSelectedModel}
            className="mb-4"
          />
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Tips</h3>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Select a model from the list</li>
              <li>• Chat messages are not saved when you leave the page</li>
              <li>• Press Enter to send messages (Shift+Enter for new line)</li>
              <li>• Responses may take a few seconds depending on model size</li>
            </ul>
          </div>
        </div>

        {/* Chat interface */}
        <div className="col-span-1 lg:col-span-3">
          <ChatInterface
            modelName={selectedModel}
            provider={selectedProvider}
            className="h-[75vh]"
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;