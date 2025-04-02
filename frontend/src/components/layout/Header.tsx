import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-farm-brown text-white border-b border-farm-brown-dark z-30 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <button
              onClick={toggleSidebar}
              className="text-white focus:outline-none focus:text-farm-brown-light lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
            <div className="ml-4 lg:ml-0 flex items-center">
              <div className="font-bold text-xl text-white flex items-center">
                <span className="h-8 w-8 mr-2 text-2xl">🌾</span>
                Dolphinoko Farm
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Link
              to="/tools/new"
              className="bg-farm-green-light text-farm-brown-dark hover:bg-farm-green px-3 py-1.5 rounded-md text-sm flex items-center transition-colors shadow-sm border border-farm-green"
            >
              <span className="mr-1.5 text-xl">🌱</span>
              <span>Plant New Tool</span>
            </Link>
            
            <div className="ml-4 relative flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-farm-earth flex items-center justify-center text-white border border-farm-earth-dark">
                <span className="text-lg">🧑‍🌾</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;