// client/src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';
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

    // Charger tous les contrats
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

    // Calculs pour les statistiques
    const totalContracts = contracts.length;
    const totalMonthly = contracts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0);
    const totalAnnual = totalMonthly * 12;
    const averageCost = totalContracts > 0 ? totalMonthly / totalContracts : 0;

    // Données pour le graphique camembert (statuts)
    const statusData = [
        { name: 'Actif', value: contracts.filter(c => c.status === 'active').length, color: COLORS.active },
        { name: 'Inactif', value: contracts.filter(c => c.status === 'inactive').length, color: COLORS.inactive },
        { name: 'Annulé', value: contracts.filter(c => c.status === 'cancelled').length, color: COLORS.cancelled },
    ].filter(item => item.value > 0);

    // Données pour le graphique barres (top fournisseurs)
    const providerCosts = {};
    contracts.forEach(c => {
        const provider = c.provider || 'Sans fournisseur';
        providerCosts[provider] = (providerCosts[provider] || 0) + (parseFloat(c.monthly_cost) || 0);
    });

    const providerData = Object.entries(providerCosts)
        .map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

    // Données pour le graphique ligne (renouvellements sur 12 mois)
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

    // Contrats à renouveler dans les 30 jours
    const upcomingRenewals = contracts.filter(c => {
        if (!c.renewal_date) return false;
        const renewalDate = new Date(c.renewal_date);
        const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
    }).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold mb-1">Erreur de chargement</h3>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Message spécial pour tableau de bord vide
    if (totalContracts === 0) {
        return (
            <div className="p-8">
                <h1 className="text-4xl font-bold mb-6 text-gray-900">Tableau de Bord Analytique</h1>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                    <div className="mb-4">
                        <TrendingUp className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Bienvenue sur votre tableau de bord !
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Vous n'avez pas encore de contrats. Créez votre premier contrat pour voir vos statistiques ici.
                    </p>
                    <a
                        href="/contracts/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        <TrendingUp className="w-5 h-5" />
                        Créer mon premier contrat
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-gray-900">Tableau de Bord Analytique</h1>

            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<TrendingUp className="w-8 h-8" />}
                    title="Total Contrats"
                    value={totalContracts}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={<DollarSign className="w-8 h-8" />}
                    title="Dépenses Mensuelles"
                    value={`${totalMonthly.toFixed(2)} €`}
                    color="bg-green-500"
                />
                <StatCard
                    icon={<DollarSign className="w-8 h-8" />}
                    title="Dépenses Annuelles"
                    value={`${totalAnnual.toFixed(2)} €`}
                    color="bg-indigo-500"
                />
                <StatCard
                    icon={<Calendar className="w-8 h-8" />}
                    title="Renouvellements (30j)"
                    value={upcomingRenewals}
                    color="bg-orange-500"
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Graphique Camembert - Statuts */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Répartition par Statut</h2>
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

                {/* Graphique Barres - Top Fournisseurs */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Coûts par Fournisseur (Top 10)</h2>
                    {providerData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={providerData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cost" fill="#6366f1" name="Coût Mensuel (€)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-500 py-16">Aucune donnée disponible</p>
                    )}
                </div>
            </div>

            {/* Graphique Ligne - Renouvellements */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Renouvellements sur 12 Mois</h2>
                {renewalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={renewalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Nombre de renouvellements" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-center text-gray-500 py-16">Aucune donnée disponible</p>
                )}
            </div>

            {/* Moyenne par contrat */}
            <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Coût Moyen par Contrat</p>
                        <p className="text-3xl font-bold mt-1">{averageCost.toFixed(2)} € / mois</p>
                    </div>
                    <DollarSign className="w-16 h-16 opacity-50" />
                </div>
            </div>
        </div>
    );
};

// Composant carte de statistique
const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
            <div className={`${color} text-white p-3 rounded-lg`}>
                {icon}
            </div>
        </div>
    </div>
);

export default DashboardPage;