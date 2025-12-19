// ============================================================================
// HEADER - COMPLET avec menu déroulant Workflows
// ============================================================================
// Fichier : client/src/components/Header.jsx
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  LayoutDashboard, User, Lightbulb, Users, Package, BarChart3, 
  GitBranch, FileText, List, ChevronDown
} from 'lucide-react';
import Notifications from './Notifications';

const Header = ({ onNotificationClick }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workflowsMenuOpen, setWorkflowsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWorkflowsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setWorkflowsMenuOpen(false);
  }, [location]);

  const isWorkflowsActive = location.pathname.startsWith('/workflows');

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link 
          to="/contracts" 
          className="text-2xl font-bold text-gray-800 hover:text-indigo-600 transition duration-300 flex items-center space-x-2"
        >
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          <span>SaaS Tracker</span> 
        </Link>
        
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link 
                to="/contracts" 
                className="text-gray-700 hover:text-indigo-600 font-medium transition duration-300"
              >
                Contrats
              </Link>
            </li>
            
            <li>
              <button 
                onClick={() => navigate('/dashboard-v2')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard 360°
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard Analytics
              </button>
            </li>
            
            <li>
              <Link 
                to="/optimization" 
                className="text-gray-700 hover:text-indigo-600 font-medium transition duration-300 flex items-center gap-1"
              >
                <Lightbulb className="w-4 h-4" />
                Optimisation
              </Link>
            </li>
            
            <li>
              <Link 
                to="/employees" 
                className="text-gray-700 hover:text-indigo-600 font-medium transition duration-300 flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Employés
              </Link>
            </li>
            
            <li>
              <Link 
                to="/assets" 
                className="text-gray-700 hover:text-indigo-600 font-medium transition duration-300 flex items-center gap-1"
              >
                <Package className="w-4 h-4" />
                Matériel
              </Link>
            </li>
            
            {/* 🆕 MENU DÉROULANT WORKFLOWS */}
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={() => setWorkflowsMenuOpen(!workflowsMenuOpen)}
                className={`flex items-center gap-1 font-medium transition duration-300 ${
                  isWorkflowsActive 
                    ? 'text-indigo-600' 
                    : 'text-gray-700 hover:text-indigo-600'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                Workflows
                <ChevronDown className={`w-4 h-4 transition-transform ${workflowsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {workflowsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/workflows/my-tasks"
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <List className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Mes tâches</p>
                      <p className="text-xs text-gray-500">Tâches assignées</p>
                    </div>
                  </Link>

                  <Link
                    to="/workflows"
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Tous les workflows</p>
                      <p className="text-xs text-gray-500">Vue d'ensemble</p>
                    </div>
                  </Link>

                  <div className="border-t border-gray-200 my-2"></div>

                  <Link
                    to="/workflows/templates"
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Templates</p>
                      <p className="text-xs text-gray-500">Gérer les modèles</p>
                    </div>
                  </Link>
                </div>
              )}
            </li>
            
            {isAuthenticated && (
              <>
                <li>
                  <Notifications onContractClick={onNotificationClick} />
                </li>
                
                <li>
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium transition duration-300 px-3 py-2 rounded-lg hover:bg-indigo-50"
                  >
                    <User className="w-4 h-4" />
                    Profil
                  </Link>
                </li>
                
                <li>
                  <button 
                    onClick={handleLogout} 
                    className="text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition duration-300"
                  >
                    Déconnexion
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;