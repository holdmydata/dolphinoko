import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModelSettings {
  baseModel: string;
  baseProvider: string;
  hasCompletedInitialSetup: boolean;
}

interface ModelSettingsContextType {
  modelSettings: ModelSettings;
  updateModelSettings: (settings: Partial<ModelSettings>) => void;
  completeInitialSetup: () => void;
  resetModelSettings: () => void;
}

const defaultModelSettings: ModelSettings = {
  baseModel: 'dolphin3:latest',
  baseProvider: 'ollama',
  hasCompletedInitialSetup: false
};

const MODEL_SETTINGS_KEY = 'dolphinoko-model-settings';

const ModelSettingsContext = createContext<ModelSettingsContextType | undefined>(undefined);

export const ModelSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(MODEL_SETTINGS_KEY);
      return savedSettings ? JSON.parse(savedSettings) : defaultModelSettings;
    } catch (error) {
      console.error('Failed to parse model settings from localStorage:', error);
      return defaultModelSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(modelSettings));
  }, [modelSettings]);

  const updateModelSettings = (settings: Partial<ModelSettings>) => {
    setModelSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  const completeInitialSetup = () => {
    setModelSettings(prev => ({
      ...prev,
      hasCompletedInitialSetup: true
    }));
  };

  const resetModelSettings = () => {
    setModelSettings(defaultModelSettings);
  };

  return (
    <ModelSettingsContext.Provider 
      value={{ 
        modelSettings, 
        updateModelSettings, 
        completeInitialSetup,
        resetModelSettings
      }}
    >
      {children}
    </ModelSettingsContext.Provider>
  );
};

export const useModelSettings = (): ModelSettingsContextType => {
  const context = useContext(ModelSettingsContext);
  if (context === undefined) {
    throw new Error('useModelSettings must be used within a ModelSettingsProvider');
  }
  return context;
}; 