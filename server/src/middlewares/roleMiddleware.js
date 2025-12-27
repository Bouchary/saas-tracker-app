// server/src/middlewares/roleMiddleware.js
// ✅ VERSION OPTIMISÉE : Utilise req.user.role directement (pas de requête DB)
// authMiddleware a déjà chargé req.user avec le rôle

/**
 * Middleware pour vérifier que l'utilisateur a le rôle super_admin OU admin
 * ✅ PERMET admin ET super_admin (pour gestion users)
 */
const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // ✅ Permet admin ET super_admin
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Accès refusé. Rôle admin ou super_admin requis.' 
    });

  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur a le rôle admin, super_admin ou owner
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (['admin', 'super_admin', 'owner'].includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Accès refusé. Rôle admin requis.' 
    });

  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware strict : SEULEMENT super_admin (pas admin)
 */
const requireStrictSuperAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.user.role === 'super_admin') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Accès refusé. Rôle super_admin requis.' 
    });

  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  requireSuperAdmin,      // ✅ Permet admin ET super_admin
  requireAdmin,           // ✅ Permet admin, super_admin, owner
  requireStrictSuperAdmin // ✅ SEULEMENT super_admin
};