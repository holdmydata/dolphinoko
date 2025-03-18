import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Tool } from '../../context/ToolContext';
import { CATEGORIES } from '../../types/categories';

interface ToolOrganizerProps {
  tools: Tool[];
  onUpdateTools: (updatedTools: Tool[]) => void;
}

const ToolOrganizer: React.FC<ToolOrganizerProps> = ({ tools, onUpdateTools }) => {
  // Group tools by category
  const initialColumns = CATEGORIES.reduce((acc, category) => {
    acc[category.name] = {
      id: category.name,
      title: category.name,
      icon: category.icon,
      toolIds: tools
        .filter(tool => tool.category === category.name)
        .map(tool => tool.id!)
    };
    return acc;
  }, {} as Record<string, { id: string, title: string, icon: string, toolIds: string[] }>);
  
  // Add uncategorized column
  initialColumns['Uncategorized'] = {
    id: 'Uncategorized',
    title: 'Uncategorized',
    icon: '🔧',
    toolIds: tools
      .filter(tool => !tool.category || !CATEGORIES.some(c => c.name === tool.category))
      .map(tool => tool.id!)
  };
  
  const [columns, setColumns] = useState(initialColumns);
  
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Get source and destination columns
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    // Move within same column
    if (sourceColumn === destColumn) {
      const newToolIds = Array.from(sourceColumn.toolIds);
      newToolIds.splice(source.index, 1);
      newToolIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...sourceColumn,
        toolIds: newToolIds
      };
      
      setColumns({
        ...columns,
        [newColumn.id]: newColumn
      });
    } else {
      // Move between columns (change category)
      const sourceToolIds = Array.from(sourceColumn.toolIds);
      sourceToolIds.splice(source.index, 1);
      
      const destToolIds = Array.from(destColumn.toolIds);
      destToolIds.splice(destination.index, 0, draggableId);
      
      setColumns({
        ...columns,
        [sourceColumn.id]: {
          ...sourceColumn,
          toolIds: sourceToolIds
        },
        [destColumn.id]: {
          ...destColumn,
          toolIds: destToolIds
        }
      });
      
      // Update tool category
      const updatedTools = tools.map(tool => {
        if (tool.id === draggableId) {
          return {
            ...tool,
            category: destination.droppableId === 'Uncategorized' ? null : destination.droppableId
          };
        }
        return tool;
      });
      
      onUpdateTools(updatedTools);
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Organize Your Tools</h2>
      <p className="text-sm text-gray-500 mb-6">Drag and drop tools between categories to organize them</p>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(columns).map(column => (
            <div 
              key={column.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <span className="mr-2 text-xl">{column.icon}</span>
                <h3 className="font-medium">{column.title}</h3>
                <span className="ml-2 text-sm text-gray-500">({column.toolIds.length})</span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px] p-2"
                  >
                    {column.toolIds.map((toolId, index) => {
                      const tool = tools.find(t => t.id === toolId);
                      if (!tool) return null;
                      
                      return (
                        <Draggable 
                          key={toolId} 
                          draggableId={toolId} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-3 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm"
                            >
                              <div className="font-medium text-sm">{tool.name}</div>
                              <div className="text-xs text-gray-500 truncate">{tool.description}</div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ToolOrganizer;