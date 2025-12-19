// client/src/components/dashboard/GlobalView.jsx
// ✅ VERSION CORRIGÉE - Bouton Optimiser fonctionnel

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { 
    DollarSign, FileText, Package, Users, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, Target, Zap
} from 'lucide-react';
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { formatCurrency, formatNumber, formatPercent, calculateDifference } from '../../utils/formatters';
import API_URL from '../../config/api';

const GlobalView = ({ onTabChange }) => {
    const { token } = useAuth();
    
    // États
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('30d');

    // Couleurs
    const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

    useEffect(() => {
        fetchGlobalData();
    }, [period]);

    // ✅ NOUVEAU : Fonction pour gérer le bouton Optimiser
    const handleOptimize = (alertTarget) => {
        if (alertTarget === 'contracts' && onTabChange) {
            onTabChange('contrats');
        } else {
            // Fallback si onTabChange n'est pas fourni
            console.log('Optimisation suggérée pour:', alertTarget);
            alert('Navigation vers l\'onglet Contrats pour optimiser les licences');
        }
    };

    const fetchGlobalData = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`${API_URL}/api/dashboard/global?period=${period}`, { headers });
            
            if (!response.ok) {
                throw new Error('Erreur chargement données');
            }

            const result = await response.json();
            setData(result);

        } catch (err) {
            console.error('Erreur fetch global:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Erreur</h2>
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchGlobalData}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    // Données mockées pour développement (utilisées si pas de data de l'API)
    const mockData = {
        kpis: {
            totalCost: { current: 45680, previous: 42300, label: 'Coût IT Total/mois' },
            activeContracts: { current: 24, previous: 22, label: 'Contrats Actifs' },
            totalAssets: { current: 156, previous: 148, label: 'Assets en Parc' },
            activeEmployees: { current: 87, previous: 85, label: 'Employés Actifs' },
            costPerEmployee: { current: 525, previous: 498, label: 'Coût IT/Employé' },
            utilizationRate: { current: 73.5, previous: 68.2, label: 'Taux Utilisation' },
            potentialSavings: { current: 6890, previous: 7200, label: 'Économies Potentielles' },
            efficiency: { current: 82, previous: 78, label: 'Score Efficacité' }
        },
        departmentCosts: [
            { name: 'IT', cost: 12500, employees: 15, costPerEmployee: 833 },
            { name: 'Marketing', cost: 8900, employees: 18, costPerEmployee: 494 },
            { name: 'Sales', cost: 7600, employees: 22, costPerEmployee: 345 }
        ],
        costDistribution: [
            { name: 'Contrats SaaS', value: 28400, percent: 62.2 },
            { name: 'Matériel', value: 12200, percent: 26.7 },
            { name: 'Maintenance', value: 5080, percent: 11.1 }
        ],
        monthlyTrend: [
            { month: 'Oct', contracts: 41200, assets: 11000, total: 52200 },
            { month: 'Nov', contracts: 42800, assets: 11800, total: 54600 },
            { month: 'Déc', contracts: 43600, assets: 12400, total: 56000 }
        ],
        alerts: []
    };

    const displayData = data || mockData;

    return (
        <div className="space-y-8">
            {/* FILTRES PÉRIODE */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Période d'analyse</h2>
                        <p className="text-sm text-gray-600">Sélectionnez la période pour les comparaisons</p>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { value: '7d', label: '7 jours' },
                            { value: '30d', label: '30 jours' },
                            { value: '90d', label: '90 jours' },
                            { value: '12m', label: '12 mois' }
                        ].map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`
                                    px-4 py-2 rounded-lg font-semibold transition-all
                                    ${period === p.value 
                                        ? 'bg-indigo-600 text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                `}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPIS PRINCIPAUX */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Coût IT Total"
                    value={formatCurrency(displayData.kpis.totalCost.current, 0)}
                    subtitle="par mois"
                    icon={DollarSign}
                    color="indigo"
                    trend={calculateDifference(displayData.kpis.totalCost.current, displayData.kpis.totalCost.previous).trend}
                    trendValue={calculateDifference(displayData.kpis.totalCost.current, displayData.kpis.totalCost.previous).formatted}
                    loading={loading}
                />
                <StatCard
                    title="Coût/Employé"
                    value={formatCurrency(displayData.kpis.costPerEmployee.current, 0)}
                    subtitle="par mois"
                    icon={Users}
                    color="purple"
                    trend={calculateDifference(displayData.kpis.costPerEmployee.current, displayData.kpis.costPerEmployee.previous).trend}
                    trendValue={calculateDifference(displayData.kpis.costPerEmployee.current, displayData.kpis.costPerEmployee.previous).formatted}
                    loading={loading}
                />
                <StatCard
                    title="Économies Potentielles"
                    value={formatCurrency(displayData.kpis.potentialSavings.current, 0)}
                    subtitle="à réaliser"
                    icon={TrendingUp}
                    color="green"
                    trend="down"
                    trendValue={calculateDifference(displayData.kpis.potentialSavings.current, displayData.kpis.potentialSavings.previous).formatted}
                    loading={loading}
                />
                <StatCard
                    title="Score Efficacité"
                    value={`${displayData.kpis.efficiency.current}/100`}
                    subtitle={`Taux utilisation ${formatPercent(displayData.kpis.utilizationRate.current)}`}
                    icon={Target}
                    color="orange"
                    trend={calculateDifference(displayData.kpis.efficiency.current, displayData.kpis.efficiency.previous).trend}
                    trendValue={calculateDifference(displayData.kpis.efficiency.current, displayData.kpis.efficiency.previous).formatted}
                    loading={loading}
                />
            </div>

            {/* KPIS SECONDAIRES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Contrats Actifs"
                    value={formatNumber(displayData.kpis.activeContracts.current)}
                    subtitle={`+${displayData.kpis.activeContracts.current - displayData.kpis.activeContracts.previous} vs période précédente`}
                    icon={FileText}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Assets en Parc"
                    value={formatNumber(displayData.kpis.totalAssets.current)}
                    subtitle={`+${displayData.kpis.totalAssets.current - displayData.kpis.totalAssets.previous} nouveaux assets`}
                    icon={Package}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Employés Actifs"
                    value={formatNumber(displayData.kpis.activeEmployees.current)}
                    subtitle={`${displayData.kpis.totalAssets.current} assets / ${displayData.kpis.activeEmployees.current} employés`}
                    icon={Users}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Taux Utilisation"
                    value={formatPercent(displayData.kpis.utilizationRate.current)}
                    subtitle="licences et assets"
                    icon={CheckCircle}
                    color={displayData.kpis.utilizationRate.current >= 80 ? 'green' : 'orange'}
                    loading={loading}
                />
            </div>

            {/* ALERTES RAPIDES - BOUTON OPTIMISER FONCTIONNEL */}
            {displayData.alerts && displayData.alerts.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900">Actions Prioritaires</h3>
                    </div>
                    <div className="space-y-3">
                        {displayData.alerts.map((alert, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    {alert.type === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                                    {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                                    {alert.type === 'info' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                    <p className="text-gray-900">{alert.message}</p>
                                </div>
                                <button 
                                    onClick={() => handleOptimize(alert.target || 'contracts')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
                                >
                                    {alert.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coûts par département */}
                <ChartCard
                    title="Coûts IT par Département"
                    subtitle="Répartition mensuelle"
                    icon={TrendingUp}
                    loading={loading}
                >
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={displayData.departmentCosts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                                formatter={(value) => formatCurrency(value, 0)}
                                contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                            />
                            <Bar dataKey="cost" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Coût" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Distribution des coûts */}
                <ChartCard
                    title="Distribution des Coûts"
                    subtitle="Par catégorie"
                    icon={DollarSign}
                    loading={loading}
                >
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={displayData.costDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label={(entry) => `${entry.name}: ${formatCurrency(entry.value, 0)}`}
                            >
                                {displayData.costDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value, 0)} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Évolution temporelle */}
            <ChartCard
                title="Évolution des Coûts IT"
                subtitle="Derniers 6 mois"
                icon={TrendingUp}
                loading={loading}
            >
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={displayData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                            formatter={(value) => formatCurrency(value, 0)}
                            contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="contracts" stroke="#4F46E5" strokeWidth={3} name="Contrats" />
                        <Line type="monotone" dataKey="assets" stroke="#10B981" strokeWidth={3} name="Assets" />
                        <Line type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={3} name="Total" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Coût par employé par département */}
            <ChartCard
                title="Coût IT par Employé"
                subtitle="Comparaison départements"
                icon={Users}
                loading={loading}
            >
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={displayData.departmentCosts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                            formatter={(value) => formatCurrency(value, 0)}
                            contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                        />
                        <Bar dataKey="costPerEmployee" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Coût/Employé" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};

export default GlobalView;