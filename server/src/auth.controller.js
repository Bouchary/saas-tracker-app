// server/src/auth.controller.js
// ✅ CORRECTION MULTI-TENANT : Création d'organization avec slug lors de l'inscription

const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeString } = require('./middlewares/validation');
const emailService = require('./services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Génère un slug URL-safe à partir d'un texte
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Enlever caractères spéciaux
    .replace(/[\s_-]+/g, '-')  // Remplacer espaces/underscores par tirets
    .replace(/^-+|-+$/g, '');  // Enlever tirets début/fin
};

/**
 * Gère l'inscription d'un nouvel utilisateur.
 * ✅ CORRECTION : Crée automatiquement une nouvelle organization avec slug
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
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ NOUVEAU : Créer une nouvelle organization pour ce user
    const organizationName = email.split('@')[0] + ' Organization';
    const baseSlug = generateSlug(email.split('@')[0]);
    
    await db.query('BEGIN');

    try {
      // Vérifier si le slug existe déjà et ajouter un suffixe si nécessaire
      let slug = baseSlug;
      let slugExists = true;
      let counter = 1;

      while (slugExists) {
        const slugCheck = await db.query(
          'SELECT id FROM organizations WHERE slug = $1',
          [slug]
        );
        
        if (slugCheck.rows.length === 0) {
          slugExists = false;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const orgResult = await db.query(
        'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
        [organizationName, slug]
      );

      const organizationId = orgResult.rows[0].id;

      console.log(`✅ Organization créée: "${organizationName}" (ID: ${organizationId}, Slug: ${slug})`);

      // 3. Enregistrer l'utilisateur avec organization_id et role='owner'
      const result = await db.query(
        'INSERT INTO users (email, password_hash, organization_id, role) VALUES ($1, $2, $3, $4) RETURNING id, email, organization_id, role, created_at',
        [email, hashedPassword, organizationId, 'owner']
      );

      await db.query('COMMIT');

      // 4. Générer le token
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

      console.log(`✅ Nouvel utilisateur inscrit: ${user.email} (ID: ${user.id}, Organization: ${organizationId})`);

      // 5. Envoyer l'email de bienvenue
      try {
        const userName = email.split('@')[0];
        await emailService.sendWelcomeEmail(email, userName);
        console.log(`✅ Email de bienvenue envoyé à ${email}`);
      } catch (emailError) {
        // Ne pas bloquer l'inscription si l'email échoue
        console.error('⚠️ Erreur envoi email de bienvenue:', emailError);
      }

      res.status(201).json({ 
        token, 
        id: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
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
    const result = await db.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    const user = result.rows[0];

    if (!user) {
      // Message générique pour des raisons de sécurité
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // 2. Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // 3. Générer le token JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log(`✅ Utilisateur connecté: ${user.email} (ID: ${user.id}, Organization: ${user.organization_id})`);

    res.status(200).json({ 
      token, 
      id: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role
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