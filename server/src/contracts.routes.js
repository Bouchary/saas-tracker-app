// server/src/contracts.routes.js

const express = require('express');
const router = express.Router();
const contractsController = require('./contracts.controller');
const { protect } = require('./middleware/auth.middleware');

// Toutes les routes ci-dessous sont maintenant sécurisées par le middleware 'protect'
router.route('/')
    .get(protect, contractsController.getAllContracts)
    .post(protect, contractsController.createContract);

router.route('/:id')
    .patch(protect, contractsController.updateContract) // <--- MODIFIÉ : PUT remplacé par PATCH
    .delete(protect, contractsController.deleteContract);

module.exports = router;