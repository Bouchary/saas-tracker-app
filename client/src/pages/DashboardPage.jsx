// client/src/pages/DashboardPage.jsx
// Version MODERNE avec design amélioré - LOGIQUE ORIGINALE CONSERVÉE (isMounted)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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

    // ✅ LOGIQUE ORIGINALE EXACTE CONSERVÉE
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

    // ✅ USEEFFECT ORIGINAL CONSERVÉ (isMounted)
    useEffect(() => {
        let isMounted = true;  // ✅ Empêche les mises à jour après démontage
        
        const loadData = async () => {
            if (!isMounted) return;  // ✅ Arrêt si composant démonté
            await fetchContracts();
        };

        loadData();

        return () => {
            isMounted = false;  // ✅ Nettoyage au démontage
        };
    }, [token]);  // ✅ Ne se déclenche que quand le token change

    // ✅ CALCULS ORIGINAUX CONSERVÉS
    const totalContracts = contracts.length;
    const totalMonthly = contracts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0);
    const totalAnnual = totalMonthly * 12;
    const averageCost = totalContracts > 0 ? totalMonthly / totalContracts : 0;

    // ✅ DONNÉES GRAPHIQUES ORIGINALES CONSERVÉES
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

    contracts.forEach(c => {
        if (!c.renewal_date) return;
        const renewalDate = new Date(c.renewal_date);
        const monthsDiff = (renewalDate.getFullYear() - today.getFullYear()) * 12 + 
                          (renewalDate.getMonth() - today.getMonth());
        
        if (monthsDiff >= 0 && monthsDiff < 12) {
            const monthKey = renewalDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            renewalsByMonth[monthKey] = (renewalsByMonth[monthKey] || 0) + 1;
        }
    });

    const renewalData = Object.entries(renewalsByMonth).map(([month, count]) => ({ month, count }));

    const upcomingRenewals = contracts.filter(c => {
        if (!c.renewal_date) return false;
        const renewalDate = new Date(c.renewal_date);
        const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
    }).length;

    // ✨ LOADING STATE MODERNISÉ (SEUL CHANGEMENT VISUEL)
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    // ✨ ERROR STATE MODERNISÉ
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex justify-center items-center p-6">
                <div className="max-w-md w-full bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-8 shadow-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-lg mb-1">Erreur de chargement</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✨ EMPTY STATE MODERNISÉ
    if (totalContracts === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                    <div className="container mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">Tableau de Bord Analytique</h1>
                        <p className="text-indigo-100 text-lg">Visualisez vos métriques et optimisez vos dépenses</p>
                    </div>
                </div>
                
                <div className="container mx-auto px-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrendingUp className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Bienvenue sur votre tableau de bord !
                        </h2>
                        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                            Vous n'avez pas encore de contrats. Créez votre premier contrat pour voir vos statistiques et analyses ici.
                        </p>
                        <a
                            href="/contracts/new"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold text-lg"
                        >
                            <TrendingUp className="w-6 h-6" />
                            Créer mon premier contrat
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* ✨ HEADER MODERNE AVEC GRADIENT */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Tableau de Bord Analytique</h1>
                    <p className="text-indigo-100 text-lg">Visualisez vos métriques et optimisez vos dépenses</p>
                </div>
            </div>

            <div className="container mx-auto px-6">
                {/* ✨ CARTES STATS MODERNISÉES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-20">
                    <ModernStatCard
                        icon={<TrendingUp className="w-7 h-7" />}
                        title="Total Contrats"
                        value={totalContracts}
                        gradient="from-blue-500 to-cyan-600"
                        badge="Total"
                        badgeColor="bg-blue-100 text-blue-700"
                    />
                    <ModernStatCard
                        icon={<DollarSign className="w-7 h-7" />}
                        title="Dépenses Mensuelles"
                        value={`${totalMonthly.toFixed(2)} €`}
                        gradient="from-green-500 to-emerald-600"
                        badge="Mensuel"
                        badgeColor="bg-green-100 text-green-700"
                    />
                    <ModernStatCard
                        icon={<DollarSign className="w-7 h-7" />}
                        title="Dépenses Annuelles"
                        value={`${totalAnnual.toFixed(2)} €`}
                        gradient="from-indigo-500 to-purple-600"
                        badge="Annuel"
                        badgeColor="bg-indigo-100 text-indigo-700"
                    />
                    <ModernStatCard
                        icon={<Calendar className="w-7 h-7" />}
                        title="Renouvellements (30j)"
                        value={upcomingRenewals}
                        gradient="from-orange-500 to-red-600"
                        badge="Urgent"
                        badgeColor="bg-orange-100 text-orange-700"
                    />
                </div>

                {/* ✨ GRAPHIQUES MODERNISÉS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Graphique Camembert */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <PieChartIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Répartition par Statut</h2>
                        </div>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-500 py-16">Aucune donnée disponible</p>
                        )}
                    </div>

                    {/* Graphique Barres */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Coûts par Fournisseur (Top 10)</h2>
                        </div>
                        {providerData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={providerData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px' 
                                        }} 
                                    />
                                    <Bar dataKey="cost" fill="url(#colorGradient)" name="Coût Mensuel (€)" radius={[8, 8, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-500 py-16">Aucune donnée disponible</p>
                        )}
                    </div>
                </div>

                {/* Graphique Ligne */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Renouvellements sur 12 Mois</h2>
                    </div>
                    {renewalData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={renewalData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        border: '1px solid #e5e7eb', 
                                        borderRadius: '8px' 
                                    }} 
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#10b981" 
                                    strokeWidth={3} 
                                    name="Nombre de renouvellements"
                                    dot={{ fill: '#10b981', r: 5 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-500 py-16">Aucune donnée disponible</p>
                    )}
                </div>

                {/* Carte Moyenne */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90 font-medium mb-1">Coût Moyen par Contrat</p>
                            <p className="text-5xl font-bold">{averageCost.toFixed(2)} €</p>
                            <p className="text-sm opacity-80 mt-2">par mois</p>
                        </div>
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <DollarSign className="w-12 h-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✨ COMPOSANT CARTE MODERNE
const ModernStatCard = ({ icon, title, value, gradient, badge, badgeColor }) => (
    <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white`}>
                {icon}
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor}`}>
                {badge}
            </span>
        </div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

export default DashboardPage;