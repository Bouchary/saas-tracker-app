// ============================================================================
// ROUTES - GESTION DES UTILISATEURS
// ============================================================================
// Fichier : server/src/users.routes.js
// Description : Routes pour CRUD utilisateurs (réservé super_admin)
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('./middlewares/authMiddleware');
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
router.get('/me', protect, getCurrentUser);

// Routes réservées aux super_admin
router.get('/', protect, requireSuperAdmin, getAllUsers);
router.get('/:id', protect, requireSuperAdmin, getUserById);
router.post('/', protect, requireSuperAdmin, createUser);
router.put('/:id', protect, requireSuperAdmin, updateUser);
router.delete('/:id', protect, requireSuperAdmin, deleteUser);

module.exports = router;