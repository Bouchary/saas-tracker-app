// server/src/auth.controller.js

const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeString } = require('./middlewares/validation');
const emailService = require('./services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Gère l'inscription d'un nouvel utilisateur.
 */
const register = async (req, res) => {
  // Sanitize les données d'entrée
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // 2. Hacher le mot de passe avec un salt fort
    const salt = await bcrypt.genSalt(12); // Augmenté à 12 pour plus de sécurité
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Enregistrer l'utilisateur
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );

    // 4. Générer le token
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' }); // 7 jours

    console.log(`Nouvel utilisateur inscrit: ${user.email} (ID: ${user.id})`);

    // 5. Envoyer l'email de bienvenue
    try {
      const userName = email.split('@')[0]; // Utilise la partie avant @ comme nom
      await emailService.sendWelcomeEmail(email, userName);
      console.log(`✅ Email de bienvenue envoyé à ${email}`);
    } catch (emailError) {
      // Ne pas bloquer l'inscription si l'email échoue
      console.error('⚠️ Erreur envoi email de bienvenue:', emailError);
    }

    res.status(201).json({ 
      token, 
      id: user.id,
      email: user.email
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
};

/**
 * Gère la connexion d'un utilisateur existant.
 */
const login = async (req, res) => {
  // Sanitize les données d'entrée
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  try {
    // 1. Rechercher l'utilisateur
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      // Message générique pour des raisons de sécurité
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // ✅ LOGS DE DEBUG
    console.log('═══════════════════════════════════');
    console.log('🔍 DEBUG LOGIN');
    console.log('Email:', email);
    console.log('Password saisi:', password);
    console.log('Password longueur:', password.length);
    console.log('Password bytes:', Buffer.from(password).toString('hex'));
    console.log('Hash en base:', user.password_hash);
    console.log('Hash longueur:', user.password_hash.length);
    console.log('═══════════════════════════════════');

    // 2. Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);

    console.log('✅ Résultat comparaison:', isMatch);

    if (!isMatch) {
      // Tests additionnels pour diagnostiquer
      console.log('❌ Comparaison échouée, tests additionnels:');
      
      const trimmedMatch = await bcrypt.compare(password.trim(), user.password_hash);
      console.log('  - Avec trim():', trimmedMatch);
      
      const upperMatch = await bcrypt.compare(password.toUpperCase(), user.password_hash);
      console.log('  - En majuscules:', upperMatch);
      
      const lowerMatch = await bcrypt.compare(password.toLowerCase(), user.password_hash);
      console.log('  - En minuscules:', lowerMatch);
      
      console.log('═══════════════════════════════════');
      
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // 3. Générer le token JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' }); // 7 jours

    console.log(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id})`);
    console.log('═══════════════════════════════════');

    res.status(200).json({ 
      token, 
      id: user.id,
      email: user.email
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
};

module.exports = {
  register,
  login,
};