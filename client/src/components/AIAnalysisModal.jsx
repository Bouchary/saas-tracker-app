// ============================================================================
// COMPONENT - AI ANALYSIS MODAL
// ============================================================================
// Fichier : client/src/components/AIAnalysisModal.jsx
// Description : Modal affichant analyse IA + prédictions ML
// ✅ Analyse Claude API + ML prédictif
// ============================================================================

import React, { useState } from 'react';
import { X, Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import API_URL from '../config/api';

const AIAnalysisModal = ({ contract, onClose, token }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeWithAI = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/analyze/${contract.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const data = await response.json();
      setAnalysis(data);

    } catch (err) {
      console.error('Erreur AI:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    analyzeWithAI();
  }, []);

  const getTrendIcon = (label) => {
    if (label === 'HAUSSE') return <TrendingUp className="w-5 h-5 text-red-600" />;
    if (label === 'BAISSE') return <TrendingDown className="w-5 h-5 text-green-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getTrendColor = (label) => {
    if (label === 'HAUSSE') return 'bg-red-50 border-red-200 text-red-800';
    if (label === 'BAISSE') return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Analyse IA Complète</h2>
                <p className="text-indigo-100 text-sm">{contract.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Analyse IA en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Claude analyse votre contrat</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* API Badge */}
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">
                    Analysé par : {analysis.api_used === 'claude-sonnet-4' ? 'Claude Sonnet 4 (Anthropic)' : 'Analyse basique'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{new Date(analysis.analyzed_at).toLocaleString('fr-FR')}</span>
              </div>

              {/* Score d'évaluation */}
              {analysis.ai_analysis && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    Évaluation IA
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Score d'évaluation</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all"
                            style={{ width: `${analysis.ai_analysis.evaluation_score}%` }}
                          ></div>
                        </div>
                        <span className="text-2xl font-bold text-indigo-900">
                          {analysis.ai_analysis.evaluation_score}/100
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Pertinence</p>
                      <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                        analysis.ai_analysis.pertinence === 'haute' ? 'bg-green-100 text-green-800' :
                        analysis.ai_analysis.pertinence === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.ai_analysis.pertinence.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <p className="text-gray-800">{analysis.ai_analysis.resume}</p>
                  </div>
                </div>
              )}

              {/* Risques détectés */}
              {analysis.ai_analysis?.risques && analysis.ai_analysis.risques.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Risques détectés
                  </h3>
                  <ul className="space-y-2">
                    {analysis.ai_analysis.risques.map((risque, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{risque}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimisations suggérées */}
              {analysis.ai_analysis?.optimisations && analysis.ai_analysis.optimisations.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Actions d'optimisation
                  </h3>
                  <ul className="space-y-2">
                    {analysis.ai_analysis.optimisations.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="text-green-600 font-bold">{idx + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stratégie de négociation */}
              {analysis.ai_analysis?.strategie_negociation && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Stratégie de négociation</h3>
                  <p className="text-sm text-blue-800">{analysis.ai_analysis.strategie_negociation}</p>
                </div>
              )}

              {/* Prédictions ML */}
              {analysis.ml_prediction?.has_prediction && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Prédictions Machine Learning
                  </h3>

                  {/* Tendance */}
                  <div className={`mb-4 p-4 rounded-lg border-2 ${getTrendColor(analysis.ml_prediction.trend.label)}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getTrendIcon(analysis.ml_prediction.trend.label)}
                      <span className="font-bold">{analysis.ml_prediction.trend.description}</span>
                      <span className="text-sm">
                        ({analysis.ml_prediction.trend.slope > 0 ? '+' : ''}{analysis.ml_prediction.trend.slope}% / mois)
                      </span>
                    </div>
                  </div>

                  {/* Prédictions 3 mois */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {analysis.ml_prediction.predictions.map((pred, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-gray-500 mb-1">Dans {pred.month_offset} mois</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {pred.predicted_usage_rate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600">{pred.confidence}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recommandation ML */}
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-900 font-medium">
                      💡 {analysis.ml_prediction.analysis.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {!analysis.ml_prediction?.has_prediction && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-gray-600">Historique insuffisant pour prédictions ML</p>
                  <p className="text-sm text-gray-500 mt-1">Minimum 2 mois de données requis</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;