// components/tools/ToolList.tsx
import React from 'react';
import { Tool } from '../../context/ToolContext';

interface ToolListProps {
  tools: Tool[];
  selectedId?: string;
  onSelect: (tool: Tool) => void;
  onDelete: (id: string) => void;
  showCategory?: boolean;
}

const ToolList: React.FC<ToolListProps> = ({ 
  tools, 
  selectedId, 
  onSelect, 
  onDelete,
  showCategory = false
}) => {
  // Group tools by category if needed
  const groupedTools: Record<string, Tool[]> = {};
  
  if (showCategory) {
    tools.forEach(tool => {
      const category = tool.category || 'Uncategorized';
      if (!groupedTools[category]) {
        groupedTools[category] = [];
      }
      groupedTools[category].push(tool);
    });
  }

  const renderTool = (tool: Tool) => (
    <div 
      key={tool.id} 
      className={`group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer ${
        selectedId === tool.id ? 'bg-gray-200 dark:bg-gray-900' : ''
      }`}
      onClick={() => onSelect(tool)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tool.name}</p>
        {showCategory && tool.subcategory && (
          <p className="text-xs text-gray-500">{tool.subcategory}</p>
        )}
        <p className="text-xs text-gray-500 truncate">{tool.description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete "${tool.name}"?`)) {
            onDelete(tool.id!);
          }
        }}
        className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {showCategory ? (
        Object.entries(groupedTools).map(([category, categoryTools]) => (
          <div key={category}>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-950 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {category}
            </div>
            {categoryTools.map(renderTool)}
          </div>
        ))
      ) : (
        tools.map(renderTool)
      )}
    </div>
  );
};

export default ToolList;