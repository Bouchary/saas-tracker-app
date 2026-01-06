// server/src/routes/purchase-requests.routes.js
// ============================================================================
// ROUTES MODULE PURCHASE REQUESTS (Demandes d'achat)
// ============================================================================
// 15 endpoints : CRUD, workflow validation, conversion contrat, stats
// Middlewares : auth, organization, permissions
// ============================================================================

const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware.js');
const organizationMiddleware = require('../middlewares/organizationMiddleware.js');
const { validate } = require('../middlewares/validation');

// Controllers
const {
    // CRUD
    getAllPurchaseRequests,
    getPurchaseRequestById,
    createPurchaseRequest,
    updatePurchaseRequest,
    deletePurchaseRequest,
    
    // Workflow
    submitPurchaseRequest,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    
    // Conversion
    convertToContract,
    
    // Fichiers
    uploadFile,
    getFiles,
    deleteFile,
    
    // Stats & Listes
    getStats,
    getMyRequests,
    getRequestsToApprove,
    
    // Historique
    getHistory
} = require('../controllers/purchaseRequestsController.js');

// Validators (on les créera après)
const {
    createPurchaseRequestValidation,
    updatePurchaseRequestValidation,
    submitPurchaseRequestValidation,
    approveRequestValidation,
    rejectRequestValidation
} = require('../validators/purchaseRequestValidator');

// Upload config
const upload = require('../config/upload.config.js');

// ============================================================================
// APPLIQUER MIDDLEWARES À TOUTES LES ROUTES
// ============================================================================
router.use(authMiddleware);
router.use(organizationMiddleware);

// ============================================================================
// ROUTES SPÉCIFIQUES (AVANT /:id)
// ============================================================================

// GET /api/purchase-requests/stats - Statistiques dashboard
router.get('/stats', getStats);

// GET /api/purchase-requests/my-requests - Mes demandes
router.get('/my-requests', getMyRequests);

// GET /api/purchase-requests/to-approve - Demandes à valider
router.get('/to-approve', getRequestsToApprove);

// ============================================================================
// ROUTES GÉNÉRALES (/)
// ============================================================================

// GET /api/purchase-requests - Liste avec filtres
router.get('/', getAllPurchaseRequests);

// POST /api/purchase-requests - Créer demande (draft)
router.post('/', validate(createPurchaseRequestValidation), createPurchaseRequest);

// ============================================================================
// ROUTES AVEC PARAMÈTRE :id
// ============================================================================

// GET /api/purchase-requests/:id - Détails
router.get('/:id', getPurchaseRequestById);

// PUT /api/purchase-requests/:id - Modifier (si draft)
router.put('/:id', validate(updatePurchaseRequestValidation), updatePurchaseRequest);

// DELETE /api/purchase-requests/:id - Supprimer (si draft)
router.delete('/:id', deletePurchaseRequest);

// ============================================================================
// ROUTES WORKFLOW (/:id/action)
// ============================================================================

// POST /api/purchase-requests/:id/submit - Soumettre pour validation
router.post('/:id/submit', validate(submitPurchaseRequestValidation), submitPurchaseRequest);

// POST /api/purchase-requests/:id/approve - Approuver (valideur actuel)
router.post('/:id/approve', validate(approveRequestValidation), approvePurchaseRequest);

// POST /api/purchase-requests/:id/reject - Rejeter
router.post('/:id/reject', validate(rejectRequestValidation), rejectPurchaseRequest);

// POST /api/purchase-requests/:id/convert - Convertir en contrat
router.post('/:id/convert', convertToContract);

// ============================================================================
// ROUTES FICHIERS (/:id/files)
// ============================================================================

// POST /api/purchase-requests/:id/files - Upload fichier (devis, specs)
router.post('/:id/files', upload.single('file'), uploadFile);

// GET /api/purchase-requests/:id/files - Liste fichiers
router.get('/:id/files', getFiles);

// DELETE /api/purchase-requests/:id/files/:fileId - Supprimer fichier
router.delete('/:id/files/:fileId', deleteFile);

// ============================================================================
// ROUTES HISTORIQUE (/:id/history)
// ============================================================================

// GET /api/purchase-requests/:id/history - Audit trail
router.get('/:id/history', getHistory);

// ============================================================================
// EXPORT MODULE
// ============================================================================

module.exports = router;