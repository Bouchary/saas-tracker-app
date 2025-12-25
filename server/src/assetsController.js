// ============================================================================
// ASSETS CONTROLLER - VERSION CORRIGÉE MULTI-TENANT (created_by)
// ============================================================================
// ✅ FIX CRITIQUE : Filtre created_by = req.user sur toutes les opérations
// ✅ FIX CRITIQUE : JOIN employees tenant-safe
// ✅ FIX CRITIQUE : Vérifs ownership sur :id + assign/unassign/history
// ✅ CORRECTION #2 : Harmonisation pool → db
// ============================================================================

const db = require('./db');

// ============================================================================
// GET /api/assets - Liste des assets avec filtres (multi-tenant)
// ============================================================================

const getAllAssets = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const {
      page = 1,
      limit = 20,
      asset_type,
      status,
      manufacturer,
      search,
      assigned_to,
      sort = 'asset_tag',
      order = 'ASC'
    } = req.query;

    // ✅ Base multi-tenant (a.created_by = $1)
    let query = `
      SELECT 
        a.*,
        e.first_name || ' ' || e.last_name AS assigned_to_name,
        e.department AS assigned_to_department
      FROM assets a
      LEFT JOIN employees e 
        ON a.currently_assigned_to = e.id 
       AND e.created_by = $1
      WHERE a.created_by = $1
    `;

    const params = [userId];
    let paramIndex = 2;

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

    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const validSortFields = ['asset_tag', 'name', 'asset_type', 'status', 'manufacturer', 'purchase_date'];
    const sortField = validSortFields.includes(sort) ? sort : 'asset_tag';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY a.${sortField} ${sortOrder}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

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
// GET /api/assets/stats - Statistiques assets (multi-tenant)
// ============================================================================

const getAssetStats = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const totalResult = await db.query(
      'SELECT COUNT(*) FROM assets WHERE created_by = $1',
      [userId]
    );
    const total = parseInt(totalResult.rows[0].count);

    const typeResult = await db.query(
      `SELECT asset_type, COUNT(*) as count
       FROM assets
       WHERE created_by = $1
       GROUP BY asset_type
       ORDER BY count DESC`,
      [userId]
    );
    const byType = {};
    typeResult.rows.forEach(row => {
      byType[row.asset_type] = parseInt(row.count);
    });

    const statusResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM assets
       WHERE created_by = $1
       GROUP BY status
       ORDER BY count DESC`,
      [userId]
    );
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    const manufacturerResult = await db.query(
      `SELECT manufacturer, COUNT(*) as count
       FROM assets
       WHERE created_by = $1 AND manufacturer IS NOT NULL
       GROUP BY manufacturer
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );
    const byManufacturer = {};
    manufacturerResult.rows.forEach(row => {
      byManufacturer[row.manufacturer] = parseInt(row.count);
    });

    const valueResult = await db.query(
      `SELECT 
        SUM(purchase_price) as total_value,
        currency
      FROM assets
      WHERE created_by = $1 AND purchase_price IS NOT NULL
      GROUP BY currency`,
      [userId]
    );

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
// GET /api/assets/:id - Détails d'un asset (multi-tenant)
// ============================================================================

const getAssetById = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const assetResult = await db.query(`
      SELECT 
        a.*,
        e.id AS assigned_to_id,
        e.first_name || ' ' || e.last_name AS assigned_to_name,
        e.email AS assigned_to_email,
        e.department AS assigned_to_department,
        e.job_title AS assigned_to_job_title
      FROM assets a
      LEFT JOIN employees e 
        ON a.currently_assigned_to = e.id
       AND e.created_by = $2
      WHERE a.id = $1 AND a.created_by = $2
    `, [id, userId]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const asset = assetResult.rows[0];

    let currentAssignment = null;
    if (asset.currently_assigned_to) {
      const assignmentResult = await db.query(`
        SELECT 
          aa.*,
          e.first_name || ' ' || e.last_name AS employee_name,
          e.email AS employee_email,
          e.department
        FROM asset_assignments aa
        JOIN employees e 
          ON aa.employee_id = e.id
         AND e.created_by = $2
        WHERE aa.asset_id = $1 AND aa.status = $3
        ORDER BY aa.assigned_date DESC
        LIMIT 1
      `, [id, userId, 'active']);

      if (assignmentResult.rows.length > 0) {
        currentAssignment = assignmentResult.rows[0];
      }
    }

    const historyResult = await db.query(`
      SELECT 
        aa.*,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.department
      FROM asset_assignments aa
      JOIN employees e 
        ON aa.employee_id = e.id
       AND e.created_by = $2
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC
      LIMIT 5
    `, [id, userId]);

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
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

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

    // ⚠️ On conserve les checks d'unicité globaux (cf. explication employeesController).
    const checkTag = await db.query(
      'SELECT id FROM assets WHERE asset_tag = $1',
      [asset_tag]
    );

    if (checkTag.rows.length > 0) {
      return res.status(409).json({ error: 'Asset tag déjà utilisé' });
    }

    if (serial_number) {
      const checkSerial = await db.query(
        'SELECT id FROM assets WHERE serial_number = $1',
        [serial_number]
      );

      if (checkSerial.rows.length > 0) {
        return res.status(409).json({ error: 'Numéro de série déjà utilisé' });
      }
    }

    const result = await db.query(
      `INSERT INTO assets (
        asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes,
        userId
      ]
    );

    console.log(`✅ Asset créé par user ${userId}: ${result.rows[0].asset_tag}`);

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
// PUT /api/assets/:id - Mettre à jour un asset (multi-tenant)
// ============================================================================

const updateAsset = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const updates = req.body;

    const check = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND created_by = $2',
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

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
    values.push(userId);

    const query = `
      UPDATE assets 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND created_by = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await db.query(query, values);

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
// DELETE /api/assets/:id - Supprimer un asset (retired) (multi-tenant)
// ============================================================================

const deleteAsset = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    // ✅ Vérifier ownership
    const assetCheck = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND created_by = $2',
      [id, userId]
    );
    if (assetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const checkAssignment = await db.query(
      'SELECT id FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [id, 'active']
    );

    if (checkAssignment.rows.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un asset assigné. Retournez-le d\'abord.'
      });
    }

    const result = await db.query(
      `UPDATE assets 
       SET status = 'retired'
       WHERE id = $1 AND created_by = $2
       RETURNING *`,
      [id, userId]
    );

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
// POST /api/assets/:id/assign - Assigner un asset à un employé (multi-tenant)
// ============================================================================

const assignAsset = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const {
      employee_id,
      purpose,
      condition_on_assignment = 'good',
      assignment_notes
    } = req.body;

    // ✅ Asset appartient au tenant
    const assetResult = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND created_by = $2',
      [id, userId]
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

    // ✅ Employé appartient au tenant
    const employeeResult = await db.query(
      'SELECT id, first_name, last_name FROM employees WHERE id = $1 AND created_by = $2',
      [employee_id, userId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const employee = employeeResult.rows[0];

    const assignmentResult = await db.query(
      `INSERT INTO asset_assignments (
        asset_id, employee_id, assigned_date, status,
        condition_on_assignment, purpose, assignment_notes, created_by
      ) VALUES ($1, $2, CURRENT_DATE, 'active', $3, $4, $5, $6)
      RETURNING *`,
      [id, employee_id, condition_on_assignment, purpose, assignment_notes, userId]
    );

    await db.query(
      `UPDATE assets 
       SET status = 'assigned', currently_assigned_to = $1
       WHERE id = $2 AND created_by = $3`,
      [employee_id, id, userId]
    );

    console.log(`✅ Asset ${id} assigné à employé ${employee_id} par user ${userId}`);

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
// POST /api/assets/:id/unassign - Retourner un asset (multi-tenant)
// ============================================================================

const unassignAsset = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const { condition_on_return = 'good', return_notes } = req.body;

    const assetResult = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND created_by = $2',
      [id, userId]
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

    // ✅ CORRECTION #6 : Vérification tenant sur assignment
    const assignmentResult = await db.query(
      `SELECT aa.* 
       FROM asset_assignments aa
       JOIN assets a ON aa.asset_id = a.id
       WHERE aa.asset_id = $1 
         AND aa.status = 'active'
         AND a.created_by = $2
       ORDER BY aa.assigned_date DESC
       LIMIT 1`,
      [id, userId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Aucune assignation active trouvée'
      });
    }

    const assignment = assignmentResult.rows[0];

    await db.query(
      `UPDATE asset_assignments
       SET status = 'returned',
           actual_return_date = CURRENT_DATE,
           condition_on_return = $1,
           return_notes = $2
       WHERE id = $3`,
      [condition_on_return, return_notes, assignment.id]
    );

    await db.query(
      `UPDATE assets 
       SET status = 'available', 
           currently_assigned_to = NULL,
           condition = $1
       WHERE id = $2 AND created_by = $3`,
      [condition_on_return, id, userId]
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
// GET /api/assets/:id/history - Historique des assignations (multi-tenant)
// ============================================================================

const getAssetHistory = async (req, res) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const assetCheck = await db.query(
      'SELECT id, asset_tag, name FROM assets WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (assetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }

    const result = await db.query(
      `SELECT 
        aa.*,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.email AS employee_email,
        e.department,
        e.job_title
      FROM asset_assignments aa
      JOIN employees e 
        ON aa.employee_id = e.id
       AND e.created_by = $2
      JOIN assets a
        ON aa.asset_id = a.id
       AND a.created_by = $2
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC`,
      [id, userId]
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