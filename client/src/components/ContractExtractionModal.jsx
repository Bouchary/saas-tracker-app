// client/src/components/ContractExtractionModal.jsx
// ✅ Modal pour extraction intelligente de contrats avec Claude IA

import React, { useState } from 'react';
import { X, Upload, FileText, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';
import { useAuth } from '../AuthContext';

const ContractExtractionModal = ({ isOpen, onClose, onExtractSuccess }) => {
    const { token } = useAuth();
    const [file, setFile] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState('');
    const [extractedData, setExtractedData] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Seuls les fichiers PDF sont acceptés');
                return;
            }
            if (selectedFile.size > 20 * 1024 * 1024) {
                setError('Fichier trop volumineux (max 20 MB)');
                return;
            }
            setFile(selectedFile);
            setError('');
            setExtractedData(null);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            setError('Veuillez sélectionner un fichier PDF');
            return;
        }

        setExtracting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/contracts/extract`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'extraction');
            }

            setExtractedData(data.data);
            console.log('✅ Données extraites:', data.data);

        } catch (err) {
            console.error('❌ Erreur extraction:', err);
            setError(err.message || 'Erreur lors de l\'extraction du contrat');
        } finally {
            setExtracting(false);
        }
    };

    const handleUseData = () => {
        if (extractedData) {
            onExtractSuccess(extractedData);
            handleClose();
        }
    };

    const handleClose = () => {
        setFile(null);
        setError('');
        setExtractedData(null);
        setExtracting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Extraction Intelligente</h2>
                                <p className="text-purple-100 text-sm">Analysez un contrat PDF avec l'IA</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {!extractedData ? (
                        <>
                            {/* Zone Upload */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Fichier PDF du contrat
                                </label>
                                
                                {!file ? (
                                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-600 mb-2">
                                            Cliquez pour sélectionner un PDF
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Formats acceptés : PDF (max 20 MB)
                                        </p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <FileText className="w-8 h-8 text-purple-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                                <p className="text-sm text-purple-900 mb-2 font-medium">
                                    💡 Comment ça marche ?
                                </p>
                                <ul className="text-xs text-purple-800 space-y-1">
                                    <li>• L'IA analyse le PDF et extrait les informations clés</li>
                                    <li>• Le formulaire sera pré-rempli automatiquement</li>
                                    <li>• Vous pourrez vérifier et modifier avant de valider</li>
                                    <li>• Coût : ~0.02€ par analyse</li>
                                </ul>
                            </div>

                            {/* Boutons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleExtract}
                                    disabled={!file || extracting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {extracting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Analyser avec l'IA
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Résultats */}
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-green-900">Extraction réussie !</p>
                                    <p className="text-sm text-green-700">Les données ont été extraites automatiquement</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Nom du contrat</p>
                                        <p className="font-semibold text-gray-900">{extractedData.name || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Fournisseur</p>
                                        <p className="font-semibold text-gray-900">{extractedData.provider || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Coût mensuel</p>
                                        <p className="font-semibold text-gray-900">
                                            {extractedData.monthly_cost ? `${extractedData.monthly_cost} €` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Date de renouvellement</p>
                                        <p className="font-semibold text-gray-900">
                                            {extractedData.renewal_date ? new Date(extractedData.renewal_date).toLocaleDateString('fr-FR') : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Préavis</p>
                                        <p className="font-semibold text-gray-900">
                                            {extractedData.notice_period_days ? `${extractedData.notice_period_days} jours` : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Licences</p>
                                        <p className="font-semibold text-gray-900">{extractedData.license_count || '-'}</p>
                                    </div>
                                </div>

                                {extractedData.description && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-2">Description</p>
                                        <p className="text-sm text-gray-900">{extractedData.description}</p>
                                    </div>
                                )}

                                {extractedData.key_clauses && extractedData.key_clauses.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-2">Clauses importantes</p>
                                        <ul className="space-y-1">
                                            {extractedData.key_clauses.map((clause, index) => (
                                                <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                                                    <span className="text-purple-600 mt-1">•</span>
                                                    <span>{clause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Boutons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setExtractedData(null)}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Analyser un autre PDF
                                </button>
                                <button
                                    onClick={handleUseData}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Utiliser ces données
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractExtractionModal;