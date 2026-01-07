// server/src/routes/contract-extractions-history.routes.js
// Routes pour historique des extractions IA de contrats
// ✅ CORRIGÉ: Ajout routes / et /stats/summary pour compatibilité frontend

const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

// ============================================================================
// ROUTE 1 : GET /api/contract-extractions/history
// Liste toutes les extractions avec pagination et filtres
// ============================================================================
router.get('/history', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { 
            page = 1, 
            limit = 20, 
            status, 
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Construction WHERE clause
        let whereConditions = ['ce.organization_id = $1'];
        let params = [organizationId];
        let paramIndex = 2;

        if (status) {
            whereConditions.push(`ce.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(ce.original_filename ILIKE $${paramIndex} OR d.filename ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Colonnes autorisées pour tri
        const allowedSortColumns = ['created_at', 'confidence_score', 'file_size', 'processing_time_ms'];
        const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Compter total
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM contract_extractions ce
             LEFT JOIN documents d ON ce.document_id = d.id
             WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Récupérer extractions
        const result = await pool.query(
            `SELECT 
                ce.id,
                ce.document_id,
                ce.original_filename,
                ce.file_size,
                ce.file_path,
                ce.document_type,
                ce.document_language,
                ce.confidence_score,
                ce.extracted_data,
                ce.status,
                ce.processing_time_ms,
                ce.api_tokens_used,
                ce.api_cost_cents,
                ce.error_message,
                ce.created_at,
                ce.updated_at,
                d.filename as document_filename,
                u.email as extracted_by_username
            FROM contract_extractions ce
            LEFT JOIN documents d ON ce.document_id = d.id
            LEFT JOIN users u ON ce.user_id = u.id
            WHERE ${whereClause}
            ORDER BY ce.${sortColumn} ${sortDir}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            extractions: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Erreur récupération historique extractions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'historique',
            details: error.message
        });
    }
});

// ============================================================================
// 🔥 ROUTE AJOUTÉE : GET /api/contract-extractions (racine)
// Alias pour /history - compatibilité frontend
// ============================================================================
router.get('/', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const { 
            page = 1, 
            limit = 20, 
            status, 
            search,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Construction WHERE clause
        let whereConditions = ['ce.organization_id = $1'];
        let params = [organizationId];
        let paramIndex = 2;

        if (status) {
            whereConditions.push(`ce.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(ce.original_filename ILIKE $${paramIndex} OR d.filename ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Colonnes autorisées pour tri
        const allowedSortColumns = ['created_at', 'confidence_score', 'file_size', 'processing_time_ms'];
        const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Compter total
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM contract_extractions ce
             LEFT JOIN documents d ON ce.document_id = d.id
             WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Récupérer extractions
        const result = await pool.query(
            `SELECT 
                ce.id,
                ce.document_id,
                ce.original_filename,
                ce.file_size,
                ce.file_path,
                ce.document_type,
                ce.document_language,
                ce.confidence_score,
                ce.extracted_data,
                ce.status,
                ce.processing_time_ms,
                ce.api_tokens_used,
                ce.api_cost_cents,
                ce.error_message,
                ce.created_at,
                ce.updated_at,
                d.filename as document_filename,
                u.email as extracted_by_username
            FROM contract_extractions ce
            LEFT JOIN documents d ON ce.document_id = d.id
            LEFT JOIN users u ON ce.user_id = u.id
            WHERE ${whereClause}
            ORDER BY ce.${sortColumn} ${sortDir}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            extractions: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Erreur récupération historique extractions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'historique',
            details: error.message
        });
    }
});

// ============================================================================
// 🔥 ROUTE AJOUTÉE : GET /api/contract-extractions/stats/summary
// Alias pour /stats - compatibilité frontend
// ============================================================================
router.get('/stats/summary', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const stats = await pool.query(
            `SELECT 
                COUNT(*) as total_extractions,
                COUNT(*) FILTER (WHERE status = 'completed') as successful_extractions,
                COUNT(*) FILTER (WHERE status = 'error') as failed_extractions,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as extractions_last_7days,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as extractions_last_30days,
                AVG(confidence_score)::NUMERIC(10,2) as avg_confidence_score,
                AVG(processing_time_ms)::NUMERIC(10,2) as avg_processing_time_ms,
                SUM(api_tokens_used)::INTEGER as total_tokens_used,
                SUM(api_cost_cents)::NUMERIC(10,2) as total_cost_cents,
                SUM(file_size)::BIGINT as total_files_size_bytes
            FROM contract_extractions
            WHERE organization_id = $1`,
            [organizationId]
        );

        // Répartition par type de document
        const byType = await pool.query(
            `SELECT 
                document_type,
                COUNT(*) as count
            FROM contract_extractions
            WHERE organization_id = $1
            GROUP BY document_type
            ORDER BY count DESC`,
            [organizationId]
        );

        // Répartition par langue
        const byLanguage = await pool.query(
            `SELECT 
                document_language,
                COUNT(*) as count
            FROM contract_extractions
            WHERE organization_id = $1
            GROUP BY document_language
            ORDER BY count DESC`,
            [organizationId]
        );

        res.json({
            success: true,
            stats: {
                ...stats.rows[0],
                by_type: byType.rows,
                by_language: byLanguage.rows
            }
        });

    } catch (error) {
        console.error('❌ Erreur récupération stats extractions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 2 : GET /api/contract-extractions/stats
// Statistiques globales extractions
// ============================================================================
router.get('/stats', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const stats = await pool.query(
            `SELECT 
                COUNT(*) as total_extractions,
                COUNT(*) FILTER (WHERE status = 'completed') as successful_extractions,
                COUNT(*) FILTER (WHERE status = 'error') as failed_extractions,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as extractions_last_7days,
                COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as extractions_last_30days,
                AVG(confidence_score)::NUMERIC(10,2) as avg_confidence_score,
                AVG(processing_time_ms)::NUMERIC(10,2) as avg_processing_time_ms,
                SUM(api_tokens_used)::INTEGER as total_tokens_used,
                SUM(api_cost_cents)::NUMERIC(10,2) as total_cost_cents,
                SUM(file_size)::BIGINT as total_files_size_bytes
            FROM contract_extractions
            WHERE organization_id = $1`,
            [organizationId]
        );

        // Répartition par type de document
        const byType = await pool.query(
            `SELECT 
                document_type,
                COUNT(*) as count
            FROM contract_extractions
            WHERE organization_id = $1
            GROUP BY document_type
            ORDER BY count DESC`,
            [organizationId]
        );

        // Répartition par langue
        const byLanguage = await pool.query(
            `SELECT 
                document_language,
                COUNT(*) as count
            FROM contract_extractions
            WHERE organization_id = $1
            GROUP BY document_language
            ORDER BY count DESC`,
            [organizationId]
        );

        res.json({
            success: true,
            stats: {
                ...stats.rows[0],
                by_type: byType.rows,
                by_language: byLanguage.rows
            }
        });

    } catch (error) {
        console.error('❌ Erreur récupération stats extractions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 3 : GET /api/contract-extractions/:id
// Détails d'une extraction
// ============================================================================
router.get('/:id', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const extractionId = req.params.id;
        const organizationId = req.organizationId;

        const result = await pool.query(
            `SELECT 
                ce.*,
                d.filename as document_filename,
                u.email as extracted_by_username
            FROM contract_extractions ce
            LEFT JOIN documents d ON ce.document_id = d.id
            LEFT JOIN users u ON ce.user_id = u.id
            WHERE ce.id = $1 AND ce.organization_id = $2`,
            [extractionId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Extraction non trouvée' });
        }

        res.json({
            success: true,
            extraction: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur récupération détails extraction:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des détails',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 4 : GET /api/contract-extractions/:id/download
// Télécharger PDF original
// ============================================================================
router.get('/:id/download', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const extractionId = req.params.id;
        const organizationId = req.organizationId;

        // Récupérer infos extraction
        const result = await pool.query(
            `SELECT file_path, original_filename 
             FROM contract_extractions 
             WHERE id = $1 AND organization_id = $2`,
            [extractionId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Extraction non trouvée' });
        }

        const { file_path, original_filename } = result.rows[0];

        // Vérifier fichier existe
        if (!fs.existsSync(file_path)) {
            return res.status(404).json({ error: 'Fichier PDF non trouvé sur le serveur' });
        }

        // Envoyer fichier
        res.download(file_path, original_filename, (err) => {
            if (err) {
                console.error('Erreur téléchargement:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erreur lors du téléchargement' });
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur téléchargement PDF:', error);
        res.status(500).json({
            error: 'Erreur lors du téléchargement',
            details: error.message
        });
    }
});

// ============================================================================
// ROUTE 5 : DELETE /api/contract-extractions/:id
// Supprimer une extraction
// ============================================================================
router.delete('/:id', authMiddleware, organizationMiddleware, async (req, res) => {
    try {
        const extractionId = req.params.id;
        const organizationId = req.organizationId;

        // Récupérer file_path avant suppression
        const result = await pool.query(
            `SELECT file_path FROM contract_extractions 
             WHERE id = $1 AND organization_id = $2`,
            [extractionId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Extraction non trouvée' });
        }

        const filePath = result.rows[0].file_path;

        // Supprimer de la base
        await pool.query(
            `DELETE FROM contract_extractions 
             WHERE id = $1 AND organization_id = $2`,
            [extractionId, organizationId]
        );

        // Supprimer fichier physique (optionnel)
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Fichier supprimé: ${filePath}`);
            }
        } catch (fileError) {
            console.warn('⚠️  Impossible de supprimer le fichier:', fileError);
            // Ne pas bloquer la réponse si fichier non supprimé
        }

        res.json({
            success: true,
            message: 'Extraction supprimée'
        });

    } catch (error) {
        console.error('❌ Erreur suppression extraction:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression',
            details: error.message
        });
    }
});

module.exports = router;