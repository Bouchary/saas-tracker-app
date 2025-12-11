// client/src/App.jsx

import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Importation des composants des pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ContractForm from './pages/ContractForm';
import DashboardPage from './pages/DashboardPage';
import Profile from './pages/Profile';
import ContractDocuments from './pages/ContractDocuments';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MentionsLegales from './pages/MentionsLegales';
import CGU from './pages/CGU';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';

// Importation des composants de structure
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrollToContract, setScrollToContract] = useState(null);

    // Fonction pour gérer le clic sur une notification
    const handleNotificationClick = (contractId) => {
        setScrollToContract(contractId);
        navigate('/contracts');
    };

    // Pages publiques où le Header ne doit PAS s'afficher
    const publicPages = [
        '/', 
        '/login', 
        '/register', 
        '/forgot-password',
        '/mentions-legales',
        '/cgu',
        '/privacy',
        '/cookies'
    ];
    const isPublicPage = publicPages.includes(location.pathname) || location.pathname.startsWith('/reset-password');

    return (
        <>
            {/* Header s'affiche seulement sur les pages protégées */}
            {!isPublicPage && <Header onNotificationClick={handleNotificationClick} />}
            
            <main className={!isPublicPage ? "container mx-auto px-4 py-8" : ""}>
                <Routes>
                    {/* Route publique : Landing Page */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Routes publiques pour l'authentification */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    
                    {/* Routes publiques : Pages légales */}
                    <Route path="/mentions-legales" element={<MentionsLegales />} />
                    <Route path="/cgu" element={<CGU />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cookies" element={<Cookies />} />
                    
                    {/* Route protégée pour la liste des contrats (ancienne HomePage) */}
                    <Route
                        path="/contracts"
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
                    
                    {/* Route pour le profil utilisateur */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Route pour les documents d'un contrat */}
                    <Route 
                        path="/contracts/:contractId/documents" 
                        element={
                            <ProtectedRoute>
                                <ContractDocuments />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Route 404 pour les pages non trouvées */}
                    <Route 
                        path="*" 
                        element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                                    <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
                                    <a 
                                        href="/"
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                                    >
                                        Retour à l'accueil
                                    </a>
                                </div>
                            </div>
                        } 
                    />
                </Routes>
            </main>
        </>
    );
};

export default App;