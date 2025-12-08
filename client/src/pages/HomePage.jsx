// client/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback } from 'react'; // <--- Ajout de useCallback
import { useAuth } from '../AuthContext';
import ContractForm from '../components/ContractForm'; // <--- NOUVEL IMPORT
import ContractList from '../components/ContractList';

const API_URL = 'http://localhost:5000/api/contracts';

const HomePage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // <--- État de la modal
    const { token, isAuthenticated } = useAuth();

    // Fonction pour récupérer les contrats
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
    }, [fetchContracts]); // Déclenchement au chargement et si les dépendances changent

    // Fonction de rappel après l'ajout d'un contrat réussi
    const handleContractAdded = (newContract) => {
        // Ajoute le nouveau contrat à la liste sans recharger toute la page
        setContracts((prevContracts) => [...prevContracts, newContract]);
    };
    
    // --- Logique d'affichage (reste inchangée sauf l'ajout du bouton) ---

    if (!isAuthenticated) {
        return (
            <div className="text-center p-10 bg-yellow-100 rounded-lg">
                <h1 className="text-2xl font-bold text-yellow-800">Accès Restreint</h1>
                <p className="text-gray-600 mt-2">Veuillez vous connecter pour voir et gérer vos contrats.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Aperçu des Contrats SaaS
                </h1>
                {/* 🌟 BOUTON D'AJOUT DE CONTRAT 🌟 */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
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

            {/* ... (Affichage des cartes de stats si vous les avez développées) ... */}

            {!loading && !error && <ContractList contracts={contracts} />}

            {/* 🌟 AFFICHAGE CONDITIONNEL DE LA MODALE 🌟 */}
            {isModalOpen && (
                <ContractForm 
                    onClose={() => setIsModalOpen(false)} 
                    onContractAdded={handleContractAdded} 
                />
            )}
        </div>
    );
};

export default HomePage;