// components/tools/ToolList.tsx
import React from 'react';
import { Tool } from '../../context/ToolContext';

interface ToolListProps {
  tools: Tool[];
  selectedId?: string;
  onSelect: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
  onEdit: (id: string) => void;
  showCategory?: boolean;
}

const ToolList: React.FC<ToolListProps> = ({ 
  tools, 
  selectedId, 
  onSelect,
  onClone,
  onEdit, 
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
      className={`group flex items-center justify-between p-3 hover:bg-farm-brown-light/10 cursor-pointer transition-colors ${
        selectedId === tool.id ? 'bg-farm-brown-light/20 border-l-4 border-farm-brown' : ''
      }`}
      onClick={() => onSelect(tool)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-farm-brown-dark truncate">{tool.name}</p>
        {showCategory && tool.subcategory && (
          <p className="text-xs text-farm-brown">{tool.subcategory}</p>
        )}
        <p className="text-xs text-farm-brown truncate">{tool.description}</p>
      </div>
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(tool.id!);
          }}
          className="text-farm-brown-light hover:text-farm-blue p-1 rounded hover:bg-farm-blue-light/30"
          title="Edit Tool"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete "${tool.name}"?`)) {
              onDelete(tool.id!);
            }
          }}
          className="text-farm-brown-light hover:text-red-500 p-1 rounded hover:bg-red-50"
          title="Delete Tool"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClone(tool.id!);
          }}
          className="text-farm-brown-light hover:text-farm-green p-1 rounded hover:bg-farm-green-light/30"
          title="Clone Tool"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="divide-y divide-farm-brown-light/30">
      {showCategory ? (
        Object.entries(groupedTools).map(([category, categoryTools]) => (
          <div key={category}>
            <div className="px-4 py-2 bg-farm-brown-light/10 text-xs font-semibold text-farm-brown uppercase tracking-wider">
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