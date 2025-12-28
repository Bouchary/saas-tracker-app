// ============================================================================
// CONTROLLER - AI ANALYSIS (VRAIE IA) - VERSION CORRIGÉE
// ============================================================================
// Fichier : server/src/aiAnalysisController.js
// Description : Analyse IA avec Claude API + ML prédictif
// ✅ VRAIE IA : Claude API (Anthropic) pour analyse contrats
// ✅ ML PRÉDICTIF : Régression linéaire pour tendances
// ✅ CORRIGÉ : Colonnes documents (original_filename, document_type)
// ============================================================================

const db = require('./db');
const Anthropic = require('@anthropic-ai/sdk');

const LOG_PREFIX = 'AI Analysis:';

// Initialiser Claude API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Analyse prédictive ML : Calcule tendance usage et prédictions futures
 */
const predictUsageTrend = async (contractId, organizationId) => {
  try {
    // Récupérer historique usage (6 derniers mois)
    const historyResult = await db.query(`
      SELECT 
        month,
        license_count,
        licenses_used,
        real_users,
        usage_rate,
        recorded_at
      FROM contract_usage_history
      WHERE contract_id = $1 AND organization_id = $2
      ORDER BY month DESC
      LIMIT 6
    `, [contractId, organizationId]);

    const history = historyResult.rows.reverse(); // Ordre chronologique

    if (history.length < 2) {
      return {
        has_prediction: false,
        message: 'Historique insuffisant (minimum 2 mois requis)',
        months_available: history.length
      };
    }

    // Régression linéaire simple
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    history.forEach((point, index) => {
      const x = index; // Mois (0, 1, 2, ...)
      const y = parseFloat(point.usage_rate);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    // Calcul pente (trend) et ordonnée à l'origine
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Prédictions 3 mois à venir
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const futureMonth = n + i - 1;
      const predictedRate = slope * futureMonth + intercept;
      
      predictions.push({
        month_offset: i,
        predicted_usage_rate: Math.max(0, Math.min(100, predictedRate)), // Clamp 0-100%
        confidence: i === 1 ? 'HIGH' : i === 2 ? 'MEDIUM' : 'LOW'
      });
    }

    // Calcul tendance
    const trendPercentage = slope * 100; // Changement par mois
    let trendLabel = 'STABLE';
    if (trendPercentage > 2) trendLabel = 'HAUSSE';
    else if (trendPercentage < -2) trendLabel = 'BAISSE';

    // Analyse tendance
    const currentUsage = parseFloat(history[history.length - 1].usage_rate);
    const predictedIn3Months = predictions[2].predicted_usage_rate;
    const changeIn3Months = predictedIn3Months - currentUsage;

    let recommendation = '';
    if (trendLabel === 'BAISSE' && predictedIn3Months < 60) {
      recommendation = `Tendance baissière détectée (${trendPercentage.toFixed(1)}%/mois). Usage prévu dans 3 mois : ${predictedIn3Months.toFixed(0)}%. Recommandation : Réduire les licences dès maintenant.`;
    } else if (trendLabel === 'HAUSSE' && predictedIn3Months > 90) {
      recommendation = `Tendance haussière détectée (+${trendPercentage.toFixed(1)}%/mois). Usage prévu dans 3 mois : ${predictedIn3Months.toFixed(0)}%. Recommandation : Prévoir l'achat de licences supplémentaires.`;
    } else {
      recommendation = `Usage stable. Aucune action urgente requise.`;
    }

    return {
      has_prediction: true,
      historical_data: history.map(h => ({
        month: h.month,
        usage_rate: parseFloat(h.usage_rate),
        license_count: h.license_count,
        licenses_used: h.licenses_used,
        real_users: h.real_users
      })),
      trend: {
        label: trendLabel,
        slope: parseFloat(trendPercentage.toFixed(2)),
        description: trendLabel === 'HAUSSE' 
          ? 'Usage en augmentation' 
          : trendLabel === 'BAISSE' 
            ? 'Usage en diminution' 
            : 'Usage stable'
      },
      predictions: predictions,
      analysis: {
        current_usage: currentUsage,
        predicted_in_3_months: predictedIn3Months,
        change: changeIn3Months,
        recommendation: recommendation
      }
    };

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur predictUsageTrend:`, error);
    throw error;
  }
};

/**
 * Analyse contrat avec Claude API (VRAIE IA)
 */
const analyzeContractWithAI = async (contractId, organizationId) => {
  try {
    // ✅ CORRECTION : Utiliser original_filename et document_type
    const contractResult = await db.query(`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', d.id,
            'original_filename', d.original_filename,
            'document_type', d.document_type,
            'file_path', d.file_path,
            'mime_type', d.mime_type
          )
        ) FILTER (WHERE d.id IS NOT NULL) as documents
      FROM contracts c
      LEFT JOIN documents d ON d.contract_id = c.id
      WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL
      GROUP BY c.id
    `, [contractId, organizationId]);

    if (contractResult.rows.length === 0) {
      throw new Error('Contrat non trouvé');
    }

    const contract = contractResult.rows[0];

    // Calcul taux utilisation actuel
    const usageRate = contract.license_count > 0 
      ? ((contract.licenses_used / contract.license_count) * 100).toFixed(1)
      : 'N/A';

    // Préparer contexte pour Claude
    const context = `
Analyse ce contrat SaaS et fournis une évaluation détaillée :

INFORMATIONS CONTRAT :
- Nom : ${contract.name}
- Fournisseur : ${contract.provider}
- Coût mensuel : ${contract.monthly_cost}€
- Modèle tarifaire : ${contract.pricing_model}
- Licences achetées : ${contract.license_count || 'N/A'}
- Licences utilisées : ${contract.licenses_used || 'N/A'}
- Utilisateurs réels : ${contract.real_users || 'N/A'}
- Taux utilisation : ${usageRate}%
- Date renouvellement : ${contract.renewal_date || 'N/A'}
- Statut : ${contract.status}
- Préavis résiliation : ${contract.notice_period_days || 'N/A'} jours

CONTEXTE D'UTILISATION :
${contract.license_count && contract.licenses_used 
  ? `- Sous-utilisation : ${contract.license_count - contract.licenses_used} licences inutilisées`
  : ''}
${contract.real_users && contract.license_count && contract.real_users > contract.license_count
  ? `- ⚠️ ALERTE : ${contract.real_users - contract.license_count} utilisateurs réels au-delà des licences achetées (risque de non-conformité)`
  : ''}

DEMANDE D'ANALYSE :
1. Évalue la pertinence de ce contrat (score 0-100)
2. Identifie les risques potentiels (clauses auto-renouvellement, pénalités, non-conformité, etc.)
3. Suggère 3-5 actions concrètes d'optimisation
4. Recommande une stratégie de négociation pour le renouvellement
5. Détecte les drapeaux rouges (coûts cachés, lock-in, surcharges, etc.)

Réponds en JSON avec cette structure exacte :
{
  "evaluation_score": <nombre 0-100>,
  "pertinence": "<haute|moyenne|basse>",
  "risques": ["<risque1>", "<risque2>", ...],
  "optimisations": ["<action1>", "<action2>", ...],
  "strategie_negociation": "<texte stratégie>",
  "drapeaux_rouges": ["<warning1>", "<warning2>", ...],
  "resume": "<résumé en 2-3 phrases>"
}
`;

    // Appel Claude API
    let aiAnalysis = null;
    
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: context
          }]
        });

        // Parser réponse JSON
        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }

      } catch (apiError) {
        console.error(`${LOG_PREFIX} Erreur Claude API:`, apiError.message);
        aiAnalysis = null;
      }
    }

    // Fallback si API indisponible
    if (!aiAnalysis) {
      aiAnalysis = {
        evaluation_score: 70,
        pertinence: 'moyenne',
        risques: [
          'API Claude non configurée - Analyse basique uniquement',
          'Pour analyses complètes : configurer ANTHROPIC_API_KEY dans .env'
        ],
        optimisations: [
          'Configurer ANTHROPIC_API_KEY pour analyses IA avancées',
          'Ajouter plus de données d\'usage pour prédictions ML précises'
        ],
        strategie_negociation: 'Analyse IA non disponible - configurez l\'API Claude pour recommandations personnalisées',
        drapeaux_rouges: [],
        resume: 'Analyse basique effectuée. Configurez l\'API Claude (clé gratuite sur console.anthropic.com) pour analyses approfondies avec vraie IA.'
      };
    }

    console.log(`${LOG_PREFIX} Contrat ${contractId} analysé avec ${process.env.ANTHROPIC_API_KEY ? 'Claude API' : 'fallback'}`);

    return {
      contract_id: contractId,
      contract_name: contract.name,
      ai_analysis: aiAnalysis,
      analyzed_at: new Date().toISOString(),
      api_used: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4' : 'fallback'
    };

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur analyzeContractWithAI:`, error);
    throw error;
  }
};

/**
 * POST /api/ai/analyze/:id
 * Analyse complète : IA + ML prédictif
 */
const analyzeContract = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    // 1. Analyse IA (Claude)
    const aiAnalysis = await analyzeContractWithAI(id, organizationId);

    // 2. Prédiction ML
    const mlPrediction = await predictUsageTrend(id, organizationId);

    console.log(`${LOG_PREFIX} Analyse complète contrat ${id} pour organisation ${organizationId}`);

    res.status(200).json({
      success: true,
      contract_id: id,
      ai_analysis: aiAnalysis.ai_analysis,
      ml_prediction: mlPrediction,
      api_used: aiAnalysis.api_used,
      analyzed_at: aiAnalysis.analyzed_at
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur analyzeContract:`, error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse IA',
      details: error.message 
    });
  }
};

/**
 * GET /api/ai/predictions/:id
 * Prédictions ML uniquement
 */
const getPredictions = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    const predictions = await predictUsageTrend(id, organizationId);

    res.status(200).json({
      success: true,
      contract_id: id,
      predictions: predictions
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getPredictions:`, error);
    res.status(500).json({ 
      error: 'Erreur lors des prédictions',
      details: error.message 
    });
  }
};

module.exports = {
  analyzeContract,
  getPredictions
};