import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { secureStorage } from "../utils/secureStorage";
import { useModelSettings } from "../context/ModelSettingsContext";
import ModelSelector from "../components/tools/ModelSelector";

// Define settings interface
interface Settings {
  localEndpoints: {
    ollama: string;
    neo4j: string;
  };
  apiKeys: {
    claude: string;
  };
  networkConfig: {
    host: string;
    port: number;
    backendPort: number;
  };
  theme: "light" | "dark" | "system";
  defaultProvider: string;
  enableNeo4j: boolean;
  defaultModel: string;
}

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { modelSettings, updateModelSettings, resetModelSettings } = useModelSettings();

  // Default settings
  const defaultSettings: Settings = {
    localEndpoints: {
      ollama: "http://localhost:11434",
      neo4j: "bolt://localhost:7687"
    },
    apiKeys: {
      claude: "",
    },
    networkConfig: {
      host: "192.168.0.249",
      port: 3000,
      backendPort: 8080
    },
    theme: "light",
    defaultProvider: "ollama",
    enableNeo4j: false,
    defaultModel: "dolphin3:latest"
  };

  // Load settings from localStorage or use defaults
  const loadSettings = (): Settings => {
    const savedSettings = localStorage.getItem("mcp-toolbox-settings");
    let settings = defaultSettings;

    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);

        // Get the API keys from secure storage instead
        settings.apiKeys.claude =
          secureStorage.getItem("mcp-claude-api-key") || "";
      } catch (e) {
        console.error("Failed to parse saved settings:", e);
      }
    }
    return settings;
  };

  // State for settings
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [isSaved, setIsSaved] = useState(false);

  // Sync theme from ThemeContext when component mounts
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      theme,
    }));
  }, [theme]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | 
    { target: { name: string, value: string | boolean } }
  ) => {
    const { name, value } = e.target;
  
    // Handle nested properties
    if (name.includes(".")) {
      const [section, key] = name.split(".");
      setSettings((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof Settings] as Record<string, any>),
          [key]: value,
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  
    // If theme is being changed, update it in ThemeContext
    if (name === "theme" && typeof value === "string") {
      setTheme(value as "light" | "dark" | "system");
    }
  
    // Reset saved status
    setIsSaved(false);
  };

  // Save settings
  const saveSettings = () => {
    // Save API keys to secure storage instead of including them in the main settings
    secureStorage.setItem("mcp-claude-api-key", settings.apiKeys.claude);

    const settingsForStorage = {
      ...settings,
      apiKeys: {
        claude: "",
      },
    };
    localStorage.setItem(
      "mcp-toolbox-settings",
      JSON.stringify(settingsForStorage)
    );
    setIsSaved(true);

    // Reset saved status after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (
      window.confirm("Are you sure you want to reset all settings to defaults?")
    ) {
      setSettings(defaultSettings);
      setTheme(defaultSettings.theme);
      setIsSaved(false);
    }
  };

  // Handle model selector changes
  const handleModelChange = (model: string) => {
    updateModelSettings({ baseModel: model });
    setIsSaved(false);
  };
  
  // Handle provider change
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateModelSettings({ baseProvider: e.target.value });
    setIsSaved(false);
  };

  // Save base model settings
  const saveBaseModelSettings = () => {
    // No need to do anything, model settings are saved automatically
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-farm-brown-dark mb-6">Farm Settings</h1>

      <div className="farm-panel mb-8">
        <div className="farm-panel-title">
          <h2 className="text-xl font-bold">Base Model Settings</h2>
        </div>
        <div className="farm-panel-content">
          <p className="text-farm-brown-dark mb-4">
            These settings control the default model used by all assistants and tools.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-farm-brown-dark mb-2">
                Default Provider
              </label>
              <select
                name="baseProvider"
                value={modelSettings.baseProvider}
                onChange={handleProviderChange}
                className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                       text-farm-brown-dark"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="claude">Claude (Anthropic)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-farm-brown-dark mb-2">
                Default Model
              </label>
              <div className="border border-farm-brown-light rounded-md">
                <ModelSelector
                  provider={modelSettings.baseProvider}
                  value={modelSettings.baseModel}
                  onChange={handleModelChange}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-farm-brown-light">
            <button
              onClick={resetModelSettings}
              className="farm-button"
            >
              Reset Model Settings
            </button>
            <button
              onClick={saveBaseModelSettings}
              className="farm-button bg-farm-green text-white hover:bg-farm-green-dark"
            >
              <span className="mr-2">{isSaved ? "✅" : "💾"}</span>
              {isSaved ? "Saved!" : "Save Model Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="farm-panel">
        <div className="farm-panel-title">
          <h2 className="text-xl font-bold">System Settings</h2>
        </div>
        <div className="farm-panel-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-farm-brown-dark mb-2">
                Local Endpoints
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Ollama API URL
                  </label>
                  <input
                    type="text"
                    name="localEndpoints.ollama"
                    value={settings.localEndpoints.ollama}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                            text-farm-brown-dark"
                    placeholder="http://localhost:11434"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Neo4j Connection String
                  </label>
                  <input
                    type="text"
                    name="localEndpoints.neo4j"
                    value={settings.localEndpoints.neo4j}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                            text-farm-brown-dark"
                    placeholder="bolt://localhost:7687"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-farm-brown-dark mb-2">
                API Keys
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Claude API Key
                  </label>
                  <input
                    type="password"
                    name="apiKeys.claude"
                    value={settings.apiKeys.claude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                            text-farm-brown-dark"
                    placeholder="sk-..."
                  />
                  <p className="mt-1 text-sm text-farm-brown">
                    Your API key is stored securely and never shared.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-farm-brown-dark mb-2">
              Network Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Host IP Address
                </label>
                <input
                  type="text"
                  name="networkConfig.host"
                  value={settings.networkConfig.host}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                          text-farm-brown-dark"
                  placeholder="192.168.0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Frontend Port
                </label>
                <input
                  type="number"
                  name="networkConfig.port"
                  value={settings.networkConfig.port}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                          text-farm-brown-dark"
                  placeholder="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                  Backend Port
                </label>
                <input
                  type="number"
                  name="networkConfig.backendPort"
                  value={settings.networkConfig.backendPort}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                          text-farm-brown-dark"
                  placeholder="8080"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-farm-brown-dark mb-2">
              Appearance
            </h3>
            <div>
              <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                Theme
              </label>
              <select
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                        text-farm-brown-dark"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-farm-brown-light">
            <button
              onClick={resetSettings}
              className="farm-button"
            >
              Reset to Defaults
            </button>
            <button
              onClick={saveSettings}
              className="farm-button bg-farm-green text-white hover:bg-farm-green-dark"
            >
              <span className="mr-2">{isSaved ? "✅" : "💾"}</span>
              {isSaved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
