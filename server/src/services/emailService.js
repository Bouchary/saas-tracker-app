// server/src/services/emailService.js
// Service d'envoi d'emails centralisé (Resend) - VERSION ÉTENDUE POUR WORKFLOWS
// ✅ CORRECTION #3 : Harmonisation sur FRONTEND_URL

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Service d'envoi d'emails centralisé
 */
class EmailService {
    /**
     * Envoyer un email générique
     */
    async sendEmail({ to, subject, html }) {
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: to,
                subject: subject,
                html: html,
            });

            if (error) {
                console.error('Erreur envoi email:', error);
                return { success: false, error };
            }

            console.log('Email envoyé avec succès:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Erreur envoi email:', error);
            return { success: false, error: error.message };
        }
    }

    // =========================================================================
    // EMAILS POUR LES CONTRATS (existants)
    // =========================================================================

    /**
     * Envoyer un email de bienvenue
     */
    async sendWelcomeEmail(userEmail, userName) {
        const welcomeTemplate = require('../templates/welcomeEmail');
        const html = welcomeTemplate(userName, process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174');

        return this.sendEmail({
            to: userEmail,
            subject: '🎉 Bienvenue sur SaaS Tracker !',
            html: html,
        });
    }

    /**
     * Envoyer une alerte d'expiration de contrat
     */
    async sendContractExpirationAlert(userEmail, contract, daysLeft) {
        const expirationTemplate = require('../templates/contractExpirationEmail');
        const html = expirationTemplate(contract, daysLeft, process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174');

        let urgency = '';
        if (daysLeft <= 7) {
            urgency = '🚨 URGENT';
        } else if (daysLeft <= 14) {
            urgency = '⚠️ Attention';
        } else {
            urgency = '📅 Rappel';
        }

        return this.sendEmail({
            to: userEmail,
            subject: `${urgency} - Contrat "${contract.name}" expire dans ${daysLeft} jour(s)`,
            html: html,
        });
    }

    /**
     * Envoyer un résumé hebdomadaire
     */
    async sendWeeklySummary(userEmail, contracts) {
        const contractsList = contracts
            .map(
                c =>
                    `<li style="margin-bottom: 10px;">
                        <strong>${c.name}</strong> - ${c.daysLeft} jour(s) restant(s)
                    </li>`
            )
            .join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #6366f1;">📊 Résumé Hebdomadaire</h1>
                    <p>Voici les contrats à surveiller cette semaine :</p>
                    <ul style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                        ${contractsList}
                    </ul>
                    <a href="${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174'}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
                        Voir mes contrats
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: '📊 Résumé hebdomadaire - SaaS Tracker',
            html: html,
        });
    }

    // =========================================================================
    // EMAILS POUR LES WORKFLOWS (nouveaux)
    // =========================================================================

    /**
     * Envoyer notification : Workflow créé
     */
    async sendWorkflowCreatedEmail(userEmail, workflow, employee, tasks) {
        const workflowType = workflow.workflow_type === 'onboarding' ? 'Onboarding' : 'Offboarding';
        const icon = workflow.workflow_type === 'onboarding' ? '🎉' : '👋';
        
        const tasksList = tasks.slice(0, 5).map(t => `
            <li style="margin-bottom: 8px; padding: 10px; background: #f9fafb; border-radius: 6px;">
                <strong style="color: #1f2937;">${t.title}</strong>
                <br>
                <span style="font-size: 14px; color: #6b7280;">
                    ${t.responsible_team} - Date limite: ${new Date(t.due_date).toLocaleDateString('fr-FR')}
                </span>
            </li>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #6366f1;">${icon} Nouveau Workflow ${workflowType}</h1>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #1f2937;">${employee.first_name} ${employee.last_name}</h2>
                        <p style="margin: 5px 0;"><strong>Poste :</strong> ${employee.job_title || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Département :</strong> ${employee.department || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Date ${workflow.workflow_type === 'onboarding' ? "d'arrivée" : 'de départ'} :</strong> ${new Date(workflow.target_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    
                    <h3 style="color: #1f2937;">Tâches à réaliser (${tasks.length}) :</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${tasksList}
                        ${tasks.length > 5 ? `<li style="color: #6b7280; font-style: italic;">... et ${tasks.length - 5} autres tâches</li>` : ''}
                    </ul>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows/${workflow.id}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
                        Voir le workflow complet
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `${icon} Nouveau workflow ${workflowType} - ${employee.first_name} ${employee.last_name}`,
            html: html,
        });
    }

    /**
     * Envoyer notification : Tâche assignée
     */
    async sendTaskAssignedEmail(userEmail, task, workflow, employee) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #6366f1;">📋 Nouvelle tâche assignée</h1>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #1f2937;">${task.title}</h2>
                        <p style="color: #6b7280;">${task.description || 'Pas de description'}</p>
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 5px 0;"><strong>Employé :</strong> ${employee.first_name} ${employee.last_name}</p>
                            <p style="margin: 5px 0;"><strong>Workflow :</strong> ${workflow.workflow_type === 'onboarding' ? 'Onboarding' : 'Offboarding'}</p>
                            <p style="margin: 5px 0;"><strong>Date limite :</strong> ${new Date(task.due_date).toLocaleDateString('fr-FR')}</p>
                            <p style="margin: 5px 0;"><strong>Équipe :</strong> ${task.responsible_team}</p>
                        </div>
                    </div>
                    
                    ${task.checklist_items && task.checklist_items.length > 0 ? `
                        <div style="margin: 20px 0;">
                            <h3 style="color: #1f2937;">Checklist :</h3>
                            <ul style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                                ${task.checklist_items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows/${workflow.id}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
                        Voir le workflow
                    </a>
                    
                    ${task.is_mandatory ? '<p style="color: #dc2626; font-weight: bold; margin-top: 20px;">⚠️ Cette tâche est obligatoire</p>' : ''}
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `📋 Nouvelle tâche : ${task.title}`,
            html: html,
        });
    }

    /**
     * Envoyer notification : Tâche bientôt due
     */
    async sendTaskDueSoonEmail(userEmail, task, workflow, employee, daysLeft) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #f59e0b;">⏰ Tâche à faire bientôt</h1>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #92400e;">${task.title}</h2>
                        <p style="font-size: 18px; font-weight: bold; color: #92400e;">
                            Date limite : ${new Date(task.due_date).toLocaleDateString('fr-FR')} (dans ${daysLeft} jours)
                        </p>
                        <p style="margin: 5px 0;"><strong>Employé :</strong> ${employee.first_name} ${employee.last_name}</p>
                    </div>
                    
                    <p>Cette tâche arrive à échéance dans moins de 3 jours. Merci de la compléter rapidement.</p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows/${workflow.id}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">
                        Voir la tâche
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `⏰ Rappel : Tâche à faire pour ${new Date(task.due_date).toLocaleDateString('fr-FR')}`,
            html: html,
        });
    }

    /**
     * Envoyer notification : Tâche en retard
     */
    async sendTaskOverdueEmail(userEmail, task, workflow, employee) {
        const daysOverdue = Math.floor((new Date() - new Date(task.due_date)) / (1000 * 60 * 60 * 24));
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #dc2626;">🚨 Tâche en retard</h1>
                    
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #991b1b;">${task.title}</h2>
                        <p style="font-size: 18px; font-weight: bold; color: #991b1b;">
                            Date limite dépassée : ${new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </p>
                        <p style="color: #dc2626; font-weight: bold;">
                            En retard de ${daysOverdue} jour(s)
                        </p>
                        <p style="margin: 5px 0;"><strong>Employé :</strong> ${employee.first_name} ${employee.last_name}</p>
                    </div>
                    
                    <p style="font-weight: bold; color: #991b1b;">Action requise immédiatement !</p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows/${workflow.id}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px;">
                        Compléter la tâche maintenant
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `🚨 URGENT : Tâche en retard - ${task.title}`,
            html: html,
        });
    }

    /**
     * Envoyer notification : Workflow complété
     */
    async sendWorkflowCompletedEmail(userEmail, workflow, employee) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #16a34a;">✅ Workflow complété avec succès !</h1>
                    
                    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #166534;">${employee.first_name} ${employee.last_name}</h2>
                        <p style="margin: 5px 0;"><strong>Type :</strong> ${workflow.workflow_type === 'onboarding' ? 'Onboarding' : 'Offboarding'}</p>
                        <p style="margin: 5px 0;"><strong>Tâches complétées :</strong> ${workflow.completed_tasks} / ${workflow.total_tasks}</p>
                        <p style="margin: 5px 0;"><strong>Taux de complétion :</strong> ${workflow.completion_percentage}%</p>
                    </div>
                    
                    <p style="color: #16a34a; font-weight: bold;">
                        Toutes les tâches obligatoires ont été complétées !
                    </p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows/${workflow.id}" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px;">
                        Voir le résumé
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `✅ Workflow complété - ${employee.first_name} ${employee.last_name}`,
            html: html,
        });
    }

    /**
     * Envoyer un rapport quotidien des workflows
     */
    async sendDailyWorkflowReport(userEmail, stats) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #6366f1;">📊 Rapport quotidien des workflows</h1>
                    <p style="color: #6b7280;">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="margin-top: 0;">Statistiques</h2>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Workflows actifs</p>
                                <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #6366f1;">${stats.activeWorkflows}</p>
                            </div>
                            
                            <div>
                                <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Complétés aujourd'hui</p>
                                <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #16a34a;">${stats.completedToday}</p>
                            </div>
                            
                            <div>
                                <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Onboarding actifs</p>
                                <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">${stats.activeOnboarding}</p>
                            </div>
                            
                            <div>
                                <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Offboarding actifs</p>
                                <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.activeOffboarding}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${stats.tasksOverdue > 0 ? `
                        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold; color: #dc2626;">
                                🚨 ${stats.tasksOverdue} tâche(s) en retard
                            </p>
                        </div>
                    ` : ''}
                    
                    ${stats.tasksDueSoon > 0 ? `
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold; color: #92400e;">
                                ⏰ ${stats.tasksDueSoon} tâche(s) à faire bientôt
                            </p>
                        </div>
                    ` : ''}
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/workflows" 
                       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">
                        Voir tous les workflows
                    </a>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: userEmail,
            subject: `📊 Rapport quotidien workflows - ${new Date().toLocaleDateString('fr-FR')}`,
            html: html,
        });
    }
}

module.exports = new EmailService();