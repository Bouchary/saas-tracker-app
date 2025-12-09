// Fichier : saas-tracker-app/client/src/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    // État pour stocker l'utilisateur et le jeton
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('userToken'));
    const navigate = useNavigate();

    // Récupère l'état de la session au montage
    useEffect(() => {
        const storedToken = localStorage.getItem('userToken');
        if (storedToken) {
            setToken(storedToken);
            // Assure que l'objet utilisateur est chargé si le jeton existe
            setUser(JSON.parse(localStorage.getItem('user')) || { id: 'unknown' }); 
        }
    }, []);

    // -----------------------------------------------------------
    // FONCTION DE CONNEXION
    // -----------------------------------------------------------
    const login = (userData, userToken) => {
        // Met à jour l'état React
        setToken(userToken);
        setUser(userData);

        // Met à jour le stockage local
        localStorage.setItem('userToken', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // -----------------------------------------------------------
    // FONCTION DE DÉCONNEXION
    // -----------------------------------------------------------
    const logout = () => {
        // Efface l'état React
        setToken(null);
        setUser(null);

        // Efface le stockage local
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        
        // ✅ CORRECTION DÉFINITIVE : Redirige vers la route /login (définie dans App.jsx)
        navigate('/login'); 
    };

    const isAuthenticated = !!token;

    const value = {
        user,
        token,
        isAuthenticated,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};