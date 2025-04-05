import React, { ReactNode } from 'react';
import ResponsiveNavbar from './ResponsiveNavbar';
import { CharacterProvider } from '../../context/CharacterContext';

interface MainLayoutProps {
  children: ReactNode;
  isElectron?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, isElectron = false }) => {
  return (
    <CharacterProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Responsive Navigation */}
        <ResponsiveNavbar standalone={isElectron} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 pt-6 md:p-6">
          {children}
        </main>
      </div>
    </CharacterProvider>
  );
};

export default MainLayout; 