// ============================================================================
// CONTROLLER - AI OPTIMIZATION SCORE (VERSION PÉRENNE)
// ============================================================================
// Fichier : server/src/optimizationController.js
// Description : Analyse intelligente des contrats pour générer scores et recommandations
// ✅ PÉRENNE : Adapté au schéma réel (license_count, licenses_used, real_users)
// ✅ Calcul score 0-100, génération recommandations, calcul économies
// ============================================================================

const db = require('./db');

const LOG_PREFIX = 'Optimization:';

/**
 * Calcule le score d'optimisation d'un contrat (0-100)
 * 100 = Parfaitement optimisé
 * 0 = Très mal optimisé
 */
const calculateOptimizationScore = (contract) => {
  let score = 100;
  const penalties = [];

  // 1. PÉNALITÉ SOUS-UTILISATION LICENCES (-50 points max)
  if (contract.license_count && contract.licenses_used !== null) {
    const utilizationRate = contract.licenses_used / contract.license_count;
    
    if (utilizationRate < 1) {
      const penalty = Math.round(50 * (1 - utilizationRate));
      score -= penalty;
      penalties.push({
        type: 'underutilization',
        points: penalty,
        message: `Seulement ${Math.round(utilizationRate * 100)}% des licences utilisées`
      });
    }
  } else if (contract.license_count && !contract.licenses_used) {
    // Pas de données d'usage
    score -= 15;
    penalties.push({
      type: 'no_usage_data',
      points: 15,
      message: 'Données d\'utilisation manquantes'
    });
  }

  // 2. PÉNALITÉ COÛT UNITAIRE ÉLEVÉ (-20 points)
  if (contract.license_count && contract.licenses_used > 0) {
    const costPerLicense = contract.monthly_cost / contract.licenses_used;
    
    // Benchmark simple : si coût/licence > 50€, c'est cher
    if (costPerLicense > 50) {
      score -= 20;
      penalties.push({
        type: 'high_unit_cost',
        points: 20,
        message: `Coût par licence élevé: ${costPerLicense.toFixed(2)}€/mois`
      });
    }
  }

  // 3. PÉNALITÉ RENOUVELLEMENT PROCHE SANS ACTION (-10 points)
  if (contract.renewal_date) {
    const daysUntilRenewal = Math.ceil(
      (new Date(contract.renewal_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilRenewal > 0 && daysUntilRenewal < 60) {
      score -= 10;
      penalties.push({
        type: 'renewal_soon',
        points: 10,
        message: `Renouvellement dans ${daysUntilRenewal} jours`
      });
    }
  }

  // 4. PÉNALITÉ INACTIVITÉ COMPLÈTE (-5 points)
  if (contract.real_users === 0 || contract.licenses_used === 0) {
    score -= 5;
    penalties.push({
      type: 'inactive',
      points: 5,
      message: 'Aucun utilisateur actif'
    });
  }

  // Score minimum = 0
  score = Math.max(0, score);

  return {
    score: Math.round(score),
    penalties,
    grade: getScoreGrade(score)
  };
};

/**
 * Retourne le grade (couleur) du score
 */
const getScoreGrade = (score) => {
  if (score >= 90) return { label: 'EXCELLENT', color: 'green', emoji: '🟢' };
  if (score >= 75) return { label: 'BON', color: 'yellow', emoji: '🟡' };
  if (score >= 50) return { label: 'MOYEN', color: 'orange', emoji: '🟠' };
  return { label: 'MAUVAIS', color: 'red', emoji: '🔴' };
};

/**
 * Génère des recommandations d'optimisation pour un contrat
 */
const generateRecommendations = (contract, scoreData) => {
  const recommendations = [];

  // 1. RÉDUCTION LICENCES
  if (contract.license_count && contract.licenses_used !== null) {
    const utilizationRate = contract.licenses_used / contract.license_count;
    
    if (utilizationRate < 0.7) {
      const unusedLicenses = contract.license_count - contract.licenses_used;
      const costPerLicense = contract.monthly_cost / contract.license_count;
      const monthlySavings = unusedLicenses * costPerLicense;
      const annualSavings = monthlySavings * 12;

      recommendations.push({
        type: 'REDUCE_LICENSES',
        priority: 'HIGH',
        title: `Réduire ${unusedLicenses} licence(s) inutilisée(s)`,
        description: `Seulement ${contract.licenses_used}/${contract.license_count} licences utilisées (${Math.round(utilizationRate * 100)}%)`,
        action: `Passer de ${contract.license_count} à ${contract.licenses_used} licences`,
        savings: {
          monthly: monthlySavings,
          annual: annualSavings
        },
        impact: 'high'
      });
    }
  }

  // 2. ANNULATION SI INACTIVITÉ TOTALE
  if (contract.real_users === 0 || contract.licenses_used === 0) {
    recommendations.push({
      type: 'CANCEL_UNUSED',
      priority: 'URGENT',
      title: 'Résilier ce contrat non utilisé',
      description: 'Aucun utilisateur actif détecté',
      action: 'Annuler le contrat et migrer si nécessaire',
      savings: {
        monthly: contract.monthly_cost,
        annual: contract.monthly_cost * 12
      },
      impact: 'high'
    });
  }

  // 3. NÉGOCIATION RENOUVELLEMENT
  if (contract.renewal_date) {
    const daysUntilRenewal = Math.ceil(
      (new Date(contract.renewal_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilRenewal > 0 && daysUntilRenewal < 90) {
      const potentialDiscount = contract.monthly_cost * 0.15; // 15% discount target
      
      recommendations.push({
        type: 'NEGOTIATE_RENEWAL',
        priority: daysUntilRenewal < 30 ? 'URGENT' : 'MEDIUM',
        title: 'Négocier le renouvellement',
        description: `Renouvellement dans ${daysUntilRenewal} jours`,
        action: 'Contacter le fournisseur pour négocier -15% minimum',
        savings: {
          monthly: potentialDiscount,
          annual: potentialDiscount * 12
        },
        impact: 'medium'
      });
    }
  }

  // 4. DOWNGRADE PLAN (si beaucoup de licences inutilisées)
  if (contract.license_count && contract.licenses_used !== null) {
    const utilizationRate = contract.licenses_used / contract.license_count;
    
    if (utilizationRate < 0.5 && utilizationRate > 0) {
      const potentialSavings = contract.monthly_cost * 0.3; // Estimation 30% moins cher
      
      recommendations.push({
        type: 'DOWNGRADE_PLAN',
        priority: 'MEDIUM',
        title: 'Passer à un plan inférieur',
        description: `Utilisation très faible (${Math.round(utilizationRate * 100)}%)`,
        action: 'Explorer un plan adapté à vos besoins réels',
        savings: {
          monthly: potentialSavings,
          annual: potentialSavings * 12
        },
        impact: 'medium'
      });
    }
  }

  // Trier par priorité
  const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
};

/**
 * GET /api/optimization/scores
 * Récupère tous les scores d'optimisation
 */
const getOptimizationScores = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    // Récupérer tous les contrats
    const result = await db.query(`
      SELECT 
        id,
        name,
        provider,
        monthly_cost,
        license_count,
        licenses_used,
        real_users,
        renewal_date,
        status
      FROM contracts
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY monthly_cost DESC
    `, [organizationId]);

    const contracts = result.rows;

    // Calculer scores et recommandations pour chaque contrat
    const optimizations = contracts.map(contract => {
      const scoreData = calculateOptimizationScore(contract);
      const recommendations = generateRecommendations(contract, scoreData);

      return {
        contract_id: contract.id,
        contract_name: contract.name,
        provider: contract.provider,
        monthly_cost: parseFloat(contract.monthly_cost),
        score: scoreData.score,
        grade: scoreData.grade,
        penalties: scoreData.penalties,
        recommendations: recommendations,
        total_potential_savings_monthly: recommendations.reduce((sum, r) => sum + (r.savings?.monthly || 0), 0),
        total_potential_savings_annual: recommendations.reduce((sum, r) => sum + (r.savings?.annual || 0), 0)
      };
    });

    // Calculer stats globales
    const totalContracts = contracts.length;
    const averageScore = totalContracts > 0 
      ? Math.round(optimizations.reduce((sum, o) => sum + o.score, 0) / totalContracts)
      : 0;
    const totalPotentialSavingsMonthly = optimizations.reduce((sum, o) => sum + o.total_potential_savings_monthly, 0);
    const totalPotentialSavingsAnnual = optimizations.reduce((sum, o) => sum + o.total_potential_savings_annual, 0);
    const contractsToOptimize = optimizations.filter(o => o.score < 75).length;

    console.log(`${LOG_PREFIX} ${totalContracts} contrats analysés pour organisation ${organizationId}`);

    res.status(200).json({
      stats: {
        total_contracts: totalContracts,
        average_score: averageScore,
        contracts_to_optimize: contractsToOptimize,
        total_potential_savings_monthly: totalPotentialSavingsMonthly,
        total_potential_savings_annual: totalPotentialSavingsAnnual
      },
      optimizations: optimizations
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getOptimizationScores:`, error);
    res.status(500).json({ error: 'Erreur serveur lors du calcul des scores' });
  }
};

/**
 * GET /api/optimization/contract/:id
 * Détail optimisation d'un contrat spécifique
 */
const getContractOptimization = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        provider,
        monthly_cost,
        license_count,
        licenses_used,
        real_users,
        renewal_date,
        status,
        pricing_model
      FROM contracts
      WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    const contract = result.rows[0];
    const scoreData = calculateOptimizationScore(contract);
    const recommendations = generateRecommendations(contract, scoreData);

    res.status(200).json({
      contract: {
        ...contract,
        monthly_cost: parseFloat(contract.monthly_cost)
      },
      optimization: {
        score: scoreData.score,
        grade: scoreData.grade,
        penalties: scoreData.penalties,
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getContractOptimization:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/optimization/recommendations/top
 * Top recommandations (économies les plus importantes)
 */
const getTopRecommendations = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        provider,
        monthly_cost,
        license_count,
        licenses_used,
        real_users,
        renewal_date,
        status
      FROM contracts
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY monthly_cost DESC
    `, [organizationId]);

    const contracts = result.rows;

    // Générer toutes les recommandations
    const allRecommendations = [];

    contracts.forEach(contract => {
      const scoreData = calculateOptimizationScore(contract);
      const recommendations = generateRecommendations(contract, scoreData);

      recommendations.forEach(rec => {
        allRecommendations.push({
          ...rec,
          contract_id: contract.id,
          contract_name: contract.name,
          provider: contract.provider
        });
      });
    });

    // Trier par économies annuelles décroissantes
    allRecommendations.sort((a, b) => 
      (b.savings?.annual || 0) - (a.savings?.annual || 0)
    );

    // Top 10
    const topRecommendations = allRecommendations.slice(0, 10);

    console.log(`${LOG_PREFIX} ${topRecommendations.length} recommandations top pour organisation ${organizationId}`);

    res.status(200).json({
      recommendations: topRecommendations,
      total_recommendations: allRecommendations.length
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getTopRecommendations:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getOptimizationScores,
  getContractOptimization,
  getTopRecommendations
};