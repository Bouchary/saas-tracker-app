const organizationMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ 
      error: 'Non authentifié',
      message: 'Utilisateur requis'
    });
  }

  // ✅ FIX: Extraire l'organizationId NUMÉRIQUE
  let organizationId = req.user.organizationId;

  // Si organizationId est un objet (bug), extraire la valeur
  if (typeof organizationId === 'object' && organizationId !== null) {
    // Cas 1: organizationId est un objet avec une propriété organizationId
    if (organizationId.organizationId) {
      organizationId = organizationId.organizationId;
    }
    // Cas 2: organizationId est un objet avec une propriété id
    else if (organizationId.id) {
      organizationId = organizationId.id;
    }
  }

  // Convertir en nombre
  organizationId = parseInt(organizationId, 10);

  // Vérifier validité
  if (!organizationId || isNaN(organizationId)) {
    return res.status(403).json({ 
      error: 'Organization non trouvée',
      message: 'Utilisateur non lié à une organisation valide'
    });
  }

  // ✅ IMPORTANT: Stocker le NUMBER
  req.organizationId = organizationId;
  
  next();
};

module.exports = organizationMiddleware;