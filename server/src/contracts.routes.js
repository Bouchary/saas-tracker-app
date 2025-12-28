// server/src/contracts.routes.js
// ✅ VERSION CORRIGÉE : Ordre des routes optimisé + PUT fonctionnel

const express = require('express');
const router = express.Router();
const db = require('./db');

// ✅ CORRECTION : Import direct authMiddleware (pas { protect })
const authMiddleware = require('./middlewares/authMiddleware.js');

// ✅ AJOUT : organizationMiddleware
const organizationMiddleware = require('./middlewares/organizationMiddleware.js');

const { validate } = require('./middlewares/validation');
const { createContractValidation, updateContractValidation } = require('./validators/contractValidator');
const {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract,
    getProviders,
    exportContracts,
    exportContractsExcel
} = require('./contractsController.js');

// ✅ CORRECTION : Appliquer les middlewares à toutes les routes
router.use(authMiddleware);
router.use(organizationMiddleware);

// ==========================================
// ROUTES SPÉCIFIQUES (DOIVENT ÊTRE AVANT /:id)
// ==========================================

// GET /api/contracts/providers - Obtenir la liste des fournisseurs uniques
router.get('/providers', getProviders);

// GET /api/contracts/export - Exporter les contrats en CSV
router.get('/export', exportContracts);

// GET /api/contracts/export-excel - Exporter les contrats en Excel
router.get('/export-excel', exportContractsExcel);

// ==========================================
// ROUTES GÉNÉRALES (/)
// ==========================================

// GET /api/contracts - Récupérer tous les contrats de l'organisation
router.get('/', getAllContracts);

// POST /api/contracts - Créer un nouveau contrat avec validation
router.post('/', validate(createContractValidation), createContract);

// ==========================================
// ROUTES AVEC PARAMÈTRE :id (DOIVENT ÊTRE APRÈS ROUTES SPÉCIFIQUES)
// ==========================================

// GET /api/contracts/:id - Récupérer un contrat par ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;

    try {
        const result = await db.query(
            'SELECT * FROM contracts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur récupération contrat:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/contracts/:id - Mettre à jour un contrat existant (méthode PUT)
router.put('/:id', updateContract);

// PATCH /api/contracts/:id - Mettre à jour un contrat existant (méthode PATCH)
router.patch('/:id', validate(updateContractValidation), updateContract);

// DELETE /api/contracts/:id - Supprimer un contrat (soft delete)
router.delete('/:id', deleteContract);

module.exports = router;