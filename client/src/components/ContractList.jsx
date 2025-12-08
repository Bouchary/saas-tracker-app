// client/src/components/ContractList.jsx

import React from 'react';

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

// Fonction utilitaire pour le badge de préavis
const getNoticePeriodBadge = (days) => {
    let color = 'bg-gray-100 text-gray-800';
    if (days >= 90) {
        color = 'bg-green-100 text-green-800';
    } else if (days >= 30) {
        color = 'bg-yellow-100 text-yellow-800';
    } else if (days > 0) {
        color = 'bg-red-100 text-red-800';
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
        {days} jours
    </span>;
};

const ContractList = ({ contracts }) => {
  if (contracts.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <p className="text-xl font-semibold text-gray-600">
            Aucun contrat trouvé.
        </p>
        <p className="mt-2 text-gray-500">
            Veuillez ajouter des données à votre base de données PostgreSQL.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl overflow-hidden rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Liste Détaillée des Abonnements</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Nom du Contrat</Th>
              <Th>Fournisseur</Th>
              <Th>Coût Mensuel (€)</Th>
              <Th>Date de Renouvellement</Th>
              <Th>Préavis</Th>
              <Th>Statut</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-indigo-50 transition duration-150">
                <Td className="font-medium text-gray-900">{contract.name}</Td>
                <Td>{contract.provider}</Td>
                <Td className="text-right">{contract.monthly_cost ? parseFloat(contract.monthly_cost).toFixed(2) : 'N/A'}</Td>
                <Td>{formatDate(contract.renewal_date)}</Td>
                <Td>{getNoticePeriodBadge(contract.notice_period_days)}</Td>
                <Td>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Actif
                    </span>
                </Td>
                <Td>
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                        Voir
                    </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Composant utilitaire pour l'en-tête de colonne
const Th = ({ children }) => (
    <th
        scope="col"
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
        {children}
    </th>
);

// Composant utilitaire pour les cellules de données
const Td = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>
        {children}
    </td>
);

export default ContractList;