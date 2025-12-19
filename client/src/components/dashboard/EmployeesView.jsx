// client/src/components/dashboard/EmployeesView.jsx
// ✅ PLACEHOLDER - Vue Employés (Tab 4) - À développer

import React from 'react';
import { Users, Construction } from 'lucide-react';

const EmployeesView = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-100 text-center">
            <Construction className="w-20 h-20 text-purple-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Vue Employés</h2>
            <p className="text-gray-600 text-lg mb-6">
                Analytics RH et coûts IT par employé :
            </p>
            <div className="bg-purple-50 rounded-xl p-6 max-w-2xl mx-auto text-left">
                <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Répartition par département
                    </li>
                    <li className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Coût IT moyen par employé
                    </li>
                    <li className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Top utilisateurs d'assets
                    </li>
                    <li className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Corrélation turnover ↔ assets
                    </li>
                    <li className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Analyse coûts par poste
                    </li>
                </ul>
            </div>
            <p className="text-sm text-gray-500 mt-6">
                À implémenter dans Phase E
            </p>
        </div>
    );
};

export default EmployeesView;