// client/src/pages/ContractDocuments.jsx
// Version MODERNE avec design amélioré - LOGIQUE ORIGINALE CONSERVÉE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, BarChart3, HardDrive } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';

const ContractDocuments = () => {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    // ✅ ÉTATS ORIGINAUX CONSERVÉS
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ✅ USEEFFECT ORIGINAL CONSERVÉ
    useEffect(() => {
        const fetchContract = async () => {
            try {
                const response = await fetch(`${API_URL}/api/contracts/${contractId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setContract(data);
                } else {
                    navigate('/contracts');
                }
            } catch (error) {
                console.error('Erreur chargement contrat:', error);
                navigate('/contracts');
            } finally {
                setLoading(false);
            }
        };

        fetchContract();
    }, [contractId, token, navigate]);

    // ✅ CALLBACK ORIGINAL CONSERVÉ
    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // ✨ LOADING STATE MODERNISÉ
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Chargement du contrat...</p>
                </div>
            </div>
        );
    }

    if (!contract) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* ✨ HEADER MODERNE AVEC GRADIENT */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-6xl">
                    <Link
                        to="/contracts"
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 font-medium transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retour aux contrats
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Documents du Contrat</h1>
                    <p className="text-indigo-100 text-lg">Gérez vos fichiers et documents</p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-6xl">
                {/* ✨ CARTE INFOS CONTRAT MODERNISÉE */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8 -mt-16">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                {contract.name}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {contract.provider && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                        <span className="text-sm">Fournisseur : <span className="font-semibold text-gray-900">{contract.provider}</span></span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span className="text-sm">Coût : <span className="font-semibold text-gray-900">{contract.monthly_cost} €/mois</span></span>
                                </div>
                                {contract.renewal_date && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                                        <span className="text-sm">Renouvellement : <span className="font-semibold text-gray-900">{new Date(contract.renewal_date).toLocaleDateString('fr-FR')}</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✨ GRILLE MODERNISÉE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    
                    {/* ✨ ZONE UPLOAD MODERNISÉE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Ajouter des Documents</h3>
                        </div>
                        <DocumentUpload 
                            contractId={contractId} 
                            onUploadSuccess={handleUploadSuccess}
                        />
                    </div>

                    {/* ✨ STATISTIQUES MODERNISÉES */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Statistiques</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Stat 1 */}
                            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Contrats uploadés</p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                            -
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Stat 2 */}
                            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Factures uploadées</p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                            -
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Stat 3 */}
                            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Espace utilisé</p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                            - MB
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                                        <HardDrive className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info bulle */}
                        <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <p className="text-xs text-indigo-700 flex items-start gap-2">
                                <span className="text-base">💡</span>
                                <span>Les statistiques seront disponibles après avoir uploadé des documents</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✨ LISTE DOCUMENTS MODERNISÉE */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Tous les Documents</h3>
                    </div>
                    <DocumentList 
                        contractId={contractId} 
                        refreshTrigger={refreshTrigger}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContractDocuments;