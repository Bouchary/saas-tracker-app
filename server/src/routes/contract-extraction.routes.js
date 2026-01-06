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
    const startTime = Date.now();

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

        const prompt = `Tu es un expert en analyse de documents juridiques et financiers. Analyse ce document et extrait TOUTES les informations pertinentes.

🎯 IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown (pas de \`\`\`json).

📋 STRUCTURE JSON ATTENDUE :

{
  "document_type": "contract" | "invoice" | "quote" | "purchase_order" | "amendment" | "other",
  "document_language": "fr" | "en" | "de" | "es" | "other",
  "confidence_score": 0-100,
  
  "basic_info": {
    "name": "Nom du contrat/service",
    "provider": "Nom du fournisseur",
    "client": "Nom du client (si présent)",
    "contract_number": "Numéro de contrat/référence",
    "description": "Description détaillée"
  },
  
  "financial": {
    "monthly_cost": nombre ou null,
    "yearly_cost": nombre ou null,
    "total_contract_value": nombre ou null,
    "currency": "EUR" | "USD" | "GBP" | etc,
    "pricing_model": "per_user" | "flat_fee" | "usage_based" | "tiered" | "other",
    "payment_terms": "Description des conditions de paiement",
    "price_table": [
      {
        "tier": "Nom du palier",
        "quantity": "Quantité/Range",
        "unit_price": nombre,
        "total_price": nombre
      }
    ]
  },
  
  "licenses": {
    "license_count": nombre ou null,
    "license_type": "Description du type de licence",
    "minimum_licenses": nombre ou null,
    "maximum_licenses": nombre ou null
  },
  
  "dates": {
    "signature_date": "YYYY-MM-DD" ou null,
    "start_date": "YYYY-MM-DD" ou null,
    "end_date": "YYYY-MM-DD" ou null,
    "renewal_date": "YYYY-MM-DD" ou null,
    "notice_deadline": "YYYY-MM-DD" ou null
  },
  
  "terms": {
    "contract_duration_months": nombre ou null,
    "notice_period_days": nombre ou null,
    "auto_renewal": true | false | null,
    "renewal_conditions": "Description des conditions de renouvellement"
  },
  
  "clauses": {
    "termination": ["Clauses de résiliation"],
    "sla": ["Clauses SLA / Garanties de service"],
    "confidentiality": ["Clauses de confidentialité"],
    "liability": ["Clauses de responsabilité"],
    "penalties": ["Clauses de pénalités"],
    "data_protection": ["Clauses RGPD / protection des données"],
    "other_important": ["Autres clauses importantes"]
  },
  
  "contacts": {
    "provider_contact": {
      "name": "Nom du contact fournisseur",
      "email": "email@fournisseur.com",
      "phone": "Téléphone"
    },
    "client_contact": {
      "name": "Nom du contact client",
      "email": "email@client.com",
      "phone": "Téléphone"
    }
  },
  
  "services": {
    "included_services": ["Liste des services inclus"],
    "optional_services": ["Services optionnels"],
    "excluded_services": ["Services exclus"]
  },
  
  "support": {
    "support_level": "Description du niveau de support",
    "support_hours": "Horaires du support",
    "response_time": "Temps de réponse garanti"
  },
  
  "special_conditions": [
    "Conditions particulières importantes"
  ],
  
  "extracted_numbers": {
    "invoice_numbers": ["Numéros de facture si présents"],
    "po_numbers": ["Numéros de bon de commande"],
    "quote_numbers": ["Numéros de devis"]
  }
}

🔍 INSTRUCTIONS SPÉCIFIQUES :

1. **DÉTECTION TYPE DE DOCUMENT** :
   - Contrat (contract) : Engagement long terme, clauses juridiques
   - Facture (invoice) : Montant à payer, numéro de facture, échéance
   - Devis (quote) : Proposition commerciale, validité limitée
   - Bon de commande (purchase_order) : Commande officielle
   - Avenant (amendment) : Modification de contrat existant

2. **TABLEAUX DE PRIX** :
   - Cherche TOUS les tableaux avec prix
   - Extrait paliers, quantités, prix unitaires
   - Identifie les remises et options

3. **CLAUSES IMPORTANTES** :
   - Résiliation : conditions, préavis, pénalités
   - SLA : disponibilité, temps de réponse, garanties
   - Confidentialité : durée, portée, exceptions
   - Responsabilité : limitations, exclusions, montants max
   - Pénalités : retards, non-conformité, montants
   - RGPD : traitement données, sous-traitance, transferts

4. **DATES** :
   - Cherche TOUTES les dates mentionnées
   - Formate en YYYY-MM-DD
   - Identifie signature, début, fin, renouvellement

5. **MULTI-LANGUE** :
   - Détecte la langue du document
   - Extrait même si multi-langue
   - Traduis les champs si nécessaire

6. **CONFIANCE** :
   - confidence_score : 0-100 selon clarté du document
   - 80-100 : Informations claires et complètes
   - 50-79 : Informations partielles ou ambiguës
   - 0-49 : Document difficile à analyser

⚠️ RÈGLES IMPORTANTES :
- Si une information n'existe pas : mets null
- Si un tableau est vide : mets []
- Tous les montants : nombres uniquement (pas de devise)
- Toutes les dates : format YYYY-MM-DD strict
- Sois précis et exhaustif

📄 DOCUMENT À ANALYSER :

${extractedText.substring(0, 20000)}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000, // ✅ Augmenté pour extraction détaillée
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

        // ✅ ÉTAPE 4 : Nettoyer et structurer les données
        const cleanedData = {
            // Métadonnées du document
            document_type: extractedData.document_type || 'contract',
            document_language: extractedData.document_language || 'fr',
            confidence_score: extractedData.confidence_score || 50,
            
            // Informations de base (compatibilité avec ancien format)
            name: extractedData.basic_info?.name || extractedData.name || 'Document sans nom',
            provider: extractedData.basic_info?.provider || extractedData.provider || null,
            client: extractedData.basic_info?.client || null,
            contract_number: extractedData.basic_info?.contract_number || null,
            description: extractedData.basic_info?.description || extractedData.description || null,
            
            // Informations financières (compatibilité avec ancien format)
            monthly_cost: extractedData.financial?.monthly_cost || extractedData.monthly_cost || null,
            yearly_cost: extractedData.financial?.yearly_cost || null,
            total_contract_value: extractedData.financial?.total_contract_value || null,
            currency: extractedData.financial?.currency || 'EUR',
            pricing_model: extractedData.financial?.pricing_model || extractedData.pricing_model || 'flat_fee',
            payment_terms: extractedData.financial?.payment_terms || null,
            price_table: extractedData.financial?.price_table || [],
            
            // Licences
            license_count: extractedData.licenses?.license_count || extractedData.license_count || 1,
            license_type: extractedData.licenses?.license_type || null,
            minimum_licenses: extractedData.licenses?.minimum_licenses || null,
            maximum_licenses: extractedData.licenses?.maximum_licenses || null,
            
            // Dates (compatibilité avec ancien format)
            signature_date: extractedData.dates?.signature_date || null,
            start_date: extractedData.dates?.start_date || null,
            end_date: extractedData.dates?.end_date || null,
            renewal_date: extractedData.dates?.renewal_date || extractedData.renewal_date || null,
            notice_deadline: extractedData.dates?.notice_deadline || null,
            
            // Termes du contrat
            contract_duration_months: extractedData.terms?.contract_duration_months || null,
            notice_period_days: extractedData.terms?.notice_period_days || extractedData.notice_period_days || 30,
            auto_renewal: extractedData.terms?.auto_renewal || null,
            renewal_conditions: extractedData.terms?.renewal_conditions || null,
            
            // Clauses (format amélioré)
            clauses: {
                termination: extractedData.clauses?.termination || [],
                sla: extractedData.clauses?.sla || [],
                confidentiality: extractedData.clauses?.confidentiality || [],
                liability: extractedData.clauses?.liability || [],
                penalties: extractedData.clauses?.penalties || [],
                data_protection: extractedData.clauses?.data_protection || [],
                other_important: extractedData.clauses?.other_important || extractedData.key_clauses || []
            },
            
            // Contacts
            contacts: extractedData.contacts || null,
            
            // Services
            services: extractedData.services || null,
            
            // Support
            support: extractedData.support || null,
            
            // Conditions spéciales
            special_conditions: extractedData.special_conditions || [],
            
            // Numéros extraits
            extracted_numbers: extractedData.extracted_numbers || null,
            
            // Preview du texte brut
            extracted_text_preview: extractedText.substring(0, 500)
        };

        // ✅ Supprimer fichier temporaire
        const tempFilePath = req.file.path;

        console.log('✅ Extraction réussie:', cleanedData.name);

        // ✅ ÉTAPE 5 : Sauvegarder dans contract_extractions + documents
        const pool = require('../db');
        let extractionId = null;
        let documentId = null;

        try {
            // Créer dossier uploads si n'existe pas
            const uploadsDir = path.join(__dirname, '../../uploads/extractions');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Déplacer le PDF vers uploads (au lieu de le supprimer)
            const timestamp = Date.now();
            const safeFilename = req.file.originalname.replace(/[^a-z0-9.-]/gi, '_');
            const newFilename = `${timestamp}_${safeFilename}`;
            const permanentPath = path.join(uploadsDir, newFilename);
            fs.renameSync(tempFilePath, permanentPath);
            
            const relativeFilePath = `uploads/extractions/${newFilename}`;

            // Sauvegarder dans documents
            const documentQuery = `
                INSERT INTO documents (
                    uploaded_by,
                    organization_id,
                    filename,
                    original_filename,
                    document_type,
                    file_path,
                    mime_type,
                    file_size
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;

            const documentResult = await pool.query(documentQuery, [
                userId,
                organizationId,
                newFilename,  // Nom du fichier nettoyé avec timestamp
                req.file.originalname,
                'contract_pdf_extracted',
                relativeFilePath,
                'application/pdf',
                req.file.size
            ]);

            documentId = documentResult.rows[0].id;
            console.log(`📄 Document ${documentId} sauvegardé`);

            // Calculer le coût approximatif (Claude Sonnet 4: $3/MTok input, $15/MTok output)
            const inputTokens = Math.ceil(extractedText.length / 4); // ~4 chars par token
            const outputTokens = 1000; // Estimation conservatrice
            const costCents = Math.ceil((inputTokens * 3 / 1000000 + outputTokens * 15 / 1000000) * 100);
            const processingTime = Date.now() - startTime;

            // Sauvegarder l'extraction
            const extractionQuery = `
                INSERT INTO contract_extractions (
                    user_id,
                    organization_id,
                    document_id,
                    original_filename,
                    file_size,
                    file_path,
                    document_type,
                    document_language,
                    confidence_score,
                    extracted_data,
                    status,
                    processing_time_ms,
                    api_tokens_used,
                    api_cost_cents
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            `;

            const extractionResult = await pool.query(extractionQuery, [
                userId,
                organizationId,
                documentId,
                req.file.originalname,
                req.file.size,
                relativeFilePath,
                cleanedData.document_type || 'other',
                cleanedData.document_language || 'fr',
                cleanedData.confidence_score || null,
                JSON.stringify(cleanedData),
                'success',
                processingTime,
                inputTokens + outputTokens,
                costCents
            ]);

            extractionId = extractionResult.rows[0].id;
            console.log(`💾 Extraction ${extractionId} sauvegardée (${costCents}c, ${processingTime}ms)`);

        } catch (saveError) {
            console.error('⚠️  Erreur sauvegarde extraction (non bloquant):', saveError);
            // On ne bloque pas la réponse si la sauvegarde échoue
            // L'extraction a réussi, on renvoie quand même les données
            
            // Supprimer le fichier temp si toujours présent
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }

        res.json({
            success: true,
            data: cleanedData,
            message: 'Extraction réussie',
            extraction_id: extractionId,
            document_id: documentId
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

        // Sauvegarder l'échec dans contract_extractions si possible
        try {
            const pool = require('../db');
            const processingTime = Date.now() - startTime;

            await pool.query(`
                INSERT INTO contract_extractions (
                    user_id,
                    organization_id,
                    original_filename,
                    file_size,
                    extracted_data,
                    status,
                    error_message,
                    processing_time_ms
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                userId,
                organizationId,
                req.file?.originalname || 'unknown',
                req.file?.size || 0,
                JSON.stringify({}),
                'failed',
                error.message,
                processingTime
            ]);

            console.log('💾 Échec d\'extraction sauvegardé');
        } catch (saveError) {
            // Ignore les erreurs de sauvegarde d'échec
        }

        res.status(500).json({ 
            error: 'Erreur lors de l\'extraction du contrat',
            details: error.message
        });
    }
});

module.exports = router;