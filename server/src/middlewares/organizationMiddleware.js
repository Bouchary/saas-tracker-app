const organizationMiddleware = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return res.status(403).json({ 
      error: 'Organization non trouvée',
      message: 'Utilisateur non lié à une organisation'
    });
  }

  req.organizationId = req.user.organizationId;
  
  next();
};

module.exports = organizationMiddleware;