import React from 'react';

interface WorkspaceProps {
  children: React.ReactNode;
}

const Workspace: React.FC<WorkspaceProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-100">
      {children}
    </main>
  );
};

export default Workspace;