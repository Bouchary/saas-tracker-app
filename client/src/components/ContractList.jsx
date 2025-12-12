// client/src/components/ContractList.jsx
// Version avec colonne LICENCES + taux d'utilisation

import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Paperclip, Users, AlertTriangle } from 'lucide-react';

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

// ✨ NOUVELLE : Fonction pour calculer le taux d'utilisation des licences
const getLicenseUsage = (licenseCount, licensesUsed) => {
    if (!licenseCount || licenseCount === 0) return null;
    
    const used = licensesUsed || 0;
    const rate = (used / licenseCount) * 100;
    
    let color = 'green';
    let status = 'Excellent';
    
    if (rate < 50) {
        color = 'red';
        status = 'Gaspillage';
    } else if (rate < 80) {
        color = 'orange';
        status = 'Moyen';
    }
    
    return { rate: rate.toFixed(0), color, status, used, total: licenseCount };
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
            onSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
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
                            <Th>Fournisseur</Th>
                            {/* ✨ NOUVELLE COLONNE LICENCES */}
                            <Th>Licences</Th>
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
                            
                            // ✨ CALCUL UTILISATION LICENCES
                            const licenseUsage = getLicenseUsage(
                                contract.license_count, 
                                contract.licenses_used
                            );

                            return (
                                <tr key={contract.id} className={`${rowClasses} transition-colors`}>
                                    {/* Nom */}
                                    <Td>
                                        <div className="flex items-center">
                                            <div className="font-medium text-gray-900">{contract.name}</div>
                                            {contract.provider && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    {contract.provider}
                                                </span>
                                            )}
                                        </div>
                                    </Td>

                                    {/* Fournisseur */}
                                    <Td>
                                        <span className="text-sm text-gray-600">
                                            {contract.provider || '-'}
                                        </span>
                                    </Td>

                                    {/* ✨ LICENCES */}
                                    <Td>
                                        {contract.pricing_model === 'per_user' && contract.license_count ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-sm font-semibold">
                                                        {licenseUsage ? `${licenseUsage.used}/${licenseUsage.total}` : contract.license_count}
                                                    </span>
                                                </div>
                                                {licenseUsage && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Barre de progression */}
                                                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all ${
                                                                    licenseUsage.color === 'green' ? 'bg-green-500' :
                                                                    licenseUsage.color === 'orange' ? 'bg-orange-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                                style={{ width: `${licenseUsage.rate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-medium ${
                                                            licenseUsage.color === 'green' ? 'text-green-600' :
                                                            licenseUsage.color === 'orange' ? 'text-orange-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {licenseUsage.rate}%
                                                        </span>
                                                    </div>
                                                )}
                                                {licenseUsage && licenseUsage.rate < 50 && (
                                                    <div className="flex items-center gap-1 text-xs text-red-600">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span>Gaspillage</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </Td>

                                    {/* Coût */}
                                    <Td>
                                        <div className="text-sm">
                                            <span className="font-semibold text-gray-900">
                                                {parseFloat(contract.monthly_cost).toFixed(2)}€
                                            </span>
                                            {contract.pricing_model === 'per_user' && contract.unit_cost && (
                                                <div className="text-xs text-gray-500">
                                                    {parseFloat(contract.unit_cost).toFixed(2)}€/licence
                                                </div>
                                            )}
                                        </div>
                                    </Td>

                                    {/* Renouvellement */}
                                    <Td>
                                        <span className="text-sm text-gray-900">
                                            {formatDate(contract.renewal_date)}
                                        </span>
                                    </Td>

                                    {/* Préavis */}
                                    <Td>
                                        <span className="text-sm text-gray-900">
                                            {contract.notice_period_days || 0}
                                        </span>
                                    </Td>

                                    {/* Statut */}
                                    <Td>{getStatusBadge(status)}</Td>

                                    {/* Jours Restants */}
                                    <Td>
                                        <span className="text-sm text-gray-900 font-medium">
                                            {badgeText}
                                        </span>
                                    </Td>

                                    {/* Actions */}
                                    <Td>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onEditContract(contract)}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 hover:bg-indigo-50 rounded"
                                                title="Modifier"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteContract(contract.id, contract.name)}
                                                className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/contracts/${contract.id}/documents`}
                                                className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-50 rounded"
                                                title="Documents"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </Link>
                                        </div>
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

// ✅ Composants d'en-tête (identiques)
const ThSortable = ({ field, sortBy, onSort, children }) => (
    <th
        onClick={() => onSort(field)}
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
    >
        <div className="flex items-center gap-1">
            {children}
        </div>
    </th>
);

const Th = ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {children}
    </th>
);

const Td = ({ children }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm">
        {children}
    </td>
);

export default ContractList;
