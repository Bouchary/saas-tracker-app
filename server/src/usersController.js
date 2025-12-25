// ============================================================================
// CONTROLLER - GESTION DES UTILISATEURS
// ============================================================================
// Fichier : server/src/usersController.js
// Description : CRUD pour gérer les utilisateurs (réservé super_admin)
// ============================================================================

const db = require('./db');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * Liste de tous les utilisateurs (super_admin uniquement)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT e.id) as employees_count,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name
          )
        ) FILTER (WHERE e.id IS NOT NULL) as linked_employees
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND u.role = $${paramIndex++}`;
      params.push(role);
    }

    if (search) {
      query += ` AND u.email ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY u.id, u.email, u.role, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);

    res.status(200).json({ 
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/users/:id
 * Détails d'un utilisateur
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        json_agg(
          jsonb_build_object(
            'id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name,
            'job_title', e.job_title,
            'department', e.department,
            'status', e.status
          )
        ) FILTER (WHERE e.id IS NOT NULL) as linked_employees
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error('❌ Erreur récupération user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/users
 * Créer un nouveau utilisateur (super_admin uniquement)
 */
const createUser = async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe requis' 
      });
    }

    // Vérifier format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format email invalide' });
    }

    // Vérifier longueur mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier rôle valide
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Rôle invalide. Valeurs possibles : user, admin, super_admin' 
      });
    }

    // Vérifier si email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await db.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, created_at
    `, [email.toLowerCase(), hashedPassword, role]);

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur création user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PUT /api/users/:id
 * Modifier un utilisateur (super_admin uniquement)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, password } = req.body;

    // Vérifier que l'utilisateur existe
    const existingUser = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    // Email
    if (email && email !== existingUser.rows[0].email) {
      // Vérifier format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Format email invalide' });
      }

      // Vérifier unicité
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }

      updates.push(`email = $${paramIndex++}`);
      params.push(email.toLowerCase());
    }

    // Rôle
    if (role && role !== existingUser.rows[0].role) {
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }

      updates.push(`role = $${paramIndex++}`);
      params.push(role);
    }

    // Mot de passe (optionnel)
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    // Ajouter updated_at
    updates.push(`updated_at = NOW()`);

    // Exécuter la mise à jour
    params.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, role, created_at, updated_at
    `;

    const result = await db.query(query, params);

    res.status(200).json({ 
      message: 'Utilisateur mis à jour avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (super_admin uniquement)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user;

    // Empêcher la suppression de soi-même
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ 
        error: 'Vous ne pouvez pas supprimer votre propre compte' 
      });
    }

    // Vérifier si l'utilisateur a des employés liés
    const employeesCheck = await db.query(
      'SELECT COUNT(*) as count FROM employees WHERE user_id = $1',
      [id]
    );

    if (parseInt(employeesCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        error: 'Impossible de supprimer : cet utilisateur est lié à des employés',
        message: 'Veuillez d\'abord délier les employés ou les supprimer'
      });
    }

    // Supprimer l'utilisateur
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ 
      message: 'Utilisateur supprimé avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur suppression user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/users/me
 * Récupérer les infos de l'utilisateur connecté
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user;

    const result = await db.query(`
      SELECT 
        id,
        email,
        role,
        created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error('❌ Erreur récupération user courant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser
};