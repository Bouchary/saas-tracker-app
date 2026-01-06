// server/src/controllers/purchaseRequestsController.js
const db = require('../db');
const { sanitizeString } = require('../middlewares/validation');
const purchaseRequestService = require('../services/purchaseRequestService');
const notificationService = require('../services/purchaseRequestNotificationService');

const LOG_PREFIX = 'PurchaseRequests:';

const checkRequestOwnership = async (requestId, organizationId) => {
    const result = await db.query(
        'SELECT * FROM purchase_requests WHERE id = $1 AND organization_id = $2',
        [requestId, organizationId]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    return result.rows[0];
};

const checkPermissions = (request, userId, action) => {
    if (request.requester_id === userId) {
        if (action === 'view') return true;
        if (action === 'edit' && request.status === 'draft') return true;
        if (action === 'delete' && request.status === 'draft') return true;
    }
    
    return false;
};

const addHistory = async (requestId, action, userId, details = {}) => {
    const query = `
        INSERT INTO purchase_request_history 
        (purchase_request_id, action, performed_by, details, old_status, new_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    
    await db.query(query, [
        requestId,
        action,
        userId,
        JSON.stringify(details),
        details.old_status || null,
        details.new_status || null
    ]);
};

const getAllPurchaseRequests = async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const search = req.query.search ? sanitizeString(req.query.search) : '';
    const status = req.query.status || '';
    const category = req.query.category || '';
    const urgency = req.query.urgency || '';
    const requesterId = req.query.requester_id || '';
    const minAmount = req.query.min_amount ? parseFloat(req.query.min_amount) : null;
    const maxAmount = req.query.max_amount ? parseFloat(req.query.max_amount) : null;
    const dateFrom = req.query.date_from || '';
    const dateTo = req.query.date_to || '';
    
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    const validSortFields = ['created_at', 'amount', 'title', 'status', 'urgency', 'needed_date', 'submitted_at'];
    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ 
            error: `Champ de tri invalide. Valeurs autorisées: ${validSortFields.join(', ')}` 
        });
    }
    
    try {
        let whereConditions = ['pr.organization_id = $1'];
        let queryParams = [organizationId];
        let paramIndex = 2;
        
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            whereConditions.push(`pr.requester_id = $${paramIndex}`);
            queryParams.push(userId);
            paramIndex++;
        }
        
        if (search) {
            whereConditions.push(`(
                LOWER(pr.title) LIKE $${paramIndex} 
                OR LOWER(pr.description) LIKE $${paramIndex}
                OR LOWER(pr.supplier_name) LIKE $${paramIndex}
                OR pr.request_number LIKE $${paramIndex}
            )`);
            queryParams.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }
        
        if (status) {
            whereConditions.push(`pr.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        
        if (category) {
            whereConditions.push(`pr.category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }
        
        if (urgency) {
            whereConditions.push(`pr.urgency = $${paramIndex}`);
            queryParams.push(urgency);
            paramIndex++;
        }
        
        if (requesterId) {
            whereConditions.push(`pr.requester_id = $${paramIndex}`);
            queryParams.push(requesterId);
            paramIndex++;
        }
        
        if (minAmount !== null) {
            whereConditions.push(`pr.amount >= $${paramIndex}`);
            queryParams.push(minAmount);
            paramIndex++;
        }
        
        if (maxAmount !== null) {
            whereConditions.push(`pr.amount <= $${paramIndex}`);
            queryParams.push(maxAmount);
            paramIndex++;
        }
        
        if (dateFrom) {
            whereConditions.push(`pr.created_at >= $${paramIndex}`);
            queryParams.push(dateFrom);
            paramIndex++;
        }
        
        if (dateTo) {
            whereConditions.push(`pr.created_at <= $${paramIndex}`);
            queryParams.push(dateTo);
            paramIndex++;
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const countQuery = `SELECT COUNT(*) FROM purchase_requests pr WHERE ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const totalRequests = parseInt(countResult.rows[0].count);
        
        const queryText = `
            SELECT 
                pr.*,
                u.email as requester_email,
                COUNT(DISTINCT pra.id) as approvers_assigned_count,
                COUNT(DISTINCT CASE WHEN pra.status = 'approved' THEN pra.id END) as approved_count
            FROM purchase_requests pr
            LEFT JOIN users u ON pr.requester_id = u.id
            LEFT JOIN purchase_request_approvers pra ON pr.id = pra.purchase_request_id
            WHERE ${whereClause}
            GROUP BY pr.id, u.email
            ORDER BY pr.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const finalParams = [...queryParams, limit, offset];
        const result = await db.query(queryText, finalParams);
        
        const totalPages = Math.ceil(totalRequests / limit);
        
        console.log(`${LOG_PREFIX} Récupération ${result.rowCount} demandes (page ${page}/${totalPages}) pour org ${organizationId}`);
        
        res.status(200).json({
            requests: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalRequests,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                search, status, category, urgency, requesterId,
                minAmount, maxAmount, dateFrom, dateTo,
                sortBy, sortOrder
            }
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getAllPurchaseRequests:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getPurchaseRequestById = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    try {
        const queryText = `
            SELECT 
                pr.*,
                u.email as requester_email,
                c.name as contract_name
            FROM purchase_requests pr
            LEFT JOIN users u ON pr.requester_id = u.id
            LEFT JOIN contracts c ON pr.contract_id = c.id
            WHERE pr.id = $1 AND pr.organization_id = $2
        `;
        
        const result = await db.query(queryText, [id, organizationId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        const request = result.rows[0];
        
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            const isRequester = request.requester_id === userId;
            
            const approverCheck = await db.query(
                'SELECT * FROM purchase_request_approvers WHERE purchase_request_id = $1 AND approver_id = $2',
                [id, userId]
            );
            
            const isApprover = approverCheck.rows.length > 0;
            
            if (!isRequester && !isApprover) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }
        }
        
        const approversQuery = `
            SELECT 
                pra.*,
                u.email as approver_email
            FROM purchase_request_approvers pra
            LEFT JOIN users u ON pra.approver_id = u.id
            WHERE pra.purchase_request_id = $1
            ORDER BY pra.order_position ASC
        `;
        
        const approversResult = await db.query(approversQuery, [id]);
        
        const filesQuery = `
            SELECT 
                prf.*,
                u.email as uploaded_by_email
            FROM purchase_request_files prf
            LEFT JOIN users u ON prf.uploaded_by = u.id
            WHERE prf.purchase_request_id = $1 AND prf.deleted_at IS NULL
        `;
        
        const filesResult = await db.query(filesQuery, [id]);
        
        console.log(`${LOG_PREFIX} Détails demande ${id} pour user ${userId}`);
        
        res.status(200).json({
            request,
            approvers: approversResult.rows,
            files: filesResult.rows
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getPurchaseRequestById:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const createPurchaseRequest = async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    const {
        title,
        description,
        justification,
        amount,
        currency = 'EUR',
        category,
        custom_category_text,
        urgency = 'normal',
        supplier_name,
        supplier_contact,
        supplier_email,
        supplier_phone,
        needed_date
    } = req.body;
    
    if (!title || !amount || !category || !justification) {
        return res.status(400).json({ 
            error: 'Champs requis : title, amount, category, justification' 
        });
    }
    
    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Le montant doit être positif' });
    }
    
    if (category === 'Autre' && !custom_category_text) {
        return res.status(400).json({ 
            error: 'Veuillez spécifier la catégorie personnalisée' 
        });
    }
    
    try {
        const year = new Date().getFullYear();
        const lastRequest = await db.query(
            `SELECT request_number FROM purchase_requests 
             WHERE organization_id = $1 
             AND request_number LIKE $2
             ORDER BY CAST(SUBSTRING(request_number FROM 9) AS INTEGER) DESC 
             LIMIT 1`,
            [organizationId, `PR-${year}-%`]
        );

        let nextNumber = 1;
        if (lastRequest.rows.length > 0) {
            const currentNum = lastRequest.rows[0].request_number;
            const lastNum = parseInt(currentNum.split('-')[2]);
            nextNumber = lastNum + 1;
        }

        const requestNumber = `PR-${year}-${String(nextNumber).padStart(4, '0')}`;

        const queryText = `
            INSERT INTO purchase_requests (
                organization_id, requester_id,
                request_number,
                title, description, justification,
                amount, currency,
                category, custom_category_text,
                urgency,
                supplier_name, supplier_contact, supplier_email, supplier_phone,
                needed_date,
                status,
                created_by, updated_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft', $17, $18
            ) RETURNING *
        `;
        
        const values = [
            organizationId, userId,
            requestNumber,
            sanitizeString(title),
            description ? sanitizeString(description) : null,
            sanitizeString(justification),
            amount, currency,
            category,
            custom_category_text ? sanitizeString(custom_category_text) : null,
            urgency,
            supplier_name ? sanitizeString(supplier_name) : null,
            supplier_contact ? sanitizeString(supplier_contact) : null,
            supplier_email,
            supplier_phone,
            needed_date || null,
            userId, userId
        ];
        
        const result = await db.query(queryText, values);
        const newRequest = result.rows[0];
        
        await addHistory(newRequest.id, 'created', userId, {
            new_status: 'draft'
        });
        
        console.log(`${LOG_PREFIX} Demande ${newRequest.request_number} créée par user ${userId}`);
        
        res.status(201).json(newRequest);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur createPurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updatePurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'draft') {
            return res.status(400).json({ 
                error: 'Seules les demandes en brouillon peuvent être modifiées' 
            });
        }
        
        if (request.requester_id !== userId) {
            return res.status(403).json({ 
                error: 'Seul le créateur peut modifier cette demande' 
            });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        const allowedFields = [
            'title', 'description', 'justification',
            'amount', 'currency',
            'category', 'custom_category_text',
            'urgency',
            'supplier_name', 'supplier_contact', 'supplier_email', 'supplier_phone',
            'needed_date'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                
                if (['title', 'description', 'justification', 'supplier_name', 'supplier_contact', 'custom_category_text'].includes(field)) {
                    values.push(req.body[field] ? sanitizeString(req.body[field]) : null);
                } else {
                    values.push(req.body[field]);
                }
                
                paramIndex++;
            }
        });
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }
        
        updates.push(`updated_by = $${paramIndex}`);
        values.push(userId);
        paramIndex++;
        
        values.push(id, organizationId);
        
        const queryText = `
            UPDATE purchase_requests
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
            RETURNING *
        `;
        
        const result = await db.query(queryText, values);
        
        await addHistory(id, 'updated', userId, {
            fields_updated: allowedFields.filter(f => req.body[f] !== undefined)
        });
        
        console.log(`${LOG_PREFIX} Demande ${id} modifiée par user ${userId}`);
        
        res.status(200).json(result.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur updatePurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deletePurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'draft') {
            return res.status(400).json({ 
                error: 'Seules les demandes en brouillon peuvent être supprimées' 
            });
        }
        
        if (request.requester_id !== userId) {
            return res.status(403).json({ 
                error: 'Seul le créateur peut supprimer cette demande' 
            });
        }
        
        await db.query(
            'DELETE FROM purchase_requests WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
        );
        
        console.log(`${LOG_PREFIX} Demande ${id} supprimée par user ${userId}`);
        
        res.status(200).json({ message: 'Demande supprimée', id });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur deletePurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const submitPurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'draft') {
            return res.status(400).json({ 
                error: 'Seules les demandes en brouillon peuvent être soumises' 
            });
        }
        
        if (request.requester_id !== userId) {
            return res.status(403).json({ 
                error: 'Seul le créateur peut soumettre cette demande' 
            });
        }
        
        const approvers = await purchaseRequestService.assignApprovers(
            organizationId,
            request.amount,
            request.category
        );
        
        if (approvers.length === 0) {
            return res.status(400).json({ 
                error: 'Aucune règle de validation ne correspond à cette demande. Contactez un administrateur.' 
            });
        }
        
        for (let i = 0; i < approvers.length; i++) {
            await db.query(`
                INSERT INTO purchase_request_approvers 
                (purchase_request_id, approver_id, order_position, status)
                VALUES ($1, $2, $3, 'pending')
            `, [id, approvers[i].user_id, i + 1]);
        }
        
        await db.query(`
            UPDATE purchase_requests
            SET status = 'in_approval',
                submitted_at = CURRENT_TIMESTAMP,
                current_approver_order = 1,
                total_approvers = $1,
                updated_by = $2
            WHERE id = $3
        `, [approvers.length, userId, id]);
        
        await addHistory(id, 'submitted', userId, {
            old_status: 'draft',
            new_status: 'in_approval',
            approvers_assigned: approvers.length
        });
        
        await addHistory(id, 'approvers_assigned', userId, {
            approvers: approvers.map(a => ({ id: a.user_id, order: a.order }))
        });
        
        await notificationService.notifyApprover(id, approvers[0].user_id, 1);
        
        console.log(`${LOG_PREFIX} Demande ${id} soumise avec ${approvers.length} valideurs`);
        
        res.status(200).json({
            message: 'Demande soumise pour validation',
            approvers: approvers.map(a => ({
                approver_id: a.user_id,
                order: a.order,
                email: a.email
            }))
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur submitPurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const approvePurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const { comments } = req.body;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'in_approval') {
            return res.status(400).json({ 
                error: 'Cette demande n\'est pas en attente de validation' 
            });
        }
        
        const approverCheck = await db.query(`
            SELECT * FROM purchase_request_approvers
            WHERE purchase_request_id = $1
            AND approver_id = $2
            AND order_position = $3
            AND status = 'pending'
        `, [id, userId, request.current_approver_order]);
        
        if (approverCheck.rows.length === 0) {
            return res.status(403).json({ 
                error: 'Ce n\'est pas votre tour de valider cette demande' 
            });
        }
        
        const approver = approverCheck.rows[0];
        
        await db.query(`
            UPDATE purchase_request_approvers
            SET status = 'approved',
                decision_date = CURRENT_TIMESTAMP,
                comments = $1
            WHERE id = $2
        `, [comments || null, approver.id]);
        
        const nextApproverCheck = await db.query(`
            SELECT * FROM purchase_request_approvers
            WHERE purchase_request_id = $1
            AND order_position = $2
        `, [id, request.current_approver_order + 1]);
        
        let newStatus = request.status;
        let nextApproverId = null;
        
        if (nextApproverCheck.rows.length > 0) {
            await db.query(`
                UPDATE purchase_requests
                SET current_approver_order = current_approver_order + 1,
                    updated_by = $1
                WHERE id = $2
            `, [userId, id]);
            
            nextApproverId = nextApproverCheck.rows[0].approver_id;
            
            await notificationService.notifyApprover(
                id,
                nextApproverId,
                request.current_approver_order + 1
            );
            
        } else {
            newStatus = 'approved';
            
            await db.query(`
                UPDATE purchase_requests
                SET status = 'approved',
                    updated_by = $1
                WHERE id = $2
            `, [userId, id]);
            
            await addHistory(id, 'fully_approved', userId, {
                old_status: 'in_approval',
                new_status: 'approved'
            });
            
            await notificationService.notifyRequester(id, 'approved');
        }
        
        await addHistory(id, 'approved_by', userId, {
            approver_id: userId,
            order_position: approver.order_position,
            comments: comments || null
        });
        
        console.log(`${LOG_PREFIX} Demande ${id} approuvée par user ${userId} (ordre ${approver.order_position})`);
        
        res.status(200).json({
            message: newStatus === 'approved' 
                ? 'Demande entièrement approuvée' 
                : 'Validation enregistrée, en attente du prochain valideur',
            status: newStatus,
            next_approver_id: nextApproverId
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur approvePurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const rejectPurchaseRequest = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const { rejection_reason } = req.body;
    
    if (!rejection_reason) {
        return res.status(400).json({ 
            error: 'La raison du rejet est obligatoire' 
        });
    }
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'in_approval') {
            return res.status(400).json({ 
                error: 'Cette demande n\'est pas en attente de validation' 
            });
        }
        
        const approverCheck = await db.query(`
            SELECT * FROM purchase_request_approvers
            WHERE purchase_request_id = $1
            AND approver_id = $2
            AND status = 'pending'
        `, [id, userId]);
        
        if (approverCheck.rows.length === 0) {
            return res.status(403).json({ 
                error: 'Vous n\'êtes pas autorisé à rejeter cette demande' 
            });
        }
        
        const approver = approverCheck.rows[0];
        
        await db.query(`
            UPDATE purchase_request_approvers
            SET status = 'rejected',
                decision_date = CURRENT_TIMESTAMP,
                comments = $1
            WHERE id = $2
        `, [rejection_reason, approver.id]);
        
        await db.query(`
            UPDATE purchase_request_approvers
            SET status = 'skipped'
            WHERE purchase_request_id = $1
            AND order_position > $2
            AND status = 'pending'
        `, [id, approver.order_position]);
        
        await db.query(`
            UPDATE purchase_requests
            SET status = 'rejected',
                rejection_reason = $1,
                rejected_by = $2,
                rejected_at = CURRENT_TIMESTAMP,
                updated_by = $3
            WHERE id = $4
        `, [rejection_reason, userId, userId, id]);
        
        await addHistory(id, 'rejected_by', userId, {
            old_status: 'in_approval',
            new_status: 'rejected',
            approver_id: userId,
            order_position: approver.order_position,
            reason: rejection_reason
        });
        
        await notificationService.notifyRequester(id, 'rejected', rejection_reason);
        
        console.log(`${LOG_PREFIX} Demande ${id} rejetée par user ${userId}`);
        
        res.status(200).json({
            message: 'Demande rejetée',
            rejection_reason
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur rejectPurchaseRequest:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const convertToContract = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!['owner', 'admin', 'superadmin', 'super_admin', 'finance'].includes(userRole)) {
        return res.status(403).json({ 
            error: 'Seuls les administrateurs peuvent convertir une demande en contrat' 
        });
    }
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        if (request.status !== 'approved') {
            return res.status(400).json({ 
                error: 'Seules les demandes approuvées peuvent être converties' 
            });
        }
        
        if (request.contract_id) {
            return res.status(400).json({ 
                error: 'Cette demande a déjà été convertie en contrat' 
            });
        }
        
        const contractData = {
            name: req.body.name || request.title,
            provider: req.body.provider || request.supplier_name,
            monthly_cost: req.body.monthly_cost || request.amount,
            renewal_date: req.body.renewal_date || request.needed_date,
            notice_period_days: req.body.notice_period_days || 30,
            status: 'active',
            pricing_model: req.body.pricing_model || 'fixed',
            unit_cost: req.body.unit_cost || null,
            license_count: req.body.license_count || null,
            licenses_used: req.body.licenses_used || null,
            real_users: req.body.real_users || null
        };
        
        const contractQuery = `
            INSERT INTO contracts (
                organization_id, user_id,
                name, provider, monthly_cost,
                renewal_date, notice_period_days,
                status, pricing_model, 
                unit_cost, license_count, licenses_used, real_users
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        
        const contractResult = await db.query(contractQuery, [
            organizationId,
            userId,
            contractData.name,
            contractData.provider,
            contractData.monthly_cost,
            contractData.renewal_date,
            contractData.notice_period_days,
            contractData.status,
            contractData.pricing_model,
            contractData.unit_cost,
            contractData.license_count,
            contractData.licenses_used,
            contractData.real_users
        ]);
        
        const contract = contractResult.rows[0];
        
        await db.query(`
            UPDATE purchase_requests
            SET status = 'converted',
                contract_id = $1,
                converted_at = CURRENT_TIMESTAMP,
                converted_by = $2,
                updated_by = $3
            WHERE id = $4
        `, [contract.id, userId, userId, id]);
        
        await addHistory(id, 'converted_to_contract', userId, {
            old_status: 'approved',
            new_status: 'converted',
            contract_id: contract.id,
            contract_name: contract.name
        });
        
        console.log(`${LOG_PREFIX} Demande ${id} convertie en contrat ${contract.id}`);
        
        res.status(201).json({
            message: 'Demande convertie en contrat avec succès',
            contract: contract,
            purchase_request_id: id
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur convertToContract:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const uploadFile = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    const { document_type } = req.body;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        const fileQuery = `
            INSERT INTO purchase_request_files (
                purchase_request_id,
                filename, original_filename,
                filepath, filesize, mimetype,
                document_type,
                uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const fileResult = await db.query(fileQuery, [
            id,
            req.file.filename,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            document_type || 'other',
            userId
        ]);
        
        await addHistory(id, 'file_uploaded', userId, {
            filename: req.file.originalname,
            file_id: fileResult.rows[0].id
        });
        
        console.log(`${LOG_PREFIX} Fichier uploadé pour demande ${id}`);
        
        res.status(201).json(fileResult.rows[0]);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur uploadFile:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getFiles = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        const query = `
            SELECT 
                prf.*,
                u.email as uploaded_by_email
            FROM purchase_request_files prf
            LEFT JOIN users u ON prf.uploaded_by = u.id
            WHERE prf.purchase_request_id = $1
            AND prf.deleted_at IS NULL
            ORDER BY prf.uploaded_at DESC
        `;
        
        const result = await db.query(query, [id]);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getFiles:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteFile = async (req, res) => {
    const { id, fileId } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        const fileCheck = await db.query(
            'SELECT * FROM purchase_request_files WHERE id = $1 AND purchase_request_id = $2',
            [fileId, id]
        );
        
        if (fileCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        
        await db.query(`
            UPDATE purchase_request_files
            SET deleted_at = CURRENT_TIMESTAMP,
                deleted_by = $1
            WHERE id = $2
        `, [userId, fileId]);
        
        await addHistory(id, 'file_deleted', userId, {
            filename: fileCheck.rows[0].original_filename,
            file_id: fileId
        });
        
        console.log(`${LOG_PREFIX} Fichier ${fileId} supprimé de demande ${id}`);
        
        res.status(200).json({ message: 'Fichier supprimé' });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur deleteFile:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getStats = async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    try {
        let userFilter = '';
        let params = [organizationId];
        
        if (!['admin', 'superadmin'].includes(userRole)) {
            userFilter = 'AND requester_id = $2';
            params.push(userId);
        }
        
        const totalQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(amount) as total_amount
            FROM purchase_requests
            WHERE organization_id = $1 ${userFilter}
        `;
        const totalResult = await db.query(totalQuery, params);
        
        const byStatusQuery = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as amount
            FROM purchase_requests
            WHERE organization_id = $1 ${userFilter}
            GROUP BY status
        `;
        const byStatusResult = await db.query(byStatusQuery, params);
        
        const byCategoryQuery = `
            SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as amount
            FROM purchase_requests
            WHERE organization_id = $1 ${userFilter}
            GROUP BY category
            ORDER BY count DESC
        `;
        const byCategoryResult = await db.query(byCategoryQuery, params);
        
        const avgTimeQuery = `
            SELECT 
                AVG(EXTRACT(EPOCH FROM (
                    CASE 
                        WHEN status = 'approved' THEN 
                            COALESCE(converted_at, updated_at) - submitted_at
                        ELSE NULL
                    END
                )) / 86400) as avg_days
            FROM purchase_requests
            WHERE organization_id = $1 
            AND status = 'approved'
            ${userFilter}
        `;
        const avgTimeResult = await db.query(avgTimeQuery, params);
        
        const urgentQuery = `
            SELECT COUNT(*) as count
            FROM purchase_requests
            WHERE organization_id = $1
            AND urgency IN ('urgent', 'critical')
            AND status IN ('pending', 'in_approval')
            ${userFilter}
        `;
        const urgentResult = await db.query(urgentQuery, params);
        
        res.status(200).json({
            total_requests: parseInt(totalResult.rows[0].total),
            total_amount: parseFloat(totalResult.rows[0].total_amount || 0),
            by_status: byStatusResult.rows,
            by_category: byCategoryResult.rows,
            avg_approval_days: parseFloat(avgTimeResult.rows[0].avg_days || 0).toFixed(1),
            urgent_count: parseInt(urgentResult.rows[0].count)
        });
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getStats:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getMyRequests = async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const query = `
            SELECT 
                pr.*,
                COUNT(DISTINCT pra.id) as approvers_assigned_count,
                COUNT(DISTINCT CASE WHEN pra.status = 'approved' THEN pra.id END) as approved_count
            FROM purchase_requests pr
            LEFT JOIN purchase_request_approvers pra ON pr.id = pra.purchase_request_id
            WHERE pr.organization_id = $1
            AND pr.requester_id = $2
            GROUP BY pr.id
            ORDER BY pr.created_at DESC
        `;
        
        const result = await db.query(query, [organizationId, userId]);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getMyRequests:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getRequestsToApprove = async (req, res) => {
    const organizationId = req.organizationId;
    const userId = req.user.id;
    
    try {
        const query = `
            SELECT 
                pr.*,
                u.email as requester_email,
                pra.order_position,
                pra.notified_at
            FROM purchase_requests pr
            JOIN purchase_request_approvers pra ON pr.id = pra.purchase_request_id
            LEFT JOIN users u ON pr.requester_id = u.id
            WHERE pr.organization_id = $1
            AND pra.approver_id = $2
            AND pra.status = 'pending'
            AND pr.status = 'in_approval'
            AND pr.current_approver_order = pra.order_position
            ORDER BY pr.urgency DESC, pr.created_at ASC
        `;
        
        const result = await db.query(query, [organizationId, userId]);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getRequestsToApprove:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getHistory = async (req, res) => {
    const { id } = req.params;
    const organizationId = req.organizationId;
    
    try {
        const request = await checkRequestOwnership(id, organizationId);
        
        if (!request) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }
        
        const query = `
            SELECT 
                prh.*,
                u.email as performed_by_email
            FROM purchase_request_history prh
            LEFT JOIN users u ON prh.performed_by = u.id
            WHERE prh.purchase_request_id = $1
            ORDER BY prh.performed_at DESC
        `;
        
        const result = await db.query(query, [id]);
        
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getHistory:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getAllPurchaseRequests,
    getPurchaseRequestById,
    createPurchaseRequest,
    updatePurchaseRequest,
    deletePurchaseRequest,
    submitPurchaseRequest,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    convertToContract,
    uploadFile,
    getFiles,
    deleteFile,
    getStats,
    getMyRequests,
    getRequestsToApprove,
    getHistory,
    checkRequestOwnership,
    addHistory
};