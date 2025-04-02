import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { Tool } from '../context/ToolContext';
import { CATEGORIES } from '../types/categories'; // Import your categories
import { motion, AnimatePresence } from 'framer-motion';

const ToolOrganizerPage: React.FC = () => {
  const navigate = useNavigate();
  const { tools, updateTool } = useTools();
  const [organizingTools, setOrganizingTools] = useState<Tool[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize with current tools
  useEffect(() => {
    setOrganizingTools([...tools]);
  }, [tools]);

  // Group tools by category
  const toolsByCategory = organizingTools.reduce((acc, tool) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  // Update a tool's category and subcategory
  const handleUpdateToolCategory = (toolId: string, category: string | undefined, subcategory: string | undefined) => {
    setOrganizingTools(prev => 
      prev.map(tool => 
        tool.id === toolId 
          ? { ...tool, category, subcategory } 
          : tool
      )
    );
  };

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryName: string) => {
    const category = CATEGORIES.find(c => c.name === categoryName);
    return category?.subcategories || [];
  };

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // Find tools that have changed
      const changedTools = organizingTools.filter(newTool => {
        const originalTool = tools.find(t => t.id === newTool.id);
        return originalTool && 
          (originalTool.category !== newTool.category || 
           originalTool.subcategory !== newTool.subcategory);
      });
      
      // Update each changed tool
      for (const tool of changedTools) {
        await updateTool(tool.id!, tool);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save changes", error);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto px-4 py-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <motion.h1 
          className="text-3xl font-bold text-farm-brown-dark retro-text mb-2 text-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          <span className="text-2xl mr-2">🌾</span>
          Organize Tool Shed
          <span className="text-2xl ml-2">🌾</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="mt-2 text-farm-brown text-center">
          Drag and drop your tools into categories to keep your tool shed organized
        </motion.p>
        
        {/* Save changes button */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 flex justify-center space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tools')}
            className="px-4 py-2 bg-farm-brown-light hover:bg-farm-brown text-farm-brown-dark rounded-md border border-farm-brown transition-colors"
          >
            Back to Tools
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-farm-green hover:bg-farm-green-dark text-white rounded-md border border-farm-green-dark transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Save Changes
          </motion.button>
        </motion.div>
        
        <AnimatePresence>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 py-2 px-4 bg-green-100 text-green-800 rounded-md text-center border border-green-200"
            >
              Changes saved successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Tool Organizer Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Uncategorized tools */}
        <motion.div 
          variants={cardVariants}
          whileHover="hover"
          className="farm-panel overflow-hidden"
        >
          <div className="farm-panel-title">
            <span className="mr-2 text-lg">🔧</span>
            Uncategorized
            <span className="ml-2 text-sm text-white/80">
              ({(toolsByCategory['Uncategorized'] || []).length})
            </span>
          </div>
          
          <div className="divide-y divide-farm-brown-light farm-panel-content">
            {(toolsByCategory['Uncategorized'] || []).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-center text-farm-brown"
              >
                No uncategorized tools
              </motion.div>
            ) : (
              (toolsByCategory['Uncategorized'] || []).map(tool => (
                <motion.div 
                  key={tool.id} 
                  className="p-4"
                  variants={itemVariants}
                  whileHover={{ backgroundColor: "rgba(188, 170, 164, 0.1)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-medium text-farm-brown-dark mb-2">{tool.name}</div>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-farm-brown mb-1">
                      Move to Category
                    </label>
                    <select
                      value=""
                      onChange={(e) => handleUpdateToolCategory(
                        tool.id!, 
                        e.target.value || undefined, 
                        undefined
                      )}
                      className="w-full p-2 text-sm border border-farm-brown-light rounded bg-white text-farm-brown-dark focus:border-farm-green"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(category => (
                        <option key={category.name} value={category.name}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
        
        {/* Categories */}
        {CATEGORIES.map(category => {
          const categoryTools = toolsByCategory[category.name] || [];
          return (
            <motion.div 
              key={category.name} 
              variants={cardVariants}
              whileHover="hover"
              className="farm-panel overflow-hidden"
            >
              <div className="farm-panel-title">
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.name}
                <span className="ml-2 text-sm text-white/80">
                  ({categoryTools.length})
                </span>
              </div>
              
              <div className="divide-y divide-farm-brown-light farm-panel-content">
                {categoryTools.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 text-center text-farm-brown"
                  >
                    No tools in this category
                  </motion.div>
                ) : (
                  categoryTools.map(tool => (
                    <motion.div 
                      key={tool.id} 
                      className="p-4"
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "rgba(188, 170, 164, 0.1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="font-medium text-farm-brown-dark mb-2">{tool.name}</div>
                      
                      <div className="mb-2">
                        <label className="block text-xs text-farm-brown mb-1">
                          Subcategory
                        </label>
                        <select
                          value={tool.subcategory || ''}
                          onChange={(e) => handleUpdateToolCategory(
                            tool.id!, 
                            tool.category, 
                            e.target.value || undefined
                          )}
                          className="w-full p-2 text-sm border border-farm-brown-light rounded bg-white text-farm-brown-dark focus:border-farm-green"
                        >
                          <option value="">No subcategory</option>
                          {getSubcategoriesForCategory(category.name).map(subcategory => (
                            <option key={subcategory} value={subcategory}>
                              {subcategory}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUpdateToolCategory(tool.id!, undefined, undefined)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Remove from category
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default ToolOrganizerPage;