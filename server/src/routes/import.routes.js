// server/src/routes/import.routes.js
// Routes pour import CSV/Excel - ÉTAPE 3 : Preview et analyse
// VERSION AVEC LOGS DEBUG

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
    const { entity_type } = req.query; // contracts, assets, employees

    // 🔍 LOGS DEBUG - DIAGNOSTIC COMPLET
    console.log('');
    console.log('🔍 ========== DEBUG PREVIEW ==========');
    console.log('Filename reçu:', filename);
    console.log('req.user COMPLET:', JSON.stringify(req.user, null, 2));
    console.log('userId extrait:', userId);
    console.log('Type de userId:', typeof userId);
    console.log('organizationId:', organizationId);
    console.log('String recherché:', `-${userId}-`);
    console.log('Filename includes -userId-?', filename.includes(`-${userId}-`));
    
    // Test manuel de matching
    const expectedPattern = `-${userId}-`;
    const filenameContainsPattern = filename.indexOf(expectedPattern) !== -1;
    console.log('Test indexOf:', filenameContainsPattern);
    console.log('Position de -userId- dans filename:', filename.indexOf(expectedPattern));
    console.log('=====================================');
    console.log('');

    // Vérifier que le fichier appartient à l'utilisateur (sécurité)
    if (!filename.includes(`-${userId}-`)) {
      console.log('❌ ACCÈS REFUSÉ - Le userId ne correspond pas dans le filename');
      console.log('   Filename:', filename);
      console.log('   Pattern cherché:', `-${userId}-`);
      return res.status(403).json({ 
        error: 'Accès refusé à ce fichier' 
      });
    }

    console.log('✅ Vérification userId: PASSÉE');

    const filePath = path.join('uploads', filename);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
      console.log('✅ Fichier existe:', filePath);
    } catch {
      console.log('❌ Fichier non trouvé:', filePath);
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }

    // Détecter le type de fichier
    const ext = path.extname(filename).toLowerCase();
    console.log('Extension détectée:', ext);

    let parseResult;

    if (ext === '.csv') {
      console.log('📄 Parsing CSV en cours...');
      
      // Parser CSV
      parseResult = await csvParser.parseCSV(filePath);

      // Suggérer le mapping si entity_type fourni
      if (entity_type && parseResult.stats.columns.length > 0) {
        const suggestedMapping = csvParser.suggestColumnMapping(
          parseResult.stats.columns, 
          entity_type
        );
        parseResult.suggestedMapping = suggestedMapping;
        console.log('💡 Mapping suggéré:', JSON.stringify(suggestedMapping, null, 2));
      }

      console.log(`📊 CSV parsé: ${filename} - ${parseResult.stats.totalRows} lignes, ${parseResult.stats.totalColumns} colonnes`);

      res.status(200).json({
        success: true,
        filename: filename,
        entityType: entity_type,
        ...parseResult
      });

    } else if (ext === '.xlsx' || ext === '.xls') {
      console.log('📊 Fichier Excel détecté - pas encore supporté');
      // TODO: Parser Excel (ÉTAPE 4)
      res.status(501).json({ 
        error: 'Parsing Excel pas encore implémenté. Utilisez CSV pour le moment.' 
      });

    } else {
      console.log('❌ Format de fichier non supporté:', ext);
      res.status(400).json({ 
        error: 'Format de fichier non supporté' 
      });
    }

  } catch (error) {
    console.log('');
    console.log('❌ ========== ERREUR PREVIEW ==========');
    console.error('Erreur complète:', error);
    console.log('Stack trace:', error.stack);
    console.log('======================================');
    console.log('');
    
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'analyse du fichier' 
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

    console.log('🗑️  Tentative de suppression:', filename, 'par user', userId);

    // Vérifier que le fichier appartient à l'utilisateur (sécurité)
    if (!filename.includes(`-${userId}-`)) {
      console.log('❌ Suppression refusée - userId ne correspond pas');
      return res.status(403).json({ 
        error: 'Accès refusé à ce fichier' 
      });
    }

    const filePath = path.join('uploads', filename);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      console.log('❌ Fichier non trouvé pour suppression:', filePath);
      return res.status(404).json({ 
        error: 'Fichier non trouvé' 
      });
    }

    // Supprimer le fichier
    await fs.unlink(filePath);

    console.log(`✅ Fichier supprimé: ${filename} par user ${userId}`);

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