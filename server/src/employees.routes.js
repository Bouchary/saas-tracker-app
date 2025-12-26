// ============================================================================
// EMPLOYEES ROUTES - VERSION COMPLÈTE AVEC ASSETS + GESTION UTILISATEURS
// ============================================================================

const express = require('express');
const router = express.Router();
const employeesController = require('./employeesController');

// ============================================================================
// ROUTES SPÉCIFIQUES (doivent être AVANT les routes avec paramètres)
// ============================================================================

// GET /api/employees/stats - Statistiques
router.get('/stats', employeesController.getEmployeeStats);

// 🆕 GET /api/employees/:id/assets - Assets de l'employé
// PHASE 10 - JOUR 4 : INTÉGRATION EMPLOYÉS ↔ MATÉRIEL
router.get('/:id/assets', employeesController.getEmployeeAssets);

// ============================================================================
// ✅ NOUVELLES ROUTES - GESTION DES UTILISATEURS
// ============================================================================

// POST /api/employees/:id/create-user - Créer un user et le lier à l'employé
router.post('/:id/create-user', employeesController.createAndAssignUser);

// POST /api/employees/:id/assign-user - Lier un employé à un user existant
router.post('/:id/assign-user', employeesController.assignUserToEmployee);

// DELETE /api/employees/:id/assign-user - Délier un employé d'un user
router.delete('/:id/assign-user', employeesController.unassignUserFromEmployee);

// ============================================================================
// ROUTES GÉNÉRIQUES
// ============================================================================

// GET /api/employees/:id - Détails d'un employé
router.get('/:id', employeesController.getEmployeeById);

// GET /api/employees - Liste tous les employés
router.get('/', employeesController.getAllEmployees);

// POST /api/employees - Créer un employé
router.post('/', employeesController.createEmployee);

// PUT /api/employees/:id - Mettre à jour un employé
router.put('/:id', employeesController.updateEmployee);

// DELETE /api/employees/:id - Supprimer (soft delete)
router.delete('/:id', employeesController.deleteEmployee);

module.exports = router;