// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { CATEGORIES } from '../types/categories';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tools } = useTools();
  const [recentTools, setRecentTools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTools: 0,
    categories: 0,
    recentlyCreated: 0
  });

  // Get tool stats on load
  useEffect(() => {
    if (tools.length > 0) {
      // Get unique categories
      const uniqueCategories = new Set(tools.map(tool => tool.category).filter(Boolean));
      
      // Get recently created tools (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recent = tools
        .filter(tool => {
          if (!tool.created_at) return false;
          const createdDate = new Date(tool.created_at);
          return createdDate > oneWeekAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
      
      // Update stats
      setStats({
        totalTools: tools.length,
        categories: uniqueCategories.size,
        recentlyCreated: recent.length
      });
      
      // Set recent tools (last 3)
      setRecentTools(recent.slice(0, 3));
    }
  }, [tools]);

  // Category colors for the farm theme
  const getCategoryColor = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Development': 'bg-farm-green',
      'Productivity': 'bg-farm-blue',
      'Data': 'bg-farm-wood',
      'Content': 'bg-farm-brown',
      'Entertainment': 'bg-farm-brown-light'
    };
    
    return categoryMap[category] || 'bg-farm-earth';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-farm-brown-dark retro-text mb-2">
          <span className="text-2xl mr-2">🌾</span>
          Dolphinoko Farm
          <span className="text-2xl ml-2">🌾</span>
        </h1>
        <p className="mt-2 text-farm-brown">
          Tend to your AI tools and watch them grow!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="farm-panel text-center">
          <div className="farm-panel-title">
            <span className="mr-2">🧰</span>
            Tool Count
          </div>
          <div className="farm-panel-content p-6">
            <div className="text-4xl font-bold text-farm-brown-dark">{stats.totalTools}</div>
            <div className="text-sm text-farm-brown mt-2">Total tools planted</div>
          </div>
        </div>

        <div className="farm-panel text-center">
          <div className="farm-panel-title">
            <span className="mr-2">🌱</span>
            Recent Sprouts
          </div>
          <div className="farm-panel-content p-6">
            <div className="text-4xl font-bold text-farm-green-dark">{stats.recentlyCreated}</div>
            <div className="text-sm text-farm-brown mt-2">New tools this week</div>
          </div>
        </div>

        <div className="farm-panel text-center">
          <div className="farm-panel-title">
            <span className="mr-2">🗂️</span>
            Categories
          </div>
          <div className="farm-panel-content p-6">
            <div className="text-4xl font-bold text-farm-blue-dark">{stats.categories}</div>
            <div className="text-sm text-farm-brown mt-2">Types of tools</div>
          </div>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="farm-panel mb-8">
        <div className="farm-panel-title">
          <span className="mr-2">🌻</span>
          Tool Garden
        </div>
        <div className="farm-panel-content p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map(category => {
              const categoryTools = tools.filter(tool => tool.category === category.name);
              return (
                <div
                  key={category.name}
                  className="relative border border-farm-brown rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-all duration-200 bg-white"
                  onClick={() => navigate('/tools', { state: { categoryFilter: category.name } })}
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-farm-brown-dark">{category.name}</h3>
                  <div className="text-sm text-farm-brown mt-1">{categoryTools.length} tools</div>
                  <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-farm-brown text-white text-xs rounded-full">
                    {categoryTools.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tools and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="farm-panel md:col-span-2">
          <div className="farm-panel-title">
            <span className="mr-2">🌿</span>
            Recently Planted Tools
          </div>
          <div className="farm-panel-content">
            {recentTools.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-farm-brown">No tools planted yet!</p>
                <button 
                  onClick={() => navigate('/tools/new')}
                  className="mt-4 bg-farm-green-light hover:bg-farm-green text-farm-brown px-4 py-2 rounded-md border border-farm-green"
                >
                  Plant Your First Tool
                </button>
              </div>
            ) : (
              <div className="divide-y divide-farm-brown-light">
                {recentTools.map(tool => (
                  <div 
                    key={tool.id} 
                    className="p-4 flex items-center hover:bg-farm-brown-light/10 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tools/edit/${tool.id}`)}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white ${getCategoryColor(tool.category)}`}>
                      <span className="text-lg">
                        {CATEGORIES.find(c => c.name === tool.category)?.icon || '🔧'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium text-farm-brown-dark">{tool.name}</h4>
                      <p className="text-sm text-farm-brown line-clamp-1">{tool.description}</p>
                    </div>
                    <div className="text-xs text-farm-brown-light">
                      {tool.created_at ? new Date(tool.created_at).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                ))}
                <div className="p-4 text-center">
                  <button 
                    onClick={() => navigate('/tools')}
                    className="bg-farm-brown-light hover:bg-farm-brown text-farm-brown-dark px-4 py-2 rounded-md border border-farm-brown"
                  >
                    View All Tools
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="farm-panel">
          <div className="farm-panel-title">
            <span className="mr-2">🚀</span>
            Quick Actions
          </div>
          <div className="farm-panel-content p-4">
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/tools/new')}
                className="w-full bg-farm-green hover:bg-farm-green-dark text-white py-3 px-4 font-medium rounded-md flex items-center justify-between border border-farm-green-dark transition-colors"
              >
                <span className="flex items-center">
                  <span className="text-xl mr-2">🌱</span>
                  Plant New Tool
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <button 
                onClick={() => navigate('/tools/organize')}
                className="w-full bg-farm-blue-light hover:bg-farm-blue text-farm-brown-dark py-3 px-4 font-medium rounded-md flex items-center justify-between border border-farm-blue transition-colors"
              >
                <span className="flex items-center">
                  <span className="text-xl mr-2">🗂️</span>
                  Organize Tools
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <button 
                onClick={() => navigate('/chat')}
                className="w-full bg-farm-brown-light hover:bg-farm-brown text-farm-brown-dark py-3 px-4 font-medium rounded-md flex items-center justify-between border border-farm-brown transition-colors"
              >
                <span className="flex items-center">
                  <span className="text-xl mr-2">💬</span>
                  Farm Chat
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;