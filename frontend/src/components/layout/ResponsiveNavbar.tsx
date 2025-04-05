import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCharacter, Character } from "../../context/CharacterContext";
import { useSidebar } from "./ElectronAppLayout";

interface ResponsiveNavbarProps {
  standalone?: boolean; // For Electron mode
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({ standalone = false }) => {
  const location = useLocation();
  const { characters } = useCharacter();
  const [isMobile, setIsMobile] = useState(false);
  
  // Use the shared sidebar context if available, otherwise use local state
  let sidebarContext;
  try {
    sidebarContext = useSidebar();
  } catch (e) {
    // Context not available, will use local state
  }
  
  // Initialize state with either the context values or defaults
  const [localSidebarMode, setLocalSidebarMode] = useState<'hidden' | 'icon' | 'full'>('full');
  const [localExpanded, setLocalExpanded] = useState(false);
  
  // Use either the context values or local state
  const sidebarMode = sidebarContext?.sidebarMode || localSidebarMode;
  const setSidebarMode = sidebarContext?.setSidebarMode || setLocalSidebarMode;
  const isExpanded = sidebarContext?.isExpanded || localExpanded;
  const setIsExpanded = sidebarContext?.setIsExpanded || setLocalExpanded;
  
  // Check viewport size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // Set sidebar mode based on window width - just two states now: full or icon
      if (width < 768) {
        setSidebarMode('hidden');
      } else if (width < 1024) {
        setSidebarMode('icon');
      } else {
        setSidebarMode('full');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarMode]);

  // Navigation links
  const navLinks = [
    { to: "/", label: "Home", icon: "🏡" },
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/tools", label: "Tools", icon: "🔧" },
    { to: "/chat", label: "Chat", icon: "💬" },
    { to: "/character-creator", label: "Characters", icon: "🧸" }
  ];

  // Get emoji for character type
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

  // Display first 3 characters for quick access
  const displayedCharacters = characters.slice(0, 3);

  // Animation variants
  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 40 } }
  };

  const bottomNavVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 40 } }
  };

  // Manually toggle sidebar - simplified to just two states
  const toggleSidebar = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    } else {
      // On desktop, toggle between full and icon modes only
      setSidebarMode(sidebarMode === 'full' ? 'icon' : 'full');
    }
  };

  // Electron window controls (only in standalone mode)
  const renderWindowControls = () => {
    if (!standalone) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <button className="w-3 h-3 rounded-full bg-red-500" title="Close"></button>
        <button className="w-3 h-3 rounded-full bg-yellow-500" title="Minimize"></button>
        <button className="w-3 h-3 rounded-full bg-green-500" title="Maximize"></button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {(sidebarMode !== 'hidden' || isExpanded) && (
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`fixed top-0 left-0 h-screen z-40 bg-farm-earth-light border-r border-farm-brown shadow-lg
              ${sidebarMode === 'full' || isExpanded ? 'w-64' : 'w-20'}`}
          >
            {/* Sidebar Header with Electron window controls */}
            <div className="bg-farm-brown text-white flex items-center justify-between p-4 border-b border-farm-brown-dark">
              {renderWindowControls()}
              <div 
                className="text-xl font-bold flex items-center cursor-pointer" 
                onClick={toggleSidebar}
                title="Toggle sidebar"
              >
                <span className="text-2xl mr-2">🌾</span>
                {(sidebarMode === 'full' || isExpanded) && (
                  <span className="logo-text text-xl tracking-wide">Dolphinoko</span>
                )}
              </div>
              
              {/* Mobile close button - only show on mobile when expanded */}
              {isMobile && isExpanded && (
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:text-farm-earth-light"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Characters section */}
            <div className="p-4 border-b border-farm-brown bg-farm-blue-light/20">
              {(sidebarMode === 'full' || isExpanded) && (
                <h2 className="text-sm font-medium text-farm-brown-dark mb-3 flex items-center">
                  <span className="mr-2">🐄</span>Farm Friends
                </h2>
              )}
              
              <div className={`flex ${(sidebarMode === 'full' || isExpanded) ? 'flex-col space-y-3' : 'flex-col items-center space-y-4'}`}>
                {displayedCharacters.map((character: Character) => (
                  <motion.div 
                    key={character.id}
                    className={`flex items-center rounded-lg transition-colors cursor-pointer relative
                      ${(sidebarMode === 'full' || isExpanded) ? 'p-2' : 'p-2 justify-center'}
                      ${location.pathname === `/character/${character.id}` 
                        ? 'bg-farm-blue-light/50 border-l-4 border-farm-blue shadow-sm' 
                        : 'hover:bg-white/60'}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className={`w-10 h-10 min-w-[2.5rem] rounded-lg flex items-center justify-center overflow-hidden shadow-sm relative
                        ${location.pathname === `/character/${character.id}` ? 'ring-2 ring-farm-blue' : ''}`}
                      style={{ 
                        backgroundColor: character.color,
                        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
                      }}
                      whileHover={{ 
                        scale: 1.1,
                        borderRadius: "40% 60% 60% 40% / 40% 40% 60% 60%" 
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="text-xl">{getCharacterEmoji(character.type)}</span>
                    </motion.div>
                    
                    {(sidebarMode === 'full' || isExpanded) && (
                      <div className="ml-3">
                        <div className="text-sm font-medium text-farm-brown-dark">{character.name}</div>
                        <div className="text-xs text-farm-brown">{character.role}</div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 overflow-y-auto">
              {(sidebarMode === 'full' || isExpanded) && (
                <h2 className="text-sm font-medium text-farm-brown-dark mb-3 flex items-center">
                  <span className="mr-2">🚜</span>Navigation
                </h2>
              )}
              
              <ul className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className={`flex items-center rounded-lg transition-colors relative
                          ${(sidebarMode === 'full' || isExpanded) ? 'p-2' : 'p-2 justify-center'}
                          ${isActive 
                            ? 'bg-farm-green-light/60 text-farm-brown-dark border-l-4 border-farm-green shadow-sm'
                            : 'hover:bg-farm-blue-light/30 text-farm-brown'
                          }`}
                      >
                        <motion.div
                          className={`w-8 h-8 min-w-[2rem] flex items-center justify-center overflow-hidden ${
                            isActive 
                              ? 'bg-farm-green shadow-inner' 
                              : 'bg-farm-brown-light/30'
                          }`}
                          style={{ 
                            borderRadius: isActive 
                              ? "50% 50% 50% 50% / 50% 50% 50% 50%" 
                              : "30% 70% 70% 30% / 30% 30% 70% 70%" 
                          }}
                          whileHover={{
                            scale: 1.1, 
                            borderRadius: "40% 60% 60% 40% / 40% 40% 60% 60%"
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className={`${isActive ? 'text-white' : ''} text-lg`}>{link.icon}</span>
                        </motion.div>
                        {(sidebarMode === 'full' || isExpanded) && <span className={`ml-3 ${isActive ? 'font-medium' : ''}`}>{link.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-farm-brown">
              {(sidebarMode === 'full' || isExpanded) ? (
                <div className="text-xs text-farm-brown text-center">
                  <p className="text-chubby text-sm">🌱 Dolphinoko Farm v1.0</p>
                  <p className="mt-1">Grow your AI tools with care</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <motion.div
                    className="w-8 h-8 flex items-center justify-center bg-farm-green-light/30"
                    style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
                    animate={{ 
                      borderRadius: [
                        "30% 70% 70% 30% / 30% 30% 70% 70%",
                        "40% 60% 60% 40% / 40% 40% 60% 60%",
                        "30% 70% 70% 30% / 30% 30% 70% 70%"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-lg">🌱</span>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.nav
          variants={bottomNavVariants}
          initial="hidden"
          animate="visible"
          className="fixed bottom-0 left-0 right-0 bg-farm-earth-light border-t border-farm-brown z-40 pb-safe" // pb-safe for iPhone notch
        >
          <div className="flex justify-around items-center h-16">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex flex-col items-center justify-center px-3 py-2 rounded-lg"
                >
                  <motion.div
                    className={`w-10 h-10 flex items-center justify-center ${
                      isActive ? 'bg-farm-green text-white' : 'bg-farm-brown-light/30 text-farm-brown'
                    }`}
                    style={{ 
                      borderRadius: isActive 
                        ? "50% 50% 50% 50% / 50% 50% 50% 50%" 
                        : "30% 70% 70% 30% / 30% 30% 70% 70%" 
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-lg">{link.icon}</span>
                  </motion.div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-medium text-farm-brown-dark' : 'text-farm-brown'}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Toggle sidebar button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="flex flex-col items-center justify-center px-3 py-2 rounded-lg"
            >
              <motion.div
                className="w-10 h-10 flex items-center justify-center bg-farm-brown-light/30 text-farm-brown"
                style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.div>
              <span className="text-xs mt-1 text-farm-brown">Menu</span>
            </button>
          </div>
        </motion.nav>
      )}

      {/* Backdrop for mobile sidebar */}
      {isMobile && isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default ResponsiveNavbar; 