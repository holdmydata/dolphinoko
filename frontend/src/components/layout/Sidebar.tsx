import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCharacter, Character } from "../../context/CharacterContext";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { characters } = useCharacter();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile on component mount and window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Update navLinks with farm theme icons
  const navLinks = [
    { to: "/", label: "Farm Home", icon: "🏡" },
    { to: "/character-creator", label: "Character Creator", icon: "🧸" },
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/tools", label: "Tool Shed", icon: "🔧" },
    { to: "/chat", label: "Farmer's Chat", icon: "💬" }
  ];

  // Display first 3 characters in the sidebar
  const displayedCharacters = characters.slice(0, 3);

  // Farm-themed expressions for characters
  const getRandomExpression = () => {
    const expressions = ['🌱', '🌾', '🌿', '🍃', '🌻'];
    return expressions[Math.floor(Math.random() * expressions.length)];
  };

  return (
    <aside className={`sidebar fixed h-screen transition-all duration-300 z-30 overflow-hidden flex flex-col
                     ${isOpen ? 'w-64 translate-x-0' : 'w-20 md:translate-x-0'} 
                     ${!isOpen && isMobile ? '-translate-x-full' : ''}
                     bg-farm-earth-light border-r border-farm-brown`}>
      
      {/* Toggle button for desktop - styled as a wooden post */}
      <button 
        onClick={toggleSidebar}
        className="hidden md:flex absolute bottom-20 right-0 z-10 p-1.5 rounded-l-md 
                   bg-farm-wood-light text-farm-brown border-farm-brown 
                   shadow-md hover:shadow-lg transition-all 
                   duration-200 hover:translate-x-0.5 active:translate-x-0 
                   border border-r-0 items-center justify-center"
        aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        style={{ width: "24px", height: "32px" }}
      >
        <svg className="w-4 h-4 text-farm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
          )}
        </svg>
      </button>
      
      {/* Header */}
      <div className="bg-farm-brown text-white flex items-center p-4 border-b border-farm-brown-dark">
        <div className="text-xl font-bold flex items-center">
          <span className="text-2xl mr-2">🌾</span>
          {isOpen && "Dolphinoko Farm"}
        </div>
      </div>
      
      {/* Characters section */}
      <div className="p-4 border-b border-farm-brown bg-farm-blue-light/20">
        {isOpen && (
          <h2 className="text-sm font-medium text-farm-brown mb-3 flex items-center">
            <span className="mr-2">🐄</span>Farm Friends
          </h2>
        )}
        
        <div className="flex flex-col space-y-3">
          {displayedCharacters.map((character: Character) => (
            <motion.div 
              key={character.id}
              className={`flex items-center rounded-lg transition-colors cursor-pointer relative
                ${isOpen ? 'p-2' : 'p-2 justify-center'}
                ${location.pathname === `/character/${character.id}` 
                  ? 'bg-farm-blue-light/50 border-l-4 border-farm-blue shadow-sm' 
                  : 'hover:bg-white/60'}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {!isOpen && location.pathname === `/character/${character.id}` && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-farm-blue rounded-r-full"></div>
              )}
              <motion.div 
                className={`w-10 h-10 min-w-[2.5rem] rounded-lg flex items-center justify-center overflow-hidden shadow-sm relative
                  ${location.pathname === `/character/${character.id}` ? 'ring-2 ring-farm-blue' : ''}`}
                style={{ 
                  backgroundColor: character.color,
                  borderRadius: location.pathname === `/character/${character.id}`
                    ? "50% 50% 50% 50% / 50% 50% 50% 50%"
                    : "30% 70% 70% 30% / 30% 30% 70% 70%"
                }}
                whileHover={{ 
                  scale: 1.1,
                  borderRadius: "40% 60% 60% 40% / 40% 40% 60% 60%" 
                }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-xl relative z-10">
                  {character.type === 'cat' ? '🐱' : 
                   character.type === 'dog' ? '🐶' :
                   character.type === 'bird' ? '🐦' :
                   character.type === 'rabbit' ? '🐰' :
                   character.type === 'fox' ? '🦊' :
                   character.type === 'bear' ? '🐻' : '🐾'}
                </span>
                <div className="absolute inset-0 bg-white opacity-10 rounded-full"></div>
              </motion.div>
              
              {isOpen && (
                <div className="ml-3">
                  <div className="text-sm font-medium text-farm-brown">{character.name}</div>
                  <div className="text-xs text-farm-earth flex items-center">
                    <span className="mr-1">{character.role}</span>
                    <span>{getRandomExpression()}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {isOpen && (
            <Link 
              to="/character-creator" 
              className="flex items-center justify-center p-2 mt-2 rounded-lg bg-farm-green-light/30 hover:bg-farm-green-light/50 border border-dashed border-farm-green text-farm-brown transition-colors"
            >
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-farm-green-light/50"
                style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
                whileHover={{ 
                  scale: 1.1, 
                  borderRadius: "40% 60% 60% 40% / 40% 40% 60% 60%" 
                }}
              >
                <span className="text-lg">+</span>
              </motion.div>
              <span className="text-sm ml-2">Plant New Friend</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {isOpen && (
          <h2 className="text-sm font-medium text-farm-brown mb-3 flex items-center">
            <span className="mr-2">🚜</span>Farm Navigation
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
                    ${isOpen ? 'p-2' : 'p-2 justify-center'}
                    ${isActive 
                      ? 'bg-farm-green-light/60 text-farm-brown-dark border-l-4 border-farm-green shadow-sm'
                      : 'hover:bg-farm-blue-light/30 text-farm-brown'
                    }`}
                  onClick={(e) => {
                    // If sidebar is closed and we're on mobile, toggle it open after navigation
                    if (!isOpen && isMobile) {
                      e.preventDefault(); // Prevent navigation
                      toggleSidebar(); // Open sidebar instead
                    }
                  }}
                >
                  {!isOpen && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-farm-green rounded-r-full"></div>
                  )}
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
                  {isOpen && <span className={`ml-3 ${isActive ? 'font-medium' : ''}`}>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-farm-brown">
        {isOpen ? (
          <div className="text-xs text-farm-brown text-center">
            <p>🌱 Dolphinoko Farm v1.0</p>
            <p className="mt-1">Grow your AI tools with care</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <motion.div
              className="w-8 h-8 flex items-center justify-center bg-farm-green-light/30"
              style={{ 
                borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" 
              }}
              animate={{ 
                borderRadius: [
                  "30% 70% 70% 30% / 30% 30% 70% 70%",
                  "40% 60% 60% 40% / 40% 40% 60% 60%",
                  "30% 70% 70% 30% / 30% 30% 70% 70%"
                ]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <span className="text-lg">🌱</span>
            </motion.div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;