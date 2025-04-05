import React, { useState, useEffect, useContext, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import ResponsiveNavbar from './ResponsiveNavbar';
import { motion } from 'framer-motion';

// Create a context to share sidebar state across components
interface SidebarContextType {
  sidebarMode: 'hidden' | 'icon' | 'full';
  setSidebarMode: (mode: 'hidden' | 'icon' | 'full') => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  sidebarMode: 'full',
  setSidebarMode: () => {},
  isExpanded: false,
  setIsExpanded: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

interface ElectronAppLayoutProps {
  isElectron?: boolean;
}

const ElectronAppLayout: React.FC<ElectronAppLayoutProps> = ({ isElectron = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarMode, setSidebarMode] = useState<'hidden' | 'icon' | 'full'>('full');
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we're running in Electron
  useEffect(() => {
    // Mock Electron detection - in a real app, we'd use:
    // const isRunningInElectron = window && window.process && window.process.type;
    
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // Handle fullscreen toggle (would use Electron API in real app)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // In a real Electron app:
    // if (window.electron) {
    //   window.electron.toggleFullScreen();
    // }
  };

  // Calculate content margin based on sidebar state
  const getContentMargin = () => {
    if (isExpanded) {
      return 'ml-64'; // Full width sidebar when expanded
    }
    
    switch (sidebarMode) {
      case 'full':
        return 'ml-64'; // 16rem
      case 'icon':
        return 'ml-20'; // 5rem
      case 'hidden':
      default:
        return 'ml-0';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-farm-earth-light">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-6xl"
          >
            🌾
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-chubby text-farm-brown"
          >
            Dolphinoko Farm
          </motion.h1>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-4 relative h-2 w-48 bg-farm-earth-dark/20 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute top-0 left-0 h-full bg-farm-green rounded-full"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider value={{ sidebarMode, setSidebarMode, isExpanded, setIsExpanded }}>
      <div className={`flex h-screen flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Electron custom window title bar would go here in a real app */}
        {isElectron && (
          <div className="bg-farm-brown text-white flex items-center h-8 drag-region">
            <div className="ml-2 text-xs flex-1 logo-text">Dolphinoko Farm</div>
            <div className="flex">
              <button 
                onClick={toggleFullscreen}
                className="h-8 w-8 hover:bg-farm-brown-dark flex items-center justify-center"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v6m6-6v6M3 6h18M3 18h18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 12v-2a2 2 0 00-2-2h-2" />
                  )}
                </svg>
              </button>
              <button className="h-8 w-8 hover:bg-farm-brown-dark flex items-center justify-center" title="Minimize">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </button>
              <button className="h-8 w-8 hover:bg-red-600 flex items-center justify-center" title="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content with Responsive Navigation */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation sidebar handled by ResponsiveNavbar */}
          <ResponsiveNavbar standalone={isElectron} />
          
          {/* Main content area with dynamic margin based on sidebar state */}
          <main className={`flex-1 overflow-y-auto p-4 pt-6 md:p-6 transition-all duration-300 ${getContentMargin()}`}>
            {/* Offline warning */}
            {!isOnline && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-4 p-3 bg-farm-earth text-white rounded-lg shadow-md flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You're currently offline. Some features may be unavailable.</span>
              </motion.div>
            )}
            
            {/* Page content rendered via React Router */}
            <Outlet />
          </main>
        </div>

        {/* Status bar (Electron-only) */}
        {isElectron && (
          <div className="bg-farm-earth-light border-t border-farm-brown text-farm-brown h-6 px-2 flex items-center justify-between text-xs">
            <div className="flex items-center">
              <span className={`h-2 w-2 rounded-full mr-2 ${isOnline ? 'bg-farm-green' : 'bg-red-500'}`}></span>
              <span>{isOnline ? 'Connected' : 'Offline'}</span>
            </div>
            <div>Dolphinoko Farm v1.0</div>
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  );
};

export default ElectronAppLayout; 