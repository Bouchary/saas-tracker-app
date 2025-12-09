// client/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import ContractList from '../components/ContractList';
import ContractForm from '../components/ContractForm';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const HomePage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logout } = useAuth();

    // États pour l'édition et la suppression
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    // Fonction pour charger les contrats
    const fetchContracts = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/contracts`, {
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
            const contractsArray = Array.isArray(data) ? data : (data.contracts || []);
            setContracts(contractsArray);

        } catch (err) {
            setError(err.message);
            console.error("Erreur de l'API:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [token]);

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
        setContracts(prevContracts => 
            prevContracts.map(c => c.id === updatedContract.id ? updatedContract : c)
        );
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
            const response = await fetch(`${API_URL}/contracts/${contractToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du contrat.');
            }

            // Supprime le contrat de la liste locale
            setContracts(prevContracts => 
                prevContracts.filter(c => c.id !== contractToDelete.id)
            );

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

    // Calculs pour les statistiques
    const totalAmount = contracts.reduce((sum, contract) => sum + (parseFloat(contract.monthly_cost) || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'active').length;
        
    if (loading) {
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
                        {contracts.length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Contrats Actifs</p>
                    <p className="text-3xl font-semibold text-green-600 mt-1">
                        {activeContracts}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Montant Total (€)</p>
                    <p className="text-3xl font-semibold text-indigo-600 mt-1">
                        {totalAmount.toFixed(2)} €
                    </p>
                </div>
            </div>

            {/* En-tête avec bouton d'ajout */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Vos Contrats</h2>
                <Link 
                    to="/contracts/new" 
                    className="py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
                >
                    + Ajouter un Contrat
                </Link>
            </div>

            {/* Liste des contrats */}
            {contracts.length === 0 ? (
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
                <ContractList 
                    contracts={contracts}
                    onDeleteContract={handleDeleteClick}
                    onEditContract={handleEditContract}
                />
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