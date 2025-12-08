// client/src/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// Crée le Contexte
const AuthContext = createContext();

// Hook personnalisé pour l'utiliser facilement
export const useAuth = () => {
  return useContext(AuthContext);
};

// Fournisseur de Contexte (Le composant qui enveloppe l'application)
export const AuthProvider = ({ children }) => {
  // 1. Initialise l'état à partir du LocalStorage
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // 2. Vérifie le LocalStorage au chargement initial
  useEffect(() => {
    if (token) {
      // Pour une application plus robuste, on pourrait ici valider le token auprès du backend.
      // Pour l'instant, on suppose que s'il y a un token, on est connecté.
      try {
        // Optionnel : décoder le token pour récupérer les infos utilisateur
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        
        // Simuler la récupération des infos utilisateur (ici, juste l'ID)
        setUser({ id: decoded.id }); 
      } catch (e) {
        console.error("Token JWT invalide ou expiré.", e);
        setToken(null);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, [token]);

  // Fonction de connexion : Stocke le token et met à jour l'état
  const login = (userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  // Fonction de déconnexion : Supprime le token et réinitialise l'état
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user, // Booleen: l'utilisateur est-il connecté ?
  };

  if (loading) {
      // Peut afficher un loader ou null si l'on attend que le LocalStorage soit vérifié
      return <div className="text-center p-8">Chargement de la session...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};