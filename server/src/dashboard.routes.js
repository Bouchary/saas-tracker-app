// ============================================================================
// DASHBOARD ROUTES - FICHIER COMPLET
// ✅ AJOUT : Route /global pour GlobalView
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('./middlewares/authMiddleware');
const {
    getGlobalStats,
    getGlobalView,
    getContractsAnalytics,
    getLicensesAnalytics,
    getAssetsAnalytics,
    getEmployeesAnalytics
} = require('./dashboardController');

// Protection de toutes les routes
router.use(protect);

// GET /api/dashboard/stats - Statistiques globales
router.get('/stats', getGlobalStats);

// GET /api/dashboard/global - Vue globale complète (pour GlobalView.jsx)
router.get('/global', getGlobalView);

// GET /api/dashboard/contracts - Analytics contrats
router.get('/contracts', getContractsAnalytics);

// GET /api/dashboard/licenses - Analytics licences
router.get('/licenses', getLicensesAnalytics);

// GET /api/dashboard/assets - Analytics assets
router.get('/assets', getAssetsAnalytics);

// GET /api/dashboard/employees - Analytics employés
router.get('/employees', getEmployeesAnalytics);

module.exports = router;