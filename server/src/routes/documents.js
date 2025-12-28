// server/src/routes/documents.js
// Routes pour l'upload, download et gestion des documents
// ✅ CORRECTION : Routes préfixées /contracts pour montage sous /api
// ✅ Multi-tenant sécurisé avec organization_id

const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

// ✅ CORRECTION : Import direct authMiddleware
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ AJOUT : organizationMiddleware
const organizationMiddleware = require('../middlewares/organizationMiddleware');

// ==========================================
// ROUTE : UPLOAD DE FICHIER
// ==========================================
// POST /api/contracts/:contractId/documents
router.post('/contracts/:contractId/documents', authMiddleware, organizationMiddleware, upload.single('file'), async (req, res) => {
    const { contractId } = req.params;
    const { documentType } = req.body; // 'contract', 'invoice', 'other'
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        // Vérifier que le fichier a été uploadé
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que le contrat appartient bien à l'organization
        const contractCheck = await db.query(
            'SELECT id FROM contracts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [contractId, organizationId]
        );

        if (contractCheck.rows.length === 0) {
            // Supprimer le fichier uploadé
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Contrat non trouvé ou non autorisé' });
        }

        // Insérer dans la base de données
        const insertQuery = `
            INSERT INTO documents (
                contract_id, 
                filename, 
                original_filename, 
                file_path, 
                file_size, 
                mime_type, 
                document_type, 
                uploaded_by,
                organization_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            contractId,
            req.file.filename,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            documentType || 'other',
            userId,
            organizationId
        ];

        const result = await db.query(insertQuery, values);
        const document = result.rows[0];

        console.log(`✅ Fichier uploadé : ${req.file.originalname} pour contrat ${contractId}`);

        res.status(201).json({
            message: 'Fichier uploadé avec succès',
            document: {
                id: document.id,
                originalFilename: document.original_filename,
                fileSize: document.file_size,
                mimeType: document.mime_type,
                documentType: document.document_type,
                uploadedAt: document.uploaded_at
            }
        });

    } catch (error) {
        console.error('❌ Erreur upload fichier:', error);
        
        // Supprimer le fichier en cas d'erreur
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur suppression fichier:', unlinkError);
            }
        }

        res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
    }
});

// ==========================================
// ROUTE : LISTE DES DOCUMENTS D'UN CONTRAT
// ==========================================
// GET /api/contracts/:contractId/documents
router.get('/contracts/:contractId/documents', authMiddleware, organizationMiddleware, async (req, res) => {
    const { contractId } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        // Vérifier que le contrat appartient à l'organization
        const contractCheck = await db.query(
            'SELECT id FROM contracts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [contractId, organizationId]
        );

        if (contractCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé' });
        }

        // Récupérer les documents
        const documentsQuery = `
            SELECT 
                id,
                original_filename,
                file_size,
                mime_type,
                document_type,
                uploaded_at
            FROM documents
            WHERE contract_id = $1
            ORDER BY uploaded_at DESC
        `;

        const result = await db.query(documentsQuery, [contractId]);

        res.json({
            contractId: parseInt(contractId),
            documents: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('❌ Erreur récupération documents:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
    }
});

// ==========================================
// ROUTE : DOWNLOAD D'UN DOCUMENT
// ==========================================
// GET /api/documents/:documentId/download
router.get('/documents/:documentId/download', authMiddleware, organizationMiddleware, async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        // Récupérer le document et vérifier les permissions
        const query = `
            SELECT d.*, c.organization_id
            FROM documents d
            JOIN contracts c ON d.contract_id = c.id
            WHERE d.id = $1
        `;

        const result = await db.query(query, [documentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document non trouvé' });
        }

        const document = result.rows[0];

        // Vérifier que l'utilisateur a accès au contrat
        if (document.organization_id !== organizationId) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Vérifier que le fichier existe
        if (!fs.existsSync(document.file_path)) {
            return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
        }

        // Télécharger le fichier
        res.download(document.file_path, document.original_filename, (err) => {
            if (err) {
                console.error('❌ Erreur download:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erreur lors du téléchargement' });
                }
            } else {
                console.log(`✅ Fichier téléchargé : ${document.original_filename}`);
            }
        });

    } catch (error) {
        console.error('❌ Erreur download document:', error);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
});

// ==========================================
// ROUTE : SUPPRESSION D'UN DOCUMENT
// ==========================================
// DELETE /api/documents/:documentId
router.delete('/documents/:documentId', authMiddleware, organizationMiddleware, async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        // Récupérer le document et vérifier les permissions
        const query = `
            SELECT d.*, c.organization_id
            FROM documents d
            JOIN contracts c ON d.contract_id = c.id
            WHERE d.id = $1
        `;

        const result = await db.query(query, [documentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document non trouvé' });
        }

        const document = result.rows[0];

        // Vérifier que l'utilisateur a accès
        if (document.organization_id !== organizationId) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Supprimer le fichier du système
        if (fs.existsSync(document.file_path)) {
            fs.unlinkSync(document.file_path);
            console.log(`🗑️ Fichier supprimé : ${document.file_path}`);
        }

        // Supprimer de la base de données
        await db.query('DELETE FROM documents WHERE id = $1', [documentId]);

        console.log(`✅ Document supprimé : ${document.original_filename}`);

        res.json({ 
            message: 'Document supprimé avec succès',
            deletedDocument: {
                id: document.id,
                filename: document.original_filename
            }
        });

    } catch (error) {
        console.error('❌ Erreur suppression document:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// ==========================================
// ROUTE : STATISTIQUES DES DOCUMENTS
// ==========================================
// GET /api/contracts/:contractId/documents/stats
router.get('/contracts/:contractId/documents/stats', authMiddleware, organizationMiddleware, async (req, res) => {
    const { contractId } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        // Vérifier le contrat
        const contractCheck = await db.query(
            'SELECT id FROM contracts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [contractId, organizationId]
        );

        if (contractCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé' });
        }

        // Récupérer les stats
        const statsQuery = `
            SELECT 
                COUNT(*) as total_documents,
                SUM(file_size) as total_size,
                COUNT(CASE WHEN document_type = 'contract' THEN 1 END) as contracts_count,
                COUNT(CASE WHEN document_type = 'invoice' THEN 1 END) as invoices_count,
                COUNT(CASE WHEN document_type = 'other' THEN 1 END) as others_count
            FROM documents
            WHERE contract_id = $1
        `;

        const result = await db.query(statsQuery, [contractId]);
        const stats = result.rows[0];

        res.json({
            contractId: parseInt(contractId),
            totalDocuments: parseInt(stats.total_documents),
            totalSize: parseInt(stats.total_size || 0),
            totalSizeMB: (parseInt(stats.total_size || 0) / (1024 * 1024)).toFixed(2),
            breakdown: {
                contracts: parseInt(stats.contracts_count),
                invoices: parseInt(stats.invoices_count),
                others: parseInt(stats.others_count)
            }
        });

    } catch (error) {
        console.error('❌ Erreur stats documents:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

module.exports = router;