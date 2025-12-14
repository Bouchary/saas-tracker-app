// ============================================================================
// EMPLOYEES ROUTES - VERSION SIMPLIFIÉE (sans auth)
// ============================================================================

const express = require('express');
const router = express.Router();
const employeesController = require('./employeesController');

// Routes sans authentification (pour tests)
// ⚠️ AJOUTER L'AUTHENTIFICATION EN PRODUCTION

// GET /api/employees/stats - Statistiques
router.get('/stats', employeesController.getEmployeeStats);

// GET /api/employees - Liste
router.get('/', employeesController.getAllEmployees);

// GET /api/employees/:id - Détail
router.get('/:id', employeesController.getEmployeeById);

// POST /api/employees - Créer
router.post('/', employeesController.createEmployee);

// PUT /api/employees/:id - Modifier
router.put('/:id', employeesController.updateEmployee);

// DELETE /api/employees/:id - Supprimer
router.delete('/:id', employeesController.deleteEmployee);

module.exports = router;