// client/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import ContractList from '../components/ContractList';

const HomePage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        // NOTE: Le port 5000 est défini dans server/.env
        const response = await fetch('http://localhost:5000/api/contracts');
        
        if (!response.ok) {
          // Lève une erreur si la réponse HTTP n'est pas OK (e.g., 404, 500)
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setContracts(data);
      } catch (err) {
        console.error("Échec de la récupération des contrats:", err);
        setError(`Impossible de se connecter à l'API (${err.message}). Assurez-vous que le serveur tourne et que la BD est configurée.`);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">
        Aperçu des Contrats SaaS
      </h1>

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
          {/* Ici, nous pouvons ajouter des statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Contrats Actifs" value={contracts.length} color="indigo" />
            <StatCard title="Coût Mensuel Est." value="XX.XX €" color="green" />
            <StatCard title="Prochain Renouvellement" value="JJ/MM/AAAA" color="yellow" />
          </div>

          <ContractList contracts={contracts} />
        </>
      )}
    </div>
  );
};

// Composant utilitaire pour les statistiques
const StatCard = ({ title, value, color }) => (
    <div className={`p-5 bg-white rounded-xl shadow-lg border-l-4 border-${color}-600`}>
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);


export default HomePage;