// client/src/App.jsx

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Importation des composants des pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ContractForm from './pages/ContractForm';
import DashboardPage from './pages/DashboardPage';

// Importation des composants de structure
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const navigate = useNavigate();
    const [scrollToContract, setScrollToContract] = useState(null);

    // Fonction pour gérer le clic sur une notification
    const handleNotificationClick = (contractId) => {
        setScrollToContract(contractId);
        navigate('/');
    };

    return (
        <>
            <Header onNotificationClick={handleNotificationClick} />
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
                                <HomePage scrollToContract={scrollToContract} />
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
                    
                    {/* Route pour le dashboard analytique */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
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