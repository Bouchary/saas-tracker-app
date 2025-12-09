// Fichier : saas-tracker-app/server/src/contracts.routes.js

const express = require('express');
const router = express.Router();

const { protect } = require('./middlewares/authMiddleware.js'); 
const pool = require('./db.js'); 

// Applique le middleware de protection à toutes les routes de contrats
router.use(protect);

// --- ROUTE GET /api/contracts (Récupérer tous les contrats de l'utilisateur) ---
router.get('/', async (req, res) => {
    // ✅ CORRECTION CRITIQUE : Assurer que nous extrayons bien l'ID (req.user est l'ID JWT décodé)
    // Le middleware 'protect' met l'ID utilisateur directement dans req.user.
    // Cependant, pour la robustesse et l'adhérence à la norme, nous vérifions si req.user est un objet avec un ID.
    // Dans notre contexte, req.user est l'ID lui-même (mis par le middleware).
    const userId = req.user; 

    if (!userId) {
        return res.status(401).json({ error: "Non autorisé. ID utilisateur manquant." });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM contracts WHERE user_id = $1 ORDER BY renewal_date ASC',
            [userId]
        );
        
        res.json(result.rows); 

    } catch (error) {
        console.error('Erreur récupération contrats:', error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération des contrats." });
    }
});

// Ajoutez d'autres routes de contrat (POST, PUT, DELETE) ici...

module.exports = router;