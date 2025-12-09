// Fichier : saas-tracker-app/server/src/auth.routes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt');     

// Chemins d'accès à la DB (Puisque db.js est dans le même dossier /src)
const pool = require('./db.js'); 

// Fonction utilitaire pour générer le jeton JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', 
    });
};

// --- ROUTE D'INSCRIPTION (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        // 1. Vérifier si l'utilisateur existe déjà
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Cet utilisateur existe déjà.' });
        }

        // 2. Hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Créer l'utilisateur dans la base de données (utilise password_hash)
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );
        const user = newUser.rows[0];

        // 4. Répondre avec l'utilisateur et le jeton
        res.status(201).json({
            id: user.id,
            email: user.email,
            token: generateToken(user.id), 
        });

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur interne lors de l\'inscription.' });
    }
});

// --- ROUTE DE CONNEXION (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        // 1. Trouver l'utilisateur (sélectionne password_hash)
        const userResult = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        // 2. Vérification du mot de passe
        if (user && (await bcrypt.compare(password, user.password_hash))) {
            // Mot de passe correct, renvoyer le jeton
            res.status(200).json({
                id: user.id,
                email: user.email,
                token: generateToken(user.id), 
            });
        } else {
            // Échec de l'authentification
            res.status(401).json({ error: 'Identifiants invalides.' });
        }

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur interne lors de la connexion.' });
    }
});

module.exports = router;