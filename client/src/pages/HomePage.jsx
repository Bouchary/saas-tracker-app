// client/src/pages/HomePage.jsx
// Version COMPLÈTE modernisée - TOUTES FONCTIONS + DESIGN MODERNE

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Download, Plus, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import ContractList from '../components/ContractList';
import ContractForm from '../components/ContractForm';
import Pagination from '../components/Pagination';
import FiltersAndSearch from '../components/FiltersAndSearch';
import QuickFilters from '../components/QuickFilters';
import AdvancedFilters from '../components/AdvancedFilters';
import API_URL from '../config/api';

const HomePage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logout } = useAuth();

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalContracts, setTotalContracts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // États pour les filtres et le tri
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', provider: '' });
    const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'renewal_date');
    const [sortOrder, setSortOrder] = useState(localStorage.getItem('sortOrder') || 'asc');
    const [providers, setProviders] = useState([]);
    
    // États pour les filtres avancés
    const [quickFilter, setQuickFilter] = useState('all');
    const [costRange, setCostRange] = useState({ minCost: 0, maxCost: 1000 });
    const [allContractsData, setAllContractsData] = useState([]);

    // États pour l'édition et la suppression
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    // ✅ Charger la liste des fournisseurs uniques
    const fetchProviders = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts/providers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProviders(data);
            }
        } catch (err) {
            console.error('Erreur récupération fournisseurs:', err);
        }
    };

    // ✅ Fonction pour charger les contrats avec tous les paramètres
    const fetchContracts = async (
        page, 
        limit,
        search,
        filterStatus,
        filterProvider,
        sort,
        order
    ) => {
        if (!token) {
            setLoading(false);
            return;
        }

        // Utiliser les valeurs actuelles si pas fournies
        const actualPage = page ?? currentPage;
        const actualLimit = limit ?? itemsPerPage;
        const actualSearch = search ?? searchTerm;
        const actualFilterStatus = filterStatus ?? filters.status;
        const actualFilterProvider = filterProvider ?? filters.provider;
        const actualSort = sort ?? sortBy;
        const actualOrder = order ?? sortOrder;

        setLoading(true);

        try {
            // Construction de l'URL avec tous les paramètres
            const params = new URLSearchParams({
                page: actualPage.toString(),
                limit: actualLimit.toString(),
                sortBy: actualSort,
                sortOrder: actualOrder,
            });

            if (actualSearch) params.append('search', actualSearch);
            if (actualFilterStatus) params.append('status', actualFilterStatus);
            if (actualFilterProvider) params.append('provider', actualFilterProvider);

            const response = await fetch(`${API_URL}/api/contracts?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                logout();
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); 
                throw new Error(errorData.error || 'Échec de la récupération des contrats.');
            }

            const data = await response.json();
            
            setContracts(data.contracts || []);
            setTotalContracts(data.pagination?.totalContracts || 0);
            setTotalPages(data.pagination?.totalPages || 0);
            setCurrentPage(data.pagination?.currentPage || 1);

        } catch (err) {
            setError(err.message);
            console.error("Erreur de l'API:", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Charger les contrats et fournisseurs au montage SEULEMENT
    useEffect(() => {
        if (!token) return;
        
        const initialLoad = async () => {
            await fetchContracts();
            await fetchProviders();
        };
        
        initialLoad();
    }, [token]);

    // Gestion de la recherche
    const handleSearch = (search) => {
        setSearchTerm(search);
        setCurrentPage(1);
        fetchContracts(1, itemsPerPage, search);
    };

    // Gestion des filtres
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        fetchContracts(1, itemsPerPage, searchTerm, newFilters.status, newFilters.provider);
    };

    // Gestion du tri
    const handleSort = (field, order) => {
        setSortBy(field);
        setSortOrder(order);
        localStorage.setItem('sortBy', field);
        localStorage.setItem('sortOrder', order);
        fetchContracts(currentPage, itemsPerPage, searchTerm, filters.status, filters.provider, field, order);
    };

    // Gestion des filtres rapides
    const handleQuickFilter = async (filterId) => {
        setQuickFilter(filterId);
        
        if (filterId === 'all') {
            // Réinitialiser tous les filtres
            setSearchTerm('');
            setFilters({ status: '', provider: '' });
            setCostRange({ minCost: 0, maxCost: 1000 });
            setCurrentPage(1);
            setAllContractsData([]);
            fetchContracts(1, itemsPerPage, '', '', '');
        } else {
            // Charger tous les contrats puis appliquer le filtre
            await fetchAllContracts(filterId);
        }
    };

    // Charger tous les contrats pour les filtres rapides
    const fetchAllContracts = async (filterId) => {
        if (!token) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/contracts?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const allContracts = data.contracts || [];
                setAllContractsData(allContracts);
                applyClientSideFilters(allContracts, filterId);
            }
        } catch (err) {
            console.error('Erreur chargement contrats:', err);
        } finally {
            setLoading(false);
        }
    };

    // Appliquer les filtres rapides côté client
    const applyClientSideFilters = (contractsList, filterId = quickFilter) => {
        let filtered = [...contractsList];

        if (filterId === 'expiring') {
            // Contrats qui expirent dans moins de 30 jours
            const today = new Date();
            filtered = filtered.filter(c => {
                if (!c.renewal_date) return false;
                const renewalDate = new Date(c.renewal_date);
                const deadline = new Date(renewalDate);
                deadline.setDate(renewalDate.getDate() - (c.notice_period_days || 0));
                const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysLeft >= 0 && daysLeft <= 30;
            });
        } else if (filterId === 'expensive') {
            // Contrats au-dessus de la moyenne
            const average = contractsList.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0) / contractsList.length;
            filtered = filtered.filter(c => parseFloat(c.monthly_cost) > average);
        }

        // Appliquer le filtre de plage de coûts
        if (costRange.minCost > 0 || costRange.maxCost < 1000) {
            filtered = filtered.filter(c => {
                const cost = parseFloat(c.monthly_cost) || 0;
                return cost >= costRange.minCost && cost <= costRange.maxCost;
            });
        }

        setContracts(filtered);
        setTotalContracts(filtered.length);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    };

    // Gestion des filtres avancés (plage de coûts)
    const handleAdvancedFilters = async (range) => {
        setCostRange(range);
        
        if (quickFilter !== 'all') {
            // Si un filtre rapide est actif, recharger et réappliquer
            if (allContractsData.length > 0) {
                applyClientSideFilters(allContractsData);
            } else {
                await fetchAllContracts(quickFilter);
            }
        } else {
            // Sinon, charger tous les contrats et filtrer par plage
            await fetchAndFilterByCost(range);
        }
    };

    // Charger et filtrer par plage de coûts
    const fetchAndFilterByCost = async (range) => {
        if (!token) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/contracts?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                let filtered = data.contracts || [];

                // Appliquer le filtre de plage
                if (range.minCost > 0 || range.maxCost < 1000) {
                    filtered = filtered.filter(c => {
                        const cost = parseFloat(c.monthly_cost) || 0;
                        return cost >= range.minCost && cost <= range.maxCost;
                    });
                }

                setContracts(filtered);
                setTotalContracts(filtered.length);
                setTotalPages(Math.ceil(filtered.length / itemsPerPage));
                setCurrentPage(1);
            }
        } catch (err) {
            console.error('Erreur filtrage par coût:', err);
        } finally {
            setLoading(false);
        }
    };

    // Gestion de la pagination
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchContracts(newPage, itemsPerPage, searchTerm, filters.status, filters.provider, sortBy, sortOrder);
    };

    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchContracts(1, newLimit, searchTerm, filters.status, filters.provider, sortBy, sortOrder);
    };

    // Fonction pour gérer l'ouverture du modal d'édition
    const handleEditContract = (contract) => {
        setContractToEdit(contract);
        setIsEditModalOpen(true);
    };

    // Fonction pour gérer la fermeture du modal d'édition
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setContractToEdit(null);
    };

    // Fonction pour gérer la mise à jour d'un contrat
    const handleContractUpdated = (updatedContract) => {
        // Recharger la page actuelle pour refléter les changements
        fetchContracts();
        handleCloseEditModal();
    };

    // Fonction pour ouvrir le modal de confirmation de suppression
    const handleDeleteClick = (contractId, contractName) => {
        setContractToDelete({ id: contractId, name: contractName });
        setIsDeleteModalOpen(true);
    };

    // Fonction pour confirmer la suppression
    const handleConfirmDelete = async () => {
        if (!contractToDelete) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts/${contractToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du contrat.');
            }

            // Recharger la page actuelle
            fetchContracts();
            fetchProviders(); // Mettre à jour la liste des fournisseurs

            setIsDeleteModalOpen(false);
            setContractToDelete(null);

        } catch (err) {
            console.error('Erreur de suppression:', err);
            alert('Erreur lors de la suppression du contrat.');
        }
    };

    // Fonction pour annuler la suppression
    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setContractToDelete(null);
    };

    // Export CSV
    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams({
                sortBy: sortBy,
                sortOrder: sortOrder,
            });

            if (searchTerm) params.append('search', searchTerm);
            if (filters.status) params.append('status', filters.status);
            if (filters.provider) params.append('provider', filters.provider);

            console.log('Export URL:', `${API_URL}/api/contracts/export?${params.toString()}`);

            const response = await fetch(`${API_URL}/api/contracts/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('Export response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Export error:', errorText);
                throw new Error('Erreur lors de l\'export des contrats.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contrats_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log('Export CSV réussi !');
        } catch (err) {
            console.error('Erreur export CSV:', err);
            alert('Erreur lors de l\'export des contrats: ' + err.message);
        }
    };

    // Calculs pour les statistiques
    const totalAmount = contracts.reduce((sum, contract) => sum + (parseFloat(contract.monthly_cost) || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'active').length;
        
    if (loading && contracts.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Chargement des contrats...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex justify-center items-center p-6">
                <div className="max-w-md w-full bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-8 text-center shadow-lg">
                    <p className="text-lg font-semibold mb-2">Erreur de chargement</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* En-tête avec titre */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Gestion des Contrats</h1>
                    <p className="text-indigo-100 text-lg">Suivez et optimisez vos abonnements en temps réel</p>
                </div>
            </div>

            <div className="container mx-auto px-6">
                {/* Cartes des Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-20">
                    {/* Carte 1 : Total Contrats */}
                    <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                Total
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Contrats enregistrés</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {totalContracts}
                        </p>
                    </div>

                    {/* Carte 2 : Contrats Actifs */}
                    <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                Actifs
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Contrats actifs (page)</p>
                        <p className="text-4xl font-bold text-green-600">
                            {activeContracts}
                        </p>
                    </div>

                    {/* Carte 3 : Montant Total */}
                    <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                Mensuel
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Coût mensuel (page)</p>
                        <p className="text-4xl font-bold text-orange-600">
                            {totalAmount.toFixed(2)}<span className="text-2xl">€</span>
                        </p>
                    </div>
                </div>

                {/* En-tête avec boutons d'action */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Vos Contrats</h2>
                            <p className="text-sm text-gray-500 mt-1">Gérez et suivez tous vos abonnements</p>
                        </div>
                        <div className="flex gap-3">
                            {/* Bouton Export CSV */}
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                <Download className="w-5 h-5" />
                                Exporter CSV
                            </button>
                            {/* Bouton Ajouter */}
                            <Link 
                                to="/contracts/new" 
                                className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                <Plus className="w-5 h-5" />
                                Ajouter un Contrat
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <FiltersAndSearch
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    providers={providers}
                    currentFilters={{ search: searchTerm, ...filters }}
                />

                {/* Filtres rapides et avancés */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <QuickFilters 
                        onFilterSelect={handleQuickFilter}
                        activeFilter={quickFilter}
                    />
                    <AdvancedFilters 
                        onApply={handleAdvancedFilters}
                        minCost={costRange.minCost}
                        maxCost={costRange.maxCost}
                    />
                    
                    {/* Badge du nombre de filtres actifs */}
                    {(quickFilter !== 'all' || costRange.minCost > 0 || costRange.maxCost < 1000 || searchTerm || filters.status || filters.provider) && (
                        <div className="ml-auto">
                            <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-semibold shadow-md">
                                {[
                                    quickFilter !== 'all',
                                    costRange.minCost > 0 || costRange.maxCost < 1000,
                                    searchTerm,
                                    filters.status,
                                    filters.provider
                                ].filter(Boolean).length} filtre(s) actif(s)
                            </span>
                        </div>
                    )}
                </div>

                {/* Liste des contrats */}
                {totalContracts === 0 && !searchTerm && !filters.status && !filters.provider ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <p className="text-lg text-gray-500 mb-4">Vous n'avez aucun contrat enregistré.</p>
                        <Link 
                            to="/contracts/new" 
                            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                        >
                            Commencer par en ajouter un !
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <ContractList 
                                contracts={contracts}
                                onDeleteContract={handleDeleteClick}
                                onEditContract={handleEditContract}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                            />
                        </div>
                        
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalContracts}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    </>
                )}

                {/* Modal d'édition */}
                {isEditModalOpen && contractToEdit && (
                    <ContractForm
                        onClose={handleCloseEditModal}
                        onContractAdded={handleContractUpdated}
                        contractToEdit={contractToEdit}
                    />
                )}

                {/* Modal de confirmation de suppression */}
                {isDeleteModalOpen && contractToDelete && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
                                <p className="text-gray-600">
                                    Êtes-vous sûr de vouloir supprimer le contrat <strong className="text-gray-900">"{contractToDelete.name}"</strong> ?
                                </p>
                                <p className="text-sm text-red-600 mt-2">Cette action est irréversible.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelDelete}
                                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Styles pour l'animation */}
            <style jsx>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default HomePage;