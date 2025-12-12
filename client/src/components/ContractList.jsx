// client/src/components/ContractList.jsx
// Version FINALE avec real_users pour détection surconsommation

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Pencil, Trash2, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, ShieldAlert } from 'lucide-react';
import ContractForm from './ContractForm';
import API_URL from '../config/api';

const ContractList = () => {
    const [contracts, setContracts] = useState([]);
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const { token, logout } = useAuth();

    const fetchContracts = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts?limit=100`, {
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
    };

    useEffect(() => {
        fetchContracts();
    }, [token]);

    useEffect(() => {
        let filtered = contracts;

        if (searchTerm) {
            filtered = filtered.filter(contract =>
                contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contract.provider && contract.provider.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(contract => contract.status === statusFilter);
        }

        setFilteredContracts(filtered);
    }, [searchTerm, statusFilter, contracts]);

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

    // ✨ CALCUL UTILISATION LICENCES avec real_users
    const getLicenseUsage = (licenseCount, licensesUsed, realUsers) => {
        if (!licenseCount) return null;
        
        const total = parseInt(licenseCount) || 0;
        const used = parseInt(licensesUsed) || 0;
        const real = parseInt(realUsers) || used; // Si pas de real_users, utiliser licensesUsed
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

    const getDaysUntilRenewal = (renewalDate) => {
        if (!renewalDate) return null;
        const today = new Date();
        const renewal = new Date(renewalDate);
        const diffTime = renewal - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                            onClick={exportToCSV}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                        >
                            <Download className="w-5 h-5" />
                            Exporter
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                        <span className="font-semibold text-indigo-600">{filteredContracts.length}</span> contrat(s) trouvé(s)
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                            Réinitialiser la recherche
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
                        {searchTerm || statusFilter !== 'all' 
                            ? 'Essayez de modifier vos critères de recherche'
                            : 'Commencez par créer votre premier contrat'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
                        >
                            Créer un contrat
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredContracts.map((contract) => {
                        const licenseUsage = getLicenseUsage(contract.license_count, contract.licenses_used, contract.real_users);
                        
                        return (
                            <div
                                key={contract.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-gray-100 hover:border-indigo-200"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Info principale */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{contract.name}</h3>
                                                {contract.provider && (
                                                    <p className="text-sm text-gray-600">{contract.provider}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {getStatusBadge(contract.status)}
                                                {licenseUsage?.isOverconsumed && (
                                                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold border-2 border-red-700 flex items-center gap-1 animate-pulse">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        SURCHARGE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Coût */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                                    <TrendingUp className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Coût mensuel</p>
                                                    <p className="text-lg font-bold text-gray-900">{parseFloat(contract.monthly_cost).toFixed(2)} €</p>
                                                </div>
                                            </div>

                                            {/* Renouvellement */}
                                            {contract.renewal_date && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                                        <Clock className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Renouvellement</p>
                                                        <div className="mt-1">{getRenewalBadge(contract.renewal_date)}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Licences */}
                                            {licenseUsage && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-10 h-10 ${licenseUsage.bgColor} rounded-lg flex items-center justify-center border-2 ${licenseUsage.borderColor}`}>
                                                        <Users className={`w-5 h-5 ${licenseUsage.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">
                                                            {licenseUsage.isOverconsumed ? 'Surconsommation' : 'Utilisation'}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-lg font-bold ${licenseUsage.color}`}>
                                                                {licenseUsage.real}/{licenseUsage.total}
                                                            </p>
                                                            {licenseUsage.isOverconsumed ? (
                                                                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                                                    +{licenseUsage.overused}
                                                                </span>
                                                            ) : (
                                                                <span className={`text-xs font-semibold ${licenseUsage.color}`}>
                                                                    ({licenseUsage.rate.toFixed(0)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex lg:flex-col gap-2">
                                        <button
                                            onClick={() => handleEdit(contract)}
                                            className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contract.id)}
                                            className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Formulaire */}
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