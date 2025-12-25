// ============================================================================
// MIDDLEWARE - VÉRIFICATION DES RÔLES
// ============================================================================
// Fichier : server/src/middlewares/roleMiddleware.js
// Description : Middleware pour restreindre l'accès selon les rôles
// ============================================================================

const db = require('../db');

/**
 * Middleware pour vérifier qu'un utilisateur a un rôle spécifique
 * Usage : router.get('/path', protect, requireRole('super_admin'), handler)
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user;

      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      // Récupérer le rôle de l'utilisateur
      const result = await db.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const userRole = result.rows[0].role;

      // Vérifier si le rôle est autorisé
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          message: `Cette action nécessite un rôle : ${allowedRoles.join(' ou ')}`,
          yourRole: userRole
        });
      }

      // Ajouter le rôle à la requête pour utilisation ultérieure
      req.userRole = userRole;
      next();

    } catch (error) {
      console.error('❌ Erreur vérification rôle:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

/**
 * Middleware pour vérifier que l'utilisateur est au moins admin
 */
const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Middleware pour vérifier que l'utilisateur est super_admin
 */
const requireSuperAdmin = requireRole('super_admin');

module.exports = {
  requireRole,
  requireAdmin,
  requireSuperAdmin
};