// server/src/routes/purchase-approval-rules.routes.js - ✅ CORRIGÉ PÉRENNE
// ============================================================================
// ROUTES GESTION RÈGLES D'APPROBATION (ADMIN + OWNER)
// ============================================================================

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware.js');
const organizationMiddleware = require('../middlewares/organizationMiddleware.js');
const db = require('../db');
const { sanitizeString } = require('../middlewares/validation');

const LOG_PREFIX = 'ApprovalRules:';

// ✅ FIX : Middleware inline qui autorise OWNER + ADMIN + SUPERADMIN
const requireAdmin = (req, res, next) => {
    // ✅ CHANGEMENT ICI : Ajout de 'owner' dans la liste
    if (!['owner', 'admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ 
            error: 'Accès réservé aux administrateurs',
            user_role: req.user.role  // ✅ Ajout pour debug
        });
    }
    next();
};

// Appliquer middlewares
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(requireAdmin);

// ============================================================================
// 1. LISTE RÈGLES
// ============================================================================
router.get('/', async (req, res) => {
    const organizationId = req.organizationId;
    
    try {
        const query = `
            SELECT 
                par.*,
                u1.email as approver_1_email,
                u2.email as approver_2_email,
                u3.email as approver_3_email
            FROM purchase_approval_rules par
            LEFT JOIN users u1 ON par.approver_1_id = u1.id
            LEFT JOIN users u2 ON par.approver_2_id = u2.id
            LEFT JOIN users u3 ON par.approver_3_id = u3.id
            WHERE par.organization_id = $1
            ORDER BY par.priority DESC, par.min_amount ASC
        `;
        
        const result = await db.query(query, [organizationId]);
        
        console.log(`${LOG_PREFIX} Récupération ${result.rowCount} règles pour org ${organizationId}`);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getRules:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 2. DÉTAILS RÈGLE
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    
    try {
        const query = `
            SELECT 
                par.*,
                u1.email as approver_1_email,
                u2.email as approver_2_email,
                u3.email as approver_3_email
            FROM purchase_approval_rules par
            LEFT JOIN users u1 ON par.approver_1_id = u1.id
            LEFT JOIN users u2 ON par.approver_2_id = u2.id
            LEFT JOIN users u3 ON par.approver_3_id = u3.id
            WHERE par.id = $1 AND par.organization_id = $2
        `;
        
        const result = await db.query(query, [id, organizationId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Règle non trouvée' });
        }
        
        res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getRule:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 3. CRÉER RÈGLE
// ============================================================================
router.post('/', async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    const {
        name,
        description,
        min_amount,
        max_amount,
        approver_1_id,
        approver_2_id,
        approver_3_id,
        priority = 1,
        is_active = true,
        applicable_categories
    } = req.body;
    
    if (!name || min_amount === undefined || !approver_1_id) {
        return res.status(400).json({ 
            error: 'Champs requis : name, min_amount, approver_1_id' 
        });
    }
    
    if (parseFloat(min_amount) < 0) {
        return res.status(400).json({ error: 'min_amount doit être >= 0' });
    }
    
    if (max_amount !== null && parseFloat(max_amount) < parseFloat(min_amount)) {
        return res.status(400).json({ error: 'max_amount doit être >= min_amount' });
    }
    
    // Vérifier que valideurs existent
    const approvers = [approver_1_id, approver_2_id, approver_3_id].filter(Boolean);
    
    for (const approverId of approvers) {
        const userCheck = await db.query(
            'SELECT id FROM users WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [approverId, organizationId]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ 
                error: `Valideur ${approverId} non trouvé dans votre organisation` 
            });
        }
    }
    
    try {
        const query = `
            INSERT INTO purchase_approval_rules (
                organization_id, name, description,
                min_amount, max_amount,
                approver_1_id, approver_2_id, approver_3_id,
                priority, is_active,
                applicable_categories,
                created_by, updated_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        
        const values = [
            organizationId,
            sanitizeString(name),
            description ? sanitizeString(description) : null,
            min_amount,
            max_amount || null,
            approver_1_id,
            approver_2_id || null,
            approver_3_id || null,
            priority,
            is_active,
            applicable_categories || null,
            userId,
            userId
        ];
        
        const result = await db.query(query, values);
        
        console.log(`${LOG_PREFIX} Règle ${result.rows[0].id} créée par user ${userId}`);
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur createRule:`, error);
        
        if (error.code === '23505') {
            return res.status(400).json({ 
                error: 'Une règle avec ce nom existe déjà' 
            });
        }
        
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 4. MODIFIER RÈGLE
// ============================================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const checkResult = await db.query(
            'SELECT * FROM purchase_approval_rules WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Règle non trouvée' });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        const allowedFields = [
            'name', 'description',
            'min_amount', 'max_amount',
            'approver_1_id', 'approver_2_id', 'approver_3_id',
            'priority', 'is_active',
            'applicable_categories'
        ];
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                
                if (['name', 'description'].includes(field)) {
                    values.push(req.body[field] ? sanitizeString(req.body[field]) : null);
                } else {
                    values.push(req.body[field]);
                }
                
                paramIndex++;
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }
        
        updates.push(`updated_by = $${paramIndex}`);
        values.push(userId);
        paramIndex++;
        
        values.push(id, organizationId);
        
        const query = `
            UPDATE purchase_approval_rules
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
            RETURNING *
        `;
        
        const result = await db.query(query, values);
        
        console.log(`${LOG_PREFIX} Règle ${id} modifiée par user ${userId}`);
        
        res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur updateRule:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 5. SUPPRIMER RÈGLE
// ============================================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const checkResult = await db.query(
            'SELECT * FROM purchase_approval_rules WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Règle non trouvée' });
        }
        
        await db.query(
            'UPDATE purchase_approval_rules SET is_active = FALSE, updated_by = $1 WHERE id = $2',
            [userId, id]
        );
        
        console.log(`${LOG_PREFIX} Règle ${id} désactivée par user ${userId}`);
        
        res.status(200).json({ 
            message: 'Règle désactivée',
            id
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur deleteRule:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 6. ACTIVER/DÉSACTIVER RÈGLE
// ============================================================================
router.patch('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const result = await db.query(`
            UPDATE purchase_approval_rules
            SET is_active = NOT is_active,
                updated_by = $1
            WHERE id = $2 AND organization_id = $3
            RETURNING *
        `, [userId, id, organizationId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Règle non trouvée' });
        }
        
        console.log(`${LOG_PREFIX} Règle ${id} ${result.rows[0].is_active ? 'activée' : 'désactivée'}`);
        
        res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur toggleRule:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================================
// 7. TESTER RÈGLE
// ============================================================================
router.post('/test', async (req, res) => {
    const organizationId = req.organizationId;
    const { amount, category } = req.body;
    
    if (!amount) {
        return res.status(400).json({ error: 'amount requis' });
    }
    
    try {
        const query = `
            SELECT 
                par.*,
                u1.email as approver_1_email,
                u2.email as approver_2_email,
                u3.email as approver_3_email
            FROM purchase_approval_rules par
            LEFT JOIN users u1 ON par.approver_1_id = u1.id
            LEFT JOIN users u2 ON par.approver_2_id = u2.id
            LEFT JOIN users u3 ON par.approver_3_id = u3.id
            WHERE par.organization_id = $1
            AND par.is_active = TRUE
            AND (
                (par.min_amount <= $2 AND (par.max_amount IS NULL OR par.max_amount >= $2))
                OR (par.min_amount <= $2 AND par.max_amount IS NULL)
            )
            AND (
                par.applicable_categories IS NULL
                OR $3 = ANY(par.applicable_categories)
            )
            ORDER BY par.priority DESC
            LIMIT 1
        `;
        
        const result = await db.query(query, [organizationId, amount, category || 'Autre']);
        
        if (result.rows.length === 0) {
            return res.status(200).json({
                matched: false,
                message: 'Aucune règle ne correspond à ces critères'
            });
        }
        
        const rule = result.rows[0];
        
        const approversCount = [rule.approver_1_id, rule.approver_2_id, rule.approver_3_id]
            .filter(Boolean).length;
        
        res.status(200).json({
            matched: true,
            rule: rule,
            approvers_count: approversCount,
            approvers: [
                rule.approver_1_id ? { id: rule.approver_1_id, email: rule.approver_1_email, order: 1 } : null,
                rule.approver_2_id ? { id: rule.approver_2_id, email: rule.approver_2_email, order: 2 } : null,
                rule.approver_3_id ? { id: rule.approver_3_id, email: rule.approver_3_email, order: 3 } : null
            ].filter(Boolean)
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur testRule:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;