// ============================================================================
// ASSETS CONTROLLER - VERSION CORRIGÉE (sans pool.connect)
// ============================================================================
// Module : Matériel IT (Phase 10)
// Description : Controller pour gérer les assets et assignations
// ============================================================================

const pool = require('./db'); // ADAPTEZ CE CHEMIN SELON VOTRE STRUCTURE

// ============================================================================
// GET /api/assets - Liste des assets avec filtres
// ============================================================================

const getAllAssets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      asset_type,
      status,
      manufacturer,
      search,
      assigned_to, // Filter by employee
      sort = 'asset_tag',
      order = 'ASC'
    } = req.query;

    // Requête de base
    let query = `
      SELECT 
        a.*,
        e.first_name || ' ' || e.last_name AS assigned_to_name,
        e.department AS assigned_to_department
      FROM assets a
      LEFT JOIN employees e ON a.currently_assigned_to = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filtres
    if (asset_type) {
      query += ` AND a.asset_type = $${paramIndex}`;
      params.push(asset_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (manufacturer) {
      query += ` AND a.manufacturer ILIKE $${paramIndex}`;
      params.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND a.currently_assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        a.asset_tag ILIKE $${paramIndex} OR
        a.name ILIKE $${paramIndex} OR
        a.model ILIKE $${paramIndex} OR
        a.serial_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Compter le total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Tri et pagination
    const validSortFields = ['asset_tag', 'name', 'asset_type', 'status', 'manufacturer', 'purchase_date'];
    const sortField = validSortFields.includes(sort) ? sort : 'asset_tag';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY a.${sortField} ${sortOrder}`;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    // Exécuter
    const result = await pool.query(query, params);

    res.json({
      assets: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des assets',
      details: error.message 
    });
  }
};

// ============================================================================
// GET /api/assets/stats - Statistiques assets
// ============================================================================

const getAssetStats = async (req, res) => {
  try {
    // Total assets
    const totalResult = await pool.query('SELECT COUNT(*) FROM assets');
    const total = parseInt(totalResult.rows[0].count);

    // Par type
    const typeResult = await pool.query(`
      SELECT asset_type, COUNT(*) as count
      FROM assets
      GROUP BY asset_type
      ORDER BY count DESC
    `);
    const byType = {};
    typeResult.rows.forEach(row => {
      byType[row.asset_type] = parseInt(row.count);
    });

    // Par statut
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM assets
      GROUP BY status
      ORDER BY count DESC
    `);
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // Par fabricant (top 5)
    const manufacturerResult = await pool.query(`
      SELECT manufacturer, COUNT(*) as count
      FROM assets
      WHERE manufacturer IS NOT NULL
      GROUP BY manufacturer
      ORDER BY count DESC
      LIMIT 5
    `);
    const byManufacturer = {};
    manufacturerResult.rows.forEach(row => {
      byManufacturer[row.manufacturer] = parseInt(row.count);
    });

    // Valeur totale
    const valueResult = await pool.query(`
      SELECT 
        SUM(purchase_price) as total_value,
        currency
      FROM assets
      WHERE purchase_price IS NOT NULL
      GROUP BY currency
    `);

    res.json({
      total_assets: total,
      by_type: byType,
      by_status: byStatus,
      by_manufacturer: byManufacturer,
      total_value: valueResult.rows
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
};

// ============================================================================
// GET /api/assets/:id - Détails d'un asset
// ============================================================================

const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Asset avec infos employé assigné
    const assetResult = await pool.query(`
      SELECT 
        a.*,
        e.id AS assigned_to_id,
        e.first_name || ' ' || e.last_name AS assigned_to_name,
        e.email AS assigned_to_email,
        e.department AS assigned_to_department,
        e.job_title AS assigned_to_job_title
      FROM assets a
      LEFT JOIN employees e ON a.currently_assigned_to = e.id
      WHERE a.id = $1
    `, [id]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const asset = assetResult.rows[0];

    // Assignation actuelle (détails complets)
    let currentAssignment = null;
    if (asset.currently_assigned_to) {
      const assignmentResult = await pool.query(`
        SELECT 
          aa.*,
          e.first_name || ' ' || e.last_name AS employee_name,
          e.email AS employee_email,
          e.department
        FROM asset_assignments aa
        JOIN employees e ON aa.employee_id = e.id
        WHERE aa.asset_id = $1 AND aa.status = $2
        ORDER BY aa.assigned_date DESC
        LIMIT 1
      `, [id, 'active']);
      
      if (assignmentResult.rows.length > 0) {
        currentAssignment = assignmentResult.rows[0];
      }
    }

    // Historique des assignations (5 dernières)
    const historyResult = await pool.query(`
      SELECT 
        aa.*,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.department
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC
      LIMIT 5
    `, [id]);

    res.json({
      asset,
      current_assignment: currentAssignment,
      assignment_history: historyResult.rows
    });

  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'asset',
      details: error.message 
    });
  }
};

// ============================================================================
// POST /api/assets - Créer un asset
// ============================================================================

const createAsset = async (req, res) => {
  try {
    const {
      asset_tag,
      name,
      asset_type,
      manufacturer,
      model,
      serial_number,
      specifications,
      status = 'available',
      condition = 'new',
      purchase_date,
      purchase_price,
      currency = 'EUR',
      warranty_end_date,
      supplier,
      location,
      room,
      image_url,
      notes
    } = req.body;

    // Vérifier asset_tag unique
    const checkTag = await pool.query(
      'SELECT id FROM assets WHERE asset_tag = $1',
      [asset_tag]
    );

    if (checkTag.rows.length > 0) {
      return res.status(409).json({ error: 'Asset tag déjà utilisé' });
    }

    // Vérifier serial_number unique (si fourni)
    if (serial_number) {
      const checkSerial = await pool.query(
        'SELECT id FROM assets WHERE serial_number = $1',
        [serial_number]
      );

      if (checkSerial.rows.length > 0) {
        return res.status(409).json({ error: 'Numéro de série déjà utilisé' });
      }
    }

    // Insérer
    const result = await pool.query(
      `INSERT INTO assets (
        asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes
      ]
    );

    res.status(201).json({
      message: 'Asset créé avec succès',
      asset: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'asset',
      details: error.message 
    });
  }
};

// ============================================================================
// PUT /api/assets/:id - Mettre à jour un asset
// ============================================================================

const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que l'asset existe
    const check = await pool.query('SELECT id FROM assets WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    // Construire UPDATE dynamiquement
    const allowedFields = [
      'name', 'asset_type', 'manufacturer', 'model', 'serial_number',
      'specifications', 'status', 'condition', 'purchase_date', 'purchase_price',
      'currency', 'warranty_end_date', 'supplier', 'location', 'room',
      'image_url', 'notes'
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    values.push(id);

    const query = `
      UPDATE assets 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Asset mis à jour',
      asset: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de l\'asset',
      details: error.message 
    });
  }
};

// ============================================================================
// DELETE /api/assets/:id - Supprimer un asset
// ============================================================================

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'asset n'est pas assigné
    const checkAssignment = await pool.query(
      'SELECT id FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [id, 'active']
    );

    if (checkAssignment.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un asset assigné. Retournez-le d\'abord.' 
      });
    }

    // Marquer comme retired au lieu de supprimer
    const result = await pool.query(
      `UPDATE assets 
       SET status = 'retired'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    res.json({
      message: 'Asset marqué comme retiré',
      asset: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de l\'asset',
      details: error.message 
    });
  }
};

// ============================================================================
// POST /api/assets/:id/assign - Assigner un asset à un employé
// ============================================================================
// VERSION SANS TRANSACTION (compatible avec toutes les configs db.js)
// ============================================================================

const assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      purpose,
      condition_on_assignment = 'good',
      assignment_notes
    } = req.body;

    // Vérifier que l'asset existe et est disponible
    const assetResult = await pool.query(
      'SELECT * FROM assets WHERE id = $1',
      [id]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const asset = assetResult.rows[0];

    if (asset.status === 'assigned') {
      return res.status(400).json({ 
        error: 'Asset déjà assigné',
        current_assignment: asset.currently_assigned_to
      });
    }

    if (!['available', 'maintenance'].includes(asset.status)) {
      return res.status(400).json({ 
        error: `Impossible d'assigner un asset avec le statut: ${asset.status}` 
      });
    }

    // Vérifier que l'employé existe
    const employeeResult = await pool.query(
      'SELECT id, first_name, last_name FROM employees WHERE id = $1',
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeResult.rows[0];

    // Créer l'assignation
    const assignmentResult = await pool.query(
      `INSERT INTO asset_assignments (
        asset_id, employee_id, assigned_date, status,
        condition_on_assignment, purpose, assignment_notes
      ) VALUES ($1, $2, CURRENT_DATE, 'active', $3, $4, $5)
      RETURNING *`,
      [id, employee_id, condition_on_assignment, purpose, assignment_notes]
    );

    // Mettre à jour l'asset
    await pool.query(
      `UPDATE assets 
       SET status = 'assigned', currently_assigned_to = $1
       WHERE id = $2`,
      [employee_id, id]
    );

    res.status(201).json({
      message: `Asset assigné à ${employee.first_name} ${employee.last_name}`,
      assignment: assignmentResult.rows[0]
    });

  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'assignation',
      details: error.message 
    });
  }
};

// ============================================================================
// POST /api/assets/:id/unassign - Retourner un asset
// ============================================================================
// VERSION SANS TRANSACTION (compatible avec toutes les configs db.js)
// ============================================================================

const unassignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      condition_on_return = 'good',
      return_notes
    } = req.body;

    // Vérifier que l'asset existe et est assigné
    const assetResult = await pool.query(
      'SELECT * FROM assets WHERE id = $1',
      [id]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const asset = assetResult.rows[0];

    if (asset.status !== 'assigned') {
      return res.status(400).json({ 
        error: 'Asset non assigné, rien à retourner' 
      });
    }

    // Trouver l'assignation active
    const assignmentResult = await pool.query(
      `SELECT * FROM asset_assignments 
       WHERE asset_id = $1 AND status = 'active'
       ORDER BY assigned_date DESC
       LIMIT 1`,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune assignation active trouvée' 
      });
    }

    const assignment = assignmentResult.rows[0];

    // Mettre à jour l'assignation
    await pool.query(
      `UPDATE asset_assignments
       SET status = 'returned',
           actual_return_date = CURRENT_DATE,
           condition_on_return = $1,
           return_notes = $2
       WHERE id = $3`,
      [condition_on_return, return_notes, assignment.id]
    );

    // Mettre à jour l'asset
    await pool.query(
      `UPDATE assets 
       SET status = 'available', 
           currently_assigned_to = NULL,
           condition = $1
       WHERE id = $2`,
      [condition_on_return, id]
    );

    res.json({
      message: 'Asset retourné avec succès',
      assignment: {
        ...assignment,
        actual_return_date: new Date(),
        condition_on_return,
        return_notes
      }
    });

  } catch (error) {
    console.error('Error unassigning asset:', error);
    res.status(500).json({ 
      error: 'Erreur lors du retour',
      details: error.message 
    });
  }
};

// ============================================================================
// GET /api/assets/:id/history - Historique des assignations
// ============================================================================

const getAssetHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'asset existe
    const assetCheck = await pool.query(
      'SELECT id, asset_tag, name FROM assets WHERE id = $1',
      [id]
    );

    if (assetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    // Récupérer l'historique
    const result = await pool.query(
      `SELECT 
        aa.*,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.email AS employee_email,
        e.department,
        e.job_title
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC`,
      [id]
    );

    res.json({
      asset: assetCheck.rows[0],
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'historique',
      details: error.message 
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getAllAssets,
  getAssetStats,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  getAssetHistory
};