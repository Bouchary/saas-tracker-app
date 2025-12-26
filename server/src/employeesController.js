const db = require('./db');
const bcrypt = require('bcryptjs');

const tenantWhereEmployees = (alias = 'e', orgParam = '$1', userParam = '$2') =>
  `(${alias}.organization_id = ${orgParam} AND (${alias}.created_by = ${userParam} OR (${alias}.created_by IS NULL AND ${alias}.user_id = ${userParam})))`;

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
  'user_id',
]);

const getAllEmployees = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { page = 1, limit = 20, status, department, search } = req.query;

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
        AND ${tenantWhereEmployees('m', '$1', '$2')}
      WHERE ${tenantWhereEmployees('e', '$1', '$2')}
    `;

    const params = [organizationId, userId];
    let paramIndex = 3;

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

    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query(countQuery, params);
    const total = Number.parseInt(countResult.rows?.[0]?.count || '0', 10);

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

const getEmployeeById = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

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
        AND ${tenantWhereEmployees('m', '$2', '$3')}
      WHERE e.id = $1
        AND ${tenantWhereEmployees('e', '$2', '$3')}
      `,
      [id, organizationId, userId]
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

const createEmployee = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

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
      user_id,
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name et email sont requis' });
    }

    const checkEmail = await db.query(
      `SELECT id FROM employees e WHERE e.email = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [email, organizationId, userId]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé dans votre organisation' });
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM employees e WHERE ${tenantWhereEmployees('e', '$1', '$2')}`,
      [organizationId, userId]
    );
    const count = Number.parseInt(countResult.rows?.[0]?.count || '0', 10) + 1;
    const employee_number = `EMP-${organizationId}-${String(count).padStart(3, '0')}`;

    const result = await db.query(
      `
      INSERT INTO employees
        (organization_id, first_name, last_name, email, personal_email, phone, employee_number,
         job_title, department, team, manager_id, hire_date, start_date,
         employment_type, office_location, work_mode, country, city, notes, status,
         created_by, updated_by, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,
         $8,$9,$10,$11,$12,$13,
         $14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23)
      RETURNING *
      `,
      [
        organizationId,
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

const updateEmployee = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const updates = req.body || {};

    const entries = Object.entries(updates).filter(([k]) => UPDATABLE_FIELDS.has(k));

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
    }

    const check = await db.query(
      `SELECT id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [id, organizationId, userId]
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

    fields.push(`updated_by = $${paramIndex++}`);
    values.push(userId);

    fields.push(`updated_at = NOW()`);

    values.push(id);
    values.push(organizationId);
    values.push(userId);

    const query = `
      UPDATE employees e
      SET ${fields.join(', ')}
      WHERE e.id = $${paramIndex++}
        AND ${tenantWhereEmployees('e', `$${paramIndex++}`, `$${paramIndex}`)}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({ 
      message: 'Employé mis à jour avec succès',
      employee: result.rows[0] 
    });
  } catch (error) {
    console.error('❌ updateEmployee error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE employees e
      SET status = 'exited',
          end_date = CURRENT_DATE,
          deleted_at = NOW(),
          deleted_by = $3
      WHERE e.id = $1
        AND ${tenantWhereEmployees('e', '$2', '$3')}
      RETURNING *
      `,
      [id, organizationId, userId]
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

const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM employees e WHERE ${tenantWhereEmployees('e', '$1', '$2')}`,
      [organizationId, userId]
    );
    const total = Number.parseInt(totalResult.rows?.[0]?.count || '0', 10);

    const statusResult = await db.query(
      `
      SELECT e.status, COUNT(*) as count
      FROM employees e
      WHERE ${tenantWhereEmployees('e', '$1', '$2')}
      GROUP BY e.status
      `,
      [organizationId, userId]
    );

    const byStatus = {};
    for (const row of statusResult.rows) byStatus[row.status] = Number.parseInt(row.count, 10);

    const deptResult = await db.query(
      `
      SELECT e.department, COUNT(*) as count
      FROM employees e
      WHERE ${tenantWhereEmployees('e', '$1', '$2')}
      GROUP BY e.department
      ORDER BY count DESC
      `,
      [organizationId, userId]
    );

    const byDepartment = {};
    for (const row of deptResult.rows) byDepartment[row.department] = Number.parseInt(row.count, 10);

    res.json({ total_employees: total, by_status: byStatus, by_department: byDepartment });
  } catch (error) {
    console.error('❌ getEmployeeStats error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

const getEmployeeAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name FROM employees e
       WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [id, organizationId, userId]
    );
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    const employee = employeeCheck.rows[0];

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
        AND a.organization_id = $2
      ORDER BY aa.assigned_date DESC
      `,
      [id, organizationId]
    );

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
        AND a.organization_id = $2
      ORDER BY aa.assigned_date DESC
      `,
      [id, organizationId]
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

const assignUserToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id requis' });
    }

    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [id, organizationId, currentUserId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    const userCheck = await db.query(
      'SELECT id, email FROM users WHERE id = $1 AND organization_id = $2',
      [user_id, organizationId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userCheck.rows[0];

    const existingLink = await db.query(
      `SELECT id, first_name, last_name FROM employees e WHERE e.user_id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')} AND e.id != $4`,
      [user_id, organizationId, currentUserId, id]
    );

    if (existingLink.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Cet utilisateur est déjà lié à un autre employé',
        linked_to: `${existingLink.rows[0].first_name} ${existingLink.rows[0].last_name}`
      });
    }

    const result = await db.query(
      `UPDATE employees e SET user_id = $1, updated_by = $4, updated_at = NOW() WHERE e.id = $2 AND ${tenantWhereEmployees('e', '$3', '$4')} RETURNING *`,
      [user_id, id, organizationId, currentUserId]
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

const unassignUserFromEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;

    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [id, organizationId, currentUserId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    if (!employee.user_id) {
      return res.status(400).json({ error: 'Cet employé n\'est lié à aucun utilisateur' });
    }

    const result = await db.query(
      `UPDATE employees e SET user_id = NULL, updated_by = $3, updated_at = NOW() WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')} RETURNING *`,
      [id, organizationId, currentUserId]
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

const createAndAssignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role = 'user' } = req.body;
    const currentUserId = req.user.id;
    const organizationId = req.organizationId;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const employeeCheck = await db.query(
      `SELECT id, first_name, last_name, email as employee_email, user_id FROM employees e WHERE e.id = $1 AND ${tenantWhereEmployees('e', '$2', '$3')}`,
      [id, organizationId, currentUserId]
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format email invalide' });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

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

    await db.query('BEGIN');

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const userResult = await db.query(`
        INSERT INTO users (email, password_hash, role, organization_id, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, role
      `, [email.toLowerCase(), hashedPassword, role, organizationId, currentUserId, currentUserId]);

      const newUser = userResult.rows[0];

      const employeeResult = await db.query(
        `UPDATE employees e SET user_id = $1, updated_by = $4, updated_at = NOW() WHERE e.id = $2 AND ${tenantWhereEmployees('e', '$3', '$4')} RETURNING *`,
        [newUser.id, id, organizationId, currentUserId]
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

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeeAssets,
  assignUserToEmployee,
  unassignUserFromEmployee,
  createAndAssignUser,
};