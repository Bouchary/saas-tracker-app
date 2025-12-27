// client/src/components/ContractList.jsx
// ✅ VERSION FINALE : Pagination toujours visible + auto-reload + Export Excel

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Pencil, Trash2, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import ContractForm from './ContractForm';
import ExportExcelButton from './ExportExcelButton';
import API_URL from '../config/api';

// ✅ FONCTIONS UTILITAIRES
const getDaysUntilRenewal = (renewalDate) => {
    if (!renewalDate) return null;
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const ContractList = () => {
    const navigate = useNavigate();
    const location = useLocation(); // ✅ AJOUT : Pour détecter changements de route
    const { token, logout } = useAuth();
    
    const [contracts, setContracts] = useState([]);
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // États recherche et filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterExpiringSoon, setFilterExpiringSoon] = useState(false);
    const [filterExpensive, setFilterExpensive] = useState(false);
    
    // États formulaire
    const [showForm, setShowForm] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    
    // États pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchContracts = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setContracts(data.contracts || []);
                setFilteredContracts(data.contracts || []);
            } else {
                throw new Error('Erreur lors du chargement des contrats');
            }
        } catch (err) {
            setError(err.message);
            console.error('Erreur liste:', err);
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    // ✅ AJOUT : Reload quand on revient sur la page
    useEffect(() => {
        fetchContracts();
    }, [fetchContracts, location]);

    // Filtrage
    useEffect(() => {
        let filtered = contracts;

        // Recherche
        if (searchTerm) {
            filtered = filtered.filter(contract =>
                contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contract.provider && contract.provider.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filtre statut
        if (statusFilter !== 'all') {
            filtered = filtered.filter(contract => contract.status === statusFilter);
        }

        // Filtre "Expire bientôt"
        if (filterExpiringSoon) {
            filtered = filtered.filter(contract => {
                const days = getDaysUntilRenewal(contract.renewal_date);
                return days !== null && days >= 0 && days <= 30;
            });
        }

        // Filtre "Coûteux"
        if (filterExpensive) {
            const avgCost = contracts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0) / contracts.length;
            filtered = filtered.filter(contract => (parseFloat(contract.monthly_cost) || 0) > avgCost);
        }

        setFilteredContracts(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, filterExpiringSoon, filterExpensive, contracts]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentContracts = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setContracts(prev => prev.filter(c => c.id !== id));
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const handleEdit = (contract) => {
        setEditingContract(contract);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingContract(null);
    };

    const handleFormSave = () => {
        fetchContracts();
        handleFormClose();
    };

    const exportToCSV = () => {
        if (filteredContracts.length === 0) {
            alert('Aucun contrat à exporter');
            return;
        }

        const headers = ['Nom', 'Fournisseur', 'Coût mensuel', 'Date renouvellement', 'Statut', 'Modèle tarification', 'Licences', 'Utilisateurs réels'];
        const rows = filteredContracts.map(c => [
            c.name,
            c.provider || '',
            c.monthly_cost,
            c.renewal_date ? new Date(c.renewal_date).toLocaleDateString('fr-FR') : '',
            c.status,
            c.pricing_model || 'fixed',
            c.license_count ? `${c.licenses_used || 0}/${c.license_count}` : '',
            c.real_users || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contrats_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-700 border-green-200',
            inactive: 'bg-gray-100 text-gray-700 border-gray-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200'
        };
        const labels = {
            active: 'Actif',
            inactive: 'Inactif',
            cancelled: 'Annulé'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getLicenseUsage = (licenseCount, licensesUsed, realUsers) => {
        if (!licenseCount) return null;
        
        const total = parseInt(licenseCount) || 0;
        const used = parseInt(licensesUsed) || 0;
        const real = parseInt(realUsers) || used;
        const rate = total > 0 ? (real / total) * 100 : 0;
        const isOverconsumed = real > total;
        const overused = isOverconsumed ? real - total : 0;
        
        let color = 'text-gray-600';
        let bgColor = 'bg-gray-100';
        let borderColor = 'border-gray-200';
        
        if (isOverconsumed) {
            color = 'text-red-700';
            bgColor = 'bg-red-100';
            borderColor = 'border-red-300';
        } else if (rate >= 70 && rate <= 95) {
            color = 'text-green-700';
            bgColor = 'bg-green-100';
            borderColor = 'border-green-200';
        } else if (rate >= 50) {
            color = 'text-yellow-700';
            bgColor = 'bg-yellow-100';
            borderColor = 'border-yellow-200';
        } else {
            color = 'text-orange-700';
            bgColor = 'bg-orange-100';
            borderColor = 'border-orange-200';
        }
        
        return { 
            total, 
            used, 
            real, 
            rate, 
            color, 
            bgColor, 
            borderColor,
            isOverconsumed,
            overused
        };
    };

    const getRenewalBadge = (renewalDate) => {
        const days = getDaysUntilRenewal(renewalDate);
        if (days === null) return null;

        if (days < 0) {
            return (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border-2 border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Expiré
                </span>
            );
        }
        if (days <= 30) {
            return (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold border-2 border-orange-200 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    {days}j restants
                </span>
            );
        }
        if (days <= 90) {
            return (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border-2 border-yellow-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {days}j restants
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border-2 border-blue-200">
                {new Date(renewalDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Chargement des contrats...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-2xl mx-auto">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-900 text-center mb-2">Erreur</h2>
                <p className="text-red-700 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div>
            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un contrat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                                showAdvancedFilters 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            Filtres avancés
                        </button>

                        <ExportExcelButton 
                            filters={{
                                search: searchTerm,
                                status: statusFilter !== 'all' ? statusFilter : '',
                                provider: ''
                            }}
                        />
                    </div>
                </div>

                {/* Filtres avancés */}
                {showAdvancedFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterExpiringSoon}
                                    onChange={(e) => setFilterExpiringSoon(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Expire bientôt (≤30j)
                                </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterExpensive}
                                    onChange={(e) => setFilterExpensive(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    <TrendingUp className="w-4 h-4 inline mr-1" />
                                    Coûteux ({'>'} moyenne)
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                        <span className="font-semibold text-indigo-600">{filteredContracts.length}</span> contrat(s) trouvé(s)
                    </p>
                    {(searchTerm || statusFilter !== 'all' || filterExpiringSoon || filterExpensive) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setFilterExpiringSoon(false);
                                setFilterExpensive(false);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                            Réinitialiser tous les filtres
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des contrats */}
            {filteredContracts.length === 0 ? (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-12 text-center border-2 border-indigo-100">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun contrat trouvé</h3>
                    <p className="text-gray-600 mb-6">
                        {searchTerm || statusFilter !== 'all' || filterExpiringSoon || filterExpensive
                            ? 'Essayez de modifier vos critères de recherche'
                            : 'Commencez par créer votre premier contrat'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && !filterExpiringSoon && !filterExpensive && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
                        >
                            Créer un contrat
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6">
                        {currentContracts.map((contract) => {
                            const licenseUsage = getLicenseUsage(contract.license_count, contract.licenses_used, contract.real_users);
                            
                            return (
                                <div
                                    key={contract.id}
                                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-indigo-200 transition-all hover:shadow-2xl p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{contract.name}</h3>
                                            {contract.provider && (
                                                <p className="text-gray-600 font-medium">{contract.provider}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(contract.status)}
                                            {getRenewalBadge(contract.renewal_date)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-100">
                                            <p className="text-sm text-gray-600 mb-1">Coût mensuel</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                {parseFloat(contract.monthly_cost).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                            </p>
                                        </div>

                                        {licenseUsage && (
                                            <div className={`rounded-xl p-4 border-2 ${licenseUsage.bgColor} ${licenseUsage.borderColor}`}>
                                                <p className="text-sm text-gray-600 mb-1">Licences</p>
                                                <p className={`text-2xl font-bold ${licenseUsage.color}`}>
                                                    {licenseUsage.real}/{licenseUsage.total}
                                                    {licenseUsage.isOverconsumed && (
                                                        <span className="text-sm ml-1">
                                                            (+{licenseUsage.overused})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {licenseUsage.rate.toFixed(0)}% utilisé
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEdit(contract)}
                                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Modifier
                                        </button>
                                        
                                        <button
                                            onClick={() => navigate(`/contracts/${contract.id}/documents`)}
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Documents
                                        </button>

                                        <button
                                            onClick={() => handleDelete(contract.id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ✅ MODIFICATION : Pagination toujours visible */}
                    {filteredContracts.length > 0 && (
                        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Afficher</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-600">par page</span>
                            </div>

                            {/* Boutons navigation seulement si > 1 page */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Précédent
                                    </button>

                                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                                        Page {currentPage} sur {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center gap-2"
                                    >
                                        Suivant
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal formulaire */}
            {showForm && (
                <ContractForm
                    contract={editingContract}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                />
            )}
        </div>
    );
};

export default ContractList;