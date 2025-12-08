// client/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import ContractForm from '../components/ContractForm';
import ContractList from '../components/ContractList';
import { Plus } from 'lucide-react'; // 🌟 NOUVEL IMPORT LUCIDE 🌟

const API_URL = 'http://localhost:5000/api/contracts';

// 🌟 NOUVELLE FONCTION UTILITAIRE DE FORMATAGE 🌟
const formatCurrency = (amount) => {
    // Utilise la locale française (fr-FR) pour la séparation des milliers et la virgule décimale
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Composant utilitaire pour les cartes de statistiques
const StatCard = ({ title, value, color }) => (
    <div className={`p-5 bg-white rounded-xl shadow-lg border-l-4 border-${color}-600`}>
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);


const HomePage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState(null);
    const { token, isAuthenticated } = useAuth();
    
    // CALCUL DES MÉTRIQUES
    const totalMonthlyCost = contracts.reduce((sum, contract) => {
        const cost = parseFloat(contract.monthly_cost) || 0;
        return sum + cost;
    }, 0);

    const totalAnnualCost = totalMonthlyCost * 12;
    const activeContractsCount = contracts.length;
    
    // Déterminer la prochaine date de renouvellement critique (utilisé pour les stats)
    const nextRenewal = contracts.length > 0
        ? contracts.reduce((minContract, currentContract) => {
            const minDate = new Date(minContract.renewal_date);
            const currentDate = new Date(currentContract.renewal_date);
            return currentDate < minDate ? currentContract : minContract;
          }, contracts[0]).renewal_date
        : null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    // Fonction pour récupérer les contrats (inchangée)
    const fetchContracts = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Session expirée ou non autorisée. Veuillez vous reconnecter.");
                }
                throw new Error("Erreur de connexion à l'API.");
            }

            const data = await response.json();
            setContracts(data);
        } catch (err) {
            console.error(err);
            setError(`⚠️ Erreur: ${err.message || "Impossible de récupérer les contrats."}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    // Chargement initial des contrats
    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    // Gestion de la modal et des actions (inchangée)
    const openEditModal = (contract) => {
        setContractToEdit(contract);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setContractToEdit(null);
        setIsModalOpen(false);
    };
    
    // Gestion de la mise à jour/création (inchangée)
    const handleContractAddedOrUpdated = (updatedContract) => {
        setContracts((prevContracts) => {
            const isExisting = prevContracts.some(c => c.id === updatedContract.id);
            let updatedList;
            
            if (isExisting) {
                updatedList = prevContracts.map(c => 
                    c.id === updatedContract.id ? updatedContract : c
                );
            } else {
                updatedList = [...prevContracts, updatedContract];
            }

            return updatedList.sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date));
        });
    };
    
    // Gérer la suppression du contrat (inchangée)
    const handleDeleteContract = async (contractId, contractName) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le contrat "${contractName}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${contractId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 204) {
                setContracts((prevContracts) =>
                    prevContracts.filter(c => c.id !== contractId)
                );
            } else if (response.status === 404) {
                setError('Contrat non trouvé ou vous n\'êtes pas autorisé à le supprimer.');
            } else {
                throw new Error('Erreur serveur lors de la suppression.');
            }

        } catch (err) {
            console.error('Erreur suppression:', err);
            setError(err.message);
        }
    };

    // --- Rendu conditionnel pour l'utilisateur non connecté ---
    if (!isAuthenticated) {
        return (
            <div className="text-center p-10 bg-yellow-100 rounded-lg">
                <h1 className="text-2xl font-bold text-yellow-800">Accès Restreint</h1>
                <p className="text-gray-600 mt-2">Veuillez vous connecter pour voir et gérer vos contrats.</p>
            </div>
        );
    }
    
    // --- Rendu principal ---
    return (
        <div className="space-y-6">
            
            <div className="flex justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Aperçu des Contrats SaaS
                </h1>
                <button
                    onClick={() => openEditModal(null)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                >
                    {/* 🌟 ICÔNE MODERNE PLUS 🌟 */}
                    <Plus className="w-5 h-5 mr-2" /> 
                    Ajouter un Contrat
                </button>
            </div>

            {loading && (
                <div className="p-4 bg-indigo-100 text-indigo-800 rounded-lg">
                    Chargement des données...
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                    ⚠️ Erreur: {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* AFFICHAGE DES CARTES DE STATISTIQUES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard 
                            title="Coût Mensuel Total" 
                            value={`${formatCurrency(totalMonthlyCost)} €`} 
                            color="indigo" 
                        />
                        <StatCard 
                            title="Coût Annuel Estimé" 
                            value={`${formatCurrency(totalAnnualCost)} €`} 
                            color="green" 
                        />
                        <StatCard 
                            title="Contrats Actifs" 
                            value={activeContractsCount} 
                            color="yellow" 
                        />
                    </div>
                    
                    {/* Liste des Contrats */}
                    <ContractList 
                        contracts={contracts} 
                        onDeleteContract={handleDeleteContract} 
                        onEditContract={openEditModal} 
                    />
                </>
            )}

            {/* Affichage conditionnel de la modale */}
            {isModalOpen && (
                <ContractForm 
                    onClose={handleCloseModal} 
                    onContractAdded={handleContractAddedOrUpdated} 
                    contractToEdit={contractToEdit}
                />
            )}
        </div>
    );
};

export default HomePage;