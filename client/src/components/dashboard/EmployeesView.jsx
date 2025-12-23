// ============================================================================
// EMPLOYEES VIEW - VERSION RÉELLE AVEC APPELS API
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Users, Briefcase, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { formatNumber } from '../../utils/formatters';
import API_URL from '../../config/api';

const EmployeesView = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

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

            const response = await fetch(`${API_URL}/api/dashboard/employees`, { headers });
            
            if (!response.ok) {
                throw new Error('Erreur chargement données employés');
            }

            const result = await response.json();
            setData(result);

        } catch (err) {
            console.error('Erreur fetch employees:', err);
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

    const totalEmployees = data?.byDepartment?.reduce((sum, d) => sum + parseInt(d.count || 0), 0) || 0;
    const totalPositions = data?.byPosition?.length || 0;
    const topAssetHoldersCount = data?.topAssetHolders?.length || 0;
    const totalAssetsAssigned = data?.topAssetHolders?.reduce((sum, h) => sum + parseInt(h.asset_count || 0), 0) || 0;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employés"
                    value={formatNumber(totalEmployees)}
                    subtitle="actifs"
                    icon={Users}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Départements"
                    value={formatNumber(data?.byDepartment?.length || 0)}
                    subtitle="différents"
                    icon={Briefcase}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Postes Uniques"
                    value={formatNumber(totalPositions)}
                    subtitle="fonctions différentes"
                    icon={Briefcase}
                    color="indigo"
                    loading={loading}
                />
                <StatCard
                    title="Assets Assignés"
                    value={formatNumber(totalAssetsAssigned)}
                    subtitle={`${topAssetHoldersCount} détenteurs`}
                    icon={Package}
                    color="green"
                    loading={loading}
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employés par département */}
                <ChartCard
                    title="Employés par Département"
                    subtitle="Répartition de l'équipe"
                    icon={Users}
                    loading={loading}
                >
                    {data?.byDepartment && data.byDepartment.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data.byDepartment}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Employés" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucun département
                        </div>
                    )}
                </ChartCard>

                {/* Distribution par département (pie) */}
                <ChartCard
                    title="Distribution par Département"
                    subtitle="Proportion de l'équipe"
                    icon={Briefcase}
                    loading={loading}
                >
                    {data?.byDepartment && data.byDepartment.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={data.byDepartment}
                                    dataKey="count"
                                    nameKey="department"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={(entry) => `${entry.department}: ${entry.count}`}
                                >
                                    {data.byDepartment.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucune donnée
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Top 10 postes */}
            <ChartCard
                title="Top 10 Postes"
                subtitle="Les postes les plus représentés"
                icon={TrendingUp}
                loading={loading}
            >
                {data?.byPosition && data.byPosition.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.byPosition}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="position" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                            />
                            <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Nombre" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Aucun poste
                    </div>
                )}
            </ChartCard>

            {/* Top détenteurs d'assets */}
            {data?.topAssetHolders && data.topAssetHolders.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                            Top Détenteurs d'Assets
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.topAssetHolders.map((holder, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="font-semibold text-gray-900">{holder.name}</p>
                                    <p className="text-sm text-gray-600">{holder.department}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-2xl text-purple-600">{holder.asset_count}</p>
                                    <p className="text-sm text-gray-600">assets</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesView;