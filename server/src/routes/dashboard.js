// server/src/routes/dashboard.js
// ✅ VERSION CORRIGÉE - Utilise le vrai middleware authMiddleware.js

const express = require('express');
const router = express.Router();

// ✅ CORRECTION : Import depuis le bon fichier avec le bon nom
const { protect } = require('../middlewares/authMiddleware');

// Import des controllers
const {
    getGlobalStats,
    getContractsAnalytics,
    getLicensesAnalytics,
    getAssetsAnalytics,
    getEmployeesAnalytics
} = require('../dashboardController');

// Toutes les routes nécessitent authentification
router.use(protect);

// GET /api/dashboard/stats - KPIs globaux
router.get('/stats', getGlobalStats);

// GET /api/dashboard/contracts - Analytics contrats
router.get('/contracts', getContractsAnalytics);

// GET /api/dashboard/licenses - Analytics licences
router.get('/licenses', getLicensesAnalytics);

// GET /api/dashboard/assets - Analytics assets
router.get('/assets', getAssetsAnalytics);

// GET /api/dashboard/employees - Analytics employés
router.get('/employees', getEmployeesAnalytics);

module.exports = router;