// ============================================================================
// ASSETS ROUTES
// ============================================================================
// Module : Matériel IT (Phase 10)
// Description : Routes Express pour les assets
// ============================================================================

const express = require('express');
const router = express.Router();
const assetsController = require('./assetsController');

// NOTE: Si vous avez un middleware d'authentification, décommentez ces lignes
// const { authenticateToken } = require('./middlewares/authMiddleware');
// Toutes les routes ci-dessous seraient alors protégées

// ============================================================================
// ROUTES STATISTICS (doit être avant /:id pour éviter les conflits)
// ============================================================================

// GET /api/assets/stats - Statistiques
router.get('/stats', assetsController.getAssetStats);

// ============================================================================
// ROUTES CRUD ASSETS
// ============================================================================

// GET /api/assets - Liste des assets
router.get('/', assetsController.getAllAssets);

// GET /api/assets/:id - Détails d'un asset
router.get('/:id', assetsController.getAssetById);

// POST /api/assets - Créer un asset
router.post('/', assetsController.createAsset);

// PUT /api/assets/:id - Mettre à jour un asset
router.put('/:id', assetsController.updateAsset);

// DELETE /api/assets/:id - Supprimer (retire) un asset
router.delete('/:id', assetsController.deleteAsset);

// ============================================================================
// ROUTES ASSIGNATIONS
// ============================================================================

// POST /api/assets/:id/assign - Assigner un asset à un employé
router.post('/:id/assign', assetsController.assignAsset);

// POST /api/assets/:id/unassign - Retourner un asset
router.post('/:id/unassign', assetsController.unassignAsset);

// GET /api/assets/:id/history - Historique des assignations
router.get('/:id/history', assetsController.getAssetHistory);

// ============================================================================
// EXPORT
// ============================================================================

module.exports = router;