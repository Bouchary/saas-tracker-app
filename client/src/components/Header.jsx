import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Search, User, Settings, ChevronDown } from 'lucide-react';
import Notifications from './Notifications';

const Header = ({ onNotificationClick }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);
  const adminRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target)) {
        setAdminOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user && ['owner', 'admin', 'super_admin'].includes(user.role);

  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-30">
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher contrats, employés, matériel..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>
      </div>
      
      <div className="flex items-center space-x-4 ml-auto">
        {isAuthenticated && (
          <>
            <Notifications onContractClick={onNotificationClick} />
            
            {isAdmin && (
              <div className="relative" ref={adminRef}>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-700 font-medium">Admin</span>
                  <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      to="/users"
                      className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                      onClick={() => setAdminOpen(false)}
                    >
                      Utilisateurs
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <User className="w-5 h-5 text-gray-700" />
                <span className="text-gray-700 font-medium">{user?.email?.split('@')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    onClick={() => setProfileOpen(false)}
                  >
                    Mon profil
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;