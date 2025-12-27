// server/src/contracts.routes.js

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

// GET /api/contracts/providers - Obtenir la liste des fournisseurs uniques
// ⚠️ DOIT ÊTRE AVANT /:id
router.get('/providers', getProviders);

// GET /api/contracts/export - Exporter les contrats en CSV
// ⚠️ DOIT ÊTRE AVANT /:id
router.get('/export', exportContracts);

// GET /api/contracts/export-excel - Exporter les contrats en Excel
// ⚠️ DOIT ÊTRE AVANT /:id
router.get('/export-excel', exportContractsExcel);

// ==========================================
// ROUTE : RÉCUPÉRER UN CONTRAT PAR ID
// ==========================================
// GET /api/contracts/:id
// ⚠️ DOIT ÊTRE APRÈS /providers, /export, /export-excel mais AVANT /
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    // ✅ CORRECTION : Utiliser req.organizationId au lieu de req.user
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

// GET /api/contracts - Récupérer tous les contrats de l'utilisateur
// ⚠️ DOIT ÊTRE APRÈS /:id
router.get('/', getAllContracts);

// POST /api/contracts - Créer un nouveau contrat avec validation
router.post('/', validate(createContractValidation), createContract);

// PUT /api/contracts/:id - Mettre à jour un contrat existant (méthode PUT ajoutée)
// ✅ ROUTE AJOUTÉE pour supporter PUT en plus de PATCH
router.put('/:id', validate(updateContractValidation), updateContract);

// PATCH /api/contracts/:id - Mettre à jour un contrat existant avec validation
router.patch('/:id', validate(updateContractValidation), updateContract);

// DELETE /api/contracts/:id - Supprimer un contrat
router.delete('/:id', deleteContract);

module.exports = router;