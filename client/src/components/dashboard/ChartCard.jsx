// client/src/components/dashboard/ChartCard.jsx
// ✅ NOUVEAU FICHIER - Wrapper pour graphiques Recharts

import React from 'react';

const ChartCard = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    children, 
    loading = false,
    actions 
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-2xl transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        {subtitle && (
                            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Chart Content */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default ChartCard;