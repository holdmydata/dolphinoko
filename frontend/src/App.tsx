import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToolProvider } from "./context/ToolContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CharacterProvider } from "./context/CharacterContext";
import { NotificationProvider } from "./context/NotificationContext";
import Sidebar from "./components/layout/Sidebar";
import Workspace from "./components/layout/Workspace";
import Dashboard from "./pages/Dashboard";
import ToolBuilder from "./pages/ToolBuilder";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import ToolImproverPage from "./pages/ToolImproverPage";
import ToolOrganizerPage from "./pages/ToolOrganizerPage";
import IslandHome from "./pages/IslandHome";
import CharacterCreator from "./pages/CharacterCreator";
import ToolShed from "./pages/ToolShed";

// Application styles
import "./App.css";
import ToolMonitoring from "./pages/ToolMonitoring";
import { ConversationProvider } from "./context/ConversationContext";

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // Default closed on mobile

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to close sidebar when clicking overlay
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ConversationProvider>
          <ToolProvider>
            <CharacterProvider>
              <Router>
                <div className="h-screen overflow-hidden bg-farm-wood-light text-farm-brown">
                  {/* Mobile Overlay - only visible on mobile when sidebar is open */}
                  {sidebarOpen && (
                    <div 
                      className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                      onClick={closeSidebar}
                    />
                  )}
                  
                  {/* Sidebar */}
                  <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

                  {/* Mobile Menu Button - visible only on mobile */}
                  <button
                    className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-farm-brown-light shadow-md hover:bg-farm-brown border border-farm-brown-dark"
                    onClick={toggleSidebar}
                  >
                    <svg className="w-6 h-6 text-farm-brown-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {sidebarOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>

                  {/* Main Content Container */}
                  <div className={`transition-all duration-300 h-full 
                    ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
                    <Workspace>
                      <Routes>
                        <Route path="/" element={<IslandHome />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tools" element={<ToolShed />} />
                        <Route path="/tools/new" element={<ToolBuilder />} />
                        <Route path="/tools/edit/:id" element={<ToolBuilder />} />
                        <Route path="/tools/improve/:id" element={<ToolImproverPage />} />
                        <Route path="/tools/organize" element={<ToolOrganizerPage />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/monitoring" element={<ToolMonitoring />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/character-creator" element={<CharacterCreator />} />
                      </Routes>
                    </Workspace>
                  </div>
                </div>
              </Router>
            </CharacterProvider>
          </ToolProvider>
        </ConversationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
