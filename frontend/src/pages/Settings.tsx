import React, { useState } from 'react';

// Define settings interface
interface Settings {
  localEndpoints: {
    ollama: string;
  };
  apiKeys: {
    claude: string;
  };
  theme: 'light' | 'dark' | 'system';
  defaultProvider: string;
}

const Settings: React.FC = () => {
  // Default settings
  const defaultSettings: Settings = {
    localEndpoints: {
      ollama: 'http://localhost:11434',
    },
    apiKeys: {
      claude: '',
    },
    theme: 'light',
    defaultProvider: 'ollama',
  };

  // Load settings from localStorage or use defaults
  const loadSettings = (): Settings => {
    const savedSettings = localStorage.getItem('mcp-toolbox-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    return defaultSettings;
  };

  // State for settings
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [isSaved, setIsSaved] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [section, key] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof Settings],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Reset saved status
    setIsSaved(false);
  };

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('mcp-toolbox-settings', JSON.stringify(settings));
    setIsSaved(true);
    
    // Reset saved status after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setIsSaved(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your Dolphin MCP Toolbox preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Local Endpoints Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Local Model Endpoints</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ollama API Endpoint
              </label>
              <input
                type="text"
                name="localEndpoints.ollama"
                value={settings.localEndpoints.ollama}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:11434"
              />
              <p className="mt-1 text-sm text-gray-500">
                The URL of your local Ollama server
              </p>
            </div>
          </div>
        </section>

        {/* API Keys Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">External API Keys</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claude API Key (Optional)
              </label>
              <input
                type="password"
                name="apiKeys.claude"
                value={settings.apiKeys.claude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-ant-api..." 
              />
              <p className="mt-1 text-sm text-gray-500">
                Required only if you want to use Claude models
              </p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Appearance</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </section>

        {/* Defaults Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Defaults</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Provider
            </label>
            <select
              name="defaultProvider"
              value={settings.defaultProvider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={resetSettings}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>
          
          <div className="flex items-center space-x-4">
            {isSaved && (
              <span className="text-green-600 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Settings saved!
              </span>
            )}
            
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;