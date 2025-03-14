import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToolProvider } from "./context/ToolContext";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Workspace from "./components/layout/Workspace";
import Dashboard from "./pages/Dashboard";
import ToolBuilder from "./pages/ToolBuilder";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";

// Application styles
import "./App.css";
import ToolMonitoring from "./pages/ToolMonitoring";

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ThemeProvider>
      <ToolProvider>
        <Router>
          <div className="flex h-screen bg-gray-100 text-gray-800">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

              <Workspace>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tools" element={<ToolBuilder />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/monitoring" element={<ToolMonitoring />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Workspace>
            </div>
          </div>
        </Router>
      </ToolProvider>
    </ThemeProvider>
  );
};

export default App;
