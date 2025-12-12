// client/src/pages/DashboardPage.jsx
// Version FINALE avec real_users pour surconsommation

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertCircle, BarChart3, PieChart as PieChartIcon, Users, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import API_URL from '../config/api';

const COLORS = {
    active: '#10b981',
    inactive: '#6b7280',
    cancelled: '#ef4444',
};

const DashboardPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logout } = useAuth();

    const fetchContracts = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setContracts(data.contracts || []);
            } else {
                throw new Error('Erreur lors du chargement des contrats');
            }
        } catch (err) {
            setError(err.message);
            console.error('Erreur dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            if (!isMounted) return;
            await fetchContracts();
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const totalContracts = contracts.length;
    const totalMonthly = contracts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0);
    const totalAnnual = totalMonthly * 12;
    const averageCost = totalContracts > 0 ? totalMonthly / totalContracts : 0;

    const licensedContracts = contracts.filter(c => c.pricing_model === 'per_user' && c.license_count);
    const totalLicenses = licensedContracts.reduce((sum, c) => sum + (parseInt(c.license_count) || 0), 0);
    const totalLicensesUsed = licensedContracts.reduce((sum, c) => sum + (parseInt(c.licenses_used) || 0), 0);
    const totalLicensesUnused = totalLicenses - totalLicensesUsed;
    const overallUsageRate = totalLicenses > 0 ? ((totalLicensesUsed / totalLicenses) * 100).toFixed(0) : 0;
    
    // ✨ SURCONSOMMATION avec real_users
    const overconsumedContracts = licensedContracts
        .map(c => {
            const licenseCount = parseInt(c.license_count) || 0;
            const real_users = parseInt(c.real_users) || 0;
            const unitCost = parseFloat(c.unit_cost) || 0;
            const overused = real_users - licenseCount;
            const overusageRate = licenseCount > 0 ? ((real_users / licenseCount) * 100) : 0;
            const missingCost = overused > 0 ? overused * unitCost : 0;
            
            return {
                id: c.id,
                name: c.name,
                provider: c.provider,
                licenseCount,
                licensesUsed: parseInt(c.licenses_used) || 0,
                real_users,
                overused,
                overusageRate,
                missingCost,
                unitCost,
                isOverconsumed: overused > 0
            };
        })
        .filter(c => c.isOverconsumed)
        .sort((a, b) => b.overused - a.overused);

    const totalOverconsumed = overconsumedContracts.reduce((sum, c) => sum + c.overused, 0);
    const totalOverconsumptionCost = overconsumedContracts.reduce((sum, c) => sum + c.missingCost, 0);
    const totalOverconsumptionAnnual = totalOverconsumptionCost * 12;

    const wasteByContract = licensedContracts
        .map(c => {
            const licenseCount = parseInt(c.license_count) || 0;
            const licensesUsed = parseInt(c.licenses_used) || 0;
            const unused = licenseCount - licensesUsed;
            const wastedCost = unused > 0 ? unused * (parseFloat(c.unit_cost) || 0) : 0;
            const usageRate = licenseCount > 0 ? ((licensesUsed / licenseCount) * 100) : 0;
            return {
                name: c.name,
                unused,
                wastedCost,
                usageRate,
                totalCost: parseFloat(c.monthly_cost) || 0
            };
        })
        .filter(c => c.unused > 0)
        .sort((a, b) => b.wastedCost - a.wastedCost);

    const totalWastedMonthlyCost = wasteByContract.reduce((sum, c) => sum + c.wastedCost, 0);
    const totalWastedAnnualCost = totalWastedMonthlyCost * 12;
    const topWastesData = wasteByContract.slice(0, 5);

    const statusData = [
        { name: 'Actif', value: contracts.filter(c => c.status === 'active').length, color: COLORS.active },
        { name: 'Inactif', value: contracts.filter(c => c.status === 'inactive').length, color: COLORS.inactive },
        { name: 'Annulé', value: contracts.filter(c => c.status === 'cancelled').length, color: COLORS.cancelled },
    ].filter(item => item.value > 0);

    const providerCosts = {};
    contracts.forEach(c => {
        const provider = c.provider || 'Sans fournisseur';
        providerCosts[provider] = (providerCosts[provider] || 0) + (parseFloat(c.monthly_cost) || 0);
    });

    const providerData = Object.entries(providerCosts)
        .map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

    const today = new Date();
    const renewalsByMonth = {};

    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        renewalsByMonth[monthKey] = 0;
    }

    contracts.forEach(contract => {
        if (contract.renewal_date) {
            const renewalDate = new Date(contract.renewal_date);
            const monthKey = renewalDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            if (renewalsByMonth.hasOwnProperty(monthKey)) {
                renewalsByMonth[monthKey]++;
            }
        }
    });

    const renewalData = Object.entries(renewalsByMonth)
        .map(([month, count]) => ({ month, count }));

    const upcomingRenewals = contracts.filter(contract => {
        if (!contract.renewal_date) return false;
        const renewalDate = new Date(contract.renewal_date);
        const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilRenewal >= 0 && daysUntilRenewal <= 30;
    }).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Chargement des analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-8">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 text-center mb-2">Erreur</h2>
                    <p className="text-red-700 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-7xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Tableau de Bord Analytique</h1>
                    <p className="text-indigo-100 text-lg">Visualisez vos métriques et optimisez vos dépenses</p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl">
                {overconsumedContracts.length > 0 && (
                    <div className="mb-8 -mt-16 animate-pulse">
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl shadow-2xl p-8 border-4 border-red-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
                                    <ShieldAlert className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">🚨 ALERTE : SURCONSOMMATION DÉTECTÉE</h2>
                                    <p className="text-red-100 text-lg">Action immédiate requise - Risque de violation contractuelle</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                                    <p className="text-red-100 text-sm mb-1">Contrats en surcharge</p>
                                    <p className="text-4xl font-bold">{overconsumedContracts.length}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                                    <p className="text-red-100 text-sm mb-1">Licences manquantes</p>
                                    <p className="text-4xl font-bold">{totalOverconsumed}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                                    <p className="text-red-100 text-sm mb-1">Surcoût estimé</p>
                                    <p className="text-4xl font-bold">{totalOverconsumptionCost.toFixed(0)}€/mois</p>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 mb-4">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Contrats en surconsommation :
                                </h3>
                                <div className="space-y-2">
                                    {overconsumedContracts.map(contract => (
                                        <div key={contract.id} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                                            <div>
                                                <p className="font-semibold">{contract.name}</p>
                                                <p className="text-sm text-red-100">
                                                    {contract.real_users} utilisateurs pour {contract.licenseCount} licences ({contract.overusageRate.toFixed(0)}%)
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-xl">{contract.overused}</p>
                                                <p className="text-sm text-red-100">manquantes</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Link 
                                to="/optimization"
                                className="block w-full bg-white text-red-600 text-center py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-all hover:scale-105 shadow-lg"
                            >
                                🚀 Voir les recommandations urgentes
                            </Link>
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${overconsumedContracts.length > 0 ? '' : '-mt-16'}`}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalContracts}</p>
                        <p className="text-sm text-gray-600 mt-1">Contrats actifs</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Mensuel</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalMonthly.toFixed(2)} €</p>
                        <p className="text-sm text-gray-600 mt-1">Coût mensuel total</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Annuel</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalAnnual.toFixed(2)} €</p>
                        <p className="text-sm text-gray-600 mt-1">Coût annuel total</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Urgent</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{upcomingRenewals}</p>
                        <p className="text-sm text-gray-600 mt-1">Renouvellements (30j)</p>
                    </div>
                </div>

                {licensedContracts.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Users className="w-7 h-7 text-indigo-600" />
                                Gestion des Licences
                            </h2>
                            <Link 
                                to="/optimization"
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Lightbulb className="w-5 h-5" />
                                Voir Optimisations
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-100">
                                <div className="flex items-center justify-between mb-3">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-700">TOTAL</span>
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{totalLicenses}</p>
                                <p className="text-sm text-blue-700 mt-1">Licences achetées</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-100">
                                <div className="flex items-center justify-between mb-3">
                                    <Users className="w-8 h-8 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700">UTILISÉES</span>
                                </div>
                                <p className="text-3xl font-bold text-green-900">{totalLicensesUsed}</p>
                                <p className="text-sm text-green-700 mt-1">Licences actives</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                    <span className="text-xs font-semibold text-purple-700">TAUX</span>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{overallUsageRate}%</p>
                                <p className="text-sm text-purple-700 mt-1">Utilisation moyenne</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-red-100">
                                <div className="flex items-center justify-between mb-3">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                    <span className="text-xs font-semibold text-red-700">GASPILLAGE</span>
                                </div>
                                <p className="text-3xl font-bold text-red-900">{totalWastedMonthlyCost.toFixed(0)} €</p>
                                <p className="text-sm text-red-700 mt-1">{totalLicensesUnused} licences inutilisées</p>
                            </div>
                        </div>

                        {totalWastedMonthlyCost > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Lightbulb className="w-8 h-8 text-amber-600" />
                                    <h3 className="text-xl font-bold text-amber-900">💰 Économies Potentielles</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-amber-700 mb-1">Mensuel</p>
                                        <p className="text-3xl font-bold text-amber-900">{totalWastedMonthlyCost.toFixed(2)} €</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-amber-700 mb-1">Annuel</p>
                                        <p className="text-3xl font-bold text-amber-900">{totalWastedAnnualCost.toFixed(2)} €</p>
                                    </div>
                                </div>
                                <p className="text-sm text-amber-700 mt-4">
                                    ✨ En optimisant vos licences, vous pourriez économiser jusqu'à <span className="font-bold">{totalWastedAnnualCost.toFixed(0)} €/an</span> !
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {statusData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <PieChartIcon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Répartition par Statut</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {topWastesData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Top Gaspillages</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topWastesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                                    <Bar dataKey="wastedCost" fill="url(#redGradient)" radius={[8, 8, 0, 0]} />
                                    <defs>
                                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {providerData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Coûts par Fournisseur</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={providerData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value} €`} />
                                    <Bar dataKey="cost" fill="url(#purpleGradient)" radius={[8, 8, 0, 0]} />
                                    <defs>
                                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Renouvellements (12 mois)</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={renewalData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm mb-2">Coût Moyen par Contrat</p>
                            <p className="text-5xl font-bold">{averageCost.toFixed(2)} €</p>
                        </div>
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                            <DollarSign className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;