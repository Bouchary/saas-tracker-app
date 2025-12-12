// client/src/pages/OptimizationPage.jsx
// Version FINALE avec real_users pour détection surconsommation

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { TrendingUp, AlertTriangle, Lightbulb, DollarSign, Users, ShieldAlert, Clock, CheckCircle } from 'lucide-react';
import API_URL from '../config/api';

const OptimizationPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logout } = useAuth();

    useEffect(() => {
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
                console.error('Erreur optimization:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, [token, logout]);

    // ✨ ANALYSE SURCONSOMMATION avec real_users
    const licensedContracts = contracts.filter(c => c.pricing_model === 'per_user' && c.license_count);
    
    const overconsumedContracts = licensedContracts
        .map(c => {
            const licenseCount = parseInt(c.license_count) || 0;
            const licensesUsed = parseInt(c.licenses_used) || 0;
            const real_users = parseInt(c.real_users) || 0;
            const unitCost = parseFloat(c.unit_cost) || 0;
            const overused = real_users - licenseCount;
            const overusageRate = licenseCount > 0 ? ((real_users / licenseCount) * 100) : 0;
            const missingCost = overused > 0 ? overused * unitCost : 0;
            
            return {
                id: c.id,
                name: c.name,
                provider: c.provider,
                renewal_date: c.renewal_date,
                licenseCount,
                licensesUsed,
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

    // Licences sous-utilisées (gaspillage)
    const underusedContracts = licensedContracts
        .map(c => {
            const licenseCount = parseInt(c.license_count) || 0;
            const licensesUsed = parseInt(c.licenses_used) || 0;
            const unused = licenseCount - licensesUsed;
            const usageRate = licenseCount > 0 ? ((licensesUsed / licenseCount) * 100) : 0;
            const wastedCost = unused > 0 ? unused * (parseFloat(c.unit_cost) || 0) : 0;
            
            return {
                id: c.id,
                name: c.name,
                provider: c.provider,
                renewal_date: c.renewal_date,
                licenseCount,
                licensesUsed,
                unused,
                usageRate,
                wastedCost,
                unitCost: parseFloat(c.unit_cost) || 0,
                isUnderused: unused > 0 && usageRate < 70
            };
        })
        .filter(c => c.isUnderused)
        .sort((a, b) => b.wastedCost - a.wastedCost);

    const totalWastedLicenses = underusedContracts.reduce((sum, c) => sum + c.unused, 0);
    const totalWastedCost = underusedContracts.reduce((sum, c) => sum + c.wastedCost, 0);
    const totalWastedAnnual = totalWastedCost * 12;

    // Licences bien optimisées (70-95%)
    const optimizedContracts = licensedContracts
        .map(c => {
            const licenseCount = parseInt(c.license_count) || 0;
            const licensesUsed = parseInt(c.licenses_used) || 0;
            const usageRate = licenseCount > 0 ? ((licensesUsed / licenseCount) * 100) : 0;
            
            return {
                id: c.id,
                name: c.name,
                provider: c.provider,
                licenseCount,
                licensesUsed,
                usageRate,
                isOptimized: usageRate >= 70 && usageRate <= 95
            };
        })
        .filter(c => c.isOptimized)
        .sort((a, b) => b.usageRate - a.usageRate);

    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getUsageColor = (rate) => {
        if (rate >= 70 && rate <= 95) return 'text-green-600 bg-green-100';
        if (rate >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 font-medium">Analyse en cours...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-8">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 text-center mb-2">Erreur</h2>
                    <p className="text-red-700 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex items-center gap-4 mb-3">
                        <Lightbulb className="w-10 h-10" />
                        <h1 className="text-4xl md:text-5xl font-bold">Optimisations & Recommandations</h1>
                    </div>
                    <p className="text-indigo-100 text-lg">Réduisez vos coûts et maximisez l'utilisation de vos licences</p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl">
                {/* Résumé global */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-16">
                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">URGENT</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{overconsumedContracts.length}</p>
                        <p className="text-sm text-gray-600 mt-1">Contrats en surcharge</p>
                        <p className="text-lg font-bold text-red-600 mt-2">{totalOverconsumptionCost.toFixed(0)} €/mois</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">MOYEN</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{underusedContracts.length}</p>
                        <p className="text-sm text-gray-600 mt-1">Contrats sous-utilisés</p>
                        <p className="text-lg font-bold text-yellow-600 mt-2">{totalWastedCost.toFixed(0)} €/mois</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">OPTIMAL</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{optimizedContracts.length}</p>
                        <p className="text-sm text-gray-600 mt-1">Contrats optimisés</p>
                        <p className="text-lg font-bold text-green-600 mt-2">70-95% utilisés</p>
                    </div>
                </div>

                {/* SECTION 1 : SURCONSOMMATION CRITIQUE */}
                {overconsumedContracts.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
                                    <ShieldAlert className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">🚨 URGENCE CRITIQUE : Surconsommation de Licences</h2>
                                    <p className="text-red-100 text-sm mt-1">
                                        {totalOverconsumed} licences manquantes • {totalOverconsumptionCost.toFixed(0)} €/mois • {totalOverconsumptionAnnual.toFixed(0)} €/an
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-b-2xl shadow-xl p-6">
                            <div className="space-y-4">
                                {overconsumedContracts.map(contract => (
                                    <div 
                                        key={contract.id} 
                                        className="border-2 border-red-200 rounded-xl p-5 bg-red-50 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{contract.name}</h3>
                                                <p className="text-sm text-gray-600">{contract.provider}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                                                    SURCHARGE {contract.overusageRate.toFixed(0)}%
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    Renouvellement : {formatDate(contract.renewal_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-3 border border-red-200">
                                                <p className="text-xs text-gray-600 mb-1">Licences achetées</p>
                                                <p className="text-2xl font-bold text-gray-900">{contract.licenseCount}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-red-200">
                                                <p className="text-xs text-gray-600 mb-1">Utilisateurs réels</p>
                                                <p className="text-2xl font-bold text-red-600">{contract.real_users}</p>
                                            </div>
                                            <div className="bg-red-100 rounded-lg p-3 border-2 border-red-300">
                                                <p className="text-xs text-red-700 mb-1 font-semibold">Licences manquantes</p>
                                                <p className="text-2xl font-bold text-red-700">{contract.overused}</p>
                                            </div>
                                            <div className="bg-red-100 rounded-lg p-3 border-2 border-red-300">
                                                <p className="text-xs text-red-700 mb-1 font-semibold">Surcoût mensuel</p>
                                                <p className="text-2xl font-bold text-red-700">{contract.missingCost.toFixed(0)} €</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-4 border-l-4 border-red-600">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-red-900 mb-2">⚠️ Actions Urgentes Requises :</h4>
                                                    <ul className="space-y-2 text-sm text-red-800">
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-600 font-bold">1.</span>
                                                            <span><strong>Acheter immédiatement {contract.overused} licences supplémentaires</strong> pour régulariser la situation (coût : {contract.missingCost.toFixed(2)} €/mois)</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-600 font-bold">2.</span>
                                                            <span>Contacter {contract.provider} pour mettre à jour le contrat avant le renouvellement ({formatDate(contract.renewal_date)})</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-600 font-bold">3.</span>
                                                            <span>Vérifier la conformité légale : vous êtes actuellement en violation des termes contractuels</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-red-600 font-bold">4.</span>
                                                            <span>Surcoût annuel évitable : <strong>{(contract.missingCost * 12).toFixed(0)} €/an</strong></span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <DollarSign className="w-7 h-7 text-red-600" />
                                    <h3 className="text-xl font-bold text-red-900">💰 Impact Financier Total</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-red-700 mb-1">Surcoût Mensuel</p>
                                        <p className="text-3xl font-bold text-red-900">{totalOverconsumptionCost.toFixed(2)} €</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-red-700 mb-1">Surcoût Annuel</p>
                                        <p className="text-3xl font-bold text-red-900">{totalOverconsumptionAnnual.toFixed(2)} €</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION 2 : SOUS-UTILISATION */}
                {underusedContracts.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">⚠️ Licences Sous-Utilisées (Gaspillage)</h2>
                                    <p className="text-yellow-100 text-sm mt-1">
                                        {totalWastedLicenses} licences inutilisées • {totalWastedCost.toFixed(0)} €/mois • {totalWastedAnnual.toFixed(0)} €/an d'économies potentielles
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-b-2xl shadow-xl p-6">
                            <div className="space-y-4">
                                {underusedContracts.map(contract => (
                                    <div 
                                        key={contract.id} 
                                        className="border-2 border-yellow-200 rounded-xl p-5 bg-yellow-50 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{contract.name}</h3>
                                                <p className="text-sm text-gray-600">{contract.provider}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getUsageColor(contract.usageRate)}`}>
                                                    {contract.usageRate.toFixed(0)}% utilisé
                                                </span>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    Renouvellement : {formatDate(contract.renewal_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-3 border border-yellow-200">
                                                <p className="text-xs text-gray-600 mb-1">Licences totales</p>
                                                <p className="text-2xl font-bold text-gray-900">{contract.licenseCount}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-yellow-200">
                                                <p className="text-xs text-gray-600 mb-1">Licences utilisées</p>
                                                <p className="text-2xl font-bold text-green-600">{contract.licensesUsed}</p>
                                            </div>
                                            <div className="bg-yellow-100 rounded-lg p-3 border-2 border-yellow-300">
                                                <p className="text-xs text-yellow-700 mb-1 font-semibold">Licences inutilisées</p>
                                                <p className="text-2xl font-bold text-yellow-700">{contract.unused}</p>
                                            </div>
                                            <div className="bg-yellow-100 rounded-lg p-3 border-2 border-yellow-300">
                                                <p className="text-xs text-yellow-700 mb-1 font-semibold">Gaspillage mensuel</p>
                                                <p className="text-2xl font-bold text-yellow-700">{contract.wastedCost.toFixed(0)} €</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-4 border-l-4 border-yellow-600">
                                            <div className="flex items-start gap-3">
                                                <Lightbulb className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-yellow-900 mb-2">💡 Recommandations :</h4>
                                                    <ul className="space-y-2 text-sm text-yellow-800">
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-yellow-600 font-bold">•</span>
                                                            <span>Réduire à <strong>{Math.ceil(contract.licensesUsed * 1.1)} licences</strong> (marge de sécurité 10%)</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-yellow-600 font-bold">•</span>
                                                            <span>Économie mensuelle : <strong>{contract.wastedCost.toFixed(2)} €</strong></span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-yellow-600 font-bold">•</span>
                                                            <span>Économie annuelle : <strong>{(contract.wastedCost * 12).toFixed(2)} €</strong></span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-yellow-600 font-bold">•</span>
                                                            <span>Action : Négocier avec {contract.provider} avant le renouvellement</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 border-2 border-yellow-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <DollarSign className="w-7 h-7 text-yellow-600" />
                                    <h3 className="text-xl font-bold text-yellow-900">💰 Économies Potentielles Totales</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-yellow-700 mb-1">Mensuel</p>
                                        <p className="text-3xl font-bold text-yellow-900">{totalWastedCost.toFixed(2)} €</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-yellow-700 mb-1">Annuel</p>
                                        <p className="text-3xl font-bold text-yellow-900">{totalWastedAnnual.toFixed(2)} €</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION 3 : CONTRATS OPTIMISÉS */}
                {optimizedContracts.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">✅ Contrats Bien Optimisés (70-95%)</h2>
                                    <p className="text-green-100 text-sm mt-1">Continuez sur cette lancée !</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-b-2xl shadow-xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {optimizedContracts.map(contract => (
                                    <div 
                                        key={contract.id} 
                                        className="border-2 border-green-200 rounded-xl p-4 bg-green-50 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-gray-900">{contract.name}</h3>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{contract.provider}</p>
                                        <div className="bg-white rounded-lg p-3 mb-2">
                                            <p className="text-xs text-gray-600 mb-1">Taux d'utilisation</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all"
                                                        style={{ width: `${contract.usageRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-green-600">{contract.usageRate.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            <Users className="w-3 h-3 inline mr-1" />
                                            {contract.licensesUsed}/{contract.licenseCount} licences
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Message si rien à optimiser */}
                {overconsumedContracts.length === 0 && underusedContracts.length === 0 && optimizedContracts.length === 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border-2 border-blue-200">
                        <Lightbulb className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucun contrat avec licences à analyser</h2>
                        <p className="text-gray-600 mb-6">
                            Ajoutez des contrats avec un modèle de tarification "Par utilisateur" pour voir les recommandations d'optimisation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptimizationPage;