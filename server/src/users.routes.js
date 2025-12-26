// ============================================================================
// ROUTES - GESTION DES UTILISATEURS
// ✅ CORRECTION : authMiddleware + organizationMiddleware
// ============================================================================
// Fichier : server/src/users.routes.js
// Description : Routes pour CRUD utilisateurs (réservé super_admin)
// ============================================================================

const express = require('express');
const router = express.Router();

// ✅ CORRECTION : Import direct authMiddleware
const authMiddleware = require('./middlewares/authMiddleware');

// ✅ AJOUT : organizationMiddleware  
const organizationMiddleware = require('./middlewares/organizationMiddleware');

const { requireSuperAdmin } = require('./middlewares/roleMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser
} = require('./usersController');

// Route publique pour récupérer l'utilisateur connecté
// ✅ Cette route utilise authMiddleware mais PAS organizationMiddleware
router.get('/me', authMiddleware, getCurrentUser);

// Routes réservées aux super_admin
// ✅ Ces routes utilisent authMiddleware + organizationMiddleware + requireSuperAdmin
router.get('/', authMiddleware, organizationMiddleware, requireSuperAdmin, getAllUsers);
router.get('/:id', authMiddleware, organizationMiddleware, requireSuperAdmin, getUserById);
router.post('/', authMiddleware, organizationMiddleware, requireSuperAdmin, createUser);
router.put('/:id', authMiddleware, organizationMiddleware, requireSuperAdmin, updateUser);
router.delete('/:id', authMiddleware, organizationMiddleware, requireSuperAdmin, deleteUser);

module.exports = router;