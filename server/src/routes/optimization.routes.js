// ============================================================================
// ROUTES - AI OPTIMIZATION SCORE
// ============================================================================
// Fichier : server/src/routes/optimization.routes.js
// Description : Routes pour l'analyse d'optimisation des contrats
// ============================================================================

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

const {
  getOptimizationScores,
  getContractOptimization,
  getTopRecommendations
} = require('../optimizationController');

// Toutes les routes nécessitent authentification + organisation
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * GET /api/optimization/scores
 * Liste complète des scores d'optimisation pour tous les contrats
 * Retourne: stats globales + détail par contrat
 */
router.get('/scores', getOptimizationScores);

/**
 * GET /api/optimization/contract/:id
 * Détail optimisation d'un contrat spécifique
 * Retourne: score, pénalités, recommandations
 */
router.get('/contract/:id', getContractOptimization);

/**
 * GET /api/optimization/recommendations/top
 * Top 10 des recommandations (triées par économies potentielles)
 * Retourne: liste des meilleures opportunités d'économies
 */
router.get('/recommendations/top', getTopRecommendations);

module.exports = router;