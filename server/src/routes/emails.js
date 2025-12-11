// server/src/routes/emails.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');
const emailScheduler = require('../jobs/emailScheduler');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/emails/test
 * @desc    Envoyer un email de test (développement uniquement)
 * @access  Private
 */
router.post('/test', protect, async (req, res) => {
    try {
        const userId = req.user;

        // Récupérer les infos de l'utilisateur
        const userResult = await db.query(
            'SELECT email FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = userResult.rows[0];
        const userName = user.email.split('@')[0]; // Utilise la partie avant @ comme nom

        // Envoyer les emails de test
        const results = await emailScheduler.testEmails(user.email, userName);

        res.json({
            success: true,
            message: 'Emails de test envoyés',
            results: results
        });
    } catch (error) {
        console.error('Erreur test emails:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi des emails de test' });
    }
});

/**
 * @route   POST /api/emails/welcome
 * @desc    Envoyer un email de bienvenue
 * @access  Private
 */
router.post('/welcome', protect, async (req, res) => {
    try {
        const userId = req.user;

        const userResult = await db.query(
            'SELECT email FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = userResult.rows[0];
        const result = await emailService.sendWelcomeEmail(user.email, user.email.split("@")[0]);

        if (result.success) {
            res.json({ success: true, message: 'Email de bienvenue envoyé' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Erreur envoi email bienvenue:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }
});

/**
 * @route   POST /api/emails/contract-alert/:contractId
 * @desc    Envoyer une alerte manuelle pour un contrat
 * @access  Private
 */
router.post('/contract-alert/:contractId', protect, async (req, res) => {
    try {
        const userId = req.user;
        const contractId = req.params.contractId;

        // Récupérer le contrat avec les infos utilisateur
        const result = await db.query(`
            SELECT 
                c.*,
                u.email as user_email
            FROM contracts c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 AND c.user_id = $2
        `, [contractId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé' });
        }

        const contract = result.rows[0];

        // Calculer les jours restants
        const today = new Date();
        const renewalDate = new Date(contract.renewal_date);
        const noticePeriodStart = new Date(renewalDate);
        noticePeriodStart.setDate(noticePeriodStart.getDate() - contract.notice_period_days);
        const daysLeft = Math.ceil((noticePeriodStart - today) / (1000 * 60 * 60 * 24));

        // Envoyer l'alerte
        const emailResult = await emailService.sendContractExpirationAlert(
            contract.user_email,
            contract,
            Math.max(0, daysLeft)
        );

        if (emailResult.success) {
            // Enregistrer la notification
            await db.query(`
                INSERT INTO notifications (user_id, contract_id, type, message, sent_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [
                userId,
                contractId,
                'email',
                `Alerte manuelle envoyée: ${daysLeft} jour(s) avant expiration du préavis`
            ]);

            res.json({ success: true, message: 'Alerte envoyée avec succès' });
        } else {
            res.status(500).json({ success: false, error: emailResult.error });
        }
    } catch (error) {
        console.error('Erreur envoi alerte contrat:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'alerte' });
    }
});

/**
 * @route   POST /api/emails/weekly-summary
 * @desc    Envoyer un résumé hebdomadaire manuel
 * @access  Private
 */
router.post('/weekly-summary', protect, async (req, res) => {
    try {
        const userId = req.user;

        // Récupérer les infos utilisateur
        const userResult = await db.query(
            'SELECT email FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = userResult.rows[0];

        // Utiliser la méthode du scheduler
        await emailScheduler.sendUserWeeklySummary(user);

        res.json({ success: true, message: 'Résumé hebdomadaire envoyé' });
    } catch (error) {
        console.error('Erreur envoi résumé:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du résumé' });
    }
});

/**
 * @route   GET /api/emails/notifications
 * @desc    Récupérer l'historique des notifications email
 * @access  Private
 */
router.get('/notifications', protect, async (req, res) => {
    try {
        const userId = req.user;
        const { limit = 50, offset = 0 } = req.query;

        const result = await db.query(`
            SELECT 
                n.id,
                n.contract_id,
                n.type,
                n.message,
                n.sent_at,
                c.name as contract_name,
                c.provider
            FROM notifications n
            LEFT JOIN contracts c ON n.contract_id = c.id
            WHERE n.user_id = $1
            ORDER BY n.sent_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        // Compter le total
        const countResult = await db.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
            [userId]
        );

        res.json({
            notifications: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
    }
});

/**
 * @route   PUT /api/emails/settings
 * @desc    Mettre à jour les préférences de notification email
 * @access  Private
 */
router.put('/settings', protect, async (req, res) => {
    try {
        const userId = req.user;
        const { notification_email, notification_days } = req.body;

        // Validation
        if (notification_email !== undefined && typeof notification_email !== 'boolean') {
            return res.status(400).json({ error: 'notification_email doit être un booléen' });
        }

        if (notification_days !== undefined) {
            if (!Array.isArray(notification_days) || 
                !notification_days.every(d => Number.isInteger(d) && d > 0)) {
                return res.status(400).json({ 
                    error: 'notification_days doit être un tableau d\'entiers positifs' 
                });
            }
        }

        // Construire la requête de mise à jour
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (notification_email !== undefined) {
            updates.push(`notification_email = $${paramCount}`);
            values.push(notification_email);
            paramCount++;
        }

        if (notification_days !== undefined) {
            updates.push(`notification_days = $${paramCount}`);
            values.push(notification_days);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucune mise à jour fournie' });
        }

        values.push(userId);

        const result = await db.query(`
            UPDATE users
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING notification_email, notification_days
        `, values);

        res.json({
            success: true,
            message: 'Préférences mises à jour',
            settings: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur mise à jour préférences:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

/**
 * @route   GET /api/emails/settings
 * @desc    Récupérer les préférences de notification email
 * @access  Private
 */
router.get('/settings', protect, async (req, res) => {
    try {
        const userId = req.user;

        const result = await db.query(`
            SELECT notification_email, notification_days
            FROM users
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur récupération préférences:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des préférences' });
    }
});

module.exports = router;