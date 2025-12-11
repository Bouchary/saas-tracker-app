// client/src/pages/ContractDocuments.jsx
// Page dédiée pour gérer les documents d'un contrat

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
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

    // Charger les infos du contrat
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
                    navigate('/');
                }
            } catch (error) {
                console.error('Erreur chargement contrat:', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchContract();
    }, [contractId, token, navigate]);

    // Callback après upload réussi
    const handleUploadSuccess = () => {
        // Incrémenter pour forcer le refresh de DocumentList
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!contract) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                
                {/* Bouton retour */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour aux contrats
                </Link>

                {/* En-tête */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Documents du contrat
                            </h1>
                            <div className="space-y-1">
                                <p className="text-lg text-gray-700">
                                    <span className="font-semibold">{contract.name}</span>
                                </p>
                                {contract.provider && (
                                    <p className="text-gray-600">
                                        Fournisseur : {contract.provider}
                                    </p>
                                )}
                                <p className="text-gray-600">
                                    Coût mensuel : <span className="font-semibold">{contract.monthly_cost} €</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grille 2 colonnes sur grand écran */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Colonne gauche : Upload */}
                    <div>
                        <DocumentUpload 
                            contractId={contractId} 
                            onUploadSuccess={handleUploadSuccess}
                        />
                    </div>

                    {/* Colonne droite : Statistiques */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">Contrats uploadés</span>
                                <span className="text-2xl font-bold text-blue-600">-</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-700">Factures uploadées</span>
                                <span className="text-2xl font-bold text-green-600">-</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-gray-700">Espace utilisé</span>
                                <span className="text-2xl font-bold text-purple-600">- MB</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            💡 Les statistiques seront disponibles après avoir uploadé des documents
                        </p>
                    </div>
                </div>

                {/* Liste des documents (pleine largeur) */}
                <div className="mt-6">
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