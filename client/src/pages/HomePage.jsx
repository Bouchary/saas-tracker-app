// client/src/pages/HomePage.jsx
// ✅ VERSION CORRIGÉE COMPLÈTE - Utilise le nouveau ContractList autonome

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import ContractList from '../components/ContractList';
import API_URL from '../config/api';

const HomePage = ({ scrollToContract }) => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        monthlyCost: 0
    });
    const [loading, setLoading] = useState(true);
    const { token, logout } = useAuth();

    // ✅ Charger les statistiques globales
    const fetchStats = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/contracts`, {
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
                const contracts = data.contracts || [];
                
                setStats({
                    total: contracts.length,
                    active: contracts.filter(c => c.status === 'active').length,
                    monthlyCost: contracts.reduce((sum, c) => sum + (parseFloat(c.monthly_cost) || 0), 0)
                });
            }
        } catch (err) {
            console.error('Erreur stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* ✨ HEADER AVEC GRADIENT */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Gestion des Contrats</h1>
                    <p className="text-indigo-100 text-lg">Suivez et optimisez vos abonnements en temps réel</p>
                </div>
            </div>

            <div className="container mx-auto px-6">
                {/* ✨ CARTES STATISTIQUES */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-20">
                        {/* Carte 1 : Total Contrats */}
                        <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                    Total
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Contrats enregistrés</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {stats.total}
                            </p>
                        </div>

                        {/* Carte 2 : Contrats Actifs */}
                        <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    Actifs
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Contrats actifs</p>
                            <p className="text-4xl font-bold text-green-600">
                                {stats.active}
                            </p>
                        </div>

                        {/* Carte 3 : Montant Total */}
                        <div className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    Mensuel
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Coût mensuel total</p>
                            <p className="text-4xl font-bold text-orange-600">
                                {stats.monthlyCost.toFixed(2)}<span className="text-2xl">€</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* ✨ LOADING STATE POUR STATS */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-20">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="w-20 h-10 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✨ EN-TÊTE AVEC BOUTON D'ACTION */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Vos Contrats</h2>
                            <p className="text-sm text-gray-500 mt-1">Gérez et suivez tous vos abonnements</p>
                        </div>
                        <Link 
                            to="/contracts/new" 
                            className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter un Contrat
                        </Link>
                    </div>
                </div>

                {/* ✅ NOUVEAU ContractList AUTONOME - TOUTES FONCTIONNALITÉS INTÉGRÉES */}
                {/* Le ContractList gère maintenant TOUT : recherche, filtres, pagination, affichage */}
                <ContractList />
            </div>
        </div>
    );
};

export default HomePage;