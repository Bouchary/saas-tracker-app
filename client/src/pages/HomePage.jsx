// client/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext'; // <--- NOUVEL IMPORT

const API_URL = 'http://localhost:5000/api/contracts';

const HomePage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, isAuthenticated } = useAuth(); // <--- Utilisation du contexte d'auth

    useEffect(() => {
        if (!isAuthenticated) {
            // Si pas connecté, on n'essaie pas de charger les données
            setLoading(false);
            return;
        }

        const fetchContracts = async () => {
            setError(null);
            setLoading(true);
            try {
                const response = await fetch(API_URL, {
                    // 🌟 AJOUT DU JETON JWT DANS L'EN-TÊTE 🌟
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // Le serveur répondra 401 si le token est invalide
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
        };

        fetchContracts();
    }, [isAuthenticated, token]); // Re-charger si l'état d'auth ou le token change

    if (!isAuthenticated) {
        return (
            <div className="text-center p-10 bg-yellow-100 rounded-lg">
                <h1 className="text-2xl font-bold text-yellow-800">Accès Restreint</h1>
                <p className="text-gray-600 mt-2">Veuillez vous connecter pour voir et gérer vos contrats.</p>
            </div>
        );
    }
    
    // ... (Reste de la logique de chargement et d'affichage)
    
    if (loading) {
        return <div className="text-center p-8">Chargement des contrats...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600 bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <div className="mt-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Tableau de Bord des Contrats</h1>
            {contracts.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-lg text-gray-500">Aucun contrat trouvé. Commencez par en ajouter un !</p>
                </div>
            ) : (
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        {/* ... Le reste du tableau (Tête et Corps) ... */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nom</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fournisseur</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Coût Mensuel</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Renouvellement</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {contracts.map((contract) => (
                                <tr key={contract.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{contract.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{contract.provider || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{contract.monthly_cost} €</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(contract.renewal_date).toLocaleDateString()}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <a href="#" className="text-indigo-600 hover:text-indigo-900">Éditer</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HomePage;