// ============================================================================
// ROUTES WORKFLOWS ONBOARDING/OFFBOARDING - VERSION CORRIGÉE
// ============================================================================
// Fichier : server/src/workflows.routes.js
// Date : 17 décembre 2024
// Correction : firstname/lastname au lieu de first_name/last_name
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('./db');
const { protect } = require('./middlewares/authMiddleware');

// Toutes les routes nécessitent authentication
router.use(protect);

// ============================================================================
// TEMPLATES DE WORKFLOWS - CRUD COMPLET
// ============================================================================

/**
 * GET /api/workflows/templates
 * Liste des templates de workflows
 */
router.get('/templates', async (req, res) => {
  try {
    const { type, department, is_active } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.type,
        t.department,
        t.job_title,
        t.is_default,
        t.is_active,
        COUNT(wt.id) as total_tasks,
        COUNT(wt.id) FILTER (WHERE wt.is_automated = true) as automated_tasks,
        json_build_object(
          'IT', COUNT(wt.id) FILTER (WHERE wt.responsible_team = 'IT'),
          'HR', COUNT(wt.id) FILTER (WHERE wt.responsible_team = 'HR'),
          'Manager', COUNT(wt.id) FILTER (WHERE wt.responsible_team = 'Manager'),
          'Finance', COUNT(wt.id) FILTER (WHERE wt.responsible_team = 'Finance')
        ) as tasks_by_team,
        t.created_at,
        t.updated_at
      FROM workflow_templates t
      LEFT JOIN workflow_tasks wt ON t.id = wt.template_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (type) {
      query += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (department) {
      query += ` AND t.department = $${paramIndex++}`;
      params.push(department);
    }
    
    if (is_active !== undefined) {
      query += ` AND t.is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
    }
    
    query += `
      GROUP BY t.id
      ORDER BY t.is_default DESC, t.created_at DESC
    `;
    
    const result = await db.query(query, params);
    
    res.status(200).json({
      templates: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/workflows/templates/:id
 * Détails d'un template avec toutes ses tâches
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le template
    const templateResult = await db.query(`
      SELECT * FROM workflow_templates WHERE id = $1
    `, [id]);
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = templateResult.rows[0];
    
    // Récupérer les tâches
    const tasksResult = await db.query(`
      SELECT 
        id,
        title,
        description,
        responsible_team,
        assigned_role,
        trigger_days,
        due_days,
        task_order,
        depends_on_task_id,
        is_mandatory,
        is_automated,
        automation_type,
        automation_config,
        checklist_items
      FROM workflow_tasks
      WHERE template_id = $1
      ORDER BY task_order ASC
    `, [id]);
    
    template.tasks = tasksResult.rows;
    
    res.status(200).json({ template });
    
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/workflows/templates
 * Créer un nouveau template
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      department,
      job_title,
      is_default,
      is_active,
      tasks
    } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!['onboarding', 'offboarding'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create template
      const templateResult = await db.query(`
        INSERT INTO workflow_templates (
          name, description, type, department, job_title, 
          is_default, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [name, description, type, department, job_title, is_default, is_active]);

      const template = templateResult.rows[0];

      // Create tasks if provided
      if (tasks && tasks.length > 0) {
        for (const task of tasks) {
          await db.query(`
            INSERT INTO workflow_tasks (
              template_id, title, description, responsible_team,
              trigger_days, due_days, task_order, is_mandatory,
              is_automated, automation_type, checklist_items
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            template.id,
            task.title,
            task.description,
            task.responsible_team,
            task.trigger_days || 0,
            task.due_days || 1,
            task.task_order,
            task.is_mandatory !== false,
            task.is_automated || false,
            task.automation_type || null,
            task.checklist_items || []
          ]);
        }
      }

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Template created successfully',
        template
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /api/workflows/templates/:id
 * Mettre à jour un template
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      department,
      job_title,
      is_default,
      is_active,
      tasks
    } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update template
      const templateResult = await db.query(`
        UPDATE workflow_templates
        SET 
          name = $1,
          description = $2,
          type = $3,
          department = $4,
          job_title = $5,
          is_default = $6,
          is_active = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, description, type, department, job_title, is_default, is_active, id]);

      if (templateResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Template not found' });
      }

      const template = templateResult.rows[0];

      // Delete existing tasks
      await db.query('DELETE FROM workflow_tasks WHERE template_id = $1', [id]);

      // Create new tasks
      if (tasks && tasks.length > 0) {
        for (const task of tasks) {
          await db.query(`
            INSERT INTO workflow_tasks (
              template_id, title, description, responsible_team,
              trigger_days, due_days, task_order, is_mandatory,
              is_automated, automation_type, checklist_items
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            template.id,
            task.title,
            task.description,
            task.responsible_team,
            task.trigger_days || 0,
            task.due_days || 1,
            task.task_order,
            task.is_mandatory !== false,
            task.is_automated || false,
            task.automation_type || null,
            task.checklist_items || []
          ]);
        }
      }

      await db.query('COMMIT');

      res.status(200).json({
        message: 'Template updated successfully',
        template
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/workflows/templates/:id
 * Supprimer un template (soft delete si utilisé)
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template is used in workflows
    const usageCheck = await db.query(`
      SELECT COUNT(*) as count
      FROM employee_workflows
      WHERE template_id = $1
    `, [id]);

    if (parseInt(usageCheck.rows[0].count) > 0) {
      // Soft delete - just mark as inactive
      const result = await db.query(`
        UPDATE workflow_templates
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json({
        message: 'Template deactivated (used in existing workflows)',
        template: result.rows[0]
      });
    }

    // Hard delete if not used
    await db.query('BEGIN');

    try {
      // Delete tasks first
      await db.query('DELETE FROM workflow_tasks WHERE template_id = $1', [id]);

      // Delete template
      const result = await db.query(`
        DELETE FROM workflow_templates
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Template not found' });
      }

      await db.query('COMMIT');

      res.status(200).json({
        message: 'Template deleted successfully',
        template: result.rows[0]
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============================================================================
// WORKFLOWS (INSTANCES)
// ============================================================================

/**
 * GET /api/workflows
 * Liste des workflows actifs
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, employee_id, overdue } = req.query;
    
    let query = `
      SELECT 
        ew.id,
        ew.workflow_type,
        ew.status,
        ew.target_date,
        ew.total_tasks,
        ew.completed_tasks,
        ew.completion_percentage,
        ew.started_at,
        ew.completed_at,
        
        -- Employé
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'job_title', e.job_title
        ) as employee,
        
        -- Template
        json_build_object(
          'id', wt.id,
          'name', wt.name
        ) as template,
        
        -- Tâches en retard
        (
          SELECT COUNT(*)
          FROM employee_workflow_tasks ewt
          WHERE ewt.workflow_id = ew.id
            AND ewt.status NOT IN ('completed', 'skipped')
            AND ewt.due_date < CURRENT_DATE
        ) as overdue_tasks,
        
        -- Jours avant target
        (ew.target_date - CURRENT_DATE) as days_until_target
        
      FROM employee_workflows ew
      JOIN employees e ON ew.employee_id = e.id
      LEFT JOIN workflow_templates wt ON ew.template_id = wt.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND ew.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND ew.workflow_type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (employee_id) {
      query += ` AND ew.employee_id = $${paramIndex++}`;
      params.push(employee_id);
    }
    
    if (overdue === 'true') {
      query += ` AND EXISTS (
        SELECT 1 FROM employee_workflow_tasks ewt
        WHERE ewt.workflow_id = ew.id
          AND ewt.status NOT IN ('completed', 'skipped')
          AND ewt.due_date < CURRENT_DATE
      )`;
    }
    
    query += ` ORDER BY ew.target_date ASC`;
    
    const result = await db.query(query, params);
    
    res.status(200).json({
      workflows: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

/**
 * POST /api/workflows
 * Créer un nouveau workflow depuis un template
 */
router.post('/', async (req, res) => {
  try {
    const {
      employee_id,
      template_id,
      workflow_type,
      target_date
    } = req.body;

    // Validation
    if (!employee_id || !workflow_type || !target_date) {
      return res.status(400).json({
        error: 'employee_id, workflow_type, and target_date are required'
      });
    }

    // Call the stored procedure
    const result = await db.query(
      'SELECT create_employee_workflow($1, $2, $3, $4) as workflow_id',
      [employee_id, workflow_type, target_date, template_id]
    );

    const workflowId = result.rows[0].workflow_id;

    // Fetch the created workflow
    const workflowResult = await db.query(`
      SELECT 
        ew.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'job_title', e.job_title,
          'department', e.department
        ) as employee,
        json_build_object(
          'id', wt.id,
          'name', wt.name
        ) as template
      FROM employee_workflows ew
      JOIN employees e ON ew.employee_id = e.id
      LEFT JOIN workflow_templates wt ON ew.template_id = wt.id
      WHERE ew.id = $1
    `, [workflowId]);

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow: workflowResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to create workflow' });
  }
});

// ============================================================================
// ROUTES SPÉCIFIQUES - DOIVENT ÊTRE AVANT /:id
// ============================================================================

/**
 * GET /api/workflows/my-tasks
 * Tâches assignées à l'utilisateur connecté
 */
router.get('/my-tasks', async (req, res) => {
  try {
    const userId = req.user;
    const { status, team, due_soon, overdue } = req.query;
    
    let query = `
      SELECT 
        ewt.id,
        ewt.workflow_id,
        ewt.status,
        ewt.due_date,
        ewt.notes,
        
        -- Task info
        json_build_object(
          'title', wt.title,
          'description', wt.description,
          'responsible_team', wt.responsible_team,
          'is_mandatory', wt.is_mandatory,
          'checklist_items', wt.checklist_items
        ) as task,
        
        -- Workflow info
        json_build_object(
          'id', ew.id,
          'type', ew.workflow_type,
          'target_date', ew.target_date
        ) as workflow,
        
        -- Employee info
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'department', e.department,
          'job_title', e.job_title
        ) as employee,
        
        -- Indicateurs
        CASE 
          WHEN ewt.due_date < CURRENT_DATE THEN true
          ELSE false
        END as is_overdue,
        
        CASE 
          WHEN ewt.due_date <= CURRENT_DATE + 3 THEN true
          ELSE false
        END as is_due_soon,
        
        ewt.checklist_completed
        
      FROM employee_workflow_tasks ewt
      JOIN workflow_tasks wt ON ewt.task_id = wt.id
      JOIN employee_workflows ew ON ewt.workflow_id = ew.id
      JOIN employees e ON ew.employee_id = e.id
      WHERE ewt.assigned_to = $1
        AND ewt.status IN ('pending', 'in_progress')
        AND ew.status IN ('pending', 'in_progress')
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND ewt.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (team) {
      query += ` AND wt.responsible_team = $${paramIndex++}`;
      params.push(team);
    }
    
    if (overdue === 'true') {
      query += ` AND ewt.due_date < CURRENT_DATE`;
    }
    
    if (due_soon === 'true') {
      query += ` AND ewt.due_date <= CURRENT_DATE + 3`;
    }
    
    query += ` ORDER BY 
      CASE WHEN ewt.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
      ewt.due_date ASC
    `;
    
    const result = await db.query(query, params);
    
    res.status(200).json({
      tasks: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching my tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/workflows/stats
 * Statistiques globales des workflows
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as active_workflows,
        COUNT(*) FILTER (WHERE workflow_type = 'onboarding') as onboarding_count,
        COUNT(*) FILTER (WHERE workflow_type = 'offboarding') as offboarding_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        ROUND(AVG(completion_percentage), 2) as avg_completion,
        (
          SELECT COUNT(*)
          FROM employee_workflow_tasks ewt
          JOIN employee_workflows ew ON ewt.workflow_id = ew.id
          WHERE ewt.status NOT IN ('completed', 'skipped')
            AND ewt.due_date < CURRENT_DATE
            AND ew.status IN ('pending', 'in_progress')
        ) as tasks_overdue
      FROM employee_workflows
    `);
    
    res.status(200).json({
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching workflow stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================================
// ROUTE GÉNÉRIQUE - APRÈS les routes spécifiques
// ============================================================================

/**
 * GET /api/workflows/:id
 * Détails complets d'un workflow
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le workflow
    const workflowResult = await db.query(`
      SELECT 
        ew.*,
        json_build_object(
          'id', e.id,
          'first_name', e.first_name,
          'last_name', e.last_name,
          'email', e.email,
          'department', e.department,
          'job_title', e.job_title
        ) as employee,
        json_build_object(
          'id', wt.id,
          'name', wt.name,
          'type', wt.type
        ) as template,
        (ew.target_date - CURRENT_DATE) as days_until_target,
        (
          SELECT COUNT(*)
          FROM employee_workflow_tasks ewt
          WHERE ewt.workflow_id = ew.id
            AND ewt.status NOT IN ('completed', 'skipped')
            AND ewt.due_date < CURRENT_DATE
        ) as overdue_tasks
      FROM employee_workflows ew
      JOIN employees e ON ew.employee_id = e.id
      LEFT JOIN workflow_templates wt ON ew.template_id = wt.id
      WHERE ew.id = $1
    `, [id]);
    
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const workflow = workflowResult.rows[0];
    
    // Récupérer les tâches du workflow
    const tasksResult = await db.query(`
      SELECT 
        ewt.id,
        ewt.status,
        ewt.due_date,
        ewt.started_at,
        ewt.completed_at,
        ewt.result,
        ewt.automation_status,
        ewt.automation_error,
        ewt.notes,
        ewt.skipped_reason,
        
        -- Template task
        json_build_object(
          'id', wt.id,
          'title', wt.title,
          'description', wt.description,
          'responsible_team', wt.responsible_team,
          'is_mandatory', wt.is_mandatory,
          'is_automated', wt.is_automated,
          'automation_type', wt.automation_type,
          'checklist_items', wt.checklist_items,
          'task_order', wt.task_order
        ) as task,
        
        -- Assigned user name (utiliser email car pas de colonne nom)
        CASE 
          WHEN u.id IS NOT NULL THEN u.email
          ELSE NULL
        END as assigned_to_name,
        
        -- Completed by name (utiliser email car pas de colonne nom)
        CASE 
          WHEN u2.id IS NOT NULL THEN u2.email
          ELSE NULL
        END as completed_by_name,
        
        ewt.checklist_completed
        
      FROM employee_workflow_tasks ewt
      JOIN workflow_tasks wt ON ewt.task_id = wt.id
      LEFT JOIN users u ON ewt.assigned_to = u.id
      LEFT JOIN users u2 ON ewt.completed_by = u2.id
      WHERE ewt.workflow_id = $1
      ORDER BY wt.task_order ASC
    `, [id]);
    
    workflow.tasks = tasksResult.rows;
    
    res.status(200).json({ workflow });
    
  } catch (error) {
    console.error('❌ Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * PUT /api/workflows/:id/tasks/:taskId
 * Mettre à jour une tâche (compléter, notes, etc.)
 */
router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status, result, notes, checklist_completed } = req.body;
    const userId = req.user;
    
    // Construction de la requête UPDATE dynamique
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
      
      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
        updates.push(`completed_by = $${paramIndex++}`);
        params.push(userId);
      } else if (status === 'in_progress' && !updates.includes('started_at')) {
        updates.push(`started_at = COALESCE(started_at, NOW())`);
      }
    }
    
    if (result) {
      updates.push(`result = $${paramIndex++}`);
      params.push(result);
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    
    if (checklist_completed !== undefined) {
      updates.push(`checklist_completed = $${paramIndex++}`);
      params.push(JSON.stringify(checklist_completed));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Ajouter l'ID de la tâche
    params.push(taskId);
    params.push(id);
    
    const query = `
      UPDATE employee_workflow_tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND workflow_id = $${paramIndex}
      RETURNING *
    `;
    
    const taskResult = await db.query(query, params);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Récupérer l'état mis à jour du workflow (le trigger a déjà fait le calcul)
    const workflowResult = await db.query(`
      SELECT 
        id,
        completion_percentage,
        completed_tasks,
        total_tasks,
        status
      FROM employee_workflows
      WHERE id = $1
    `, [id]);
    
    res.status(200).json({
      task: taskResult.rows[0],
      workflow: workflowResult.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * POST /api/workflows/:id/tasks/:taskId/skip
 * Passer une tâche (avec raison)
 */
router.post('/:id/tasks/:taskId/skip', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { skipped_reason } = req.body;
    
    const result = await db.query(`
      UPDATE employee_workflow_tasks
      SET 
        status = 'skipped',
        skipped_reason = $1,
        updated_at = NOW()
      WHERE id = $2 AND workflow_id = $3
      RETURNING *
    `, [skipped_reason, taskId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(200).json({
      message: 'Task skipped',
      task: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error skipping task:', error);
    res.status(500).json({ error: 'Failed to skip task' });
  }
});

/**
 * POST /api/workflows/:id/cancel
 * Annuler un workflow
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    const result = await db.query(`
      UPDATE employee_workflows
      SET 
        status = 'cancelled',
        cancellation_reason = $1,
        cancelled_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [cancellation_reason, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.status(200).json({
      message: 'Workflow cancelled',
      workflow: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error cancelling workflow:', error);
    res.status(500).json({ error: 'Failed to cancel workflow' });
  }
});

module.exports = router;