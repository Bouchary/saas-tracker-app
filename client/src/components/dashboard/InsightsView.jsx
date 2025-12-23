// client/src/components/dashboard/InsightsView.jsx
// ✅ VERSION AMÉLIORÉE - Vue Recommandations (Tab 5) - À implémenter Phase F

import React from 'react';
import { Lightbulb, Construction, TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart3, Target } from 'lucide-react';

const InsightsView = () => {
    return (
        <div className="space-y-6">
            {/* Header amélioré */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-lg p-8 border-2 border-orange-200">
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Construction className="w-12 h-12 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Recommandations Intelligentes
                        </h2>
                        <p className="text-gray-700 text-lg mb-4">
                            IA et insights pour optimiser vos coûts IT :
                        </p>
                        
                        {/* Liste des fonctionnalités à venir */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Économies détectées</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Recommandations d'économies basées sur l'analyse de vos contrats
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Détection anomalies</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Détection automatique des anomalies et surconsommations
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Prédictions de coûts</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Prévisions budgétaires basées sur vos tendances de consommation
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Actions prioritaires</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Liste d'actions à effectuer en priorité pour optimiser vos coûts
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Lightbulb className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Alertes personnalisées</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Notifications intelligentes adaptées à votre contexte
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Analyse prédictive</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    IA pour anticiper les besoins et optimiser les ressources
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Planning */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Target className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Feuille de route</h3>
                        <p className="text-gray-600">Fonctionnalités prévues pour Phase F</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white font-bold text-lg">1</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Analyse automatique</h4>
                        <p className="text-sm text-gray-600">
                            Scan quotidien de vos données pour identifier les optimisations possibles
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white font-bold text-lg">2</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Recommandations IA</h4>
                        <p className="text-sm text-gray-600">
                            Suggestions personnalisées basées sur l'apprentissage automatique
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white font-bold text-lg">3</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Actions automatisées</h4>
                        <p className="text-sm text-gray-600">
                            Exécution automatique des optimisations avec validation utilisateur
                        </p>
                    </div>
                </div>
            </div>

            {/* Message Phase F */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-2">À implémenter dans Phase F</h3>
                <p className="text-indigo-100 text-lg">
                    Cette fonctionnalité sera disponible dans une prochaine version
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-6 py-3 border border-white/20">
                    <Construction className="w-5 h-5" />
                    <span className="font-semibold">En cours de développement</span>
                </div>
            </div>

            {/* CTA Temporaire */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => window.location.href = '#contracts'}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition cursor-pointer text-left group"
                >
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition">
                        <BarChart3 className="w-6 h-6 text-indigo-600 group-hover:text-white transition" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Analytics Contrats</h4>
                    <p className="text-sm text-gray-600">
                        Consultez vos métriques actuelles
                    </p>
                </button>

                <button 
                    onClick={() => window.location.href = '#assets'}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 hover:shadow-lg transition cursor-pointer text-left group"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition">
                        <CheckCircle className="w-6 h-6 text-green-600 group-hover:text-white transition" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Analytics Assets</h4>
                    <p className="text-sm text-gray-600">
                        Vue d'ensemble de votre matériel
                    </p>
                </button>

                <button 
                    onClick={() => window.location.href = '#employees'}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition cursor-pointer text-left group"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
                        <Target className="w-6 h-6 text-purple-600 group-hover:text-white transition" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Analytics Employés</h4>
                    <p className="text-sm text-gray-600">
                        Statistiques de votre équipe
                    </p>
                </button>
            </div>
        </div>
    );
};

export default InsightsView;