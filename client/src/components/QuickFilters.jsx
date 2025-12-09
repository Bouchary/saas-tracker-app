// client/src/components/QuickFilters.jsx

import React from 'react';
import { Zap, Clock, TrendingUp } from 'lucide-react';

const QuickFilters = ({ onFilterSelect, activeFilter }) => {
    const filters = [
        {
            id: 'all',
            label: 'Tous',
            icon: <Zap className="w-4 h-4" />,
            color: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
            activeColor: 'bg-slate-800 text-white border border-slate-800 shadow-lg',
        },
        {
            id: 'expiring',
            label: 'Expire bientôt (≤30j)',
            icon: <Clock className="w-4 h-4" />,
            color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
            activeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-lg',
        },
        {
            id: 'expensive',
            label: 'Coûteux (>moyenne)',
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
            activeColor: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-none shadow-lg',
        },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600 mr-1">
                Filtres rapides :
            </span>
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterSelect(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeFilter === filter.id ? filter.activeColor : filter.color
                    }`}
                >
                    {filter.icon}
                    <span className="text-sm">{filter.label}</span>
                </button>
            ))}
        </div>
    );
};

export default QuickFilters;