// client/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Rediriger vers la page de connexion si non connecté
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si connecté, afficher le composant enfant
  return children;
};

export default ProtectedRoute;