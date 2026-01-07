// ============================================================================
// PAGE HISTORIQUE EXTRACTIONS IA - AVEC MODAL PROPRE
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Search, Eye, Trash2, Plus,
    TrendingUp, CheckCircle, XCircle, FileText, AlertCircle,
    ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import ExtractionDetailModal from '../components/ExtractionDetailModal';

const ExtractionsHistoryPage = () => {
    const { token } = useAuth();
    
    const [extractions, setExtractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [selectedExtraction, setSelectedExtraction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');

    const loadExtractions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(search && { search }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterType && { document_type: filterType })
            });

            const response = await fetch(`${API_URL}/api/contract-extractions?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                setExtractions(data.extractions || []);
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error('Erreur chargement extractions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/contract-extractions/stats/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    const viewDetails = async (extractionId) => {
        try {
            const response = await fetch(`${API_URL}/api/contract-extractions/${extractionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (response.ok) {
                setSelectedExtraction(data.extraction);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('Erreur chargement détails:', error);
        }
    };

    const deleteExtraction = async (extractionId) => {
        if (!window.confirm('Supprimer cette extraction ?')) return;

        try {
            const response = await fetch(`${API_URL}/api/contract-extractions/${extractionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadExtractions();
                alert('Extraction supprimée');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const createContractFromExtraction = (extraction) => {
        const data = typeof extraction.extracted_data === 'string' 
            ? JSON.parse(extraction.extracted_data)
            : extraction.extracted_data;
        
        const params = new URLSearchParams({
            from_extraction: extraction.id,
            name: data.name || '',
            provider: data.provider || data.basic_info?.provider || ''
        });
        window.location.href = `/contracts/new?${params}`;
    };

    useEffect(() => {
        loadExtractions();
        loadStats();
    }, [page, search, filterStatus, filterType]);

    const getStatusBadge = (status) => {
        const badges = {
            success: { label: 'Succès', color: 'bg-green-100 text-green-800', icon: CheckCircle },
            completed: { label: 'Succès', color: 'bg-green-100 text-green-800', icon: CheckCircle },
            failed: { label: 'Échec', color: 'bg-red-100 text-red-800', icon: XCircle },
            error: { label: 'Échec', color: 'bg-red-100 text-red-800', icon: XCircle },
            partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
        };
        const badge = badges[status] || badges.success;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const types = {
            contract: { label: 'Contrat', color: 'bg-blue-100 text-blue-800' },
            invoice: { label: 'Facture', color: 'bg-green-100 text-green-800' },
            quote: { label: 'Devis', color: 'bg-purple-100 text-purple-800' },
            other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' }
        };
        const typeInfo = types[type] || types.other;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                {typeInfo.label}
            </span>
        );
    };

    const getConfidenceColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    const parseExtractedData = (data) => {
        if (!data) return null;
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            return data;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Historique des Extractions IA</h1>
                            <p className="text-gray-600">Toutes vos extractions avec Claude Sonnet 4</p>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total extractions</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_extractions || 0}</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Taux de succès</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats.total_extractions > 0 
                                            ? Math.round((stats.successful_extractions / stats.total_extractions) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Score moyen</p>
                                    <p className={`text-2xl font-bold ${getConfidenceColor(stats.avg_confidence_score)}`}>
                                        {stats.avg_confidence_score || 0}%
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-purple-500" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Coût total API</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {((stats.total_cost_cents || 0) / 100).toFixed(2)}€
                                    </p>
                                </div>
                                <FileText className="w-8 h-8 text-orange-500" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="success">Succès</option>
                                <option value="completed">Succès</option>
                                <option value="failed">Échec</option>
                                <option value="error">Échec</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Tous les types</option>
                                <option value="contract">Contrat</option>
                                <option value="invoice">Facture</option>
                                <option value="quote">Devis</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Chargement...</p>
                </div>
            ) : extractions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Aucune extraction trouvée</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confiance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {extractions.map((extraction) => {
                                    const data = parseExtractedData(extraction.extracted_data);
                                    return (
                                        <tr key={extraction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 truncate max-w-xs">
                                                    {data?.name || extraction.original_filename}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getTypeBadge(extraction.document_type)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(extraction.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${getConfidenceColor(extraction.confidence_score)}`}>
                                                    {extraction.confidence_score ? `${extraction.confidence_score}%` : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(extraction.created_at).toLocaleString('fr-FR', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => viewDetails(extraction.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {!extraction.contract_id && (
                                                        <button
                                                            onClick={() => createContractFromExtraction(extraction)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                            title="Créer contrat"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteExtraction(extraction.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between mt-6">
                            <p className="text-sm text-gray-600">Page {page} sur {totalPages}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal avec nouveau composant */}
            {showDetailModal && selectedExtraction && (
                <ExtractionDetailModal 
                    extraction={selectedExtraction}
                    onClose={() => setShowDetailModal(false)}
                />
            )}
        </div>
    );
};

export default ExtractionsHistoryPage;