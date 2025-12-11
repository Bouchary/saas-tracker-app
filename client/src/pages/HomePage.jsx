// client/src/pages/HomePage.jsx
// Version corrigée avec useCallback pour éviter les boucles infinies

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
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

    // ✅ Charger la liste des fournisseurs uniques (useCallback)
    const fetchProviders = useCallback(async () => {
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
    }, [token]);

    // ✅ Fonction pour charger les contrats avec tous les paramètres (PAS de useCallback)
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
    }, [token]); // ← Se déclenche seulement si token change

    // Gestion du changement de page
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchContracts(newPage);
    };

    // Gestion du changement d'items par page
    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchContracts(1, newLimit);
    };

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
        // Sauvegarder dans localStorage
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

    // Fonction pour exporter les contrats en CSV
    const handleExportCSV = async () => {
        try {
            // Construction de l'URL avec tous les paramètres actuels (filtres, recherche, tri)
            const params = new URLSearchParams();
            
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

            if (searchTerm && searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }
            if (filters.status) {
                params.append('status', filters.status);
            }
            if (filters.provider) {
                params.append('provider', filters.provider);
            }

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

            // Créer un blob et télécharger le fichier
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

    // Calculs pour les statistiques de la page actuelle
    const totalAmount = contracts.reduce((sum, contract) => sum + (parseFloat(contract.monthly_cost) || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'active').length;
        
    if (loading && contracts.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-lg text-gray-600">Chargement des contrats...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6 bg-red-100 text-red-700 rounded-lg">
                <p>Erreur lors du chargement des données : {error}</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-gray-900">Tableau de Bord</h1>

            {/* Cartes des Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total des Contrats</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-1">
                        {totalContracts}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Contrats Actifs (page)</p>
                    <p className="text-3xl font-semibold text-green-600 mt-1">
                        {activeContracts}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Montant Total Page (€)</p>
                    <p className="text-3xl font-semibold text-indigo-600 mt-1">
                        {totalAmount.toFixed(2)} €
                    </p>
                </div>
            </div>

            {/* En-tête avec bouton d'ajout */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Vos Contrats</h2>
                <div className="flex gap-3">
                    {/* Bouton Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition"
                    >
                        <Download className="w-4 h-4" />
                        Exporter CSV
                    </button>
                    {/* Bouton Ajouter */}
                    <Link 
                        to="/contracts/new" 
                        className="py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
                    >
                        + Ajouter un Contrat
                    </Link>
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
                <div className="text-center p-10 bg-gray-50 rounded-lg shadow-inner">
                    <p className="text-lg text-gray-500">Vous n'avez aucun contrat enregistré.</p>
                    <Link 
                        to="/contracts/new" 
                        className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Commencer par en ajouter un !
                    </Link>
                </div>
            ) : (
                <>
                    <ContractList 
                        contracts={contracts}
                        onDeleteContract={handleDeleteClick}
                        onEditContract={handleEditContract}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                    />
                    
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalContracts}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Confirmer la suppression
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer le contrat <strong>"{contractToDelete.name}"</strong> ? 
                            Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
