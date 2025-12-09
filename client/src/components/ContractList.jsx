// client/src/components/ContractList.jsx

import React from 'react';
import { Edit, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

// Fonction pour calculer le statut et les jours restants
const getStatusAndDays = (renewalDate, noticePeriodDays) => {
    if (!renewalDate) {
        return { status: 'Inconnu', color: 'gray', daysLeft: 'N/A', badgeText: 'N/A' };
    }

    const today = new Date();
    const renewal = new Date(renewalDate);
    
    const deadline = new Date(renewal);
    deadline.setDate(renewal.getDate() - noticePeriodDays);

    const msInDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / msInDay);

    let status = 'Actif';
    let color = 'green';
    let badgeText = `${daysLeft} jours restants`;

    if (daysLeft <= 0) {
        status = 'Renouvellement Imminent';
        color = 'red';
        badgeText = 'Préavis Dépassé';
    } else if (daysLeft <= 30) {
        status = 'Alerte Préavis';
        color = 'yellow';
        badgeText = `${daysLeft} j. restants`;
    } else if (daysLeft > 365) {
        status = 'Long Terme';
        color = 'blue';
        badgeText = 'Lointain';
    }

    return { status, color, daysLeft, badgeText };
};

// Fonction pour obtenir les classes de couleur complètes
const getColorClasses = (status) => {
    switch (status) {
        case 'Renouvellement Imminent':
            return { badge: 'bg-red-100 text-red-800', row: 'bg-red-50 hover:bg-red-100' };
        case 'Alerte Préavis':
            return { badge: 'bg-yellow-100 text-yellow-800', row: 'bg-yellow-50 hover:bg-yellow-100' };
        case 'Actif':
        case 'Long Terme':
            return { badge: 'bg-green-100 text-green-800', row: 'hover:bg-green-50' };
        default:
            return { badge: 'bg-gray-100 text-gray-800', row: 'hover:bg-gray-50' };
    }
};

const getStatusBadge = (status) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (status === 'Alerte Préavis') colorClass = 'bg-yellow-100 text-yellow-800';
    else if (status === 'Renouvellement Imminent') colorClass = 'bg-red-100 text-red-800';
    else if (status === 'Actif' || status === 'Long Terme') colorClass = 'bg-green-100 text-green-800';
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {status}
    </span>;
};

const ContractList = ({ 
    contracts, 
    onDeleteContract, 
    onEditContract,
    sortBy,
    sortOrder,
    onSort
}) => {
    if (contracts.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
                <p className="text-xl font-semibold text-gray-600">
                    Aucun contrat trouvé.
                </p>
                <p className="mt-2 text-gray-500">
                    Utilisez le bouton "Ajouter un Contrat" pour commencer ou modifiez vos filtres.
                </p>
            </div>
        );
    }

    // Fonction pour gérer le clic sur un en-tête de colonne
    const handleSort = (field) => {
        if (sortBy === field) {
            // Si on clique sur la même colonne, inverser l'ordre
            onSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Nouvelle colonne, tri ascendant par défaut
            onSort(field, 'asc');
        }
    };

    // Composant pour l'icône de tri
    const SortIcon = ({ field }) => {
        if (sortBy !== field) {
            return <ArrowUpDown className="w-4 h-4 opacity-50" />;
        }
        return sortOrder === 'asc' 
            ? <ArrowUp className="w-4 h-4 text-indigo-600" />
            : <ArrowDown className="w-4 h-4 text-indigo-600" />;
    };

    return (
        <div className="bg-white shadow-xl overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <ThSortable field="name" sortBy={sortBy} onSort={handleSort}>
                                Nom <SortIcon field="name" />
                            </ThSortable>
                            <ThSortable field="monthly_cost" sortBy={sortBy} onSort={handleSort}>
                                Coût (€) <SortIcon field="monthly_cost" />
                            </ThSortable>
                            <ThSortable field="renewal_date" sortBy={sortBy} onSort={handleSort}>
                                Renouvellement <SortIcon field="renewal_date" />
                            </ThSortable>
                            <ThSortable field="notice_period_days" sortBy={sortBy} onSort={handleSort}>
                                Préavis (J) <SortIcon field="notice_period_days" />
                            </ThSortable>
                            <ThSortable field="status" sortBy={sortBy} onSort={handleSort}>
                                Statut <SortIcon field="status" />
                            </ThSortable>
                            <Th>Jours Restants</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map((contract) => {
                            const { status, badgeText } = getStatusAndDays(
                                contract.renewal_date, 
                                contract.notice_period_days
                            );
                            
                            const { row: rowClasses } = getColorClasses(status);

                            return (
                                <tr key={contract.id} className={rowClasses}>
                                    <Td className="font-medium text-gray-900">{contract.name}</Td>
                                    <Td className="text-right">{parseFloat(contract.monthly_cost).toFixed(2)}</Td>
                                    <Td>{formatDate(contract.renewal_date)}</Td>
                                    <Td>{contract.notice_period_days} j.</Td>
                                    <Td>{getStatusBadge(status)}</Td>
                                    <Td>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClasses(status).badge}`}>
                                            {badgeText}
                                        </span>
                                    </Td>
                                    <Td className="flex items-center space-x-3">
                                        <button 
                                            onClick={() => onEditContract(contract)}
                                            className="text-gray-600 hover:text-indigo-600 font-medium text-sm flex items-center transition duration-150"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Éditer
                                        </button>
                                        <button 
                                            onClick={() => onDeleteContract(contract.id, contract.name)}
                                            className="text-gray-600 hover:text-red-600 font-medium text-sm flex items-center transition duration-150"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Supprimer
                                        </button>
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Composant pour l'en-tête de colonne (non triable)
const Th = ({ children }) => (
    <th
        scope="col"
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
    >
        {children}
    </th>
);

// Composant pour l'en-tête de colonne triable
const ThSortable = ({ field, sortBy, onSort, children }) => (
    <th
        scope="col"
        onClick={() => onSort(field)}
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none"
    >
        <div className="flex items-center gap-1">
            {children}
        </div>
    </th>
);

// Composant pour les cellules de données
const Td = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>
        {children}
    </td>
);

export default ContractList;