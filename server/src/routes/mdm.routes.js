// server/src/routes/mdm.routes.js
// ✅ SYSTÈME MDM COMPLET - Routes API pour agents et dashboard
// Routes : /api/mdm/*

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const mdmTokenMiddleware = require('../middlewares/mdmTokenMiddleware'); // À créer

// ============================================================================
// ROUTE 1 : REGISTRATION - Enregistrer nouvel agent
// ============================================================================
// POST /api/mdm/register
// Body: { organization_token, hostname, serial_number, mac_address, os_type }
router.post('/register', async (req, res) => {
    try {
        const {
            organization_token,
            hostname,
            serial_number,
            mac_address,
            os_type,
            manufacturer,
            model,
            os_version
        } = req.body;

        console.log(`📱 MDM Registration - Hostname: ${hostname}, Serial: ${serial_number}`);

        // Validation
        if (!organization_token || !hostname || !serial_number) {
            return res.status(400).json({
                error: 'Paramètres manquants',
                required: ['organization_token', 'hostname', 'serial_number']
            });
        }

        // Vérifier organization_token (c'est un token spécial pour enregistrement)
        // Pour l'instant, on utilise l'ID organisation directement
        // TODO: Implémenter système de tokens organisations sécurisés
        const organizationId = parseInt(organization_token);

        if (!organizationId || isNaN(organizationId)) {
            return res.status(401).json({ error: 'Token organisation invalide' });
        }

        // Vérifier si device existe déjà
        const existingDevice = await pool.query(
            `SELECT id, device_token, status 
             FROM mdm_devices 
             WHERE organization_id = $1 AND serial_number = $2`,
            [organizationId, serial_number]
        );

        if (existingDevice.rows.length > 0) {
            // Device existe déjà
            const device = existingDevice.rows[0];
            
            // Si désactivé, réactiver
            if (device.status === 'inactive' || device.status === 'decommissioned') {
                await pool.query(
                    `UPDATE mdm_devices 
                     SET status = 'active', 
                         last_seen = CURRENT_TIMESTAMP,
                         hostname = $1,
                         mac_address = $2,
                         os_type = $3,
                         os_version = $4,
                         manufacturer = $5,
                         model = $6
                     WHERE id = $7`,
                    [hostname, mac_address, os_type, os_version, manufacturer, model, device.id]
                );
                
                console.log(`✅ Device ${device.id} réactivé`);
            }

            return res.json({
                success: true,
                message: 'Device déjà enregistré',
                device_token: device.device_token,
                device_id: device.id,
                is_new: false
            });
        }

        // Générer token unique pour ce device
        const deviceToken = crypto.randomBytes(32).toString('hex');

        // Créer nouveau device
        const result = await pool.query(
            `INSERT INTO mdm_devices (
                organization_id,
                device_token,
                device_name,
                hostname,
                serial_number,
                mac_address,
                manufacturer,
                model,
                os_type,
                os_version,
                status,
                last_seen
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', CURRENT_TIMESTAMP)
            RETURNING id, device_token`,
            [
                organizationId,
                deviceToken,
                hostname, // device_name = hostname par défaut
                hostname,
                serial_number,
                mac_address,
                manufacturer,
                model,
                os_type,
                os_version
            ]
        );

        const deviceId = result.rows[0].id;

        // Créer alerte "nouveau device"
        await pool.query(
            `INSERT INTO mdm_alerts (
                organization_id,
                device_id,
                alert_type,
                severity,
                title,
                message,
                details
            ) VALUES ($1, $2, 'new_device', 'info', $3, $4, $5)`,
            [
                organizationId,
                deviceId,
                `Nouveau matériel détecté: ${hostname}`,
                `Un nouveau device ${manufacturer} ${model} (${os_type}) a été enregistré automatiquement.`,
                JSON.stringify({
                    hostname,
                    serial_number,
                    mac_address,
                    os_type,
                    manufacturer,
                    model
                })
            ]
        );

        console.log(`✅ Nouveau device ${deviceId} enregistré`);

        res.json({
            success: true,
            message: 'Device enregistré avec succès',
            device_token: deviceToken,
            device_id: deviceId,
            is_new: true
        });

    } catch (error) {
        console.error('❌ Erreur registration MDM:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'enregistrement',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 2 : HEARTBEAT - Recevoir données inventaire
// ============================================================================
// POST /api/mdm/heartbeat
// Headers: { 'X-Device-Token': 'xxx' }
// Body: { inventaire complet }
router.post('/heartbeat', mdmTokenMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const deviceId = req.deviceId; // Injecté par middleware
        const organizationId = req.organizationId;
        const inventoryData = req.body;

        console.log(`💓 Heartbeat device ${deviceId} - Org ${organizationId}`);

        // Récupérer dernière collecte pour comparer
        const lastInventory = await pool.query(
            `SELECT inventory_data 
             FROM mdm_inventory_history 
             WHERE device_id = $1 
             ORDER BY collected_at DESC 
             LIMIT 1`,
            [deviceId]
        );

        // Détecter changements
        let changesDetected = {};
        let hasChanges = false;
        let alertsGenerated = [];

        if (lastInventory.rows.length > 0) {
            const lastData = lastInventory.rows[0].inventory_data;
            changesDetected = detectChanges(lastData, inventoryData);
            hasChanges = Object.keys(changesDetected).length > 0;

            // Générer alertes basées sur changements
            alertsGenerated = await generateAlerts(deviceId, organizationId, changesDetected, inventoryData);
        }

        // Mettre à jour device
        await pool.query(
            `UPDATE mdm_devices SET
                last_seen = CURRENT_TIMESTAMP,
                hostname = $1,
                cpu_model = $2,
                cpu_cores = $3,
                ram_gb = $4,
                disk_total_gb = $5,
                disk_free_gb = $6,
                ip_local = $7,
                ip_public = $8,
                current_username = $9,
                os_version = $10,
                last_boot = $11,
                agent_version = $12,
                status = 'active'
            WHERE id = $13`,
            [
                inventoryData.hostname,
                inventoryData.cpu_model,
                inventoryData.cpu_cores,
                inventoryData.ram_gb,
                inventoryData.disk_total_gb,
                inventoryData.disk_free_gb,
                inventoryData.ip_local,
                inventoryData.ip_public,
                inventoryData.current_username,
                inventoryData.os_version,
                inventoryData.last_boot,
                inventoryData.agent_version || '1.0.0',
                deviceId
            ]
        );

        // Calculer métriques
        const diskUsagePercent = ((inventoryData.disk_total_gb - inventoryData.disk_free_gb) / inventoryData.disk_total_gb * 100).toFixed(2);
        const cpuUsagePercent = inventoryData.cpu_usage_percent || null;
        const ramUsagePercent = inventoryData.ram_usage_percent || null;

        // Sauvegarder historique
        await pool.query(
            `INSERT INTO mdm_inventory_history (
                device_id,
                organization_id,
                inventory_data,
                changes_detected,
                has_changes,
                cpu_usage_percent,
                ram_usage_percent,
                disk_usage_percent,
                software_count,
                software_changes,
                alerts_generated,
                collection_duration_ms,
                agent_version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                deviceId,
                organizationId,
                JSON.stringify(inventoryData),
                hasChanges ? JSON.stringify(changesDetected) : null,
                hasChanges,
                cpuUsagePercent,
                ramUsagePercent,
                diskUsagePercent,
                inventoryData.installed_software?.length || 0,
                changesDetected.software ? JSON.stringify(changesDetected.software) : null,
                alertsGenerated.length > 0 ? alertsGenerated : null,
                Date.now() - startTime,
                inventoryData.agent_version || '1.0.0'
            ]
        );

        // Vérifier si asset existe, sinon créer
        const device = await pool.query(
            `SELECT asset_id FROM mdm_devices WHERE id = $1`,
            [deviceId]
        );

        if (!device.rows[0].asset_id) {
            // Créer asset automatiquement
            await createAssetFromDevice(deviceId, organizationId, inventoryData);
        } else {
            // Mettre à jour asset existant
            await updateAssetFromDevice(device.rows[0].asset_id, inventoryData);
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Heartbeat traité en ${processingTime}ms - ${hasChanges ? 'Changements détectés' : 'Aucun changement'}`);

        res.json({
            success: true,
            message: 'Heartbeat enregistré',
            has_changes: hasChanges,
            changes_count: Object.keys(changesDetected).length,
            alerts_generated: alertsGenerated.length,
            processing_time_ms: processingTime
        });

    } catch (error) {
        console.error('❌ Erreur heartbeat MDM:', error);
        res.status(500).json({
            error: 'Erreur lors du traitement heartbeat',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 3 : GET DEVICES - Liste tous les devices
// ============================================================================
// GET /api/mdm/devices?status=active&search=PC-001&page=1&limit=20
router.get('/devices', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { status, search, os_type, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['d.organization_id = $1'];
        let params = [organizationId];
        let paramIndex = 2;

        if (status) {
            whereConditions.push(`d.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (os_type) {
            whereConditions.push(`d.os_type = $${paramIndex}`);
            params.push(os_type);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(d.hostname ILIKE $${paramIndex} OR d.device_name ILIKE $${paramIndex} OR d.serial_number ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Compter total
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM mdm_devices d WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Récupérer devices
        const result = await pool.query(
            `SELECT 
                d.*,
                a.name as asset_name,
                a.status as asset_status,
                CASE 
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'online'
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'recently_active'
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'inactive'
                    ELSE 'offline'
                END as connection_status,
                (
                    SELECT COUNT(*) 
                    FROM mdm_alerts 
                    WHERE device_id = d.id AND resolved = false
                ) as unresolved_alerts_count
            FROM mdm_devices d
            LEFT JOIN assets a ON d.asset_id = a.id
            WHERE ${whereClause}
            ORDER BY d.last_seen DESC NULLS LAST
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            devices: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Erreur get devices:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des devices',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 4 : GET DEVICE DETAILS - Détails device
// ============================================================================
// GET /api/mdm/devices/:id
router.get('/devices/:id', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const deviceId = req.params.id;
        const organizationId = req.organizationId;

        const result = await pool.query(
            `SELECT 
                d.*,
                a.name as asset_name,
                a.status as asset_status,
                a.id as asset_id,
                CASE 
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'online'
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'recently_active'
                    WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'inactive'
                    ELSE 'offline'
                END as connection_status
            FROM mdm_devices d
            LEFT JOIN assets a ON d.asset_id = a.id
            WHERE d.id = $1 AND d.organization_id = $2`,
            [deviceId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Device non trouvé' });
        }

        // Récupérer dernière collecte
        const lastInventory = await pool.query(
            `SELECT * FROM mdm_inventory_history 
             WHERE device_id = $1 
             ORDER BY collected_at DESC 
             LIMIT 1`,
            [deviceId]
        );

        // Récupérer alertes non résolues
        const alerts = await pool.query(
            `SELECT * FROM mdm_alerts 
             WHERE device_id = $1 AND resolved = false 
             ORDER BY created_at DESC`,
            [deviceId]
        );

        res.json({
            success: true,
            device: result.rows[0],
            last_inventory: lastInventory.rows[0] || null,
            active_alerts: alerts.rows
        });

    } catch (error) {
        console.error('❌ Erreur get device details:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des détails',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 5 : GET STATS - Statistiques globales
// ============================================================================
// GET /api/mdm/stats
router.get('/stats', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;

        // Stats devices
        const devicesStats = await pool.query(
            `SELECT 
                COUNT(*) as total_devices,
                COUNT(*) FILTER (WHERE last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes') as online_devices,
                COUNT(*) FILTER (WHERE last_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days' OR last_seen IS NULL) as offline_devices,
                COUNT(*) FILTER (WHERE status = 'active') as active_devices,
                COUNT(*) FILTER (WHERE os_type = 'windows') as windows_devices,
                COUNT(*) FILTER (WHERE os_type = 'macos') as macos_devices,
                COUNT(*) FILTER (WHERE os_type = 'linux') as linux_devices
            FROM mdm_devices
            WHERE organization_id = $1 AND status != 'decommissioned'`,
            [organizationId]
        );

        // Stats alertes
        const alertsStats = await pool.query(
            `SELECT 
                COUNT(*) as total_alerts,
                COUNT(*) FILTER (WHERE resolved = false) as unresolved_alerts,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
                COUNT(*) FILTER (WHERE severity = 'warning') as warning_alerts,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as alerts_24h
            FROM mdm_alerts
            WHERE organization_id = $1`,
            [organizationId]
        );

        // Stats historique (derniers 30 jours)
        const historyStats = await pool.query(
            `SELECT 
                COUNT(*) as total_collections,
                COUNT(*) FILTER (WHERE has_changes = true) as collections_with_changes,
                AVG(disk_usage_percent)::NUMERIC(10,2) as avg_disk_usage,
                AVG(cpu_usage_percent)::NUMERIC(10,2) as avg_cpu_usage,
                AVG(ram_usage_percent)::NUMERIC(10,2) as avg_ram_usage
            FROM mdm_inventory_history
            WHERE organization_id = $1 
            AND collected_at > CURRENT_TIMESTAMP - INTERVAL '30 days'`,
            [organizationId]
        );

        // Évolution derniers 30 jours (collectes par jour)
        const evolutionStats = await pool.query(
            `SELECT 
                DATE(collected_at) as date,
                COUNT(*) as collections_count,
                COUNT(DISTINCT device_id) as active_devices_count
            FROM mdm_inventory_history
            WHERE organization_id = $1
            AND collected_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY DATE(collected_at)
            ORDER BY date DESC`,
            [organizationId]
        );

        res.json({
            success: true,
            stats: {
                devices: devicesStats.rows[0],
                alerts: alertsStats.rows[0],
                history: historyStats.rows[0],
                evolution: evolutionStats.rows
            }
        });

    } catch (error) {
        console.error('❌ Erreur get stats:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des stats',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 6 : GET ALERTS - Liste alertes
// ============================================================================
// GET /api/mdm/alerts?resolved=false&severity=critical
router.get('/alerts', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { resolved, severity, device_id, limit = 50 } = req.query;

        let whereConditions = ['a.organization_id = $1'];
        let params = [organizationId];
        let paramIndex = 2;

        if (resolved !== undefined) {
            whereConditions.push(`a.resolved = $${paramIndex}`);
            params.push(resolved === 'true');
            paramIndex++;
        }

        if (severity) {
            whereConditions.push(`a.severity = $${paramIndex}`);
            params.push(severity);
            paramIndex++;
        }

        if (device_id) {
            whereConditions.push(`a.device_id = $${paramIndex}`);
            params.push(device_id);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const result = await pool.query(
            `SELECT 
                a.*,
                d.hostname,
                d.device_name
            FROM mdm_alerts a
            LEFT JOIN mdm_devices d ON a.device_id = d.id
            WHERE ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT $${paramIndex}`,
            [...params, limit]
        );

        res.json({
            success: true,
            alerts: result.rows
        });

    } catch (error) {
        console.error('❌ Erreur get alerts:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des alertes',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 7 : RESOLVE ALERT - Résoudre alerte
// ============================================================================
// PUT /api/mdm/alerts/:id/resolve
router.put('/alerts/:id/resolve', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const alertId = req.params.id;
        const userId = req.user.id;
        const organizationId = req.organizationId;
        const { resolution_note } = req.body;

        const result = await pool.query(
            `UPDATE mdm_alerts SET
                resolved = true,
                resolved_at = CURRENT_TIMESTAMP,
                resolved_by = $1,
                resolution_note = $2
            WHERE id = $3 AND organization_id = $4
            RETURNING *`,
            [userId, resolution_note, alertId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }

        res.json({
            success: true,
            alert: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur resolve alert:', error);
        res.status(500).json({
            error: 'Erreur lors de la résolution de l\'alerte',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 8 : GET HISTORY - Historique device
// ============================================================================
// GET /api/mdm/devices/:id/history?limit=30
router.get('/devices/:id/history', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const deviceId = req.params.id;
        const organizationId = req.organizationId;
        const { limit = 30 } = req.query;

        const result = await pool.query(
            `SELECT * FROM mdm_inventory_history
            WHERE device_id = $1 AND organization_id = $2
            ORDER BY collected_at DESC
            LIMIT $3`,
            [deviceId, organizationId, limit]
        );

        res.json({
            success: true,
            history: result.rows
        });

    } catch (error) {
        console.error('❌ Erreur get history:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'historique',
            details: error.message
        });
    }
});

// ============================================================================
// FONCTIONS HELPERS
// ============================================================================

// Détecter changements entre deux inventaires
function detectChanges(oldData, newData) {
    const changes = {};

    // Vérifier RAM
    if (oldData.ram_gb !== newData.ram_gb) {
        changes.ram_gb = {
            old: oldData.ram_gb,
            new: newData.ram_gb,
            type: newData.ram_gb > oldData.ram_gb ? 'upgrade' : 'downgrade'
        };
    }

    // Vérifier disque
    if (oldData.disk_total_gb !== newData.disk_total_gb) {
        changes.disk_total_gb = {
            old: oldData.disk_total_gb,
            new: newData.disk_total_gb,
            type: newData.disk_total_gb > oldData.disk_total_gb ? 'upgrade' : 'downgrade'
        };
    }

    // Vérifier CPU
    if (oldData.cpu_cores !== newData.cpu_cores || oldData.cpu_model !== newData.cpu_model) {
        changes.cpu = {
            old: { cores: oldData.cpu_cores, model: oldData.cpu_model },
            new: { cores: newData.cpu_cores, model: newData.cpu_model },
            type: 'change'
        };
    }

    // Vérifier OS version
    if (oldData.os_version !== newData.os_version) {
        changes.os_version = {
            old: oldData.os_version,
            new: newData.os_version,
            type: 'update'
        };
    }

    // Vérifier logiciels (si présents)
    if (oldData.installed_software && newData.installed_software) {
        const oldSoftware = new Set(oldData.installed_software.map(s => s.name));
        const newSoftware = new Set(newData.installed_software.map(s => s.name));
        
        const added = [...newSoftware].filter(s => !oldSoftware.has(s));
        const removed = [...oldSoftware].filter(s => !newSoftware.has(s));
        
        if (added.length > 0 || removed.length > 0) {
            changes.software = { added, removed };
        }
    }

    return changes;
}

// Générer alertes basées sur changements et seuils
async function generateAlerts(deviceId, organizationId, changes, currentData) {
    const alerts = [];

    try {
        // Alerte espace disque faible
        const diskUsagePercent = ((currentData.disk_total_gb - currentData.disk_free_gb) / currentData.disk_total_gb * 100);
        if (diskUsagePercent > 90) {
            await pool.query(
                `INSERT INTO mdm_alerts (organization_id, device_id, alert_type, severity, title, message)
                 VALUES ($1, $2, 'low_disk', 'critical', $3, $4)
                 ON CONFLICT DO NOTHING`,
                [
                    organizationId,
                    deviceId,
                    'Espace disque critique',
                    `Le disque est plein à ${diskUsagePercent.toFixed(1)}%. Libérez de l'espace rapidement.`
                ]
            );
            alerts.push('low_disk');
        }

        // Alerte changement matériel
        if (changes.ram_gb || changes.disk_total_gb || changes.cpu) {
            await pool.query(
                `INSERT INTO mdm_alerts (organization_id, device_id, alert_type, severity, title, message, details)
                 VALUES ($1, $2, 'hardware_change', 'warning', $3, $4, $5)`,
                [
                    organizationId,
                    deviceId,
                    'Changement matériel détecté',
                    'Des modifications matérielles ont été détectées sur ce device.',
                    JSON.stringify(changes)
                ]
            );
            alerts.push('hardware_change');
        }

        // Alerte logiciels installés/désinstallés
        if (changes.software) {
            const { added, removed } = changes.software;
            if (added.length > 0 || removed.length > 0) {
                await pool.query(
                    `INSERT INTO mdm_alerts (organization_id, device_id, alert_type, severity, title, message, details)
                     VALUES ($1, $2, 'software_change', 'info', $3, $4, $5)`,
                    [
                        organizationId,
                        deviceId,
                        'Logiciels modifiés',
                        `${added.length} installés, ${removed.length} désinstallés`,
                        JSON.stringify({ added, removed })
                    ]
                );
                alerts.push('software_change');
            }
        }

        // Alerte mise à jour OS
        if (changes.os_version) {
            await pool.query(
                `INSERT INTO mdm_alerts (organization_id, device_id, alert_type, severity, title, message)
                 VALUES ($1, $2, 'os_update', 'info', $3, $4)`,
                [
                    organizationId,
                    deviceId,
                    'Mise à jour système',
                    `OS mis à jour: ${changes.os_version.old} → ${changes.os_version.new}`
                ]
            );
            alerts.push('os_update');
        }

    } catch (error) {
        console.error('Erreur génération alertes:', error);
    }

    return alerts;
}

// Créer asset depuis device
async function createAssetFromDevice(deviceId, organizationId, inventoryData) {
    try {
        const result = await pool.query(
            `INSERT INTO assets (
                organization_id,
                name,
                type,
                manufacturer,
                model,
                serial_number,
                purchase_date,
                status,
                cpu_model,
                cpu_cores,
                ram_gb,
                disk_total_gb,
                os_type,
                os_version,
                location,
                notes
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'active', $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id`,
            [
                organizationId,
                inventoryData.hostname || 'Auto-imported device',
                inventoryData.device_type || 'computer',
                inventoryData.manufacturer,
                inventoryData.model,
                inventoryData.serial_number,
                inventoryData.cpu_model,
                inventoryData.cpu_cores,
                inventoryData.ram_gb,
                inventoryData.disk_total_gb,
                inventoryData.os_type,
                inventoryData.os_version,
                inventoryData.location || 'Unknown',
                'Créé automatiquement par MDM'
            ]
        );

        const assetId = result.rows[0].id;

        // Lier asset au device
        await pool.query(
            `UPDATE mdm_devices SET asset_id = $1 WHERE id = $2`,
            [assetId, deviceId]
        );

        console.log(`✅ Asset ${assetId} créé depuis device ${deviceId}`);
    } catch (error) {
        console.error('Erreur création asset:', error);
    }
}

// Mettre à jour asset depuis device
async function updateAssetFromDevice(assetId, inventoryData) {
    try {
        await pool.query(
            `UPDATE assets SET
                cpu_model = $1,
                cpu_cores = $2,
                ram_gb = $3,
                disk_total_gb = $4,
                os_version = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6`,
            [
                inventoryData.cpu_model,
                inventoryData.cpu_cores,
                inventoryData.ram_gb,
                inventoryData.disk_total_gb,
                inventoryData.os_version,
                assetId
            ]
        );
    } catch (error) {
        console.error('Erreur mise à jour asset:', error);
    }
}

module.exports = router;