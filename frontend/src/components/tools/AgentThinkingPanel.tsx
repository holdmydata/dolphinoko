import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character } from '../../context/CharacterContext';
import { ToolExecutionEvent } from './ToolMonitor';

interface AgentThinkingPanelProps {
  steps: string[];
  tools: ToolExecutionEvent[];
  character: Character | null;
  onClose: () => void;
}

const AgentThinkingPanel: React.FC<AgentThinkingPanelProps> = ({
  steps,
  tools,
  character,
  onClose
}) => {
  // Helper function to get emoji based on animal type
  const getCharacterEmoji = (type: string): string => {
    switch (type) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      case 'fox': return '🦊';
      case 'bear': return '🐻';
      default: return '🐾';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Agent Thinking Panel */}
      <motion.div 
        className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-farm-wood-light z-50 overflow-y-auto farm-panel border-r border-farm-brown/20 shadow-xl"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="farm-panel-title flex items-center">
          <span className="mr-2">💭</span>
          Agent Thinking
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-farm-brown-dark rounded-full"
          >
            ✕
          </button>
        </div>
        
        <div className="farm-panel-content p-4">
          {/* Character thinking */}
          {character && (
            <div className="mb-6 p-3 bg-white/50 rounded-lg border border-farm-brown-light">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: character.color + '40' }}
                >
                  {getCharacterEmoji(character.type)}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-on-light">{character.name}</div>
                  <div className="text-xs text-muted-on-light">{character.role}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-on-light">
                <div className="flex items-start mb-1">
                  <div className="flex-shrink-0 w-6 text-center">💭</div>
                  <div>Thinking process:</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Thinking steps */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-on-light mb-2">
              Reasoning Steps
            </h3>
            <ul className="space-y-3">
              {steps.map((step, index) => (
                <motion.li
                  key={index}
                  className="p-2 bg-white/60 rounded border border-farm-brown-light/30 text-sm text-on-light"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex">
                    <span className="mr-2 text-farm-green">
                      ✓
                    </span>
                    {step}
                  </div>
                </motion.li>
              ))}
              {steps.length === 0 && (
                <div className="text-center text-muted-on-light text-sm py-3">
                  No thinking steps available
                </div>
              )}
            </ul>
          </div>
          
          {/* Recent tool executions */}
          {tools.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-on-light mb-2">
                Recent Tool Executions
              </h3>
              <ul className="space-y-2">
                {tools.slice(0, 3).map((tool) => (
                  <li 
                    key={tool.id}
                    className="p-2 bg-white/60 rounded border border-farm-brown-light/30 text-xs"
                  >
                    <div className="font-medium text-on-light">{tool.toolName}</div>
                    <div className="text-muted-on-light mt-1 overflow-hidden text-ellipsis">
                      {typeof tool.input === 'string' 
                        ? tool.input.slice(0, 120) + (tool.input.length > 120 ? '...' : '')
                        : 'Complex input'}
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        tool.status === 'success' 
                          ? 'bg-farm-green/20 text-farm-green' 
                          : 'bg-farm-brown/20 text-farm-brown'
                      }`}>
                        {tool.status}
                      </span>
                      <span className="text-muted-on-light">
                        {new Date(tool.startTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Tips */}
          <div className="mt-6 p-3 bg-farm-green-light/30 rounded-lg border border-farm-green/20 text-xs text-on-light">
            <div className="font-medium mb-1">How agent thinking works:</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>The agent analyzes your request</li>
              <li>Selects the most appropriate tools</li>
              <li>Processes information from tools</li>
              <li>Formulates a response based on tool output</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AgentThinkingPanel; 