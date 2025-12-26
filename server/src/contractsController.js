const db = require('./db');
const { sanitizeString } = require('./middlewares/validation');

const LOG_PREFIX = 'Contrats SQL:';

const getAllContracts = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const search = req.query.search ? sanitizeString(req.query.search) : '';
    const status = req.query.status || '';
    const provider = req.query.provider || '';
    const sortBy = req.query.sortBy || 'renewal_date';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const maxLimit = 100;
    if (page < 1 || limit < 1 || limit > maxLimit) {
        return res.status(400).json({ 
            error: `Paramètres de pagination invalides. Page >= 1, Limit entre 1 et ${maxLimit}.` 
        });
    }

    const validSortFields = ['name', 'provider', 'monthly_cost', 'renewal_date', 'notice_period_days', 'status'];
    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ 
            error: `Champ de tri invalide. Valeurs autorisées: ${validSortFields.join(', ')}` 
        });
    }
    
    try {
        let whereConditions = ['organization_id = $1 AND deleted_at IS NULL'];
        let queryParams = [organizationId];
        let paramIndex = 2;

        if (search) {
            whereConditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(provider) LIKE $${paramIndex})`);
            queryParams.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`LOWER(status) = $${paramIndex}`);
            queryParams.push(status.toLowerCase());
            paramIndex++;
        }

        if (provider) {
            whereConditions.push(`LOWER(provider) = $${paramIndex}`);
            queryParams.push(provider.toLowerCase());
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM contracts WHERE ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const totalContracts = parseInt(countResult.rows[0].count);

        const queryText = `
            SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status,
                   pricing_model, license_count, licenses_used, unit_cost, real_users,
                   created_by, updated_by, created_at
            FROM contracts
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const finalParams = [...queryParams, limit, offset];
        const result = await db.query(queryText, finalParams);

        const totalPages = Math.ceil(totalContracts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log(`${LOG_PREFIX} Page ${page}/${totalPages} - ${result.rowCount} contrats (filtres: ${search ? 'recherche' : 'aucun'}) pour organization ${organizationId}`);

        res.status(200).json({
            contracts: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalContracts: totalContracts,
                limit: limit,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
            },
            filters: {
                search: search,
                status: status,
                provider: provider,
                sortBy: sortBy,
                sortOrder: sortOrder,
            }
        });
    } catch (error) {
        console.error('Erreur getAllContracts:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des contrats.' });
    }
};

const createContract = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }
    
    const name = sanitizeString(req.body.name);
    const provider = req.body.provider ? sanitizeString(req.body.provider) : null;
    const renewal_date = req.body.renewal_date;
    const notice_period_days = parseInt(req.body.notice_period_days) || 0;
    
    const pricing_model = req.body.pricing_model || 'fixed';
    const license_count = req.body.license_count ? parseInt(req.body.license_count) : null;
    const licenses_used = req.body.licenses_used ? parseInt(req.body.licenses_used) : null;
    const unit_cost = req.body.unit_cost ? parseFloat(req.body.unit_cost) : null;
    const real_users = req.body.real_users ? parseInt(req.body.real_users) : null;

    const validPricingModels = ['fixed', 'per_user', 'usage_based'];
    if (!validPricingModels.includes(pricing_model)) {
        return res.status(400).json({ 
            error: `Type de tarification invalide. Valeurs autorisées: ${validPricingModels.join(', ')}` 
        });
    }

    let monthly_cost = req.body.monthly_cost ? parseFloat(req.body.monthly_cost) : null;
    
    if (pricing_model === 'per_user' && license_count && unit_cost) {
        monthly_cost = license_count * unit_cost;
    }

    if (pricing_model === 'fixed' && !monthly_cost) {
        return res.status(400).json({ error: 'Le coût mensuel est requis pour un prix fixe' });
    }

    if (pricing_model === 'per_user' && (!license_count || !unit_cost)) {
        return res.status(400).json({ error: 'Le nombre de licences et le coût unitaire sont requis' });
    }

    try {
        const queryText = `
            INSERT INTO contracts (
                organization_id, name, provider, monthly_cost, renewal_date, notice_period_days, 
                status, pricing_model, license_count, licenses_used, unit_cost, real_users,
                created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        const values = [
            organizationId, name, provider, monthly_cost, renewal_date, notice_period_days, 
            pricing_model, license_count, licenses_used, unit_cost, real_users,
            userId, userId
        ];
        const result = await db.query(queryText, values);
        
        console.log(`${LOG_PREFIX} Création du contrat ${result.rows[0].id} pour organization ${organizationId}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur createContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du contrat.' });
    }
};

const updateContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const checkResult = await db.query(
            'SELECT * FROM contracts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
            [id, organizationId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        const currentContract = checkResult.rows[0];

        const name = req.body.name ? sanitizeString(req.body.name) : undefined;
        const provider = req.body.provider !== undefined ? (req.body.provider ? sanitizeString(req.body.provider) : null) : undefined;
        const renewal_date = req.body.renewal_date;
        const notice_period_days = req.body.notice_period_days !== undefined ? parseInt(req.body.notice_period_days) : undefined;
        const status = req.body.status ? req.body.status.toLowerCase() : undefined;
        
        const pricing_model = req.body.pricing_model !== undefined ? req.body.pricing_model : undefined;
        const license_count = req.body.license_count !== undefined ? (req.body.license_count ? parseInt(req.body.license_count) : null) : undefined;
        const licenses_used = req.body.licenses_used !== undefined ? (req.body.licenses_used ? parseInt(req.body.licenses_used) : null) : undefined;
        const unit_cost = req.body.unit_cost !== undefined ? (req.body.unit_cost ? parseFloat(req.body.unit_cost) : null) : undefined;
        const real_users = req.body.real_users !== undefined ? (req.body.real_users ? parseInt(req.body.real_users) : null) : undefined;

        const validPricingModels = ['fixed', 'per_user', 'usage_based'];
        if (pricing_model !== undefined && !validPricingModels.includes(pricing_model)) {
            return res.status(400).json({ 
                error: `Type de tarification invalide. Valeurs autorisées: ${validPricingModels.join(', ')}` 
            });
        }

        let monthly_cost = req.body.monthly_cost !== undefined ? parseFloat(req.body.monthly_cost) : undefined;
        
        const finalPricingModel = pricing_model !== undefined ? pricing_model : currentContract.pricing_model;
        const finalLicenseCount = license_count !== undefined ? license_count : currentContract.license_count;
        const finalUnitCost = unit_cost !== undefined ? unit_cost : currentContract.unit_cost;
        
        if (finalPricingModel === 'per_user' && finalLicenseCount && finalUnitCost) {
            monthly_cost = finalLicenseCount * finalUnitCost;
        }

        let queryText = 'UPDATE contracts SET ';
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name); }
        if (provider !== undefined) { updates.push(`provider = $${paramIndex++}`); values.push(provider); }
        if (monthly_cost !== undefined) { updates.push(`monthly_cost = $${paramIndex++}`); values.push(monthly_cost); }
        if (renewal_date !== undefined) { updates.push(`renewal_date = $${paramIndex++}`); values.push(renewal_date); }
        if (notice_period_days !== undefined) { updates.push(`notice_period_days = $${paramIndex++}`); values.push(notice_period_days); }
        if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
        
        if (pricing_model !== undefined) { updates.push(`pricing_model = $${paramIndex++}`); values.push(pricing_model); }
        if (license_count !== undefined) { updates.push(`license_count = $${paramIndex++}`); values.push(license_count); }
        if (licenses_used !== undefined) { updates.push(`licenses_used = $${paramIndex++}`); values.push(licenses_used); }
        if (unit_cost !== undefined) { updates.push(`unit_cost = $${paramIndex++}`); values.push(unit_cost); }
        if (real_users !== undefined) { updates.push(`real_users = $${paramIndex++}`); values.push(real_users); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
        }

        updates.push(`updated_by = $${paramIndex++}`);
        values.push(userId);

        updates.push(`updated_at = NOW()`);

        queryText += updates.join(', ');
        queryText += ` WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} AND deleted_at IS NULL RETURNING *`;
        
        values.push(id, organizationId);

        const result = await db.query(queryText, values);

        console.log(`${LOG_PREFIX} Contrat ${id} mis à jour par l'utilisateur ${userId}`);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur updateContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du contrat.' });
    }
};

const deleteContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const result = await db.query(
            'UPDATE contracts SET deleted_at = NOW(), deleted_by = $3 WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL RETURNING id', 
            [id, organizationId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        console.log(`${LOG_PREFIX} Contrat ${id} supprimé (soft delete) par l'utilisateur ${userId}`);
        res.status(204).send();
    } catch (error) {
        console.error('Erreur deleteContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du contrat.' });
    }
};

const getProviders = async (req, res) => {
    const organizationId = req.organizationId;
    
    if (!organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const queryText = `
            SELECT DISTINCT provider 
            FROM contracts 
            WHERE organization_id = $1 AND provider IS NOT NULL AND provider != '' AND deleted_at IS NULL
            ORDER BY provider ASC
        `;
        const result = await db.query(queryText, [organizationId]);
        
        const providers = result.rows.map(row => row.provider);
        res.status(200).json(providers);
    } catch (error) {
        console.error('Erreur getProviders:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des fournisseurs.' });
    }
};

const exportContracts = async (req, res) => {
    const organizationId = req.organizationId;
    
    if (!organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    const search = req.query.search ? sanitizeString(req.query.search) : '';
    const status = req.query.status || '';
    const provider = req.query.provider || '';
    const sortBy = req.query.sortBy || 'renewal_date';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const validSortFields = ['name', 'provider', 'monthly_cost', 'renewal_date', 'notice_period_days', 'status'];
    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ 
            error: `Champ de tri invalide. Valeurs autorisées: ${validSortFields.join(', ')}` 
        });
    }

    try {
        let whereConditions = ['organization_id = $1 AND deleted_at IS NULL'];
        let queryParams = [organizationId];
        let paramIndex = 2;

        if (search) {
            whereConditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(provider) LIKE $${paramIndex})`);
            queryParams.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`LOWER(status) = $${paramIndex}`);
            queryParams.push(status.toLowerCase());
            paramIndex++;
        }

        if (provider) {
            whereConditions.push(`LOWER(provider) = $${paramIndex}`);
            queryParams.push(provider.toLowerCase());
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        let queryText = 'SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status, ';
        queryText += 'pricing_model, license_count, licenses_used, unit_cost, real_users ';
        queryText += 'FROM contracts ';
        queryText += 'WHERE ' + whereClause + ' ';
        queryText += 'ORDER BY ' + sortBy + ' ' + sortOrder;
        
        console.log(`${LOG_PREFIX} Export CSV - Query:`, queryText);
        console.log(`${LOG_PREFIX} Export CSV - Params:`, queryParams);
        
        const result = await db.query(queryText, queryParams);

        const csvHeaders = 'ID,Nom,Fournisseur,Coût Mensuel (€),Date de Renouvellement,Préavis (Jours),Statut,Type Tarification,Licences,Licences Utilisées,Coût Unitaire (€),Utilisateurs Réels\n';
        
        const csvRows = result.rows.map(contract => {
            const escapeCsvField = (field) => {
                if (field === null || field === undefined) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            return [
                contract.id,
                escapeCsvField(contract.name),
                escapeCsvField(contract.provider || ''),
                parseFloat(contract.monthly_cost || 0).toFixed(2),
                contract.renewal_date ? new Date(contract.renewal_date).toISOString().split('T')[0] : '',
                contract.notice_period_days || 0,
                escapeCsvField(contract.status),
                escapeCsvField(contract.pricing_model || 'fixed'),
                contract.license_count || '',
                contract.licenses_used || '',
                contract.unit_cost ? parseFloat(contract.unit_cost).toFixed(2) : '',
                contract.real_users || ''
            ].join(',');
        }).join('\n');

        const csvContent = csvHeaders + csvRows;
        const filename = `contrats_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

        console.log(`${LOG_PREFIX} Export CSV de ${result.rowCount} contrats pour organization ${organizationId}`);
        
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Erreur exportContracts:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'export des contrats.' });
    }
};

module.exports = {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract,
    getProviders,
    exportContracts,
};