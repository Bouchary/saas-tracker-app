// client/src/components/ContractExtractionModal.jsx
// ✅ Modal extraction intelligente - VERSION AMÉLIORÉE avec affichage détaillé

import React, { useState } from 'react';
import { X, Upload, FileText, Sparkles, CheckCircle, AlertCircle, TrendingUp, Calendar, DollarSign, Shield, Users, FileCheck } from 'lucide-react';
import API_URL from '../config/api';
import { useAuth } from '../AuthContext';

const ContractExtractionModal = ({ isOpen, onClose, onExtractSuccess }) => {
    const { token } = useAuth();
    const [file, setFile] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [activeTab, setActiveTab] = useState('basic'); // basic, financial, clauses, contacts

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
        setActiveTab('basic');
        onClose();
    };

    // Fonction helper pour afficher le type de document
    const getDocumentTypeBadge = (type) => {
        const types = {
            contract: { label: 'Contrat', color: 'bg-blue-100 text-blue-800' },
            invoice: { label: 'Facture', color: 'bg-green-100 text-green-800' },
            quote: { label: 'Devis', color: 'bg-purple-100 text-purple-800' },
            purchase_order: { label: 'Bon de commande', color: 'bg-orange-100 text-orange-800' },
            amendment: { label: 'Avenant', color: 'bg-yellow-100 text-yellow-800' },
            other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' }
        };
        return types[type] || types.other;
    };

    // Fonction helper pour afficher le score de confiance
    const getConfidenceColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Extraction Intelligente IA</h2>
                                <p className="text-purple-100 text-sm">Analyse automatique avec Claude Sonnet 4</p>
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

                            {/* Info amélioration */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg">
                                <p className="text-sm text-purple-900 mb-2 font-medium flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    ✨ Extraction Améliorée - Nouveau !
                                </p>
                                <ul className="text-xs text-purple-800 space-y-1">
                                    <li>• Détection automatique du type de document (Contrat/Facture/Devis)</li>
                                    <li>• Extraction de tableaux de prix et paliers tarifaires</li>
                                    <li>• Détection de clauses spécifiques (SLA, résiliation, RGPD)</li>
                                    <li>• Support multi-langue (FR/EN/DE/ES)</li>
                                    <li>• Extraction de contacts et dates multiples</li>
                                    <li>• Score de confiance de l'analyse</li>
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
                            {/* Résultats - Header */}
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-green-900 text-lg">Extraction réussie !</p>
                                            <p className="text-sm text-green-700">Toutes les informations ont été extraites automatiquement</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Type de document */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDocumentTypeBadge(extractedData.document_type).color}`}>
                                            {getDocumentTypeBadge(extractedData.document_type).label}
                                        </span>
                                        {/* Score de confiance */}
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Confiance</p>
                                            <p className={`text-lg font-bold ${getConfidenceColor(extractedData.confidence_score || 0)}`}>
                                                {extractedData.confidence_score || 'N/A'}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="border-b border-gray-200">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('basic')}
                                            className={`px-4 py-2 font-medium text-sm transition ${
                                                activeTab === 'basic'
                                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <FileCheck className="w-4 h-4 inline mr-2" />
                                            Informations de base
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('financial')}
                                            className={`px-4 py-2 font-medium text-sm transition ${
                                                activeTab === 'financial'
                                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <DollarSign className="w-4 h-4 inline mr-2" />
                                            Finances & Prix
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('clauses')}
                                            className={`px-4 py-2 font-medium text-sm transition ${
                                                activeTab === 'clauses'
                                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <Shield className="w-4 h-4 inline mr-2" />
                                            Clauses & Conditions
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('contacts')}
                                            className={`px-4 py-2 font-medium text-sm transition ${
                                                activeTab === 'contacts'
                                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Contacts & Support
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contenu des tabs */}
                            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                                {/* TAB: Informations de base */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Nom</p>
                                                <p className="font-semibold text-gray-900">{extractedData.name || '-'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Fournisseur</p>
                                                <p className="font-semibold text-gray-900">{extractedData.provider || '-'}</p>
                                            </div>
                                            {extractedData.client && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">Client</p>
                                                    <p className="font-semibold text-gray-900">{extractedData.client}</p>
                                                </div>
                                            )}
                                            {extractedData.contract_number && (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">N° de contrat</p>
                                                    <p className="font-semibold text-gray-900">{extractedData.contract_number}</p>
                                                </div>
                                            )}
                                        </div>

                                        {extractedData.description && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-2">Description</p>
                                                <p className="text-sm text-gray-900">{extractedData.description}</p>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {extractedData.signature_date && (
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Signature
                                                    </p>
                                                    <p className="font-semibold text-blue-900">
                                                        {new Date(extractedData.signature_date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                            {extractedData.start_date && (
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Début
                                                    </p>
                                                    <p className="font-semibold text-green-900">
                                                        {new Date(extractedData.start_date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                            {extractedData.end_date && (
                                                <div className="bg-orange-50 p-3 rounded-lg">
                                                    <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Fin
                                                    </p>
                                                    <p className="font-semibold text-orange-900">
                                                        {new Date(extractedData.end_date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                            {extractedData.renewal_date && (
                                                <div className="bg-purple-50 p-3 rounded-lg">
                                                    <p className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Renouvellement
                                                    </p>
                                                    <p className="font-semibold text-purple-900">
                                                        {new Date(extractedData.renewal_date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB: Finances */}
                                {activeTab === 'financial' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {extractedData.monthly_cost && (
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <p className="text-xs text-green-600 mb-1">Coût mensuel</p>
                                                    <p className="text-2xl font-bold text-green-900">
                                                        {extractedData.monthly_cost} {extractedData.currency}
                                                    </p>
                                                </div>
                                            )}
                                            {extractedData.yearly_cost && (
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <p className="text-xs text-blue-600 mb-1">Coût annuel</p>
                                                    <p className="text-2xl font-bold text-blue-900">
                                                        {extractedData.yearly_cost} {extractedData.currency}
                                                    </p>
                                                </div>
                                            )}
                                            {extractedData.total_contract_value && (
                                                <div className="bg-purple-50 p-4 rounded-lg">
                                                    <p className="text-xs text-purple-600 mb-1">Valeur totale</p>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {extractedData.total_contract_value} {extractedData.currency}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-2">Modèle de tarification</p>
                                            <p className="font-semibold text-gray-900 capitalize">{extractedData.pricing_model?.replace('_', ' ')}</p>
                                        </div>

                                        {extractedData.payment_terms && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <p className="text-xs text-yellow-800 mb-2 font-medium">Conditions de paiement</p>
                                                <p className="text-sm text-yellow-900">{extractedData.payment_terms}</p>
                                            </div>
                                        )}

                                        {/* Tableau de prix */}
                                        {extractedData.price_table && extractedData.price_table.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-900">Grille tarifaire</p>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Palier</th>
                                                                <th className="px-4 py-2 text-left font-medium text-gray-600">Quantité</th>
                                                                <th className="px-4 py-2 text-right font-medium text-gray-600">Prix unitaire</th>
                                                                <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {extractedData.price_table.map((row, idx) => (
                                                                <tr key={idx} className="border-t border-gray-100">
                                                                    <td className="px-4 py-2">{row.tier}</td>
                                                                    <td className="px-4 py-2">{row.quantity}</td>
                                                                    <td className="px-4 py-2 text-right font-medium">{row.unit_price} {extractedData.currency}</td>
                                                                    <td className="px-4 py-2 text-right font-bold">{row.total_price} {extractedData.currency}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Licences */}
                                        {extractedData.license_count && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-indigo-50 p-4 rounded-lg">
                                                    <p className="text-xs text-indigo-600 mb-1">Licences</p>
                                                    <p className="text-2xl font-bold text-indigo-900">{extractedData.license_count}</p>
                                                </div>
                                                {extractedData.license_type && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-600 mb-1">Type de licence</p>
                                                        <p className="font-semibold text-gray-900">{extractedData.license_type}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: Clauses */}
                                {activeTab === 'clauses' && (
                                    <div className="space-y-4">
                                        {/* Termes du contrat */}
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-sm font-semibold text-blue-900 mb-3">Termes du contrat</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {extractedData.contract_duration_months && (
                                                    <div>
                                                        <p className="text-blue-700">Durée : <strong>{extractedData.contract_duration_months} mois</strong></p>
                                                    </div>
                                                )}
                                                {extractedData.notice_period_days && (
                                                    <div>
                                                        <p className="text-blue-700">Préavis : <strong>{extractedData.notice_period_days} jours</strong></p>
                                                    </div>
                                                )}
                                                {extractedData.auto_renewal !== null && (
                                                    <div>
                                                        <p className="text-blue-700">Renouvellement auto : <strong>{extractedData.auto_renewal ? 'Oui' : 'Non'}</strong></p>
                                                    </div>
                                                )}
                                            </div>
                                            {extractedData.renewal_conditions && (
                                                <p className="text-xs text-blue-800 mt-2 bg-white/50 p-2 rounded">{extractedData.renewal_conditions}</p>
                                            )}
                                        </div>

                                        {/* Clauses importantes */}
                                        {extractedData.clauses && (
                                            <>
                                                {extractedData.clauses.termination && extractedData.clauses.termination.length > 0 && (
                                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                        <p className="text-sm font-semibold text-red-900 mb-2">🚫 Résiliation</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.clauses.termination.map((clause, idx) => (
                                                                <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                                                                    <span className="text-red-600 mt-1">•</span>
                                                                    <span>{clause}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extractedData.clauses.sla && extractedData.clauses.sla.length > 0 && (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                        <p className="text-sm font-semibold text-green-900 mb-2">✅ SLA & Garanties</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.clauses.sla.map((clause, idx) => (
                                                                <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                                                    <span className="text-green-600 mt-1">•</span>
                                                                    <span>{clause}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extractedData.clauses.penalties && extractedData.clauses.penalties.length > 0 && (
                                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                        <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ Pénalités</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.clauses.penalties.map((clause, idx) => (
                                                                <li key={idx} className="text-xs text-orange-800 flex items-start gap-2">
                                                                    <span className="text-orange-600 mt-1">•</span>
                                                                    <span>{clause}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extractedData.clauses.data_protection && extractedData.clauses.data_protection.length > 0 && (
                                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                        <p className="text-sm font-semibold text-purple-900 mb-2">🔒 RGPD & Protection des données</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.clauses.data_protection.map((clause, idx) => (
                                                                <li key={idx} className="text-xs text-purple-800 flex items-start gap-2">
                                                                    <span className="text-purple-600 mt-1">•</span>
                                                                    <span>{clause}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extractedData.clauses.other_important && extractedData.clauses.other_important.length > 0 && (
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <p className="text-sm font-semibold text-gray-900 mb-2">📋 Autres clauses</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.clauses.other_important.map((clause, idx) => (
                                                                <li key={idx} className="text-xs text-gray-800 flex items-start gap-2">
                                                                    <span className="text-gray-600 mt-1">•</span>
                                                                    <span>{clause}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* TAB: Contacts */}
                                {activeTab === 'contacts' && (
                                    <div className="space-y-4">
                                        {/* Contacts */}
                                        {extractedData.contacts && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {extractedData.contacts.provider_contact && (
                                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                        <p className="text-sm font-semibold text-blue-900 mb-3">Contact Fournisseur</p>
                                                        {extractedData.contacts.provider_contact.name && (
                                                            <p className="text-sm text-blue-800 mb-1">
                                                                <strong>Nom :</strong> {extractedData.contacts.provider_contact.name}
                                                            </p>
                                                        )}
                                                        {extractedData.contacts.provider_contact.email && (
                                                            <p className="text-sm text-blue-800 mb-1">
                                                                <strong>Email :</strong> {extractedData.contacts.provider_contact.email}
                                                            </p>
                                                        )}
                                                        {extractedData.contacts.provider_contact.phone && (
                                                            <p className="text-sm text-blue-800">
                                                                <strong>Tél :</strong> {extractedData.contacts.provider_contact.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {extractedData.contacts.client_contact && (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                        <p className="text-sm font-semibold text-green-900 mb-3">Contact Client</p>
                                                        {extractedData.contacts.client_contact.name && (
                                                            <p className="text-sm text-green-800 mb-1">
                                                                <strong>Nom :</strong> {extractedData.contacts.client_contact.name}
                                                            </p>
                                                        )}
                                                        {extractedData.contacts.client_contact.email && (
                                                            <p className="text-sm text-green-800 mb-1">
                                                                <strong>Email :</strong> {extractedData.contacts.client_contact.email}
                                                            </p>
                                                        )}
                                                        {extractedData.contacts.client_contact.phone && (
                                                            <p className="text-sm text-green-800">
                                                                <strong>Tél :</strong> {extractedData.contacts.client_contact.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Support */}
                                        {extractedData.support && (
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                <p className="text-sm font-semibold text-purple-900 mb-3">🎧 Support</p>
                                                {extractedData.support.support_level && (
                                                    <p className="text-sm text-purple-800 mb-2">
                                                        <strong>Niveau :</strong> {extractedData.support.support_level}
                                                    </p>
                                                )}
                                                {extractedData.support.support_hours && (
                                                    <p className="text-sm text-purple-800 mb-2">
                                                        <strong>Horaires :</strong> {extractedData.support.support_hours}
                                                    </p>
                                                )}
                                                {extractedData.support.response_time && (
                                                    <p className="text-sm text-purple-800">
                                                        <strong>Temps de réponse :</strong> {extractedData.support.response_time}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Services */}
                                        {extractedData.services && (
                                            <>
                                                {extractedData.services.included_services && extractedData.services.included_services.length > 0 && (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                        <p className="text-sm font-semibold text-green-900 mb-2">✅ Services inclus</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.services.included_services.map((service, idx) => (
                                                                <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                                                    <span className="text-green-600 mt-1">•</span>
                                                                    <span>{service}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {extractedData.services.optional_services && extractedData.services.optional_services.length > 0 && (
                                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                        <p className="text-sm font-semibold text-yellow-900 mb-2">⭐ Services optionnels</p>
                                                        <ul className="space-y-1">
                                                            {extractedData.services.optional_services.map((service, idx) => (
                                                                <li key={idx} className="text-xs text-yellow-800 flex items-start gap-2">
                                                                    <span className="text-yellow-600 mt-1">•</span>
                                                                    <span>{service}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Boutons */}
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
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