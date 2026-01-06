// server/src/middlewares/mdmTokenMiddleware.js
// Middleware pour authentifier les agents MDM via device_token

const pool = require('../db');

const mdmTokenMiddleware = async (req, res, next) => {
    try {
        // Récupérer token depuis header
        const deviceToken = req.headers['x-device-token'];

        if (!deviceToken) {
            return res.status(401).json({
                error: 'Device token manquant',
                message: 'Header X-Device-Token requis'
            });
        }

        // Vérifier token dans la base
        const result = await pool.query(
            `SELECT 
                id,
                organization_id,
                status,
                hostname
            FROM mdm_devices
            WHERE device_token = $1`,
            [deviceToken]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Device token invalide',
                message: 'Token non reconnu. Veuillez réenregistrer le device.'
            });
        }

        const device = result.rows[0];

        // Vérifier que device est actif
        if (device.status === 'decommissioned') {
            return res.status(403).json({
                error: 'Device désactivé',
                message: 'Ce device a été désactivé. Contactez votre administrateur.'
            });
        }

        // Injecter informations dans request
        req.deviceId = device.id;
        req.organizationId = device.organization_id;
        req.deviceHostname = device.hostname;

        next();

    } catch (error) {
        console.error('❌ Erreur MDM token middleware:', error);
        res.status(500).json({
            error: 'Erreur authentification',
            details: error.message
        });
    }
};

module.exports = mdmTokenMiddleware;