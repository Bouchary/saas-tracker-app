// server/src/jobs/workflowScheduler.js
// Scheduler pour les notifications automatiques de workflows

const cron = require('node-cron');
const db = require('../db');
const emailService = require('../services/emailService');

class WorkflowScheduler {
    constructor() {
        this.jobs = [];
    }

    /**
     * Vérifier les tâches bientôt dues (3 jours avant)
     * Exécuté tous les jours à 9h30
     */
    scheduleTaskDueSoonAlerts() {
        const job = cron.schedule('30 9 * * *', async () => {
            console.log('🔔 Vérification des tâches bientôt dues...');
            
            try {
                // Récupérer toutes les tâches qui sont dues dans les 3 prochains jours
                const result = await db.query(`
                    SELECT 
                        ewt.id,
                        ewt.due_date,
                        
                        -- Task info
                        json_build_object(
                            'id', wt.id,
                            'title', wt.title,
                            'description', wt.description,
                            'responsible_team', wt.responsible_team,
                            'is_mandatory', wt.is_mandatory,
                            'due_date', ewt.due_date,
                            'checklist_items', wt.checklist_items
                        ) as task,
                        
                        -- Workflow info
                        json_build_object(
                            'id', ew.id,
                            'workflow_type', ew.workflow_type
                        ) as workflow,
                        
                        -- Employee info
                        json_build_object(
                            'id', e.id,
                            'first_name', e.first_name,
                            'last_name', e.last_name,
                            'email', e.email,
                            'job_title', e.job_title,
                            'department', e.department
                        ) as employee,
                        
                        -- Assigned user info
                        u.email as assigned_user_email,
                        
                        -- Days left
                        (ewt.due_date - CURRENT_DATE) as days_left
                        
                    FROM employee_workflow_tasks ewt
                    JOIN workflow_tasks wt ON ewt.task_id = wt.id
                    JOIN employee_workflows ew ON ewt.workflow_id = ew.id
                    JOIN employees e ON ew.employee_id = e.id
                    LEFT JOIN users u ON ewt.assigned_to = u.id
                    
                    WHERE ewt.status IN ('pending', 'in_progress')
                      AND ew.status IN ('pending', 'in_progress')
                      AND ewt.due_date > CURRENT_DATE
                      AND ewt.due_date <= CURRENT_DATE + INTERVAL '3 days'
                      AND (ewt.notification_sent_due_soon = false OR ewt.notification_sent_due_soon IS NULL)
                      AND u.email IS NOT NULL
                `);
                
                console.log(`📬 ${result.rows.length} tâches bientôt dues trouvées`);
                
                // Envoyer une notification pour chaque tâche
                for (const row of result.rows) {
                    try {
                        await emailService.sendTaskDueSoonEmail(
                            row.assigned_user_email,
                            row.task,
                            row.workflow,
                            row.employee,
                            parseInt(row.days_left)
                        );
                        
                        // Marquer la notification comme envoyée
                        await db.query(`
                            UPDATE employee_workflow_tasks
                            SET notification_sent_due_soon = true
                            WHERE id = $1
                        `, [row.id]);
                        
                        console.log(`✅ Notification "due soon" envoyée: ${row.task.title}`);
                    } catch (error) {
                        console.error(`❌ Erreur envoi notification tâche ${row.id}:`, error);
                    }
                }
                
            } catch (error) {
                console.error('❌ Erreur vérification tâches bientôt dues:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Europe/Paris'
        });
        
        this.jobs.push({ name: 'taskDueSoonAlerts', job });
        console.log('✅ Scheduler tâches bientôt dues configuré (9h30 quotidien)');
    }

    /**
     * Vérifier les tâches en retard
     * Exécuté tous les jours à 10h
     */
    scheduleTaskOverdueAlerts() {
        const job = cron.schedule('0 10 * * *', async () => {
            console.log('🚨 Vérification des tâches en retard...');
            
            try {
                // Récupérer toutes les tâches en retard
                const result = await db.query(`
                    SELECT 
                        ewt.id,
                        ewt.due_date,
                        
                        -- Task info
                        json_build_object(
                            'id', wt.id,
                            'title', wt.title,
                            'description', wt.description,
                            'responsible_team', wt.responsible_team,
                            'is_mandatory', wt.is_mandatory,
                            'due_date', ewt.due_date
                        ) as task,
                        
                        -- Workflow info
                        json_build_object(
                            'id', ew.id,
                            'workflow_type', ew.workflow_type
                        ) as workflow,
                        
                        -- Employee info
                        json_build_object(
                            'id', e.id,
                            'first_name', e.first_name,
                            'last_name', e.last_name,
                            'email', e.email,
                            'job_title', e.job_title,
                            'department', e.department
                        ) as employee,
                        
                        -- Assigned user info
                        u.email as assigned_user_email
                        
                    FROM employee_workflow_tasks ewt
                    JOIN workflow_tasks wt ON ewt.task_id = wt.id
                    JOIN employee_workflows ew ON ewt.workflow_id = ew.id
                    JOIN employees e ON ew.employee_id = e.id
                    LEFT JOIN users u ON ewt.assigned_to = u.id
                    
                    WHERE ewt.status IN ('pending', 'in_progress')
                      AND ew.status IN ('pending', 'in_progress')
                      AND ewt.due_date < CURRENT_DATE
                      AND (
                          ewt.last_overdue_notification IS NULL 
                          OR ewt.last_overdue_notification < CURRENT_DATE
                      )
                      AND u.email IS NOT NULL
                `);
                
                console.log(`📬 ${result.rows.length} tâches en retard trouvées`);
                
                // Envoyer une notification pour chaque tâche
                for (const row of result.rows) {
                    try {
                        await emailService.sendTaskOverdueEmail(
                            row.assigned_user_email,
                            row.task,
                            row.workflow,
                            row.employee
                        );
                        
                        // Marquer la date de dernière notification
                        await db.query(`
                            UPDATE employee_workflow_tasks
                            SET last_overdue_notification = CURRENT_DATE
                            WHERE id = $1
                        `, [row.id]);
                        
                        console.log(`✅ Notification "overdue" envoyée: ${row.task.title}`);
                    } catch (error) {
                        console.error(`❌ Erreur envoi notification tâche ${row.id}:`, error);
                    }
                }
                
            } catch (error) {
                console.error('❌ Erreur vérification tâches en retard:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Europe/Paris'
        });
        
        this.jobs.push({ name: 'taskOverdueAlerts', job });
        console.log('✅ Scheduler tâches en retard configuré (10h quotidien)');
    }

    /**
     * Envoyer un rapport quotidien des workflows
     * Exécuté tous les jours à 17h
     */
    scheduleDailyWorkflowReport() {
        const job = cron.schedule('0 17 * * *', async () => {
            console.log('📊 Génération des rapports quotidiens workflows...');
            
            try {
                // Récupérer tous les utilisateurs qui ont des workflows actifs
                const usersResult = await db.query(`
                    SELECT DISTINCT u.id, u.email
                    FROM users u
                    JOIN employees e ON e.user_id = u.id
                    JOIN employee_workflows ew ON ew.employee_id = e.id
                    WHERE ew.status IN ('pending', 'in_progress')
                `);
                
                for (const user of usersResult.rows) {
                    // Récupérer les statistiques pour cet utilisateur
                    const statsResult = await db.query(`
                        SELECT
                            COUNT(*) FILTER (WHERE ew.status IN ('pending', 'in_progress')) as active_workflows,
                            COUNT(*) FILTER (WHERE ew.workflow_type = 'onboarding' AND ew.status IN ('pending', 'in_progress')) as active_onboarding,
                            COUNT(*) FILTER (WHERE ew.workflow_type = 'offboarding' AND ew.status IN ('pending', 'in_progress')) as active_offboarding,
                            COUNT(*) FILTER (WHERE ew.status = 'completed' AND DATE(ew.completed_at) = CURRENT_DATE) as completed_today,
                            (
                                SELECT COUNT(*)
                                FROM employee_workflow_tasks ewt
                                JOIN employee_workflows ew2 ON ewt.workflow_id = ew2.id
                                JOIN employees e2 ON ew2.employee_id = e2.id
                                WHERE e2.user_id = $1
                                  AND ewt.status NOT IN ('completed', 'skipped')
                                  AND ewt.due_date < CURRENT_DATE
                                  AND ew2.status IN ('pending', 'in_progress')
                            ) as tasks_overdue,
                            (
                                SELECT COUNT(*)
                                FROM employee_workflow_tasks ewt
                                JOIN employee_workflows ew2 ON ewt.workflow_id = ew2.id
                                JOIN employees e2 ON ew2.employee_id = e2.id
                                WHERE e2.user_id = $1
                                  AND ewt.status NOT IN ('completed', 'skipped')
                                  AND ewt.due_date <= CURRENT_DATE + INTERVAL '3 days'
                                  AND ewt.due_date > CURRENT_DATE
                                  AND ew2.status IN ('pending', 'in_progress')
                            ) as tasks_due_soon
                        FROM employee_workflows ew
                        JOIN employees e ON ew.employee_id = e.id
                        WHERE e.user_id = $1
                    `, [user.id]);
                    
                    const stats = statsResult.rows[0];
                    
                    // Envoyer le rapport seulement s'il y a des workflows actifs
                    if (parseInt(stats.active_workflows) > 0) {
                        await emailService.sendDailyWorkflowReport(user.email, {
                            activeWorkflows: parseInt(stats.active_workflows),
                            activeOnboarding: parseInt(stats.active_onboarding),
                            activeOffboarding: parseInt(stats.active_offboarding),
                            completedToday: parseInt(stats.completed_today),
                            tasksOverdue: parseInt(stats.tasks_overdue),
                            tasksDueSoon: parseInt(stats.tasks_due_soon)
                        });
                        
                        console.log(`✅ Rapport quotidien envoyé à ${user.email}`);
                    }
                }
                
            } catch (error) {
                console.error('❌ Erreur génération rapports quotidiens:', error);
            }
        }, {
            scheduled: false,
            timezone: 'Europe/Paris'
        });
        
        this.jobs.push({ name: 'dailyWorkflowReport', job });
        console.log('✅ Scheduler rapport quotidien configuré (17h quotidien)');
    }

    /**
     * Démarrer tous les jobs
     */
    start() {
        // Vérifier si les notifications workflows sont activées
        if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS !== 'true') {
            console.log('⏸️  Notifications workflows désactivées (ENABLE_WORKFLOW_NOTIFICATIONS != true)');
            return;
        }

        // Planifier les jobs
        if (process.env.ENABLE_DUE_SOON_NOTIFICATIONS !== 'false') {
            this.scheduleTaskDueSoonAlerts();
        }
        
        if (process.env.ENABLE_OVERDUE_NOTIFICATIONS !== 'false') {
            this.scheduleTaskOverdueAlerts();
        }
        
        if (process.env.ENABLE_DAILY_REPORT !== 'false') {
            this.scheduleDailyWorkflowReport();
        }
        
        // Démarrer tous les jobs
        this.jobs.forEach(({ name, job }) => {
            job.start();
            console.log(`🚀 Job "${name}" démarré`);
        });
        
        console.log(`✅ WorkflowScheduler démarré (${this.jobs.length} jobs actifs)`);
    }

    /**
     * Arrêter tous les jobs
     */
    stop() {
        this.jobs.forEach(({ name, job }) => {
            job.stop();
            console.log(`🛑 Job "${name}" arrêté`);
        });
        
        console.log('✅ WorkflowScheduler arrêté');
    }
}

module.exports = new WorkflowScheduler();