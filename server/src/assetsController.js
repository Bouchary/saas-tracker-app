const db = require('./db');

const getAllAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
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

    let query = `
      SELECT 
        a.*,
        e.first_name || ' ' || e.last_name AS assigned_to_name,
        e.department AS assigned_to_department
      FROM assets a
      LEFT JOIN employees e 
        ON a.currently_assigned_to = e.id 
       AND e.organization_id = $1
      WHERE a.organization_id = $1 AND a.deleted_at IS NULL
    `;

    const params = [organizationId];
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

const getAssetStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const totalResult = await db.query(
      'SELECT COUNT(*) FROM assets WHERE organization_id = $1 AND deleted_at IS NULL',
      [organizationId]
    );
    const total = parseInt(totalResult.rows[0].count);

    const typeResult = await db.query(
      `SELECT asset_type, COUNT(*) as count
       FROM assets
       WHERE organization_id = $1 AND deleted_at IS NULL
       GROUP BY asset_type
       ORDER BY count DESC`,
      [organizationId]
    );
    const byType = {};
    typeResult.rows.forEach(row => {
      byType[row.asset_type] = parseInt(row.count);
    });

    const statusResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM assets
       WHERE organization_id = $1 AND deleted_at IS NULL
       GROUP BY status
       ORDER BY count DESC`,
      [organizationId]
    );
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    const manufacturerResult = await db.query(
      `SELECT manufacturer, COUNT(*) as count
       FROM assets
       WHERE organization_id = $1 AND manufacturer IS NOT NULL AND deleted_at IS NULL
       GROUP BY manufacturer
       ORDER BY count DESC
       LIMIT 5`,
      [organizationId]
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
      WHERE organization_id = $1 AND purchase_price IS NOT NULL AND deleted_at IS NULL
      GROUP BY currency`,
      [organizationId]
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

const getAssetById = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    
    if (!organizationId) {
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
       AND e.organization_id = $2
      WHERE a.id = $1 AND a.organization_id = $2 AND a.deleted_at IS NULL
    `, [id, organizationId]);

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
         AND e.organization_id = $2
        WHERE aa.asset_id = $1 AND aa.status = $3
        ORDER BY aa.assigned_date DESC
        LIMIT 1
      `, [id, organizationId, 'active']);

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
       AND e.organization_id = $2
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC
      LIMIT 5
    `, [id, organizationId]);

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

const createAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
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

    if (!asset_tag || !name || !asset_type) {
      return res.status(400).json({ error: 'asset_tag, name et asset_type sont requis' });
    }

    const checkTag = await db.query(
      'SELECT id FROM assets WHERE asset_tag = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [asset_tag, organizationId]
    );

    if (checkTag.rows.length > 0) {
      return res.status(409).json({ error: 'Asset tag déjà utilisé dans votre organisation' });
    }

    if (serial_number) {
      const checkSerial = await db.query(
        'SELECT id FROM assets WHERE serial_number = $1 AND organization_id = $2 AND deleted_at IS NULL',
        [serial_number, organizationId]
      );

      if (checkSerial.rows.length > 0) {
        return res.status(409).json({ error: 'Numéro de série déjà utilisé dans votre organisation' });
      }
    }

    const result = await db.query(
      `INSERT INTO assets (
        organization_id, asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        organizationId, asset_tag, name, asset_type, manufacturer, model, serial_number,
        specifications, status, condition, purchase_date, purchase_price,
        currency, warranty_end_date, supplier, location, room, image_url, notes,
        userId, userId
      ]
    );

    console.log(`✅ Asset créé par user ${userId} pour organization ${organizationId}: ${result.rows[0].asset_tag}`);

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

const updateAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const updates = req.body;

    const check = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
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

    fields.push(`updated_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    fields.push(`updated_at = NOW()`);

    values.push(id);
    values.push(organizationId);

    const query = `
      UPDATE assets 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
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

const deleteAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const assetCheck = await db.query(
      'SELECT id FROM assets WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
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
       SET status = 'retired', deleted_at = NOW(), deleted_by = $3
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, organizationId, userId]
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

const assignAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const {
      employee_id,
      purpose,
      condition_on_assignment = 'good',
      assignment_notes
    } = req.body;

    const assetResult = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
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

    const employeeResult = await db.query(
      'SELECT id, first_name, last_name FROM employees WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [employee_id, organizationId]
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
       SET status = 'assigned', currently_assigned_to = $1, updated_by = $4
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL`,
      [employee_id, id, organizationId, userId]
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

const unassignAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;
    const { condition_on_return = 'good', return_notes } = req.body;

    const assetResult = await db.query(
      'SELECT * FROM assets WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
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

    const assignmentResult = await db.query(
      `SELECT aa.* 
       FROM asset_assignments aa
       JOIN assets a ON aa.asset_id = a.id
       WHERE aa.asset_id = $1 
         AND aa.status = 'active'
         AND a.organization_id = $2
       ORDER BY aa.assigned_date DESC
       LIMIT 1`,
      [id, organizationId]
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
           condition = $1,
           updated_by = $4
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL`,
      [condition_on_return, id, organizationId, userId]
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

const getAssetHistory = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.params;

    const assetCheck = await db.query(
      'SELECT id, asset_tag, name FROM assets WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
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
       AND e.organization_id = $2
      JOIN assets a
        ON aa.asset_id = a.id
       AND a.organization_id = $2
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC`,
      [id, organizationId]
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