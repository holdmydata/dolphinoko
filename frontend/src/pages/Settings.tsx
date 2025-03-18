import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { secureStorage } from "../utils/secureStorage";

// Define settings interface
interface Settings {
  localEndpoints: {
    ollama: string;
  };
  apiKeys: {
    claude: string;
  };
  theme: "light" | "dark" | "system";
  defaultProvider: string;
  enableNeo4j: boolean;
}

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  // Default settings
  const defaultSettings: Settings = {
    localEndpoints: {
      ollama: "http://localhost:11434",
    },
    apiKeys: {
      claude: "",
    },
    theme: "light",
    defaultProvider: "ollama",
    enableNeo4j: false,
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure your Dolphin MCP Toolbox preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Local Endpoints Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-200 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
            Local Model Endpoints
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ollama API Endpoint
              </label>
              <input
                type="text"
                name="localEndpoints.ollama"
                value={settings.localEndpoints.ollama}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="http://localhost:11434"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The URL of your local Ollama server
              </p>
            </div>
          </div>
        </section>

        {/* API Keys Section */}
        <section className="mb-8">
          <h2 className="text-xl  text-gray-200 dark:text-white font-semibold mb-4 pb-2 border-b dark:border-gray-700">
            External API Keys
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Claude API Key (Optional)
              </label>
              <input
                type="password"
                name="apiKeys.claude"
                value={settings.apiKeys.claude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="sk-ant-api..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Required only if you want to use Claude models
              </p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-xl  text-gray-200 dark:text-white font-semibold mb-4 pb-2 border-b dark:border-gray-700">
            Appearance
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </section>

        {/* Defaults Section */}
        <section className="mb-8">
          <h2 className="text-xl  text-gray-200 dark:text-white font-semibold mb-4 pb-2 border-b dark:border-gray-700">
            Defaults
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Provider
            </label>
            <select
              name="defaultProvider"
              value={settings.defaultProvider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-xl text-gray-200 dark:text-white font-semibold mb-4 pb-2 border-b dark:border-gray-700">
            Database Options
          </h2>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="enableNeo4j"
              name="enableNeo4j"
              checked={settings.enableNeo4j}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "enableNeo4j",
                    value: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="enableNeo4j"
              className="ml-2 block text-gray-700 dark:text-gray-300"
            >
              Enable Neo4j Graph Database (Optional)
            </label>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Neo4j provides advanced graph capabilities, but requires separate
            installation. SQLite is used by default.
          </p>
        </section>
        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={resetSettings}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>

          <div className="flex items-center space-x-4">
            {isSaved && (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
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
