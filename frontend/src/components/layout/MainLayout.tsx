import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { CharacterProvider } from '../../context/CharacterContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <CharacterProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Mobile Menu Button - only visible on mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 border border-pink-200"
          onClick={toggleSidebar}
        >
          <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Mobile Overlay - only visible on mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main content with margin adjusted for sidebar */}
        <main className={`transition-all duration-300 flex-1 overflow-y-auto p-4
          ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
          {children}
        </main>
      </div>
    </CharacterProvider>
  );
};

export default MainLayout; 