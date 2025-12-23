// ============================================================================
// EMPLOYEES CONTROLLER - VERSION CORRIGÉE MULTI-TENANT (created_by)
// ============================================================================
// ✅ FIX CRITIQUE : Toutes les lectures/écritures filtrées par created_by = req.user
// ✅ FIX CRITIQUE : Contrôles d'accès sur :id (lecture/update/delete/assets)
// ============================================================================

const pool = require('./db');

// ============================================================================
// GET /api/employees - Liste tous les employés (multi-tenant)
// ============================================================================

const getAllEmployees = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const {
      page = 1,
      limit = 20,
      status,
      department,
      search
    } = req.query;

    // ✅ Base multi-tenant
    let query = 'SELECT * FROM employees WHERE created_by = $1';
    const params = [userId];
    let paramIndex = 2;

    // Filtres
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (department) {
      query += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Compter le total (déjà filtré tenant)
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    query += ` ORDER BY id ASC`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      employees: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/:id - Détails d'un employé (multi-tenant)
// ============================================================================

const getEmployeeById = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json({ employee: result.rows[0] });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// POST /api/employees - Créer un employé
// ============================================================================

const createEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
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
      status = 'active'
    } = req.body;

    // ⚠️ On conserve l'unicité email telle que ton code original (globale),
    // car on n'a pas le schéma DB employees (risque de contrainte unique globale).
    const checkEmail = await pool.query(
      'SELECT id FROM employees WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    // Générer employee_number (on garde logique existante, globale)
    const countResult = await pool.query('SELECT COUNT(*) FROM employees');
    const count = parseInt(countResult.rows[0].count) + 1;
    const employee_number = `EMP-${String(count).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO employees 
       (first_name, last_name, email, personal_email, phone, employee_number, 
        job_title, department, team, manager_id, hire_date, start_date, 
        employment_type, office_location, work_mode, country, city, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        first_name, last_name, email, personal_email, phone, employee_number,
        job_title, department, team, manager_id, hire_date, start_date,
        employment_type, office_location, work_mode, country, city, notes, status,
        userId
      ]
    );

    console.log(`✅ Employé créé par user ${userId}: ${result.rows[0].employee_number}`);

    res.status(201).json({
      message: 'Employé créé',
      employee: result.rows[0]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// PUT /api/employees/:id - Mettre à jour un employé (multi-tenant)
// ============================================================================

const updateEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const updates = req.body;

    // ✅ Vérifier que l'employé existe ET appartient au user
    const check = await pool.query(
      'SELECT id FROM employees WHERE id = $1 AND created_by = $2',
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Construire UPDATE dynamiquement
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    // WHERE id + created_by (tenant)
    values.push(id);
    values.push(userId);

    const query = `
      UPDATE employees 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND created_by = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Employé mis à jour',
      employee: result.rows[0]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// DELETE /api/employees/:id - Supprimer (soft delete) (multi-tenant)
// ============================================================================

const deleteEmployee = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE employees 
       SET status = 'exited', end_date = CURRENT_DATE
       WHERE id = $1 AND created_by = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json({
      message: 'Employé marqué comme sorti',
      employee: result.rows[0]
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/stats - Statistiques (multi-tenant)
// ============================================================================

const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Total (tenant)
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM employees WHERE created_by = $1',
      [userId]
    );
    const total = parseInt(totalResult.rows[0].count);

    // Par statut (tenant)
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM employees
       WHERE created_by = $1
       GROUP BY status`,
      [userId]
    );
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // Par département (tenant)
    const deptResult = await pool.query(
      `SELECT department, COUNT(*) as count
       FROM employees
       WHERE created_by = $1
       GROUP BY department
       ORDER BY count DESC`,
      [userId]
    );
    const byDepartment = {};
    deptResult.rows.forEach(row => {
      byDepartment[row.department] = parseInt(row.count);
    });

    res.json({
      total_employees: total,
      by_status: byStatus,
      by_department: byDepartment
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// GET /api/employees/:id/assets - Assets assignés à un employé (multi-tenant)
// ============================================================================

const getEmployeeAssets = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    // ✅ Vérifier que l'employé existe ET appartient au tenant
    const employeeCheck = await pool.query(
      'SELECT id, first_name, last_name FROM employees WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeCheck.rows[0];

    // ✅ Assets actuellement assignés (tenant-safe via a.created_by)
    const currentAssetsResult = await pool.query(
      `SELECT 
        a.*,
        aa.assigned_date,
        aa.purpose,
        aa.condition_on_assignment
      FROM assets a
      JOIN asset_assignments aa ON a.id = aa.asset_id
      WHERE aa.employee_id = $1 
        AND aa.status = 'active'
        AND a.created_by = $2
      ORDER BY aa.assigned_date DESC`,
      [id, userId]
    );

    // ✅ Historique complet (tenant-safe)
    const historyResult = await pool.query(
      `SELECT 
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
      ORDER BY aa.assigned_date DESC`,
      [id, userId]
    );

    const stats = {
      total_current: currentAssetsResult.rows.length,
      total_history: historyResult.rows.length,
      by_type: {}
    };

    currentAssetsResult.rows.forEach(asset => {
      stats.by_type[asset.asset_type] = (stats.by_type[asset.asset_type] || 0) + 1;
    });

    res.json({
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`
      },
      current_assets: currentAssetsResult.rows,
      history: historyResult.rows,
      stats
    });

  } catch (error) {
    console.error('Error fetching employee assets:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des assets',
      details: error.message
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeeAssets
};
