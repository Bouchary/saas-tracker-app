// server/src/routes/import.routes.js
// Routes pour import CSV/Excel - ÉTAPE 2 : Upload fichier

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const upload = require('../config/upload.config');

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

    console.log(`🗑️ Fichier supprimé: ${filename} par user ${userId}`);

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