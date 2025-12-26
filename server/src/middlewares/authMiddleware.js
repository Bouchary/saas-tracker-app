const jwt = require('jsonwebtoken');
const db = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ CORRECTION : Le token contient decoded.id (pas decoded.userId)
    const result = await db.query(
      `SELECT 
        id, 
        email, 
        role,
        organization_id
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.id]  // ✅ CORRECTION : decoded.id au lieu de decoded.userId
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    };

    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;