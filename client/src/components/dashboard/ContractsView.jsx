// ============================================================================
// CONTRACTS VIEW - VERSION RÉELLE AVEC APPELS API
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { FileText, DollarSign, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import API_URL from '../../config/api';

const ContractsView = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`${API_URL}/api/dashboard/contracts`, { headers });
            
            if (!response.ok) {
                throw new Error('Erreur chargement données contrats');
            }

            const result = await response.json();
            setData(result);

        } catch (err) {
            console.error('Erreur fetch contracts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Erreur</h2>
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!data && !loading) {
        return <div className="text-center py-12">Aucune donnée disponible</div>;
    }

    const totalCost = data?.providers?.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0) || 0;
    const totalProviders = data?.providers?.length || 0;
    const expiringSoon = data?.expiringSoon?.length || 0;
    const totalContracts = data?.topContracts?.length || 0;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Coût Total Contrats"
                    value={formatCurrency(totalCost, 0)}
                    subtitle="par mois"
                    icon={DollarSign}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Fournisseurs"
                    value={formatNumber(totalProviders)}
                    subtitle="actifs"
                    icon={Package}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Contrats Actifs"
                    value={formatNumber(totalContracts)}
                    subtitle="en cours"
                    icon={FileText}
                    color="indigo"
                    loading={loading}
                />
                <StatCard
                    title="Renouvellements"
                    value={formatNumber(expiringSoon)}
                    subtitle="sous 30 jours"
                    icon={AlertCircle}
                    color={expiringSoon > 0 ? 'orange' : 'green'}
                    loading={loading}
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top fournisseurs */}
                <ChartCard
                    title="Top Fournisseurs par Coût"
                    subtitle="Coût mensuel total"
                    icon={TrendingUp}
                    loading={loading}
                >
                    {data?.providers && data.providers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data.providers.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="provider" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value, 0)}
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="total_cost" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Coût" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucun fournisseur
                        </div>
                    )}
                </ChartCard>

                {/* Modèles de tarification */}
                <ChartCard
                    title="Modèles de Tarification"
                    subtitle="Répartition par type"
                    icon={DollarSign}
                    loading={loading}
                >
                    {data?.pricingModels && data.pricingModels.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={data.pricingModels}
                                    dataKey="total_cost"
                                    nameKey="pricing_model"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={(entry) => `${entry.pricing_model}: ${formatCurrency(entry.total_cost, 0)}`}
                                >
                                    {data.pricingModels.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value, 0)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucun modèle de tarification
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Top contrats */}
            <ChartCard
                title="Top 10 Contrats par Coût"
                subtitle="Contrats les plus coûteux"
                icon={FileText}
                loading={loading}
            >
                {data?.topContracts && data.topContracts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.topContracts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                                formatter={(value) => formatCurrency(value, 0)}
                                contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                            />
                            <Bar dataKey="monthly_cost" fill="#10B981" radius={[8, 8, 0, 0]} name="Coût mensuel" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Aucun contrat
                    </div>
                )}
            </ChartCard>

            {/* Alertes renouvellement */}
            {data?.expiringSoon && data.expiringSoon.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                            Renouvellements à venir (30 jours)
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {data.expiringSoon.map((contract, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">{contract.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {contract.provider} - Renouvellement: {new Date(contract.renewal_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-gray-900">{formatCurrency(contract.monthly_cost, 0)}</p>
                                    <p className="text-sm text-gray-600">par mois</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsView;