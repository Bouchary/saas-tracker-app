import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ImportPage from './pages/ImportPage';
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
import ExtractionsHistoryPage from './pages/ExtractionsHistoryPage';
import Dashboard from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetFormPage from './pages/AssetFormPage';
import MyTasksPage from './pages/workflows/MyTasksPage';
import WorkflowsPage from './pages/workflows/WorkflowsPage';
import WorkflowDetailPage from './pages/workflows/WorkflowDetailPage';
import TemplatesPage from './pages/workflows/TemplatesPage';
import TemplateFormPage from './pages/workflows/TemplateFormPage';
import MDMDashboardPage from './pages/MDMDashboardPage';
import MDMDevicesListPage from './pages/MDMDevicesListPage';
import MDMDeviceDetailPage from './pages/MDMDeviceDetailPage';
import MDMAlertsPage from './pages/MDMAlertsPage';
import UsersPage from './pages/UsersPage';
import PurchaseRequestsListPage from './pages/PurchaseRequestsListPage';
import PurchaseRequestFormPage from './pages/PurchaseRequestFormPage';
import PurchaseRequestDetailPage from './pages/PurchaseRequestDetailPage';
import PurchaseRequestsToApprovePage from './pages/PurchaseRequestsToApprovePage';
import PurchaseApprovalRulesPage from './pages/PurchaseApprovalRulesPage';
import SearchResultsPage from './pages/SearchResultsPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrollToContract, setScrollToContract] = useState(null);

    const handleNotificationClick = (contractId) => {
        setScrollToContract(contractId);
        navigate('/contracts');
    };

    const publicPages = [
        '/', '/login', '/register', '/forgot-password',
        '/mentions-legales', '/cgu', '/privacy', '/cookies'
    ];
    const isPublicPage = publicPages.includes(location.pathname) || location.pathname.startsWith('/reset-password');

    return (
        <div className="flex">
            {!isPublicPage && <Sidebar />}
            <div className={!isPublicPage ? "flex-1 ml-64" : "w-full"}>
                {!isPublicPage && <Header onNotificationClick={handleNotificationClick} />}
                <main className={!isPublicPage ? "pt-16 px-4 py-8" : ""}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/mentions-legales" element={<MentionsLegales />} />
                        <Route path="/cgu" element={<CGU />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/cookies" element={<Cookies />} />
                        <Route path="/search" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
                        <Route path="/contracts" element={<ProtectedRoute><HomePage scrollToContract={scrollToContract} /></ProtectedRoute>} />
                        <Route path="/contracts/new" element={<ProtectedRoute><ContractFormPage /></ProtectedRoute>} />
                        <Route path="/contracts/:id/edit" element={<ProtectedRoute><ContractFormPage /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/dashboard-v2" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
                        <Route path="/optimization" element={<ProtectedRoute><OptimizationPage /></ProtectedRoute>} />
                        <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
                        <Route path="/extractions-history" element={<ProtectedRoute><ExtractionsHistoryPage /></ProtectedRoute>} />
                        <Route path="/mdm" element={<ProtectedRoute><MDMDashboardPage /></ProtectedRoute>} />
                        <Route path="/mdm/devices" element={<ProtectedRoute><MDMDevicesListPage /></ProtectedRoute>} />
                        <Route path="/mdm/devices/:id" element={<ProtectedRoute><MDMDeviceDetailPage /></ProtectedRoute>} />
                        <Route path="/mdm/alerts" element={<ProtectedRoute><MDMAlertsPage /></ProtectedRoute>} />
                        <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
                        <Route path="/employees/new" element={<ProtectedRoute><EmployeeFormPage /></ProtectedRoute>} />
                        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
                        <Route path="/employees/:id/edit" element={<ProtectedRoute><EmployeeFormPage /></ProtectedRoute>} />
                        <Route path="/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
                        <Route path="/assets/new" element={<ProtectedRoute><AssetFormPage /></ProtectedRoute>} />
                        <Route path="/assets/:id" element={<ProtectedRoute><AssetDetailPage /></ProtectedRoute>} />
                        <Route path="/assets/:id/edit" element={<ProtectedRoute><AssetFormPage /></ProtectedRoute>} />
                        <Route path="/workflows/my-tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
                        <Route path="/workflows/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
                        <Route path="/workflows/templates/new" element={<ProtectedRoute><TemplateFormPage /></ProtectedRoute>} />
                        <Route path="/workflows/templates/:id/edit" element={<ProtectedRoute><TemplateFormPage /></ProtectedRoute>} />
                        <Route path="/workflows/:id" element={<ProtectedRoute><WorkflowDetailPage /></ProtectedRoute>} />
                        <Route path="/workflows" element={<ProtectedRoute><WorkflowsPage /></ProtectedRoute>} />
                        <Route path="/purchase-requests" element={<ProtectedRoute><PurchaseRequestsListPage /></ProtectedRoute>} />
                        <Route path="/purchase-requests/new" element={<ProtectedRoute><PurchaseRequestFormPage /></ProtectedRoute>} />
                        <Route path="/purchase-requests/to-approve" element={<ProtectedRoute><PurchaseRequestsToApprovePage /></ProtectedRoute>} />
                        <Route path="/purchase-requests/:id" element={<ProtectedRoute><PurchaseRequestDetailPage /></ProtectedRoute>} />
                        <Route path="/purchase-requests/:id/edit" element={<ProtectedRoute><PurchaseRequestFormPage /></ProtectedRoute>} />
                        <Route path="/purchase-approval-rules" element={<ProtectedRoute><PurchaseApprovalRulesPage /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/contracts/:contractId/documents" element={<ProtectedRoute><ContractDocuments /></ProtectedRoute>} />
                        <Route path="*" element={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                                    <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
                                    <a href="/" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
                                        Retour à l'accueil
                                    </a>
                                </div>
                            </div>
                        } />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default App;