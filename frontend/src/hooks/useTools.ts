import { useContext } from 'react';
import { ToolContext } from '../context/ToolContext';

export const useTools = () => {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useTools must be used within a ToolProvider');
  }
  return context;
};