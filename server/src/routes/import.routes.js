// server/src/routes/import.routes.js
// Routes pour import CSV/Excel - ÉTAPE 6 : Import en BDD

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const upload = require('../config/upload.config');

// Services
const csvParser = require('../services/csvParser');
const importService = require('../services/importService');

// ✅ Protection : toutes les routes nécessitent authentification
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * POST /api/import/upload
 * Upload un fichier CSV ou Excel
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;

    // Vérifier que le fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier fourni' 
      });
    }

    const file = req.file;

    console.log(`✅ Fichier uploadé: ${file.filename} (${file.size} bytes) par user ${userId} (org ${organizationId})`);

    // Retourner les infos du fichier
    res.status(200).json({
      message: 'Fichier uploadé avec succès',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);

    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur suppression fichier:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'upload du fichier' 
    });
  }
});

/**
 * GET /api/import/preview/:filename
 * Analyser et prévisualiser un fichier CSV
 */
router.get('/preview/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;
    const { entity_type } = req.query;

    // Vérifier que le fichier appartient à l'utilisateur (sécurité)
    if (!filename.includes(`-${userId}-`)) {
      return res.status(403).json({ 
        error: 'Accès refusé à ce fichier' 
      });
    }

    const filePath = path.join('uploads', filename);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }

    // Détecter le type de fichier
    const ext = path.extname(filename).toLowerCase();

    let parseResult;

    if (ext === '.csv') {
      // Parser CSV
      parseResult = await csvParser.parseCSV(filePath);

      // Suggérer le mapping si entity_type fourni
      if (entity_type && parseResult.stats.columns.length > 0) {
        const suggestedMapping = csvParser.suggestColumnMapping(
          parseResult.stats.columns, 
          entity_type
        );
        parseResult.suggestedMapping = suggestedMapping;
      }

      console.log(`📊 CSV parsé: ${filename} - ${parseResult.stats.totalRows} lignes, ${parseResult.stats.totalColumns} colonnes`);

      res.status(200).json({
        success: true,
        filename: filename,
        entityType: entity_type,
        ...parseResult
      });

    } else if (ext === '.xlsx' || ext === '.xls') {
      // TODO: Parser Excel (ÉTAPE 4)
      res.status(501).json({ 
        error: 'Parsing Excel pas encore implémenté. Utilisez CSV pour le moment.' 
      });

    } else {
      res.status(400).json({ 
        error: 'Format de fichier non supporté' 
      });
    }

  } catch (error) {
    console.error('❌ Erreur preview:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'analyse du fichier' 
    });
  }
});

/**
 * POST /api/import/contracts
 * Importer les contrats depuis un fichier CSV en base de données
 */
router.post('/contracts', async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    const { filename, mapping } = req.body;

    console.log('📥 Début import contracts:', { filename, userId, organizationId });

    // Validation
    if (!filename) {
      return res.status(400).json({ error: 'Filename requis' });
    }

    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({ error: 'Mapping requis' });
    }

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filename.includes(`-${userId}-`)) {
      return res.status(403).json({ 
        error: 'Accès refusé à ce fichier' 
      });
    }

    const filePath = path.join('uploads', filename);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }

    // Parser le CSV
    const parseResult = await csvParser.parseCSV(filePath);

    if (!parseResult.success || parseResult.data.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à importer' 
      });
    }

    console.log(`📊 ${parseResult.data.length} lignes à importer`);

    // Importer les contrats
    const importResult = await importService.importContracts(
      parseResult.data,
      mapping,
      organizationId,
      userId
    );

    console.log(`✅ Import terminé: ${importResult.success} succès, ${importResult.failed} échecs`);

    // Supprimer le fichier après import (optionnel)
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  Fichier supprimé après import: ${filename}`);
    } catch (unlinkError) {
      console.warn('⚠️  Impossible de supprimer le fichier:', unlinkError.message);
    }

    res.status(200).json({
      success: true,
      message: `Import terminé: ${importResult.success}/${importResult.total} contrats importés`,
      results: importResult
    });

  } catch (error) {
    console.error('❌ Erreur import contracts:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'import' 
    });
  }
});

/**
 * DELETE /api/import/cleanup/:filename
 * Supprimer un fichier uploadé (nettoyage)
 */
router.delete('/cleanup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;

    // Vérifier que le fichier appartient à l'utilisateur (sécurité)
    if (!filename.includes(`-${userId}-`)) {
      return res.status(403).json({ 
        error: 'Accès refusé à ce fichier' 
      });
    }

    const filePath = path.join('uploads', filename);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }

    // Supprimer le fichier
    await fs.unlink(filePath);

    console.log(`🗑️  Fichier supprimé: ${filename} par user ${userId}`);

    res.status(200).json({ 
      message: 'Fichier supprimé avec succès' 
    });

  } catch (error) {
    console.error('❌ Erreur suppression fichier:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du fichier' 
    });
  }
});

module.exports = router;