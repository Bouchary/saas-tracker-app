// server/src/services/purchaseRequestService.js - ✅ CORRIGÉ
// ============================================================================
// SERVICE PURCHASE REQUESTS - Logique métier règles et workflow
// ============================================================================

const db = require('../db');

/**
 * Assigner valideurs automatiquement selon règles
 */
const assignApprovers = async (organizationId, amount, category) => {
    try {
        const rulesQuery = `
            SELECT *
            FROM purchase_approval_rules
            WHERE organization_id = $1
            AND is_active = TRUE
            AND (
                (min_amount <= $2 AND (max_amount IS NULL OR max_amount >= $2))
                OR (min_amount <= $2 AND max_amount IS NULL)
            )
            AND (
                applicable_categories IS NULL
                OR $3 = ANY(applicable_categories)
            )
            ORDER BY priority DESC
            LIMIT 1
        `;
        
        const rulesResult = await db.query(rulesQuery, [organizationId, amount, category]);
        
        if (rulesResult.rows.length === 0) {
            console.log(`PurchaseRequestService: Aucune règle trouvée pour org ${organizationId}, montant ${amount}, catégorie ${category}`);
            return [];
        }
        
        const rule = rulesResult.rows[0];
        
        const approvers = [];
        let order = 1;
        
        if (rule.approver_1_id) {
            const user1 = await getUserInfo(rule.approver_1_id);
            if (user1) {
                approvers.push({
                    user_id: rule.approver_1_id,
                    email: user1.email,
                    order: order++
                });
            }
        }
        
        if (rule.approver_2_id) {
            const user2 = await getUserInfo(rule.approver_2_id);
            if (user2) {
                approvers.push({
                    user_id: rule.approver_2_id,
                    email: user2.email,
                    order: order++
                });
            }
        }
        
        if (rule.approver_3_id) {
            const user3 = await getUserInfo(rule.approver_3_id);
            if (user3) {
                approvers.push({
                    user_id: rule.approver_3_id,
                    email: user3.email,
                    order: order++
                });
            }
        }
        
        console.log(`PurchaseRequestService: ${approvers.length} valideurs assignés selon règle "${rule.name}"`);
        
        return approvers;
        
    } catch (error) {
        console.error('PurchaseRequestService: Erreur assignApprovers:', error);
        throw error;
    }
};

/**
 * Récupérer infos utilisateur - ✅ CORRIGÉ : seulement email
 */
const getUserInfo = async (userId) => {
    try {
        const result = await db.query(
            'SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL',
            [userId]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
        
    } catch (error) {
        console.error('PurchaseRequestService: Erreur getUserInfo:', error);
        return null;
    }
};

/**
 * Vérifier si demande complètement approuvée
 */
const isFullyApproved = async (requestId) => {
    try {
        const result = await db.query(
            'SELECT is_fully_approved($1) as is_approved',
            [requestId]
        );
        
        return result.rows[0].is_approved;
        
    } catch (error) {
        console.error('PurchaseRequestService: Erreur isFullyApproved:', error);
        return false;
    }
};

/**
 * Obtenir prochain valideur
 */
const getNextApprover = async (requestId) => {
    try {
        const result = await db.query(
            'SELECT * FROM get_next_approver($1)',
            [requestId]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
        
    } catch (error) {
        console.error('PurchaseRequestService: Erreur getNextApprover:', error);
        return null;
    }
};

/**
 * Créer règles par défaut pour nouvelle organisation
 */
const createDefaultRules = async (organizationId, adminUserId) => {
    try {
        await db.query(
            'SELECT create_default_purchase_rules($1, $2)',
            [organizationId, adminUserId]
        );
        
        console.log(`PurchaseRequestService: Règles par défaut créées pour org ${organizationId}`);
        
    } catch (error) {
        console.error('PurchaseRequestService: Erreur createDefaultRules:', error);
        throw error;
    }
};

module.exports = {
    assignApprovers,
    getUserInfo,
    isFullyApproved,
    getNextApprover,
    createDefaultRules
};