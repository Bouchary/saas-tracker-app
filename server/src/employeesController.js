// ============================================================================
// EMPLOYEES CONTROLLER - MULTI-TENANT ROBUSTE (created_by + fallback legacy user_id)
// ============================================================================
// Objectif : éviter les régressions si certaines lignes historiques n'ont pas encore `created_by`.
// Règle d'accès : un employé est visible/modifiable si
//   employees.created_by = req.user
//   OU (employees.created_by IS NULL ET employees.user_id = req.user)  // legacy
//
// ✅ Fix : utilisation de db.query (ton db.js n'expose pas pool.query)
// ✅ Fix : manager_name renvoyé (EmployeeDetailPage l'utilise)
// ✅ Fix : update allowlist (évite de pouvoir modifier created_by, employee_number, etc.)
// ✅ CORRECTION #4 : Vérification email multi-tenant
// ✅ CORRECTION #5 : employee_number par tenant (évite collisions)
// ✅ NOUVEAU : 3 fonctions de gestion des utilisateurs (assign, unassign, create+assign)
// ============================================================================

const db = require('./db');
const bcrypt = require('bcryptjs');

// -----------------------------------------------------------------------------
// Helpers multi-tenant (compat)
// -----------------------------------------------------------------------------
const tenantWhereEmployees = (alias = 'e', param = '$1') =>
  `(${alias}.created_by = ${param} OR (${alias}.created_by IS NULL AND ${alias}.user_id = ${param}))`;

// Colonnes autorisées en update (évite injections / modifications sensibles)
const UPDATABLE_FIELDS = new Set([
  'first_name',
  'last_name',
  'email',
  'personal_email',
  'phone',
  'job_title',
  'department',
  'team',
  'manager_id',
  'hire_date',
  'start_date',
  'end_date',
  'employment_type',
  'office_location',
  'work_mode',
  'country',
  'city',
  'notes',
  'status',
  'user_id', // lien éventuel vers un compte user (si tu le permets)
]);

// ============================================================================
// GET /api/employees - Liste tous les employés (multi-tenant)
// ============================================================================
const getAllEmployees = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { page = 1, limit = 20, status, department, search } = req.query;

    // ✅ Base multi-tenant + manager_name
    let query = `
      SELECT
        e.*,
        CASE
          WHEN m.id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
          ELSE NULL
        END AS manager_name
      FROM employees e
      LEFT JOIN employees m
        ON e.manager_id = m.id
        AND ${tenantWhereEmployees('m', '$1')}
      WHERE ${tenantWhereEmployees('e', '$1')}
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND e.status = $${paramIndex++}`;
      params.push(status);
    }

    if (department) {
      query += ` AND e.department = $${paramIndex++}`;
      params.push(department);
    }

    if (search) {
      query += ` AND (
        e.first_name ILIKE $${paramIndex}
        OR e.last_name ILIKE $${paramIndex}
        OR e.email ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Total count (mêmes filtres)
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query(countQuery, params);
    const total = Number.parseInt(countResult.rows?.[0]?.count || '0', 10);

    // Pagination
    query += ` ORDER BY e.id ASC`;
    const offset = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number.parseInt(limit, 10), offset);

    const result = await db.query(query, params);

    res.json({
      employees: result.rows,
      pagination: {
        total,
        page: Number.parseInt(page, 10),
        limit: Number.parseInt(limit, 10),
        totalPages: Math.ceil(total / Number.parseInt(limit, 10) || 1),
      },
    });
  } catch (error) {
    console.error('❌ getAllEmployees error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/:id - Détails d'un employé (multi-tenant + manager_name)
// ============================================================================
const getEmployeeById = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        e.*,
        CASE
          WHEN m.id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
          ELSE NULL
        END AS manager_name
      FROM employees e
      LEFT JOIN employees m
        ON e.manager_id = m.id
        AND ${tenantWhereEmployees('m', '$2')}
      WHERE e.id = $1
        AND ${tenantWhereEmployees('e', '$2')}
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json({ employee: result.rows[0] });
  } catch (error) {
    console.error('❌ getEmployeeById error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// POST /api/employees - Créer un employé
// ============================================================================
const createEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const {
      first_name,
      last_name,
      email,
      personal_email,
      phone,
      job_title,
      department,
      team,
      manager_id,
      hire_date,
      start_date,
      employment_type,
      office_location,
      work_mode,
      country,
      city,
      notes,
      status = 'active',
      user_id, // lien éventuel vers un compte user
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name et email sont requis' });
    }

    // ✅ CORRECTION #4 : Vérification email multi-tenant (évite collision entre tenants)
    const checkEmail = await db.query(
      `SELECT id FROM employees e WHERE e.email = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [email, userId]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé dans votre organisation' });
    }

    // ✅ CORRECTION #5 : employee_number par tenant (évite collisions globales)
    const countResult = await db.query(
      `SELECT COUNT(*) FROM employees e WHERE ${tenantWhereEmployees('e', '$1')}`,
      [userId]
    );
    const count = Number.parseInt(countResult.rows?.[0]?.count || '0', 10) + 1;
    const employee_number = `EMP-${userId}-${String(count).padStart(3, '0')}`;

    const result = await db.query(
      `
      INSERT INTO employees
        (first_name, last_name, email, personal_email, phone, employee_number,
         job_title, department, team, manager_id, hire_date, start_date,
         employment_type, office_location, work_mode, country, city, notes, status,
         created_by, user_id)
      VALUES
        ($1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16,$17,$18,$19,
         $20,$21)
      RETURNING *
      `,
      [
        first_name,
        last_name,
        email,
        personal_email,
        phone,
        employee_number,
        job_title,
        department,
        team,
        manager_id || null,
        hire_date || null,
        start_date || null,
        employment_type || null,
        office_location || null,
        work_mode || null,
        country || null,
        city || null,
        notes || null,
        status,
        userId,
        user_id || null,
      ]
    );

    res.status(201).json({ message: 'Employé créé', employee: result.rows[0] });
  } catch (error) {
    console.error('❌ createEmployee error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// PUT /api/employees/:id - Mettre à jour un employé (multi-tenant)
// ============================================================================
const updateEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;
    const updates = req.body || {};

    // allowlist
    const entries = Object.entries(updates).filter(([k]) => UPDATABLE_FIELDS.has(k));

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
    }

    // ✅ Vérifier tenant
    const check = await db.query(
      `SELECT id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of entries) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    // WHERE id + tenant
    values.push(id);
    values.push(userId);

    const query = `
      UPDATE employees e
      SET ${fields.join(', ')}
      WHERE e.id = $${paramIndex++}
        AND ${tenantWhereEmployees('e', `$${paramIndex}`)}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({ message: 'Employé mis à jour', employee: result.rows[0] });
  } catch (error) {
    console.error('❌ updateEmployee error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// DELETE /api/employees/:id - Soft delete (multi-tenant)
// ============================================================================
const deleteEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE employees e
      SET status = 'exited',
          end_date = CURRENT_DATE
      WHERE e.id = $1
        AND ${tenantWhereEmployees('e', '$2')}
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json({ message: 'Employé marqué comme sorti', employee: result.rows[0] });
  } catch (error) {
    console.error('❌ deleteEmployee error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/stats - Statistiques (multi-tenant)
// ============================================================================
const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM employees e WHERE ${tenantWhereEmployees('e', '$1')}`,
      [userId]
    );
    const total = Number.parseInt(totalResult.rows?.[0]?.count || '0', 10);

    const statusResult = await db.query(
      `
      SELECT e.status, COUNT(*) as count
      FROM employees e
      WHERE ${tenantWhereEmployees('e', '$1')}
      GROUP BY e.status
      `,
      [userId]
    );

    const byStatus = {};
    for (const row of statusResult.rows) byStatus[row.status] = Number.parseInt(row.count, 10);

    const deptResult = await db.query(
      `
      SELECT e.department, COUNT(*) as count
      FROM employees e
      WHERE ${tenantWhereEmployees('e', '$1')}
      GROUP BY e.department
      ORDER BY count DESC
      `,
      [userId]
    );

    const byDepartment = {};
    for (const row of deptResult.rows) byDepartment[row.department] = Number.parseInt(row.count, 10);

    res.json({ total_employees: total, by_status: byStatus, by_department: byDepartment });
  } catch (error) {
    console.error('❌ getEmployeeStats error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/:id/assets - Assets assignés (multi-tenant)
// ============================================================================
const getEmployeeAssets = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    const { id } = req.params;

    // ✅ Vérifier employee + tenant (compat)
    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name FROM employees e
       WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [id, userId]
    );
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    const employee = employeeCheck.rows[0];

    // ✅ Assets actuellement assignés (tenant safe sur assets.created_by)
    const currentAssetsResult = await db.query(
      `
      SELECT
        a.*,
        aa.assigned_date,
        aa.purpose,
        aa.condition_on_assignment
      FROM assets a
      JOIN asset_assignments aa ON a.id = aa.asset_id
      WHERE aa.employee_id = $1
        AND aa.status = 'active'
        AND a.created_by = $2
      ORDER BY aa.assigned_date DESC
      `,
      [id, userId]
    );

    // ✅ Historique (tenant safe)
    const historyResult = await db.query(
      `
      SELECT
        a.id,
        a.asset_tag,
        a.name,
        a.asset_type,
        aa.assigned_date,
        aa.actual_return_date,
        aa.status,
        aa.purpose,
        aa.condition_on_assignment,
        aa.condition_on_return,
        aa.assignment_notes,
        aa.return_notes
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      WHERE aa.employee_id = $1
        AND a.created_by = $2
      ORDER BY aa.assigned_date DESC
      `,
      [id, userId]
    );

    const stats = {
      total_current: currentAssetsResult.rows.length,
      total_history: historyResult.rows.length,
      by_type: {},
    };

    for (const asset of currentAssetsResult.rows) {
      stats.by_type[asset.asset_type] = (stats.by_type[asset.asset_type] || 0) + 1;
    }

    res.json({
      employee: { id: employee.id, name: `${employee.first_name} ${employee.last_name}` },
      current_assets: currentAssetsResult.rows,
      history: historyResult.rows,
      stats,
    });
  } catch (error) {
    console.error('❌ getEmployeeAssets error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des assets', details: error.message });
  }
};

// ============================================================================
// ✅ NOUVEAU : POST /api/employees/:id/assign-user
// Lier un employé à un utilisateur existant
// ============================================================================
const assignUserToEmployee = async (req, res) => {
  try {
    const { id } = req.params; // Employee ID
    const { user_id } = req.body;
    const currentUserId = req.user;

    // Validation
    if (!user_id) {
      return res.status(400).json({ error: 'user_id requis' });
    }

    // Vérifier que l'employé existe et appartient au tenant
    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [id, currentUserId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    // Vérifier que l'utilisateur existe
    const userCheck = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userCheck.rows[0];

    // Vérifier que l'utilisateur n'est pas déjà lié à un autre employé du même tenant
    const existingLink = await db.query(
      `SELECT id, first_name, last_name FROM employees e WHERE e.user_id = $1 AND ${tenantWhereEmployees('e', '$2')} AND e.id != $3`,
      [user_id, currentUserId, id]
    );

    if (existingLink.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Cet utilisateur est déjà lié à un autre employé',
        linked_to: `${existingLink.rows[0].first_name} ${existingLink.rows[0].last_name}`
      });
    }

    // Lier l'utilisateur à l'employé
    const result = await db.query(
      `UPDATE employees e SET user_id = $1, updated_at = NOW() WHERE e.id = $2 AND ${tenantWhereEmployees('e', '$3')} RETURNING *`,
      [user_id, id, currentUserId]
    );

    res.status(200).json({ 
      message: `Employé ${employee.first_name} ${employee.last_name} lié à ${user.email}`,
      employee: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur liaison employé-user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================================
// ✅ NOUVEAU : DELETE /api/employees/:id/assign-user
// Délier un employé d'un utilisateur
// ============================================================================
const unassignUserFromEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user;

    // Vérifier que l'employé existe
    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [id, currentUserId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    if (!employee.user_id) {
      return res.status(400).json({ error: 'Cet employé n\'est lié à aucun utilisateur' });
    }

    // Délier l'utilisateur
    const result = await db.query(
      `UPDATE employees e SET user_id = NULL, updated_at = NOW() WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')} RETURNING *`,
      [id, currentUserId]
    );

    res.status(200).json({ 
      message: `Utilisateur délié de ${employee.first_name} ${employee.last_name}`,
      employee: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur déliaison employé-user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================================
// ✅ NOUVEAU : POST /api/employees/:id/create-user
// Créer un utilisateur et le lier immédiatement à l'employé
// ============================================================================
const createAndAssignUser = async (req, res) => {
  try {
    const { id } = req.params; // Employee ID
    const { email, password, role = 'user' } = req.body;
    const currentUserId = req.user;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier que l'employé existe
    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, email as employee_email, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2')}`,
      [id, currentUserId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    if (employee.user_id) {
      return res.status(409).json({ 
        error: 'Cet employé est déjà lié à un utilisateur',
        message: 'Veuillez d\'abord le délier'
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

    // Vérifier si email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Un utilisateur avec cet email existe déjà',
        message: 'Utilisez la fonction "Lier à un utilisateur existant" à la place'
      });
    }

    // Transaction : créer user + lier à l'employé
    await db.query('BEGIN');

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const userResult = await db.query(`
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role
      `, [email.toLowerCase(), hashedPassword, role]);

      const newUser = userResult.rows[0];

      // Lier à l'employé
      const employeeResult = await db.query(
        `UPDATE employees e SET user_id = $1, updated_at = NOW() WHERE e.id = $2 AND ${tenantWhereEmployees('e', '$3')} RETURNING *`,
        [newUser.id, id, currentUserId]
      );

      await db.query('COMMIT');

      res.status(201).json({ 
        message: `Utilisateur créé et lié à ${employee.first_name} ${employee.last_name}`,
        user: newUser,
        employee: employeeResult.rows[0]
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Erreur création et liaison user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================================
// EXPORTS - ✅ 3 NOUVELLES FONCTIONS AJOUTÉES
// ============================================================================
module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeeAssets,
  assignUserToEmployee,        // ✅ NOUVEAU
  unassignUserFromEmployee,    // ✅ NOUVEAU
  createAndAssignUser,         // ✅ NOUVEAU
};