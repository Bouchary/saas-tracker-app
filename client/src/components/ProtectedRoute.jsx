// client/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Afficher un loader le temps de vérifier le token
  if (loading) {
    return <div className="text-center p-8">Vérification de la session...</div>;
  }

  // Rediriger vers la page d'authentification si non connecté
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si connecté, afficher le composant enfant
  return children;
};

export default ProtectedRoute;