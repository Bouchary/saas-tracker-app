// ============================================================================
// PAGE - OPTIMIZATION HYBRIDE (FUSION)
// ============================================================================
// Fichier : client/src/pages/OptimizationPage.jsx
// Description : Fusion AI Score + Surconsommation/Gaspillage
// ✅ Design magnifique + Intelligence AI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  TrendingUp, AlertTriangle, Lightbulb, DollarSign, Users, 
  ShieldAlert, Clock, CheckCircle, Target, Award, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import API_URL from '../config/api';

const OptimizationPage = () => {
  const { token, logout } = useAuth();
  
  // États pour AI Optimization
  const [aiStats, setAiStats] = useState(null);
  const [aiOptimizations, setAiOptimizations] = useState([]);
  const [expandedContract, setExpandedContract] = useState(null);
  
  // États pour analyse classique
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Fetch AI Scores + Contrats classiques en parallèle
      const [aiRes, contractsRes] = await Promise.all([
        fetch(`${API_URL}/api/optimization/scores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/contracts?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (aiRes.status === 401 || contractsRes.status === 401) {
        logout();
        return;
      }

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiStats(aiData.stats);
        setAiOptimizations(aiData.optimizations);
      }

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData.contracts || []);
      }

      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== ANALYSE SURCONSOMMATION (version originale) ==========
  const licensedContracts = contracts.filter(c => c.pricing_model === 'per_user' && c.license_count);
  
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
        renewal_date: c.renewal_date,
        licenseCount,
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

  // Sous-utilisation
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

  // Optimisés
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

  // ========== HELPERS ==========
  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGradeBadge = (grade) => {
    const styles = {
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${styles[grade.color]}`}>
        {grade.emoji} {grade.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      URGENT: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const icons = {
      URGENT: '🚨',
      HIGH: '⚠️',
      MEDIUM: '📌',
      LOW: '💡'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[priority]}`}>
        {icons[priority]} {priority}
      </span>
    );
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
          <p className="text-lg text-gray-600 font-medium">Analyse intelligente en cours...</p>
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
            <h1 className="text-4xl md:text-5xl font-bold">AI Optimization Center</h1>
          </div>
          <p className="text-indigo-100 text-lg">Analyse intelligente + Détection automatique des opportunités</p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Stats globales ENRICHIES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 -mt-16">
          {/* AI Score moyen */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">AI SCORE</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{aiStats?.average_score || 0}/100</p>
            <p className="text-sm text-gray-600 mt-1">Score moyen</p>
            <p className="text-lg font-bold text-indigo-600 mt-2">
              {aiStats?.contracts_to_optimize || 0} à optimiser
            </p>
          </div>

          {/* Surconsommation */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">URGENT</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{overconsumedContracts.length}</p>
            <p className="text-sm text-gray-600 mt-1">Surcharge licences</p>
            <p className="text-lg font-bold text-red-600 mt-2">{formatCurrency(totalOverconsumptionCost)}/mois</p>
          </div>

          {/* Gaspillage */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">ÉCONOMIES</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{underusedContracts.length}</p>
            <p className="text-sm text-gray-600 mt-1">Sous-utilisés</p>
            <p className="text-lg font-bold text-yellow-600 mt-2">{formatCurrency(totalWastedCost)}/mois</p>
          </div>

          {/* Optimisés */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">OPTIMAL</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{optimizedContracts.length}</p>
            <p className="text-sm text-gray-600 mt-1">Bien optimisés</p>
            <p className="text-lg font-bold text-green-600 mt-2">70-95% utilisés</p>
          </div>
        </div>

        {/* NOUVELLE SECTION : AI OPTIMIZATION SCORES */}
        {aiOptimizations.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">🤖 AI Optimization Score</h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    Analyse intelligente • Score 0-100 • Recommandations automatiques
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl p-6">
              <div className="space-y-4">
                {aiOptimizations.slice(0, 5).map((opt) => (
                  <div 
                    key={opt.contract_id}
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Header contrat */}
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedContract(
                        expandedContract === opt.contract_id ? null : opt.contract_id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{opt.contract_name}</h3>
                            {getGradeBadge(opt.grade)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {formatCurrency(opt.monthly_cost)}/mois
                            </span>
                            <span>•</span>
                            <span>Score: {opt.score}/100</span>
                            {opt.recommendations.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 font-medium">
                                  {opt.recommendations.length} recommandation(s)
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {opt.total_potential_savings_annual > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Économie potentielle</p>
                              <p className="text-lg font-bold text-green-700">
                                {formatCurrency(opt.total_potential_savings_annual)}/an
                              </p>
                            </div>
                          )}
                          {expandedContract === opt.contract_id ? (
                            <ChevronUp className="w-6 h-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Détails (expandable) */}
                    {expandedContract === opt.contract_id && (
                      <div className="border-t-2 border-gray-200 bg-gray-50 p-5">
                        {/* Pénalités */}
                        {opt.penalties && opt.penalties.length > 0 && (
                          <div className="mb-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <XCircle className="w-5 h-5 text-red-600" />
                              Points de pénalité
                            </h4>
                            <div className="space-y-2">
                              {opt.penalties.map((penalty, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                                >
                                  <span className="text-sm text-gray-700">{penalty.message}</span>
                                  <span className="text-sm font-semibold text-red-600">-{penalty.points} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommandations AI */}
                        {opt.recommendations && opt.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-yellow-600" />
                              Recommandations AI
                            </h4>
                            <div className="space-y-3">
                              {opt.recommendations.map((rec, idx) => (
                                <div 
                                  key={idx}
                                  className="bg-white rounded-lg p-4 border-2 border-gray-200"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {getPriorityBadge(rec.priority)}
                                      </div>
                                      <h5 className="font-semibold text-gray-900 mb-1">{rec.title}</h5>
                                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                                      <p className="text-sm text-indigo-700 font-medium">
                                        ➜ {rec.action}
                                      </p>
                                    </div>
                                    {rec.savings && (
                                      <div className="ml-4 text-right">
                                        <p className="text-xs text-gray-500">Économie</p>
                                        <p className="text-xl font-bold text-green-700">
                                          {formatCurrency(rec.savings.annual)}
                                        </p>
                                        <p className="text-xs text-gray-500">/an</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION SURCONSOMMATION (version originale) */}
        {overconsumedContracts.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">🚨 URGENCE : Surconsommation Licences</h2>
                  <p className="text-red-100 text-sm mt-1">
                    {totalOverconsumed} licences manquantes • {formatCurrency(totalOverconsumptionCost)}/mois
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
                      <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                        SURCHARGE {contract.overusageRate.toFixed(0)}%
                      </span>
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
                        <p className="text-xs text-red-700 mb-1 font-semibold">Manquantes</p>
                        <p className="text-2xl font-bold text-red-700">{contract.overused}</p>
                      </div>
                      <div className="bg-red-100 rounded-lg p-3 border-2 border-red-300">
                        <p className="text-xs text-red-700 mb-1 font-semibold">Surcoût/mois</p>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(contract.missingCost)}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-4 border-l-4 border-red-600">
                      <h4 className="font-bold text-red-900 mb-2">⚠️ Actions Urgentes :</h4>
                      <ul className="space-y-2 text-sm text-red-800">
                        <li>• Acheter {contract.overused} licences ({formatCurrency(contract.missingCost)}/mois)</li>
                        <li>• Contacter {contract.provider} avant renouvellement</li>
                        <li>• Surcoût annuel : {formatCurrency(contract.missingCost * 12)}</li>
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION SOUS-UTILISATION (version originale) */}
        {underusedContracts.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">⚠️ Gaspillage Licences</h2>
                  <p className="text-yellow-100 text-sm mt-1">
                    {totalWastedLicenses} inutilisées • {formatCurrency(totalWastedCost)}/mois économisables
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
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getUsageColor(contract.usageRate)}`}>
                        {contract.usageRate.toFixed(0)}% utilisé
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">Total licences</p>
                        <p className="text-2xl font-bold text-gray-900">{contract.licenseCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-gray-600 mb-1">Utilisées</p>
                        <p className="text-2xl font-bold text-green-600">{contract.licensesUsed}</p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-3 border-2 border-yellow-300">
                        <p className="text-xs text-yellow-700 mb-1 font-semibold">Inutilisées</p>
                        <p className="text-2xl font-bold text-yellow-700">{contract.unused}</p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-3 border-2 border-yellow-300">
                        <p className="text-xs text-yellow-700 mb-1 font-semibold">Gaspillage/mois</p>
                        <p className="text-2xl font-bold text-yellow-700">{formatCurrency(contract.wastedCost)}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-4 border-l-4 border-yellow-600">
                      <h4 className="font-bold text-yellow-900 mb-2">💡 Recommandations :</h4>
                      <ul className="space-y-2 text-sm text-yellow-800">
                        <li>• Réduire à {Math.ceil(contract.licensesUsed * 1.1)} licences</li>
                        <li>• Économie : {formatCurrency(contract.wastedCost * 12)}/an</li>
                        <li>• Négocier avec {contract.provider}</li>
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION OPTIMISÉS (version originale) */}
        {optimizedContracts.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">✅ Bien Optimisés</h2>
                  <p className="text-green-100 text-sm mt-1">70-95% d'utilisation • Continuez !</p>
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
                    <div className="bg-white rounded-lg p-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full"
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
      </div>
    </div>
  );
};

export default OptimizationPage;