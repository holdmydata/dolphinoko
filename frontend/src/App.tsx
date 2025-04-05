import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToolProvider } from "./context/ToolContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CharacterProvider } from "./context/CharacterContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ModelSettingsProvider } from "./context/ModelSettingsContext";
import ElectronAppLayout from "./components/layout/ElectronAppLayout";
import Dashboard from "./pages/Dashboard";
import ToolBuilder from "./pages/ToolBuilder";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import ToolImproverPage from "./pages/ToolImproverPage";
import ToolOrganizerPage from "./pages/ToolOrganizerPage";
import IslandHome from "./pages/IslandHome";
import CharacterCreator from "./pages/CharacterCreator";
import ToolShed from "./pages/ToolShed";
import ModelSetupModal from "./components/modals/ModelSetupModal";
import DashboardOption1 from './pages/DashboardOption1';
import DashboardOption2 from './pages/DashboardOption2';
import DashboardOption3 from './pages/DashboardOption3';
import IndexPage from './pages/index';
import DashboardWorkflow from './pages/DashboardWorkflow';

// Application styles
import "./App.css";
import ToolMonitoring from "./pages/ToolMonitoring";
import { ConversationProvider } from "./context/ConversationContext";
import { useModelSettings } from "./context/ModelSettingsContext";

// Detect if running in Electron
const isElectronApp = () => {
  // In a real app, use: return window && window.process && window.process.type;
  // For this demo, check for a URL parameter or localStorage setting
  return window.location.search.includes('electron=true') || localStorage.getItem('useElectronUI') === 'true';
};

// Wrap application with model setup check
const AppWithModelSetup: React.FC = () => {
  const { modelSettings } = useModelSettings();
  const [showModelSetup, setShowModelSetup] = useState(!modelSettings.hasCompletedInitialSetup);
  
  // Update showModelSetup when modelSettings change
  useEffect(() => {
    setShowModelSetup(!modelSettings.hasCompletedInitialSetup);
  }, [modelSettings.hasCompletedInitialSetup]);
  
  return (
    <>
      <ModelSetupModal isOpen={showModelSetup} />
      <App />
    </>
  );
};

const App: React.FC = () => {
  const [isElectron, setIsElectron] = useState(isElectronApp());

  // Enable toggling Electron mode via localStorage for testing
  useEffect(() => {
    const checkElectronMode = () => {
      setIsElectron(isElectronApp());
    };
    
    window.addEventListener('storage', checkElectronMode);
    return () => window.removeEventListener('storage', checkElectronMode);
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ModelSettingsProvider>
          <ConversationProvider>
            <ToolProvider>
              <CharacterProvider>
                <Router>
                  <Routes>
                    <Route element={<ElectronAppLayout isElectron={isElectron} />}>
                      <Route path="/" element={<IndexPage />} />
                      <Route path="/tools" element={<ToolShed />} />
                      <Route path="/tools/:id" element={<ToolShed />} />
                      <Route path="/island-home" element={<IslandHome />} />
                      <Route path="/DashboardOption1" element={<DashboardOption1 />} />
                      <Route path="/DashboardOption2" element={<DashboardOption2 />} />
                      <Route path="/DashboardOption3" element={<DashboardOption3 />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/tools/new" element={<ToolBuilder />} />
                      <Route path="/tools/edit/:id" element={<ToolBuilder />} />
                      <Route path="/tools/improve/:id" element={<ToolImproverPage />} />
                      <Route path="/tools/organize" element={<ToolOrganizerPage />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/monitoring" element={<ToolMonitoring />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/character-creator" element={<CharacterCreator />} />
                      <Route path="/workflow" element={<DashboardWorkflow />} />
                    </Route>
                  </Routes>
                </Router>
              </CharacterProvider>
            </ToolProvider>
          </ConversationProvider>
        </ModelSettingsProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default function AppWrapper() {
  return (
    <ModelSettingsProvider>
      <AppWithModelSetup />
    </ModelSettingsProvider>
  );
}
