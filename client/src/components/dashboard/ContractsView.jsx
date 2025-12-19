// client/src/components/dashboard/ContractsView.jsx
// ✅ PLACEHOLDER - Vue Contrats (Tab 2) - À développer

import React from 'react';
import { FileText, Construction } from 'lucide-react';

const ContractsView = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-100 text-center">
            <Construction className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Vue Contrats</h2>
            <p className="text-gray-600 text-lg mb-6">
                Cette section intégrera votre dashboard Contrats existant + nouvelles fonctionnalités :
            </p>
            <div className="bg-indigo-50 rounded-xl p-6 max-w-2xl mx-auto text-left">
                <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Dashboard licences existant (réutilisé)
                    </li>
                    <li className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Filtres période (7j/30j/90j/12mois)
                    </li>
                    <li className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Comparaisons temporelles
                    </li>
                    <li className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Export PDF professionnel
                    </li>
                </ul>
            </div>
            <p className="text-sm text-gray-500 mt-6">
                À implémenter dans Phase B
            </p>
        </div>
    );
};

export default ContractsView;