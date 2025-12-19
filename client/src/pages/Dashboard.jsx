// client/src/pages/Dashboard.jsx
// ✅ NOUVEAU FICHIER - Page Dashboard principale avec analytics

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, FileText, Package, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, ShieldAlert, BarChart3 } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import API_URL from '../config/api';

const Dashboard = () => {
    const { token } = useAuth();
    
    // États données
    const [globalStats, setGlobalStats] = useState(null);
    const [contractsAnalytics, setContractsAnalytics] = useState(null);
    const [licensesAnalytics, setLicensesAnalytics] = useState(null);
    const [assetsAnalytics, setAssetsAnalytics] = useState(null);
    const [employeesAnalytics, setEmployeesAnalytics] = useState(null);
    
    // États UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Couleurs graphiques
    const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Appels parallèles
            const [statsRes, contractsRes, licensesRes, assetsRes, employeesRes] = await Promise.all([
                fetch(`${API_URL}/api/dashboard/stats`, { headers }),
                fetch(`${API_URL}/api/dashboard/contracts`, { headers }),
                fetch(`${API_URL}/api/dashboard/licenses`, { headers }),
                fetch(`${API_URL}/api/dashboard/assets`, { headers }),
                fetch(`${API_URL}/api/dashboard/employees`, { headers })
            ]);

            if (!statsRes.ok || !contractsRes.ok || !licensesRes.ok || !assetsRes.ok || !employeesRes.ok) {
                throw new Error('Erreur chargement données');
            }

            const [stats, contracts, licenses, assets, employees] = await Promise.all([
                statsRes.json(),
                contractsRes.json(),
                licensesRes.json(),
                assetsRes.json(),
                employeesRes.json()
            ]);

            setGlobalStats(stats);
            setContractsAnalytics(contracts);
            setLicensesAnalytics(licenses);
            setAssetsAnalytics(assets);
            setEmployeesAnalytics(employees);

        } catch (err) {
            console.error('Erreur fetch dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-900 mb-2">Erreur</h2>
                        <p className="text-red-700">{error}</p>
                        <button
                            onClick={fetchAllData}
                            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <BarChart3 className="w-12 h-12" />
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">Dashboard Analytics</h1>
                        <p className="text-indigo-100 text-lg">Vue d'ensemble de votre infrastructure IT</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-8">
                {/* KPIS GLOBAUX */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Contrats Actifs"
                        value={globalStats?.contracts.active || 0}
                        subtitle={`${globalStats?.contracts.total || 0} total`}
                        icon={FileText}
                        color="indigo"
                        loading={loading}
                    />
                    <StatCard
                        title="Coût Mensuel Total"
                        value={`${(globalStats?.contracts.totalCost || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                        subtitle="Contrats actifs"
                        icon={DollarSign}
                        color="green"
                        loading={loading}
                    />
                    <StatCard
                        title="Assets Assignés"
                        value={globalStats?.assets.assigned || 0}
                        subtitle={`${globalStats?.assets.available || 0} disponibles`}
                        icon={Package}
                        color="blue"
                        loading={loading}
                    />
                    <StatCard
                        title="Employés Actifs"
                        value={globalStats?.employees.active || 0}
                        subtitle={`${globalStats?.employees.total || 0} total`}
                        icon={Users}
                        color="purple"
                        loading={loading}
                    />
                </div>

                {/* ANALYTICS LICENCES (PRIORITAIRE) */}
                {licensesAnalytics && licensesAnalytics.summary.totalLicenses > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Taux Utilisation Moyen"
                            value={`${licensesAnalytics.summary.averageUsageRate}%`}
                            subtitle={`${licensesAnalytics.summary.totalUsed} / ${licensesAnalytics.summary.totalLicenses} licences`}
                            icon={CheckCircle}
                            color={
                                licensesAnalytics.summary.averageUsageRate >= 80 ? 'green' :
                                licensesAnalytics.summary.averageUsageRate >= 50 ? 'orange' : 'red'
                            }
                            loading={loading}
                        />
                        <StatCard
                            title="Gaspillage Détecté"
                            value={`${licensesAnalytics.summary.totalWasted.toFixed(2)} €`}
                            subtitle="Licences inutilisées"
                            icon={AlertTriangle}
                            color="orange"
                            loading={loading}
                        />
                        <StatCard
                            title="Surconsommation"
                            value={`${licensesAnalytics.summary.totalOverconsumptionCost.toFixed(2)} €`}
                            subtitle="Coût excédentaire"
                            icon={ShieldAlert}
                            color="red"
                            loading={loading}
                        />
                    </div>
                )}

                {/* TOP CONTRATS COÛTEUX */}
                {contractsAnalytics && contractsAnalytics.topContracts.length > 0 && (
                    <ChartCard
                        title="Top 10 Contrats les Plus Coûteux"
                        subtitle="Classement par coût mensuel"
                        icon={TrendingUp}
                        loading={loading}
                    >
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={contractsAnalytics.topContracts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Coût (€)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    formatter={(value) => `${parseFloat(value).toFixed(2)} €`}
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="monthly_cost" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* RÉPARTITION PAR FOURNISSEUR */}
                {contractsAnalytics && contractsAnalytics.providers.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard
                            title="Répartition par Fournisseur"
                            subtitle="Nombre de contrats par fournisseur"
                            icon={FileText}
                            loading={loading}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={contractsAnalytics.providers}
                                        dataKey="count"
                                        nameKey="provider"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => `${entry.provider} (${entry.count})`}
                                        labelLine={false}
                                    >
                                        {contractsAnalytics.providers.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            title="Coût par Fournisseur"
                            subtitle="Répartition des coûts"
                            icon={DollarSign}
                            loading={loading}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={contractsAnalytics.providers}
                                        dataKey="total_cost"
                                        nameKey="provider"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => `${entry.provider} (${parseFloat(entry.total_cost).toFixed(0)}€)`}
                                        labelLine={false}
                                    >
                                        {contractsAnalytics.providers.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${parseFloat(value).toFixed(2)} €`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                )}

                {/* CONTRATS GASPILLÉS (LICENCES INUTILISÉES) */}
                {licensesAnalytics && licensesAnalytics.underused.length > 0 && (
                    <ChartCard
                        title="Top 10 Contrats avec Licences Inutilisées"
                        subtitle="Opportunités d'économies"
                        icon={AlertTriangle}
                        loading={loading}
                    >
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={licensesAnalytics.underused}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Gaspillage (€)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    formatter={(value, name) => {
                                        if (name === 'wastedCost') return `${parseFloat(value).toFixed(2)} €`;
                                        return value;
                                    }}
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="wastedCost" fill="#F59E0B" radius={[8, 8, 0, 0]} name="Coût gaspillé" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* SURCONSOMMATION */}
                {licensesAnalytics && licensesAnalytics.overconsumed.length > 0 && (
                    <ChartCard
                        title="Top 10 Contrats en Surconsommation"
                        subtitle="Attention : coûts excédentaires"
                        icon={ShieldAlert}
                        loading={loading}
                    >
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={licensesAnalytics.overconsumed}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Surcoût (€)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    formatter={(value) => `${parseFloat(value).toFixed(2)} €`}
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="cost" fill="#EF4444" radius={[8, 8, 0, 0]} name="Surcoût mensuel" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* ASSETS PAR TYPE ET STATUT */}
                {assetsAnalytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {assetsAnalytics.byType.length > 0 && (
                            <ChartCard
                                title="Répartition Assets par Type"
                                subtitle="Inventaire par catégorie"
                                icon={Package}
                                loading={loading}
                            >
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={assetsAnalytics.byType}
                                            dataKey="count"
                                            nameKey="asset_type"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={(entry) => `${entry.asset_type} (${entry.count})`}
                                        >
                                            {assetsAnalytics.byType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        )}

                        {assetsAnalytics.byStatus.length > 0 && (
                            <ChartCard
                                title="Statut des Assets"
                                subtitle="Disponibilité matériel"
                                icon={CheckCircle}
                                loading={loading}
                            >
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={assetsAnalytics.byStatus}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="status" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        )}
                    </div>
                )}

                {/* EMPLOYÉS PAR DÉPARTEMENT */}
                {employeesAnalytics && employeesAnalytics.byDepartment.length > 0 && (
                    <ChartCard
                        title="Répartition Employés par Département"
                        subtitle="Structure organisationnelle"
                        icon={Users}
                        loading={loading}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={employeesAnalytics.byDepartment}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {/* CONTRATS EXPIRANT BIENTÔT */}
                {contractsAnalytics && contractsAnalytics.expiringSoon.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Contrats Expirant dans 30 jours</h3>
                                <p className="text-sm text-gray-600">{contractsAnalytics.expiringSoon.length} contrat(s) à renouveler</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {contractsAnalytics.expiringSoon.map((contract, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{contract.name}</p>
                                        <p className="text-sm text-gray-600">{contract.provider || 'Sans fournisseur'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-orange-600">
                                            {new Date(contract.renewal_date).toLocaleDateString('fr-FR')}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {parseFloat(contract.monthly_cost).toFixed(2)} €/mois
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;