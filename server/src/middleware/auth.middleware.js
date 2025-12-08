// server/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  let token;

  // 1. Vérifier l'existence du token dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Le format est "Bearer TOKEN", donc on prend le deuxième élément
      token = req.headers.authorization.split(' ')[1];

      // 2. Décoder le token avec la clé secrète
      const decoded = jwt.verify(token, JWT_SECRET);

      // 3. Récupérer l'utilisateur à partir de l'ID dans le token
      const user = await db.query('SELECT id, email FROM users WHERE id = $1', [decoded.id]);

      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'Utilisateur non trouvé.' });
      }

      // 4. Attacher l'utilisateur (ou juste son ID) à l'objet requête (req)
      req.userId = user.rows[0].id; 
      
      next(); // Passer au contrôleur suivant
    } catch (error) {
      console.error('Erreur de validation du token:', error);
      return res.status(401).json({ error: 'Non autorisé, jeton invalide ou expiré.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Non autorisé, aucun jeton fourni.' });
  }
};

module.exports = { protect };