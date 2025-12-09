// client/src/components/AdvancedFilters.jsx

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

const AdvancedFilters = ({ onApply, minCost = 0, maxCost = 1000 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [minValue, setMinValue] = useState(minCost);
    const [maxValue, setMaxValue] = useState(maxCost);

    const handleApply = () => {
        onApply({ minCost: minValue, maxCost: maxValue });
        setIsOpen(false);
    };

    const handleReset = () => {
        setMinValue(0);
        setMaxValue(1000);
        onApply({ minCost: 0, maxCost: 1000 });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    minValue > 0 || maxValue < 1000
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres avancés
                {(minValue > 0 || maxValue < 1000) && (
                    <span className="bg-white text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        1
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-50 w-80">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Plage de Montants</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Montant minimum (€)
                            </label>
                            <input
                                type="number"
                                value={minValue}
                                onChange={(e) => setMinValue(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Montant maximum (€)
                            </label>
                            <input
                                type="number"
                                value={maxValue}
                                onChange={(e) => setMaxValue(parseFloat(e.target.value) || 1000)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="pt-4 border-t flex justify-between">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedFilters;