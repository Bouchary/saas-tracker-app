// client/src/components/FiltersAndSearch.jsx

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

const FiltersAndSearch = ({ 
    onSearch, 
    onFilterChange, 
    providers = [],
    currentFilters = {}
}) => {
    const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(currentFilters.status || '');
    const [selectedProvider, setSelectedProvider] = useState(currentFilters.provider || '');
    const [showFilters, setShowFilters] = useState(false);

    // Debounce pour la recherche (attendre 500ms après la dernière frappe)
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        onFilterChange({ status, provider: selectedProvider });
    };

    const handleProviderChange = (provider) => {
        setSelectedProvider(provider);
        onFilterChange({ status: selectedStatus, provider });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedProvider('');
        onSearch('');
        onFilterChange({ status: '', provider: '' });
    };

    const hasActiveFilters = searchTerm || selectedStatus || selectedProvider;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            {/* Barre de recherche */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Champ de recherche */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou fournisseur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Bouton Filtres */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                        showFilters || hasActiveFilters
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Filter className="w-5 h-5" />
                    Filtres
                    {hasActiveFilters && !showFilters && (
                        <span className="bg-white text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {[searchTerm, selectedStatus, selectedProvider].filter(Boolean).length}
                        </span>
                    )}
                </button>

                {/* Bouton Réinitialiser */}
                {hasActiveFilters && (
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Panneau de filtres (repliable) */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Filtre par statut */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Statut
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                    </div>

                    {/* Filtre par fournisseur */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fournisseur
                        </label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tous les fournisseurs</option>
                            {providers.map((provider, index) => (
                                <option key={index} value={provider}>
                                    {provider}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Indicateur de filtres actifs */}
            {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                            Recherche: "{searchTerm}"
                            <button onClick={() => setSearchTerm('')} className="hover:text-indigo-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedStatus && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Statut: {selectedStatus}
                            <button onClick={() => handleStatusChange('')} className="hover:text-green-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedProvider && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            Fournisseur: {selectedProvider}
                            <button onClick={() => handleProviderChange('')} className="hover:text-purple-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FiltersAndSearch;