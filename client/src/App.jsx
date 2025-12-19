// ============================================================================
// APP.JSX - COMPLET avec toutes les routes Workflows
// ============================================================================
// Fichier : client/src/App.jsx
// ============================================================================

import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Importation des composants des pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ContractFormPage from './pages/ContractForm';
import DashboardPage from './pages/DashboardPage';
import Profile from './pages/Profile';
import ContractDocuments from './pages/ContractDocuments';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MentionsLegales from './pages/MentionsLegales';
import CGU from './pages/CGU';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import OptimizationPage from './pages/OptimizationPage';

import Dashboard from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';

// 🆕 MODULE EMPLOYÉS (Phase 9)
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeeFormPage from './pages/EmployeeFormPage';

// 🆕 MODULE MATÉRIEL (Phase 10)
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetFormPage from './pages/AssetFormPage';

// 🆕 MODULE WORKFLOWS (Phase 12) - COMPLET
import MyTasksPage from './pages/workflows/MyTasksPage';
import WorkflowsPage from './pages/workflows/WorkflowsPage';
import WorkflowDetailPage from './pages/workflows/WorkflowDetailPage';
import TemplatesPage from './pages/workflows/TemplatesPage';
import TemplateFormPage from './pages/workflows/TemplateFormPage';

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
                                <ContractFormPage />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Routes Dashboard */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/dashboard-v2"
                        element={
                            <ProtectedRoute>
                                <DashboardV2 />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Route : Page Optimisation */}
                    <Route
                        path="/optimization"
                        element={
                            <ProtectedRoute>
                                <OptimizationPage />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* 🆕 ROUTES EMPLOYÉS (Phase 9) */}
                    <Route
                        path="/employees"
                        element={
                            <ProtectedRoute>
                                <EmployeesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees/new"
                        element={
                            <ProtectedRoute>
                                <EmployeeFormPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees/:id"
                        element={
                            <ProtectedRoute>
                                <EmployeeDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees/:id/edit"
                        element={
                            <ProtectedRoute>
                                <EmployeeFormPage />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* 🆕 ROUTES ASSETS (Phase 10) */}
                    <Route
                        path="/assets"
                        element={
                            <ProtectedRoute>
                                <AssetsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assets/new"
                        element={
                            <ProtectedRoute>
                                <AssetFormPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assets/:id"
                        element={
                            <ProtectedRoute>
                                <AssetDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assets/:id/edit"
                        element={
                            <ProtectedRoute>
                                <AssetFormPage />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* 🆕 ROUTES WORKFLOWS (Phase 12) - COMPLET */}
                    {/* Routes spécifiques AVANT les routes génériques */}
                    <Route
                        path="/workflows/my-tasks"
                        element={
                            <ProtectedRoute>
                                <MyTasksPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workflows/templates"
                        element={
                            <ProtectedRoute>
                                <TemplatesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workflows/templates/new"
                        element={
                            <ProtectedRoute>
                                <TemplateFormPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workflows/templates/:id/edit"
                        element={
                            <ProtectedRoute>
                                <TemplateFormPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workflows/:id"
                        element={
                            <ProtectedRoute>
                                <WorkflowDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/workflows"
                        element={
                            <ProtectedRoute>
                                <WorkflowsPage />
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