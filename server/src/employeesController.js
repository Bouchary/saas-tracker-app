// ============================================================================
// EMPLOYEES CONTROLLER - VERSION SIMPLIFIÉE
// ============================================================================

const pool = require('./db'); // ADAPTEZ CE CHEMIN SELON VOTRE STRUCTURE

// ============================================================================
// GET /api/employees - Liste tous les employés
// ============================================================================

const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      department,
      search
    } = req.query;

    // Requête de base
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    let paramIndex = 1;

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

    // Compter le total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    query += ` ORDER BY id ASC`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    // Exécuter
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
// GET /api/employees/:id - Détails d'un employé
// ============================================================================

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
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
    const {
      first_name,
      last_name,
      email,
      job_title,
      department,
      hire_date,
      start_date,
      status = 'active'
    } = req.body;

    // Vérifier email unique
    const checkEmail = await pool.query(
      'SELECT id FROM employees WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    // Générer employee_number
    const countResult = await pool.query('SELECT COUNT(*) FROM employees');
    const count = parseInt(countResult.rows[0].count) + 1;
    const employee_number = `EMP-${String(count).padStart(3, '0')}`;

    // Insérer
    const result = await pool.query(
      `INSERT INTO employees 
       (first_name, last_name, email, employee_number, job_title, department, hire_date, start_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [first_name, last_name, email, employee_number, job_title, department, hire_date, start_date, status]
    );

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
// PUT /api/employees/:id - Mettre à jour un employé
// ============================================================================

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que l'employé existe
    const check = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
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

    values.push(id);

    const query = `
      UPDATE employees 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
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
// DELETE /api/employees/:id - Supprimer (soft delete)
// ============================================================================

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE employees 
       SET status = 'exited', end_date = CURRENT_DATE
       WHERE id = $1
       RETURNING *`,
      [id]
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
// GET /api/employees/stats - Statistiques
// ============================================================================

const getEmployeeStats = async (req, res) => {
  try {
    // Total
    const totalResult = await pool.query('SELECT COUNT(*) FROM employees');
    const total = parseInt(totalResult.rows[0].count);

    // Par statut
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM employees
      GROUP BY status
    `);
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // Par département
    const deptResult = await pool.query(`
      SELECT department, COUNT(*) as count
      FROM employees
      GROUP BY department
      ORDER BY count DESC
    `);
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
// EXPORTS
// ============================================================================

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
};