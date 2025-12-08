// client/src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-800 transition duration-300">
          SaaS Tracker 📊
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
            {/* L'item de connexion/profil sera ajouté plus tard */}
            {/* <li>
              <Link 
                to="/login" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
              >
                Connexion
              </Link>
            </li> */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;