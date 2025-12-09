// client/src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, logout } = useAuth(); 

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-indigo-600 transition duration-300 flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            <span>SaaS Tracker</span> 
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link 
                to="/" 
                className="text-gray-700 hover:text-indigo-600 font-medium transition duration-300"
              >
                Tableau de Bord
              </Link>
            </li>
            <li>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-300 shadow-md font-medium text-sm"
                >
                  Déconnexion
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md font-medium text-sm"
                >
                  Connexion
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;