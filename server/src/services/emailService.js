// server/src/services/emailService.js

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

    /**
     * Envoyer un email de bienvenue
     */
    async sendWelcomeEmail(userEmail, userName) {
        const welcomeTemplate = require('../templates/welcomeEmail');
        const html = welcomeTemplate(userName, process.env.APP_URL);

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
        const html = expirationTemplate(contract, daysLeft, process.env.APP_URL);

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
                    <a href="${process.env.APP_URL}" 
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
}

module.exports = new EmailService();