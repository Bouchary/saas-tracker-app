// client/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importation des composants des pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ContractForm from './pages/ContractForm';

// Importation des composants de structure
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    {/* Routes publiques pour l'authentification */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<LoginPage />} />
                    
                    {/* Route protégée pour la page d'accueil */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Route pour le formulaire de création de contrat */}
                    <Route
                        path="/contracts/new"
                        element={
                            <ProtectedRoute>
                                <ContractForm />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Route 404 pour les pages non trouvées */}
                    <Route 
                        path="*" 
                        element={
                            <div className="text-center text-xl mt-10">
                                404 - Page Non Trouvée
                            </div>
                        } 
                    />
                </Routes>
            </main>
        </>
    );
};

export default App;