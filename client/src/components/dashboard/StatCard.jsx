// client/src/components/dashboard/StatCard.jsx
// ✅ NOUVEAU FICHIER - Composant Card pour KPIs Dashboard

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "indigo",
    loading = false 
}) => {
    const colorClasses = {
        indigo: {
            bg: "from-indigo-500 to-indigo-600",
            icon: "bg-indigo-100 text-indigo-600",
            text: "text-indigo-600"
        },
        green: {
            bg: "from-green-500 to-green-600",
            icon: "bg-green-100 text-green-600",
            text: "text-green-600"
        },
        orange: {
            bg: "from-orange-500 to-orange-600",
            icon: "bg-orange-100 text-orange-600",
            text: "text-orange-600"
        },
        red: {
            bg: "from-red-500 to-red-600",
            icon: "bg-red-100 text-red-600",
            text: "text-red-600"
        },
        blue: {
            bg: "from-blue-500 to-blue-600",
            icon: "bg-blue-100 text-blue-600",
            text: "text-blue-600"
        },
        purple: {
            bg: "from-purple-500 to-purple-600",
            icon: "bg-purple-100 text-purple-600",
            text: "text-purple-600"
        }
    };

    const colors = colorClasses[color] || colorClasses.indigo;

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                        {title}
                    </p>
                    <h3 className={`text-3xl font-bold ${colors.text}`}>
                        {value}
                    </h3>
                </div>
                {Icon && (
                    <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                {subtitle && (
                    <p className="text-sm text-gray-600">{subtitle}</p>
                )}
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${
                        trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {trend === 'up' ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        {trendValue}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;