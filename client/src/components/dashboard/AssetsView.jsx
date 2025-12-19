// client/src/components/dashboard/AssetsView.jsx
// ✅ PLACEHOLDER - Vue Assets (Tab 3) - À développer

import React from 'react';
import { Package, Construction } from 'lucide-react';

const AssetsView = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-100 text-center">
            <Construction className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Vue Matériel</h2>
            <p className="text-gray-600 text-lg mb-6">
                Analytics complètes sur votre parc matériel :
            </p>
            <div className="bg-green-50 rounded-xl p-6 max-w-2xl mx-auto text-left">
                <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Inventaire par type (laptops, téléphones, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Taux d'assignation et disponibilité
                    </li>
                    <li className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Valeur totale du parc
                    </li>
                    <li className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Garanties expirant sous 30j
                    </li>
                    <li className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Coûts maintenance par type
                    </li>
                </ul>
            </div>
            <p className="text-sm text-gray-500 mt-6">
                À implémenter dans Phase D
            </p>
        </div>
    );
};

export default AssetsView;