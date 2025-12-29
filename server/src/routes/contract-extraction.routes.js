// server/src/routes/contract-extraction.routes.js
// ✅ Extraction intelligente de contrats avec Claude API + OCR
// ✅ Compatible pdf-parse v1.1.1 (STABLE)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse'); // ✅ Import simple v1.1.1
const fs = require('fs');
const path = require('path');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

// ✅ Configuration upload temporaire
const upload = multer({
    dest: 'temp-uploads/',
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'));
        }
    }
});

// ==========================================
// ROUTE : EXTRACTION INTELLIGENTE
// ==========================================
// POST /api/contracts/extract
router.post('/extract', authMiddleware, organizationMiddleware, upload.single('file'), async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
        }

        console.log(`📄 Extraction contrat - User ${userId}, Org ${organizationId}, Fichier: ${req.file.originalname}`);

        // ✅ ÉTAPE 1 : Extraire le texte du PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer); // ✅ API simple v1.1.1
        const extractedText = pdfData.text;

        console.log(`📄 Texte extrait : ${extractedText.length} caractères`);

        if (extractedText.length < 50) {
            // Supprimer fichier temporaire
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                error: 'Le PDF semble vide ou illisible. Essayez avec un PDF contenant du texte.' 
            });
        }

        // ✅ ÉTAPE 2 : Analyser avec Claude API
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

        if (!ANTHROPIC_API_KEY) {
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Clé API Anthropic manquante' });
        }

        const prompt = `Analyse ce contrat et extrait les informations suivantes au format JSON.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown.

Informations à extraire :
- name : Nom du contrat ou du service
- provider : Nom du fournisseur / éditeur
- monthly_cost : Coût mensuel (nombre uniquement, sans devise)
- renewal_date : Date de renouvellement au format YYYY-MM-DD (si absent, null)
- notice_period_days : Période de préavis en jours (nombre, si absent : 30)
- license_count : Nombre de licences incluses (nombre, si absent : 1)
- pricing_model : "per_user" ou "flat_fee" ou "usage_based"
- description : Description courte du contrat
- key_clauses : Liste des clauses importantes (tableau de strings)

Si une information n'est pas présente dans le document, mets null.

Voici le texte du contrat :

${extractedText.substring(0, 15000)}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [
                    { 
                        role: 'user', 
                        content: prompt 
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erreur Claude API:', errorData);
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ 
                error: 'Erreur lors de l\'analyse IA',
                details: errorData.error?.message || 'Erreur inconnue'
            });
        }

        const claudeData = await response.json();
        const claudeResponse = claudeData.content[0].text;

        console.log('🤖 Réponse Claude:', claudeResponse);

        // ✅ ÉTAPE 3 : Parser la réponse JSON
        let extractedData;
        try {
            // Nettoyer la réponse (retirer markdown si présent)
            let cleanedResponse = claudeResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
            }

            extractedData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            console.error('Réponse brute:', claudeResponse);
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ 
                error: 'Erreur lors du traitement de la réponse IA',
                rawResponse: claudeResponse.substring(0, 500)
            });
        }

        // ✅ ÉTAPE 4 : Nettoyer les données
        const cleanedData = {
            name: extractedData.name || 'Contrat sans nom',
            provider: extractedData.provider || null,
            monthly_cost: extractedData.monthly_cost ? parseFloat(extractedData.monthly_cost) : null,
            renewal_date: extractedData.renewal_date || null,
            notice_period_days: extractedData.notice_period_days ? parseInt(extractedData.notice_period_days) : 30,
            license_count: extractedData.license_count ? parseInt(extractedData.license_count) : 1,
            pricing_model: extractedData.pricing_model || 'flat_fee',
            description: extractedData.description || null,
            key_clauses: Array.isArray(extractedData.key_clauses) ? extractedData.key_clauses : [],
            extracted_text_preview: extractedText.substring(0, 500)
        };

        // ✅ Supprimer fichier temporaire
        fs.unlinkSync(req.file.path);

        console.log('✅ Extraction réussie:', cleanedData.name);

        res.json({
            success: true,
            data: cleanedData,
            message: 'Extraction réussie'
        });

    } catch (error) {
        console.error('❌ Erreur extraction contrat:', error);

        // Nettoyer fichier temporaire
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur suppression fichier temp:', unlinkError);
            }
        }

        res.status(500).json({ 
            error: 'Erreur lors de l\'extraction du contrat',
            details: error.message
        });
    }
});

module.exports = router;