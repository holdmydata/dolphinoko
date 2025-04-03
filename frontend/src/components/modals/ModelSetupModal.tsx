import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelSelector from '../tools/ModelSelector';
import { useModelSettings } from '../../context/ModelSettingsContext';

interface ModelSetupModalProps {
  isOpen: boolean;
}

const ModelSetupModal: React.FC<ModelSetupModalProps> = ({ isOpen }) => {
  const { modelSettings, updateModelSettings, completeInitialSetup } = useModelSettings();
  const [selectedProvider, setSelectedProvider] = useState(modelSettings.baseProvider);
  const [selectedModel, setSelectedModel] = useState(modelSettings.baseModel);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  // Providers available
  const providers = [
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'claude', label: 'Claude (Anthropic)' },
  ];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // Update the model settings
    updateModelSettings({
      baseModel: selectedModel,
      baseProvider: selectedProvider
    });
    
    // Mark setup as complete
    completeInitialSetup();
    
    // Allow time for the settings to be saved
    setTimeout(() => {
      setIsLoading(false);
      setShowModal(false); // Close the modal
    }, 500);
  };

  // If not open, don't render
  if (!showModal) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="farm-panel relative w-full max-w-lg overflow-hidden bg-white"
          >
            <div className="farm-panel-title">
              <h2 className="text-xl font-bold text-white">
                Welcome to Dolphinoko!
              </h2>
            </div>
            
            <div className="farm-panel-content">
              <p className="text-farm-brown-dark mb-4">
                Let's set up your base model to power all your assistants.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Choose a provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    className="w-full px-3 py-2 border border-farm-brown-light rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-farm-green bg-white
                              text-farm-brown-dark"
                  >
                    {providers.map(provider => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-farm-brown-dark mb-1">
                    Select your base model
                  </label>
                  <div className="border border-farm-brown-light rounded-md">
                    <ModelSelector
                      provider={selectedProvider}
                      value={selectedModel}
                      onChange={handleModelChange}
                      className="bg-white"
                    />
                  </div>
                  <p className="mt-2 text-sm text-farm-brown">
                    This model will be the default for all your assistants unless overridden.
                  </p>
                </div>

                <div className="pt-4 flex justify-end border-t border-farm-brown-light">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !selectedModel}
                    className={`farm-button ${
                      isLoading || !selectedModel
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-farm-green text-white hover:bg-farm-green-dark'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Save & Continue'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModelSetupModal; 