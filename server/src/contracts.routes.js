// server/src/contracts.routes.js

const express = require('express');
const router = express.Router();
const contractsController = require('./contracts.controller');

// Route GET /api/contracts
// Récupère la liste de tous les contrats
router.get('/', contractsController.getAllContracts);

module.exports = router;