// server/src/contracts.routes.js

const express = require('express');
const router = express.Router();
const contractsController = require('./contracts.controller');
const { protect } = require('./middleware/auth.middleware'); // <--- NOUVEL IMPORT

// Toutes les routes ci-dessous sont maintenant sécurisées par le middleware 'protect'
router.route('/')
    .get(protect, contractsController.getAllContracts) // <--- APPLIQUÉ
    .post(protect, contractsController.createContract); // <--- APPLIQUÉ

router.route('/:id')
    .put(protect, contractsController.updateContract) // <--- APPLIQUÉ
    .delete(protect, contractsController.deleteContract); // <--- APPLIQUÉ

module.exports = router;