// client/src/pages/ContractDocuments.jsx
// Version FINALE avec TOUS LES TYPES DE DOCUMENTS (11 types)
// ✅ Stats complètes avec icônes lucide-react

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, FileText, Upload, BarChart3, HardDrive,
    FileCheck, TrendingUp, Shield, CreditCard, Mail,
    FilePenLine, Scale, Paperclip, Folder
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';

const ContractDocuments = () => {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalSizeMB: '0.00',
        breakdown: {
            contracts: 0,
            invoices: 0,
            quotes: 0,
            reports: 0,
            terms: 0,
            payments: 0,
            correspondences: 0,
            amendments: 0,
            legals: 0,
            appendixes: 0,
            others: 0
        }
    });
    const [statsLoading, setStatsLoading] = useState(true);

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

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            
            const response = await fetch(`${API_URL}/api/contracts/${contractId}/documents/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                console.error('Erreur stats:', response.status);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [contractId, token]);

    useEffect(() => {
        if (contractId && token) {
            fetchStats();
        }
    }, [contractId, token, refreshTrigger]);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

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

    // ✅ Configuration des types de documents avec icônes
    const documentTypes = [
        { key: 'contracts', label: 'Contrats', icon: FileText, color: 'blue' },
        { key: 'invoices', label: 'Factures', icon: FileCheck, color: 'green' },
        { key: 'quotes', label: 'Devis', icon: FileText, color: 'purple' },
        { key: 'reports', label: 'Rapports', icon: TrendingUp, color: 'orange' },
        { key: 'terms', label: 'CGV/CGU', icon: Shield, color: 'indigo' },
        { key: 'payments', label: 'Paiements', icon: CreditCard, color: 'emerald' },
        { key: 'correspondences', label: 'Correspondances', icon: Mail, color: 'cyan' },
        { key: 'amendments', label: 'Avenants', icon: FilePenLine, color: 'violet' },
        { key: 'legals', label: 'Légaux', icon: Scale, color: 'slate' },
        { key: 'appendixes', label: 'Annexes', icon: Paperclip, color: 'teal' },
        { key: 'others', label: 'Autres', icon: Folder, color: 'gray' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-7xl">
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

            <div className="container mx-auto px-6 max-w-7xl">
                {/* Carte Infos Contrat */}
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

                {/* Zone Upload + Résumé */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Upload */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Ajouter Document</h3>
                        </div>
                        <DocumentUpload 
                            contractId={contractId} 
                            onUploadSuccess={handleUploadSuccess}
                        />
                    </div>

                    {/* Résumé Global */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Résumé Global</h3>
                        </div>
                        
                        {statsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Total documents */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                    <p className="text-sm text-gray-600 mb-1">Total documents</p>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        {stats.totalDocuments}
                                    </p>
                                </div>

                                {/* Espace utilisé */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                    <p className="text-sm text-gray-600 mb-1">Espace utilisé</p>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        {stats.totalSizeMB}
                                    </p>
                                    <p className="text-xs text-gray-500">MB</p>
                                </div>

                                {/* Types différents */}
                                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                                    <p className="text-sm text-gray-600 mb-1">Types utilisés</p>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                        {Object.values(stats.breakdown).filter(v => v > 0).length}
                                    </p>
                                    <p className="text-xs text-gray-500">sur 11</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ STATS PAR TYPE - GRILLE 11 TYPES */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Statistiques par Type</h3>
                    </div>

                    {statsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {documentTypes.map((type) => {
                                const Icon = type.icon;
                                const count = stats.breakdown[type.key] || 0;
                                
                                // ✅ Couleurs organisées par objet
                                const colorSchemes = {
                                    blue: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-100', text: 'from-blue-600 to-cyan-600' },
                                    green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-100', text: 'from-green-600 to-emerald-600' },
                                    purple: { bg: 'from-purple-50 to-violet-50', border: 'border-purple-100', text: 'from-purple-600 to-violet-600' },
                                    orange: { bg: 'from-orange-50 to-amber-50', border: 'border-orange-100', text: 'from-orange-600 to-amber-600' },
                                    indigo: { bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-100', text: 'from-indigo-600 to-blue-600' },
                                    emerald: { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'from-emerald-600 to-teal-600' },
                                    cyan: { bg: 'from-cyan-50 to-sky-50', border: 'border-cyan-100', text: 'from-cyan-600 to-sky-600' },
                                    violet: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-100', text: 'from-violet-600 to-purple-600' },
                                    slate: { bg: 'from-slate-50 to-gray-50', border: 'border-slate-100', text: 'from-slate-600 to-gray-600' },
                                    teal: { bg: 'from-teal-50 to-cyan-50', border: 'border-teal-100', text: 'from-teal-600 to-cyan-600' },
                                    gray: { bg: 'from-gray-50 to-slate-50', border: 'border-gray-100', text: 'from-gray-600 to-slate-600' }
                                };
                                
                                const colors = colorSchemes[type.color];

                                return (
                                    <div 
                                        key={type.key}
                                        className={`bg-gradient-to-br ${colors.bg} rounded-xl p-4 border ${colors.border} hover:shadow-md transition-all`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Icon className="w-5 h-5 text-gray-600" />
                                            <p className={`text-2xl font-bold bg-gradient-to-r ${colors.text} bg-clip-text text-transparent`}>
                                                {count}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">{type.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!statsLoading && stats.totalDocuments === 0 && (
                        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                            <p className="text-sm text-indigo-700">
                                💡 Aucun document uploadé pour le moment. Utilisez le formulaire ci-dessus pour commencer.
                            </p>
                        </div>
                    )}
                </div>

                {/* Liste Documents */}
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