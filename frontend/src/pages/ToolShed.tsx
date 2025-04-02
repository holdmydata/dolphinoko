import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tool } from '../context/ToolContext';
import { useTools } from '../hooks/useTools';
import { CATEGORIES } from '../types/categories';
import { motion, AnimatePresence } from 'framer-motion';

const ToolShed: React.FC = () => {
  const navigate = useNavigate();
  const { tools, loading, error, deleteTool } = useTools();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Reset subcategory filter when category changes
  useEffect(() => {
    setSubcategoryFilter(null);
  }, [categoryFilter]);

  // Filter tools based on category, subcategory, and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || tool.subcategory === subcategoryFilter;
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Group tools by category
  const toolsByCategory = filteredTools.reduce((acc, tool) => {
    const category = tool.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  // Navigate to tool builder for creating a new tool
  const handleCreateTool = () => {
    navigate('/tools/new');
  };

  // Navigate to tool builder for editing a tool
  const handleEditTool = (id: string) => {
    navigate(`/tools/edit/${id}`);
  };

  // Handle tool deletion
  const handleDeleteTool = async (id: string) => {
    try {
      await deleteTool(id);
      setShowConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting tool:', err);
    }
  };

  // Get available subcategories for the selected category
  const availableSubcategories = categoryFilter 
    ? CATEGORIES.find(c => c.name === categoryFilter)?.subcategories || []
    : [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05,
        when: "beforeChildren" 
      } 
    },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: { scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
    tap: { scale: 0.98 }
  };

  const growVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-6"
    >
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <motion.h1 
          className="text-3xl font-bold text-farm-brown-dark retro-text mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          <span className="text-2xl mr-2">🌾</span>
          Tool Shed
          <span className="text-2xl ml-2">🌾</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="mt-2 text-farm-brown">
          Tend to your custom AI tools in the farm's tool shed
        </motion.p>
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tool filters */}
        <motion.div 
          variants={itemVariants}
          className="col-span-1 farm-panel"
        >
          <div className="farm-panel-title">
            <span className="mr-2">🪴</span>
            Sort Your Tools
          </div>
          <div className="farm-panel-content p-4">
            {/* Search input */}
            <motion.div 
              variants={itemVariants}
              className="relative mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full px-3 py-2 pl-10 text-sm border border-farm-brown rounded-md focus:outline-none focus:ring-2 focus:ring-farm-green bg-white text-farm-brown"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
            </motion.div>
            
            {/* Category filters */}
            <motion.div variants={itemVariants} className="mb-5">
              <div className="text-sm font-medium text-farm-brown mb-3">Tool Categories</div>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors duration-200 farm-button ${
                    categoryFilter === null ? 'bg-farm-brown' : 'bg-farm-brown-light'
                  }`}
                  onClick={() => setCategoryFilter(null)}
                >
                  All
                </motion.button>
                
                {CATEGORIES.map(category => (
                  <motion.button
                    key={category.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors duration-200 farm-button ${
                      categoryFilter === category.name ? 'bg-farm-brown' : 'bg-farm-brown-light'
                    } flex items-center`}
                    onClick={() => setCategoryFilter(category.name)}
                  >
                    <span className="mr-1">{category.icon}</span> {category.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            {/* Subcategory filters - only when a category is selected */}
            <AnimatePresence>
              {categoryFilter && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="text-sm font-medium text-farm-brown mb-3">Tool Types</div>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors duration-200 farm-button ${
                        subcategoryFilter === null ? 'bg-farm-green' : 'bg-farm-green-light'
                      }`}
                      onClick={() => setSubcategoryFilter(null)}
                    >
                      All
                    </motion.button>
                    
                    {availableSubcategories.map(subcat => (
                      <motion.button
                        key={subcat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors duration-200 farm-button ${
                          subcategoryFilter === subcat ? 'bg-farm-green' : 'bg-farm-green-light'
                        }`}
                        onClick={() => setSubcategoryFilter(subcat)}
                      >
                        {subcat}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Create new tool button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTool}
              className="w-full mt-6 bg-farm-green hover:bg-farm-green-dark text-white py-3 px-4 font-medium rounded-md flex items-center justify-center border border-farm-green-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Plant New Tool
            </motion.button>
          </div>
        </motion.div>

        {/* Tool grid */}
        <div className="col-span-1 lg:col-span-3">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-40"
            >
              <motion.div 
                className="rounded-full h-10 w-10 border-b-2 border-farm-brown"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              ></motion.div>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="farm-panel"
            >
              <div className="bg-red-100 text-red-700 p-4 rounded-md">
                {error}
              </div>
            </motion.div>
          ) : filteredTools.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="farm-panel text-center"
            >
              <div className="farm-panel-content p-8">
                <motion.div 
                  className="text-6xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >🌱</motion.div>
                <h3 className="mt-4 text-lg font-medium text-farm-brown-dark">No tools found</h3>
                <p className="mt-2 text-farm-brown">
                  {searchQuery || categoryFilter || subcategoryFilter 
                    ? "Try adjusting your filters" 
                    : "Plant your first tool to get started"}
                </p>
                {(searchQuery || categoryFilter || subcategoryFilter) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter(null);
                      setSubcategoryFilter(null);
                    }}
                    className="mt-4 bg-farm-green-light hover:bg-farm-green text-farm-brown px-4 py-2 rounded-md border border-farm-green"
                  >
                    Reset filters
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : !categoryFilter && !searchQuery ? (
            // Category view
            <motion.div 
              variants={containerVariants}
              className="space-y-6"
            >
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <motion.div 
                  key={category}
                  variants={itemVariants}
                  className="farm-panel"
                >
                  <div className="farm-panel-title flex items-center">
                    <span className="mr-2 text-lg">
                      {CATEGORIES.find(c => c.name === category)?.icon || '🔧'}
                    </span>
                    {category}
                    <span className="ml-2 text-sm text-white/80">
                      ({categoryTools.length})
                    </span>
                  </div>
                  
                  <motion.div 
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 farm-panel-content"
                  >
                    {categoryTools.map(tool => (
                      <motion.div
                        key={tool.id}
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="border border-farm-brown rounded-md p-4 hover:shadow-md transition-shadow duration-200 bg-white"
                      >
                        <h4 className="font-medium text-farm-brown-dark text-lg flex items-center">
                          <span className="text-sm mr-2">🔧</span>
                          {tool.name}
                        </h4>
                        <p className="text-sm text-farm-brown mt-1 line-clamp-2">{tool.description}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tool.subcategory && (
                            <span className="bg-farm-green-light px-2 py-1 text-xs rounded-full text-farm-brown">
                              {tool.subcategory}
                            </span>
                          )}
                          <span className="bg-farm-blue-light px-2 py-1 text-xs rounded text-farm-brown">
                            {tool.model}
                          </span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-farm-brown-light flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditTool(tool.id!)}
                            className="bg-farm-blue-light hover:bg-farm-blue text-farm-brown text-xs flex items-center px-2 py-1 rounded border border-farm-blue"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowConfirmDelete(tool.id!)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 text-xs flex items-center px-2 py-1 rounded border border-red-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Grid view for filtered results
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTools.map(tool => (
                <motion.div
                  key={tool.id}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="farm-panel"
                >
                  <div className="p-4 farm-panel-content">
                    {tool.category && (
                      <div className="flex items-center mb-2">
                        <span className="mr-1 text-sm">{CATEGORIES.find(c => c.name === tool.category)?.icon || '🔧'}</span>
                        <span className="text-xs text-farm-brown">{tool.category}</span>
                        {tool.subcategory && (
                          <span className="mx-1 text-farm-brown-light">•</span>
                        )}
                        {tool.subcategory && (
                          <span className="text-xs text-farm-brown">{tool.subcategory}</span>
                        )}
                      </div>
                    )}
                    
                    <h4 className="font-medium text-farm-brown-dark text-lg">{tool.name}</h4>
                    <p className="text-sm text-farm-brown mt-1 mb-4 line-clamp-3">{tool.description}</p>
                    
                    <div className="bg-farm-blue-light px-2 py-1 rounded text-xs text-farm-brown inline-block border border-farm-blue-dark/20">
                      {tool.model}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-farm-brown-light flex justify-between">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditTool(tool.id!)}
                        className="bg-farm-blue-light hover:bg-farm-blue text-farm-brown text-xs flex items-center px-2 py-1 rounded border border-farm-blue"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowConfirmDelete(tool.id!)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs flex items-center px-2 py-1 rounded border border-red-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="farm-panel max-w-md w-full"
            >
              <div className="farm-panel-title flex items-center">
                <motion.span 
                  animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="mr-2"
                >⚠️</motion.span>
                Confirm Delete
              </div>
              <div className="farm-panel-content p-5">
                <p className="text-farm-brown mb-6">
                  Are you sure you want to delete this tool? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowConfirmDelete(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-farm-brown px-4 py-2 rounded-md border border-gray-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteTool(showConfirmDelete)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ToolShed;
