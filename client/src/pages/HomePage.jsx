// Fichier : saas-tracker-app/client/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const HomePage = () => {
    // Initialisation critique à un tableau vide
    const [contracts, setContracts] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logout } = useAuth();

    useEffect(() => {
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
                
                // Vérifie que la réponse est un tableau (ou un tableau extrait d'un objet)
                const contractsArray = Array.isArray(data) ? data : (data.contracts || []);

                setContracts(contractsArray); 

            } catch (err) {
                setError(err.message);
                console.error("Erreur de l'API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, [token, logout]);

    // Les méthodes sont sûres car contracts est un tableau
    const totalAmount = contracts.reduce((sum, contract) => sum + (contract.amount || 0), 0);
    const activeContracts = contracts.filter(c => c.status === 'active').length;
        
    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Chargement des contrats...</p>
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

            {/* Carte des Statistiques */}
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

            {/* Liste des Contrats */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Vos Contrats</h2>
                <Link to="/contracts/new" className="py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition">
                    + Ajouter un Contrat
                </Link>
            </div>

            {contracts.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 rounded-lg shadow-inner">
                    <p className="text-lg text-gray-500">Vous n'avez aucun contrat enregistré.</p>
                    <Link to="/contracts/new" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">
                        Commencer par en ajouter un !
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {contracts.map((contract) => ( 
                        <div key={contract.id} className="p-4 border rounded-md shadow-sm bg-white hover:border-indigo-400 transition">
                            <h3 className="text-xl font-medium">{contract.name || 'Contrat sans nom'}</h3>
                            <p className="text-gray-600">Montant: {contract.amount} € | Statut: {contract.status}</p>
                            <Link to={`/contracts/${contract.id}`} className="text-sm text-indigo-500 hover:text-indigo-700">Voir les détails</Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;