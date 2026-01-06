// client/src/components/ContractExtractionTab.jsx
// Onglet affichant toutes les données d'extraction IA dans la page contrat

import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Calendar, DollarSign, Shield, Users, FileText,
    Download, AlertCircle, CheckCircle, TrendingUp
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const ContractExtractionTab = ({ contractId }) => {
    const { token } = useAuth();
    const [extraction, setExtraction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('overview');

    useEffect(() => {
        loadExtraction();
    }, [contractId]);

    const loadExtraction = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/contract-extractions/contract/${contractId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setExtraction(data);
            } else {
                setExtraction(null);
            }
        } catch (error) {
            console.error('Erreur chargement extraction:', error);
            setExtraction(null);
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    const getTypeBadge = (type) => {
        const types = {
            contract: { label: 'Contrat', color: 'bg-blue-100 text-blue-800' },
            invoice: { label: 'Facture', color: 'bg-green-100 text-green-800' },
            quote: { label: 'Devis', color: 'bg-purple-100 text-purple-800' },
            purchase_order: { label: 'Bon de commande', color: 'bg-orange-100 text-orange-800' },
            amendment: { label: 'Avenant', color: 'bg-yellow-100 text-yellow-800' },
            other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' }
        };
        const typeInfo = types[type] || types.other;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                {typeInfo.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Chargement des données d'extraction...</p>
            </div>
        );
    }

    if (!extraction) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Aucune extraction IA disponible</p>
                <p className="text-gray-500 text-sm mt-2">
                    Ce contrat n'a pas été créé à partir d'une extraction IA
                </p>
            </div>
        );
    }

    const data = extraction.extracted_data;

    return (
        <div className="space-y-6">
            {/* Header avec métadonnées */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-purple-900">Extraction IA Claude Sonnet 4</h3>
                            <p className="text-sm text-purple-700">
                                Extrait le {new Date(extraction.extraction_date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Type */}
                        {getTypeBadge(extraction.document_type)}

                        {/* Score de confiance */}
                        <div className="text-right">
                            <p className="text-xs text-purple-600 font-medium">Confiance</p>
                            <p className={`text-2xl font-bold ${getConfidenceColor(extraction.confidence_score)}`}>
                                {extraction.confidence_score || 'N/A'}%
                            </p>
                        </div>

                        {/* Télécharger PDF */}
                        {extraction.document_path && (
                            <a
                                href={`${API_URL}/${extraction.document_path}`}
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition font-medium"
                            >
                                <Download className="w-4 h-4" />
                                PDF Original
                            </a>
                        )}
                    </div>
                </div>

                {/* Performance */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">Temps de traitement</p>
                        <p className="font-semibold text-purple-900">
                            {extraction.processing_time_ms ? `${(extraction.processing_time_ms / 1000).toFixed(1)}s` : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">Tokens utilisés</p>
                        <p className="font-semibold text-purple-900">
                            {extraction.api_tokens_used ? extraction.api_tokens_used.toLocaleString() : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">Coût API</p>
                        <p className="font-semibold text-purple-900">
                            {extraction.api_cost_cents ? `${(extraction.api_cost_cents / 100).toFixed(2)}€` : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sous-onglets */}
            <div className="border-b border-gray-200">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveSubTab('overview')}
                        className={`px-4 py-2 font-medium text-sm transition ${
                            activeSubTab === 'overview'
                                ? 'border-b-2 border-purple-600 text-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" />
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveSubTab('financial')}
                        className={`px-4 py-2 font-medium text-sm transition ${
                            activeSubTab === 'financial'
                                ? 'border-b-2 border-purple-600 text-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Finances
                    </button>
                    <button
                        onClick={() => setActiveSubTab('clauses')}
                        className={`px-4 py-2 font-medium text-sm transition ${
                            activeSubTab === 'clauses'
                                ? 'border-b-2 border-purple-600 text-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Clauses
                    </button>
                    <button
                        onClick={() => setActiveSubTab('contacts')}
                        className={`px-4 py-2 font-medium text-sm transition ${
                            activeSubTab === 'contacts'
                                ? 'border-b-2 border-purple-600 text-purple-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Contacts & Services
                    </button>
                </div>
            </div>

            {/* Contenu des sous-onglets */}
            <div className="space-y-4">
                {/* Vue d'ensemble */}
                {activeSubTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                                <p className="font-semibold text-gray-900">{data.name || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Fournisseur</p>
                                <p className="font-semibold text-gray-900">{data.provider || data.basic_info?.provider || '-'}</p>
                            </div>
                            {data.client && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Client</p>
                                    <p className="font-semibold text-gray-900">{data.client}</p>
                                </div>
                            )}
                            {data.contract_number && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">N° de contrat</p>
                                    <p className="font-semibold text-gray-900">{data.contract_number}</p>
                                </div>
                            )}
                        </div>

                        {data.description && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">Description</p>
                                <p className="text-sm text-gray-900">{data.description}</p>
                            </div>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            {data.signature_date && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Signature
                                    </p>
                                    <p className="font-semibold text-blue-900">
                                        {new Date(data.signature_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            )}
                            {data.start_date && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Début
                                    </p>
                                    <p className="font-semibold text-green-900">
                                        {new Date(data.start_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            )}
                            {data.end_date && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Fin
                                    </p>
                                    <p className="font-semibold text-orange-900">
                                        {new Date(data.end_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            )}
                            {data.renewal_date && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <p className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Renouvellement
                                    </p>
                                    <p className="font-semibold text-purple-900">
                                        {new Date(data.renewal_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Finances */}
                {activeSubTab === 'financial' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {data.monthly_cost && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-600 mb-1">Coût mensuel</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {data.monthly_cost} {data.currency || 'EUR'}
                                    </p>
                                </div>
                            )}
                            {data.yearly_cost && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-600 mb-1">Coût annuel</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {data.yearly_cost} {data.currency || 'EUR'}
                                    </p>
                                </div>
                            )}
                            {data.total_contract_value && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-xs text-purple-600 mb-1">Valeur totale</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {data.total_contract_value} {data.currency || 'EUR'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {data.pricing_model && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">Modèle de tarification</p>
                                <p className="font-semibold text-gray-900 capitalize">
                                    {data.pricing_model.replace('_', ' ')}
                                </p>
                            </div>
                        )}

                        {data.payment_terms && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800 mb-2 font-medium">Conditions de paiement</p>
                                <p className="text-sm text-yellow-900">{data.payment_terms}</p>
                            </div>
                        )}

                        {/* Tableau de prix */}
                        {data.price_table && data.price_table.length > 0 && (
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
                                            {data.price_table.map((row, idx) => (
                                                <tr key={idx} className="border-t border-gray-100">
                                                    <td className="px-4 py-2">{row.tier}</td>
                                                    <td className="px-4 py-2">{row.quantity}</td>
                                                    <td className="px-4 py-2 text-right font-medium">
                                                        {row.unit_price} {data.currency || 'EUR'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold">
                                                        {row.total_price} {data.currency || 'EUR'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Licences */}
                        {data.license_count && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <p className="text-xs text-indigo-600 mb-1">Nombre de licences</p>
                                    <p className="text-2xl font-bold text-indigo-900">{data.license_count}</p>
                                </div>
                                {data.license_type && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Type de licence</p>
                                        <p className="font-semibold text-gray-900">{data.license_type}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Clauses */}
                {activeSubTab === 'clauses' && (
                    <div className="space-y-4">
                        {/* Termes du contrat */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-3">Termes du contrat</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {data.contract_duration_months && (
                                    <div>
                                        <p className="text-blue-700">
                                            Durée : <strong>{data.contract_duration_months} mois</strong>
                                        </p>
                                    </div>
                                )}
                                {data.notice_period_days && (
                                    <div>
                                        <p className="text-blue-700">
                                            Préavis : <strong>{data.notice_period_days} jours</strong>
                                        </p>
                                    </div>
                                )}
                                {data.auto_renewal !== null && data.auto_renewal !== undefined && (
                                    <div>
                                        <p className="text-blue-700">
                                            Renouvellement auto : <strong>{data.auto_renewal ? 'Oui' : 'Non'}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                            {data.renewal_conditions && (
                                <p className="text-xs text-blue-800 mt-2 bg-white/50 p-2 rounded">
                                    {data.renewal_conditions}
                                </p>
                            )}
                        </div>

                        {/* Clauses catégorisées */}
                        {data.clauses && (
                            <>
                                {data.clauses.termination && data.clauses.termination.length > 0 && (
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <p className="text-sm font-semibold text-red-900 mb-2">🚫 Résiliation</p>
                                        <ul className="space-y-1">
                                            {data.clauses.termination.map((clause, idx) => (
                                                <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                                                    <span className="text-red-600 mt-1">•</span>
                                                    <span>{clause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {data.clauses.sla && data.clauses.sla.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm font-semibold text-green-900 mb-2">✅ SLA & Garanties</p>
                                        <ul className="space-y-1">
                                            {data.clauses.sla.map((clause, idx) => (
                                                <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                                    <span className="text-green-600 mt-1">•</span>
                                                    <span>{clause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {data.clauses.penalties && data.clauses.penalties.length > 0 && (
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ Pénalités</p>
                                        <ul className="space-y-1">
                                            {data.clauses.penalties.map((clause, idx) => (
                                                <li key={idx} className="text-xs text-orange-800 flex items-start gap-2">
                                                    <span className="text-orange-600 mt-1">•</span>
                                                    <span>{clause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {data.clauses.data_protection && data.clauses.data_protection.length > 0 && (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <p className="text-sm font-semibold text-purple-900 mb-2">🔒 RGPD & Protection des données</p>
                                        <ul className="space-y-1">
                                            {data.clauses.data_protection.map((clause, idx) => (
                                                <li key={idx} className="text-xs text-purple-800 flex items-start gap-2">
                                                    <span className="text-purple-600 mt-1">•</span>
                                                    <span>{clause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {data.clauses.other_important && data.clauses.other_important.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900 mb-2">📋 Autres clauses</p>
                                        <ul className="space-y-1">
                                            {data.clauses.other_important.map((clause, idx) => (
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

                {/* Contacts & Services */}
                {activeSubTab === 'contacts' && (
                    <div className="space-y-4">
                        {/* Contacts */}
                        {data.contacts && (
                            <div className="grid grid-cols-2 gap-4">
                                {data.contacts.provider_contact && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-900 mb-3">Contact Fournisseur</p>
                                        {data.contacts.provider_contact.name && (
                                            <p className="text-sm text-blue-800 mb-1">
                                                <strong>Nom :</strong> {data.contacts.provider_contact.name}
                                            </p>
                                        )}
                                        {data.contacts.provider_contact.email && (
                                            <p className="text-sm text-blue-800 mb-1">
                                                <strong>Email :</strong> {data.contacts.provider_contact.email}
                                            </p>
                                        )}
                                        {data.contacts.provider_contact.phone && (
                                            <p className="text-sm text-blue-800">
                                                <strong>Tél :</strong> {data.contacts.provider_contact.phone}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {data.contacts.client_contact && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm font-semibold text-green-900 mb-3">Contact Client</p>
                                        {data.contacts.client_contact.name && (
                                            <p className="text-sm text-green-800 mb-1">
                                                <strong>Nom :</strong> {data.contacts.client_contact.name}
                                            </p>
                                        )}
                                        {data.contacts.client_contact.email && (
                                            <p className="text-sm text-green-800 mb-1">
                                                <strong>Email :</strong> {data.contacts.client_contact.email}
                                            </p>
                                        )}
                                        {data.contacts.client_contact.phone && (
                                            <p className="text-sm text-green-800">
                                                <strong>Tél :</strong> {data.contacts.client_contact.phone}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Support */}
                        {data.support && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm font-semibold text-purple-900 mb-3">🎧 Support</p>
                                {data.support.support_level && (
                                    <p className="text-sm text-purple-800 mb-2">
                                        <strong>Niveau :</strong> {data.support.support_level}
                                    </p>
                                )}
                                {data.support.support_hours && (
                                    <p className="text-sm text-purple-800 mb-2">
                                        <strong>Horaires :</strong> {data.support.support_hours}
                                    </p>
                                )}
                                {data.support.response_time && (
                                    <p className="text-sm text-purple-800">
                                        <strong>Temps de réponse :</strong> {data.support.response_time}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Services */}
                        {data.services && (
                            <>
                                {data.services.included_services && data.services.included_services.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm font-semibold text-green-900 mb-2">✅ Services inclus</p>
                                        <ul className="space-y-1">
                                            {data.services.included_services.map((service, idx) => (
                                                <li key={idx} className="text-xs text-green-800 flex items-start gap-2">
                                                    <span className="text-green-600 mt-1">•</span>
                                                    <span>{service}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {data.services.optional_services && data.services.optional_services.length > 0 && (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <p className="text-sm font-semibold text-yellow-900 mb-2">⭐ Services optionnels</p>
                                        <ul className="space-y-1">
                                            {data.services.optional_services.map((service, idx) => (
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
        </div>
    );
};

export default ContractExtractionTab;