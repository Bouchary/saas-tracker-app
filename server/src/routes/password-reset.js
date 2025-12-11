// server/src/routes/password-reset.js
// Routes pour la réinitialisation de mot de passe

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { sendEmail } = require('../services/emailService');

// ==========================================
// ROUTE : DEMANDER LA RÉINITIALISATION
// ==========================================
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Vérifier que l'utilisateur existe
        const userResult = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Par sécurité, on ne dit pas si l'email existe ou non
            return res.json({ 
                message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' 
            });
        }

        const user = userResult.rows[0];

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

        // Sauvegarder le token en base
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetTokenHash, resetTokenExpiry, user.id]
        );

        // URL de réinitialisation
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // Envoyer l'email
        const emailContent = `
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
            <p>Ce lien est valide pendant 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">SaaS Tracker - Gestion de vos abonnements</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Réinitialisation de votre mot de passe',
            html: emailContent
        });

        console.log(`✅ Email de réinitialisation envoyé à ${email}`);

        res.json({ 
            message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' 
        });

    } catch (error) {
        console.error('❌ Erreur demande réinitialisation:', error);
        res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
    }
});

// ==========================================
// ROUTE : RÉINITIALISER LE MOT DE PASSE
// ==========================================
// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Valider le mot de passe
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Hasher le token reçu
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Trouver l'utilisateur avec ce token et vérifier l'expiration
        const userResult = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [resetTokenHash]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        const user = userResult.rows[0];

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mettre à jour le mot de passe et supprimer le token
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        console.log(`✅ Mot de passe réinitialisé pour utilisateur ${user.id}`);

        res.json({ message: 'Mot de passe réinitialisé avec succès' });

    } catch (error) {
        console.error('❌ Erreur réinitialisation mot de passe:', error);
        res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
});

module.exports = router;