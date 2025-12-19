// client/src/components/dashboard/InsightsView.jsx
// ✅ PLACEHOLDER - Vue Recommandations (Tab 5) - À développer

import React from 'react';
import { Lightbulb, Construction } from 'lucide-react';

const InsightsView = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-100 text-center">
            <Construction className="w-20 h-20 text-orange-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Recommandations Intelligentes</h2>
            <p className="text-gray-600 text-lg mb-6">
                IA et insights pour optimiser vos coûts IT :
            </p>
            <div className="bg-orange-50 rounded-xl p-6 max-w-2xl mx-auto text-left">
                <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                        Recommandations d'économies
                    </li>
                    <li className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                        Détection anomalies automatique
                    </li>
                    <li className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                        Prédictions de coûts
                    </li>
                    <li className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                        Actions prioritaires
                    </li>
                    <li className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-orange-600" />
                        Alertes personnalisées
                    </li>
                </ul>
            </div>
            <p className="text-sm text-gray-500 mt-6">
                À implémenter dans Phase F
            </p>
        </div>
    );
};

export default InsightsView;