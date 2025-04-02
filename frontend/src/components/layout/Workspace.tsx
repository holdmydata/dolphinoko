import React from 'react';

interface WorkspaceProps {
  children: React.ReactNode;
}

const Workspace: React.FC<WorkspaceProps> = ({ children }) => {
  return (
    <main className="w-full h-full overflow-auto bg-farm-wood-light transition-colors duration-200 pt-14 md:pt-4">
      <div className="p-4 md:p-6 h-full">
        {children}
      </div>
    </main>
  );
};

export default Workspace;