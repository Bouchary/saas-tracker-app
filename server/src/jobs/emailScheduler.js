// server/src/jobs/emailScheduler.js

const cron = require('node-cron');
const db = require('../db');
const emailService = require('../services/emailService');

/**
 * Planificateur d'emails automatiques
 * Vérifie les contrats et envoie des alertes selon les préférences utilisateur
 */
class EmailScheduler {
    constructor() {
        this.jobs = [];
    }

    /**
     * Démarrer tous les jobs planifiés
     */
    start() {
        console.log('📧 Démarrage du planificateur d\'emails...');

        // Job quotidien : vérifier les contrats et envoyer des alertes
        // Exécuté tous les jours à 9h00
        const dailyJob = cron.schedule('0 9 * * *', async () => {
            console.log('🔄 Exécution du job quotidien d\'alertes...');
            await this.sendDailyAlerts();
        });

        // Job hebdomadaire : envoyer un résumé
        // Exécuté tous les lundis à 9h00
        const weeklyJob = cron.schedule('0 9 * * 1', async () => {
            console.log('📊 Exécution du job hebdomadaire de résumés...');
            await this.sendWeeklySummaries();
        });

        this.jobs.push(dailyJob, weeklyJob);
        console.log('✅ Planificateur d\'emails démarré avec succès');
        console.log('   - Alertes quotidiennes : tous les jours à 9h00');
        console.log('   - Résumés hebdomadaires : tous les lundis à 9h00');
    }

    /**
     * Arrêter tous les jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('🛑 Planificateur d\'emails arrêté');
    }

    /**
     * Envoyer les alertes quotidiennes
     */
    async sendDailyAlerts() {
        try {
            // Récupérer tous les utilisateurs avec notifications activées
            const usersResult = await db.query(`
                SELECT id, email, username, notification_email, notification_days
                FROM users
                WHERE notification_email = true
            `);

            console.log(`👥 ${usersResult.rows.length} utilisateur(s) avec notifications activées`);

            for (const user of usersResult.rows) {
                await this.checkUserContracts(user);
            }

            console.log('✅ Alertes quotidiennes envoyées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi des alertes quotidiennes:', error);
        }
    }

    /**
     * Vérifier les contrats d'un utilisateur et envoyer des alertes si nécessaire
     */
    async checkUserContracts(user) {
        try {
            const notificationDays = user.notification_days || [30, 14, 7, 3, 1];

            // Récupérer les contrats actifs de l'utilisateur
            const contractsResult = await db.query(`
                SELECT 
                    id,
                    name,
                    provider,
                    monthly_cost,
                    renewal_date,
                    notice_period_days,
                    status
                FROM contracts
                WHERE user_id = $1 
                AND status = 'active'
                AND renewal_date IS NOT NULL
                ORDER BY renewal_date ASC
            `, [user.id]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let alertsSent = 0;

            for (const contract of contractsResult.rows) {
                const renewalDate = new Date(contract.renewal_date);
                renewalDate.setHours(0, 0, 0, 0);

                const noticePeriodStart = new Date(renewalDate);
                noticePeriodStart.setDate(noticePeriodStart.getDate() - contract.notice_period_days);

                const daysUntilNoticeDeadline = Math.ceil((noticePeriodStart - today) / (1000 * 60 * 60 * 24));

                // Vérifier si on doit envoyer une alerte aujourd'hui
                if (notificationDays.includes(daysUntilNoticeDeadline) && daysUntilNoticeDeadline >= 0) {
                    console.log(`📧 Envoi d'alerte pour le contrat "${contract.name}" (${daysUntilNoticeDeadline}j restants)`);
                    
                    const result = await emailService.sendContractExpirationAlert(
                        user.email,
                        contract,
                        daysUntilNoticeDeadline
                    );

                    if (result.success) {
                        alertsSent++;
                        
                        // Enregistrer la notification dans la base
                        await db.query(`
                            INSERT INTO notifications (user_id, contract_id, type, message, sent_at)
                            VALUES ($1, $2, $3, $4, NOW())
                        `, [
                            user.id,
                            contract.id,
                            'email',
                            `Alerte envoyée: ${daysUntilNoticeDeadline} jour(s) avant expiration du préavis`
                        ]);
                    }
                }
            }

            if (alertsSent > 0) {
                console.log(`✅ ${alertsSent} alerte(s) envoyée(s) à ${user.email}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la vérification des contrats pour ${user.email}:`, error);
        }
    }

    /**
     * Envoyer les résumés hebdomadaires
     */
    async sendWeeklySummaries() {
        try {
            // Récupérer tous les utilisateurs avec notifications activées
            const usersResult = await db.query(`
                SELECT id, email, username
                FROM users
                WHERE notification_email = true
            `);

            console.log(`👥 Envoi de résumés à ${usersResult.rows.length} utilisateur(s)`);

            for (const user of usersResult.rows) {
                await this.sendUserWeeklySummary(user);
            }

            console.log('✅ Résumés hebdomadaires envoyés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi des résumés hebdomadaires:', error);
        }
    }

    /**
     * Envoyer le résumé hebdomadaire pour un utilisateur
     */
    async sendUserWeeklySummary(user) {
        try {
            // Récupérer les contrats qui expirent dans les 30 prochains jours
            const contractsResult = await db.query(`
                SELECT 
                    name,
                    provider,
                    monthly_cost,
                    renewal_date,
                    notice_period_days
                FROM contracts
                WHERE user_id = $1 
                AND status = 'active'
                AND renewal_date IS NOT NULL
                AND renewal_date <= CURRENT_DATE + INTERVAL '30 days'
                ORDER BY renewal_date ASC
            `, [user.id]);

            if (contractsResult.rows.length === 0) {
                console.log(`ℹ️ Aucun contrat à surveiller pour ${user.email}`);
                return;
            }

            // Calculer les jours restants pour chaque contrat
            const today = new Date();
            const contractsWithDays = contractsResult.rows.map(contract => {
                const renewalDate = new Date(contract.renewal_date);
                const noticePeriodStart = new Date(renewalDate);
                noticePeriodStart.setDate(noticePeriodStart.getDate() - contract.notice_period_days);
                
                const daysLeft = Math.ceil((noticePeriodStart - today) / (1000 * 60 * 60 * 24));
                
                return {
                    ...contract,
                    daysLeft: Math.max(0, daysLeft)
                };
            });

            // Envoyer le résumé
            const result = await emailService.sendWeeklySummary(user.email, contractsWithDays);

            if (result.success) {
                console.log(`✅ Résumé hebdomadaire envoyé à ${user.email}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi du résumé pour ${user.email}:`, error);
        }
    }

    /**
     * Tester l'envoi d'emails (pour développement)
     */
    async testEmails(userEmail, userName) {
        console.log('🧪 Mode TEST - Envoi d\'emails de test...');

        // Test email de bienvenue
        console.log('📧 Test 1/2 : Email de bienvenue...');
        const welcomeResult = await emailService.sendWelcomeEmail(userEmail, userName);
        console.log(welcomeResult.success ? '✅ Succès' : '❌ Échec', welcomeResult);

        // Test email d'alerte
        console.log('📧 Test 2/2 : Email d\'alerte...');
        const testContract = {
            name: 'Netflix Premium',
            provider: 'Netflix',
            monthly_cost: 15.99,
            renewal_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 jours
            notice_period_days: 30
        };
        const alertResult = await emailService.sendContractExpirationAlert(userEmail, testContract, 7);
        console.log(alertResult.success ? '✅ Succès' : '❌ Échec', alertResult);

        return {
            welcome: welcomeResult,
            alert: alertResult
        };
    }
}

module.exports = new EmailScheduler();
