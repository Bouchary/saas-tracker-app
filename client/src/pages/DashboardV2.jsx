// client/src/pages/DashboardV2.jsx
// ✅ NOUVEAU FICHIER - Dashboard principal avec architecture onglets

import React, { useState } from 'react';
import { BarChart3, FileText, Package, Users, Lightbulb } from 'lucide-react';
import GlobalView from '../components/dashboard/GlobalView';
import ContractsView from '../components/dashboard/ContractsView';
import AssetsView from '../components/dashboard/AssetsView';
import EmployeesView from '../components/dashboard/EmployeesView';
import InsightsView from '../components/dashboard/InsightsView';

const DashboardV2 = () => {
    const [activeTab, setActiveTab] = useState('global');

    const tabs = [
        { id: 'global', label: 'Vue Globale', icon: BarChart3, color: 'indigo' },
        { id: 'contracts', label: 'Contrats', icon: FileText, color: 'blue' },
        { id: 'assets', label: 'Matériel', icon: Package, color: 'green' },
        { id: 'employees', label: 'Employés', icon: Users, color: 'purple' },
        { id: 'insights', label: 'Recommandations', icon: Lightbulb, color: 'orange' }
    ];

    const getTabColor = (color, isActive) => {
        const colors = {
            indigo: isActive ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50',
            blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50',
            green: isActive ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50',
            purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50',
            orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'
        };
        return colors[color] || colors.indigo;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'global':
                return <GlobalView onTabChange={setActiveTab} />;
            case 'contracts':
                return <ContractsView />;
            case 'assets':
                return <AssetsView />;
            case 'employees':
                return <EmployeesView />;
            case 'insights':
                return <InsightsView />;
            default:
                return <GlobalView onTabChange={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-8 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <BarChart3 className="w-10 h-10" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">Dashboard Analytics 360°</h1>
                            <p className="text-indigo-100 text-sm mt-1">
                                Vue d'ensemble complète de votre infrastructure IT
                            </p>
                        </div>
                    </div>

                    {/* TABS NAVIGATION */}
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
                                        transition-all transform
                                        ${getTabColor(tab.color, isActive)}
                                        ${isActive ? 'shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20 text-white shadow-md'}
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default DashboardV2;