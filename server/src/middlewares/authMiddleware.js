const jwt = require('jsonwebtoken');
const db = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await db.query(
      `SELECT 
        id, 
        email, 
        role,
        organization_id
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    // ✅ FIX: FORCER la conversion en nombre
    const organizationId = parseInt(user.organization_id, 10);

    if (!organizationId || isNaN(organizationId)) {
      console.error('❌ organizationId invalide pour user:', user.id, 'value:', user.organization_id);
      return res.status(403).json({ error: 'Organisation invalide' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: organizationId  // ✅ Nombre garanti
    };

    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;