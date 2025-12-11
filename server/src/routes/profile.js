// server/src/routes/profile.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/profile
 * @desc    Récupérer les informations du profil utilisateur
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user;

        // Récupérer les infos utilisateur
        const userResult = await db.query(
            `SELECT 
                id, 
                email, 
                created_at,
                notification_email,
                notification_days
            FROM users 
            WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = userResult.rows[0];

        // Récupérer les statistiques des contrats
        const statsResult = await db.query(
            `SELECT 
                COUNT(*) as total_contracts,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
                COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_cost ELSE 0 END), 0) as total_monthly_cost,
                MIN(renewal_date) as next_renewal
            FROM contracts 
            WHERE user_id = $1`,
            [userId]
        );

        const stats = statsResult.rows[0];

        res.json({
            profile: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                notification_email: user.notification_email,
                notification_days: user.notification_days
            },
            stats: {
                total_contracts: parseInt(stats.total_contracts) || 0,
                active_contracts: parseInt(stats.active_contracts) || 0,
                total_monthly_cost: parseFloat(stats.total_monthly_cost) || 0,
                next_renewal: stats.next_renewal
            }
        });
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

/**
 * @route   PUT /api/profile/notifications
 * @desc    Mettre à jour les préférences de notification
 * @access  Private
 */
router.put('/notifications', protect, async (req, res) => {
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

        console.log(`✅ Préférences mises à jour pour l'utilisateur ${userId}`);

        res.json({
            success: true,
            message: 'Préférences mises à jour avec succès',
            settings: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur mise à jour préférences:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
    }
});

/**
 * @route   GET /api/profile/notifications/history
 * @desc    Récupérer l'historique des notifications
 * @access  Private
 */
router.get('/notifications/history', protect, async (req, res) => {
    try {
        const userId = req.user;
        const { limit = 20, offset = 0 } = req.query;

        const result = await db.query(`
            SELECT 
                n.id,
                n.contract_id,
                n.type,
                n.message,
                n.sent_at,
                c.name as contract_name
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
        console.error('Erreur récupération historique:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

module.exports = router;