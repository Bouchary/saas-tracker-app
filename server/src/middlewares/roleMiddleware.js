// server/src/middlewares/roleMiddleware.js
// ✅ CORRECTION : Utiliser req.user.id au lieu de req.user

const db = require('../db');

/**
 * Middleware pour vérifier que l'utilisateur a le rôle super_admin
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    // ✅ CORRECTION : Utiliser req.user.id au lieu de req.user
    const userId = req.user.id;

    const result = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    if (user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Accès refusé : rôle super_admin requis' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur a le rôle admin ou super_admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    // ✅ CORRECTION : Utiliser req.user.id au lieu de req.user
    const userId = req.user.id;

    const result = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    if (!['admin', 'super_admin', 'owner'].includes(user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé : rôle admin requis' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  requireSuperAdmin,
  requireAdmin
};