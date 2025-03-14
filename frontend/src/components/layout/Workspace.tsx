import React from 'react';

interface WorkspaceProps {
  children: React.ReactNode;
}

const Workspace: React.FC<WorkspaceProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {children}
    </main>
  );
};

export default Workspace;