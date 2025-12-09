// server/src/contracts.routes.js

const express = require('express');
const router = express.Router();

const { protect } = require('./middlewares/authMiddleware.js');
const {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract
} = require('./contractsController.js');

// Applique le middleware de protection à toutes les routes
router.use(protect);

// GET /api/contracts - Récupérer tous les contrats de l'utilisateur
router.get('/', getAllContracts);

// POST /api/contracts - Créer un nouveau contrat
router.post('/', createContract);

// PATCH /api/contracts/:id - Mettre à jour un contrat existant
router.patch('/:id', updateContract);

// DELETE /api/contracts/:id - Supprimer un contrat
router.delete('/:id', deleteContract);

module.exports = router;