// ============================================================================
// CONTROLLER - GESTION DES UTILISATEURS
// ============================================================================
// Fichier : server/src/usersController.js
// Description : CRUD pour gérer les utilisateurs avec multi-tenant
// ✅ CORRECTIONS : Colonnes adaptées au schéma DB actuel (pas de last_login, updated_at)
// ============================================================================

const db = require('./db');
const bcrypt = require('bcryptjs');

const LOG_PREFIX = 'Users:';

/**
 * GET /api/users
 * Liste de tous les utilisateurs de l'organisation (super_admin/admin)
 */
const getAllUsers = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;
  const userRole = req.user.role;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.organization_id,
        u.created_at,
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
      WHERE u.organization_id = $1 AND u.deleted_at IS NULL
    `;

    const params = [organizationId];
    let paramIndex = 2;

    if (role) {
      query += ` AND u.role = $${paramIndex++}`;
      params.push(role);
    }

    if (search) {
      query += ` AND u.email ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY u.id, u.email, u.role, u.organization_id, u.created_at
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);

    console.log(`${LOG_PREFIX} ${result.rowCount} utilisateurs récupérés pour organisation ${organizationId}`);

    res.status(200).json({ 
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getAllUsers:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
};

/**
 * GET /api/users/:id
 * Détails d'un utilisateur
 */
const getUserById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.organization_id,
        u.created_at,
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
      WHERE u.id = $1 AND u.organization_id = $2 AND u.deleted_at IS NULL
      GROUP BY u.id
    `, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log(`${LOG_PREFIX} Utilisateur ${id} récupéré`);
    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getUserById:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/users
 * Créer un nouveau utilisateur (super_admin/admin)
 */
const createUser = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;
  const userRole = req.user.role;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { email, password, role = 'user' } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
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

  // Seul super_admin peut créer d'autres super_admin
  if (role === 'super_admin' && userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Seul un super_admin peut créer un autre super_admin' });
  }

  try {
    // Vérifier si email existe déjà dans cette organisation
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
      [email.toLowerCase(), organizationId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Un utilisateur avec cet email existe déjà dans cette organisation' 
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const result = await db.query(`
      INSERT INTO users (email, password_hash, role, organization_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, organization_id, created_at
    `, [email.toLowerCase(), hashedPassword, role, organizationId]);

    const newUser = result.rows[0];

    console.log(`${LOG_PREFIX} Utilisateur créé: ${newUser.email} (ID: ${newUser.id}, Role: ${newUser.role})`);

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès',
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organization_id,
      createdAt: newUser.created_at
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur createUser:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'utilisateur' });
  }
};

/**
 * PUT /api/users/:id
 * Modifier un utilisateur (super_admin/admin)
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;
  const userRole = req.user.role;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    // Vérifier que l'utilisateur à modifier existe et appartient à la même organisation
    const checkResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const targetUser = checkResult.rows[0];

    // Empêcher un admin de modifier un super_admin
    if (targetUser.role === 'super_admin' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Seul un super_admin peut modifier un autre super_admin' });
    }

    const { email, role, password } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    // Email
    if (email && email !== targetUser.email) {
      // Vérifier format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Format email invalide' });
      }

      // Vérifier unicité dans l'organisation
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND organization_id = $2 AND id != $3',
        [email.toLowerCase(), organizationId, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }

      updates.push(`email = $${paramIndex++}`);
      params.push(email.toLowerCase());
    }

    // Rôle
    if (role && role !== targetUser.role) {
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }

      // Seul super_admin peut attribuer le rôle super_admin
      if (role === 'super_admin' && userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Seul un super_admin peut attribuer le rôle super_admin' });
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

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    // Exécuter la mise à jour
    params.push(id, organizationId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      RETURNING id, email, role, organization_id, created_at
    `;

    const result = await db.query(query, params);
    const updatedUser = result.rows[0];

    console.log(`${LOG_PREFIX} Utilisateur modifié: ${updatedUser.email} (ID: ${updatedUser.id})`);

    res.status(200).json({ 
      message: 'Utilisateur mis à jour avec succès',
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      organizationId: updatedUser.organization_id,
      createdAt: updatedUser.created_at
    });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur updateUser:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la modification de l\'utilisateur' });
  }
};

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (soft delete)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;
  const userRole = req.user.role;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // Empêcher de se supprimer soi-même
  if (parseInt(id) === userId) {
    return res.status(400).json({ 
      error: 'Vous ne pouvez pas supprimer votre propre compte' 
    });
  }

  try {
    // Vérifier que l'utilisateur existe
    const checkResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const targetUser = checkResult.rows[0];

    // Empêcher un admin de supprimer un super_admin
    if (targetUser.role === 'super_admin' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Seul un super_admin peut supprimer un autre super_admin' });
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

    // Soft delete
    await db.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );

    console.log(`${LOG_PREFIX} Utilisateur supprimé: ${targetUser.email} (ID: ${id})`);

    res.status(204).send();

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur deleteUser:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'utilisateur' });
  }
};

/**
 * GET /api/users/me
 * Récupérer les infos de l'utilisateur connecté
 */
const getCurrentUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(`
      SELECT 
        id,
        email,
        role,
        organization_id,
        created_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getCurrentUser:`, error);
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