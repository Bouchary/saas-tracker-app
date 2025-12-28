// ============================================================================
// ROUTES - AI ANALYSIS
// ============================================================================
// Fichier : server/src/routes/ai-analysis.routes.js
// Description : Routes pour analyse IA (Claude API + ML)
// ============================================================================

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

const {
  analyzeContract,
  getPredictions
} = require('../aiAnalysisController');

// Toutes les routes nécessitent authentification + organisation
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * POST /api/ai/analyze/:id
 * Analyse complète IA d'un contrat (Claude API + ML prédictif)
 * Retourne : analyse IA + prédictions tendances
 */
router.post('/analyze/:id', analyzeContract);

/**
 * GET /api/ai/predictions/:id
 * Prédictions ML uniquement (tendances usage)
 * Retourne : historique + prédictions 3 mois
 */
router.get('/predictions/:id', getPredictions);

module.exports = router;