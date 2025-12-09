// server/src/contracts.routes.js

const express = require('express');
const router = express.Router();

const { protect } = require('./middlewares/authMiddleware.js');
const { validate } = require('./middlewares/validation');
const { createContractValidation, updateContractValidation } = require('./validators/contractValidator');
const {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract,
    getProviders,
    exportContracts
} = require('./contractsController.js');

// Applique le middleware de protection à toutes les routes
router.use(protect);

// GET /api/contracts/providers - Obtenir la liste des fournisseurs uniques
// ⚠️ DOIT ÊTRE AVANT /:id
router.get('/providers', getProviders);

// GET /api/contracts/export - Exporter les contrats en CSV
// ⚠️ DOIT ÊTRE AVANT /:id
router.get('/export', exportContracts);

// GET /api/contracts - Récupérer tous les contrats de l'utilisateur
router.get('/', getAllContracts);

// POST /api/contracts - Créer un nouveau contrat avec validation
router.post('/', validate(createContractValidation), createContract);

// PATCH /api/contracts/:id - Mettre à jour un contrat existant avec validation
router.patch('/:id', validate(updateContractValidation), updateContract);

// DELETE /api/contracts/:id - Supprimer un contrat
router.delete('/:id', deleteContract);

module.exports = router;