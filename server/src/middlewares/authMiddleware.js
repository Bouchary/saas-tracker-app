// server/src/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const pool = require('../db'); // Le pool de connexion à la base de données

exports.protect = async (req, res, next) => {
    let token;

    // 🌟 POINT CRITIQUE : Vérification que le secret est bien dans l'environnement 🌟
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Si la variable est manquante (local .env non chargé), on ne peut pas continuer
    if (!JWT_SECRET) {
        console.error('Erreur de configuration : JWT_SECRET manquant dans les variables d\'environnement.');
        return res.status(500).json({ error: 'Erreur de configuration du serveur.' });
    }

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Vérifier le jeton avec la clé lue de process.env
            const decoded = jwt.verify(token, JWT_SECRET); 

            // Simule la recherche de l'utilisateur (ajuster si vous avez un modèle User)
            req.user = decoded.id; 
            next();

        } catch (error) {
            // Le jeton est invalide ou expiré (401)
            console.error('Erreur de vérification JWT:', error.message);
            return res.status(401).json({ error: 'Session expirée ou non autorisée. Veuillez vous reconnecter.' });
        }
    }

    if (!token) {
        // Renvoie 401 si aucun jeton n'est trouvé
        return res.status(401).json({ error: 'Non autorisé, aucun jeton fourni.' });
    }
};