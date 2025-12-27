// server/src/contractsController.js

const db = require('./db');
const { sanitizeString } = require('./middlewares/validation');

const LOG_PREFIX = 'Contrats SQL:';

// 1. OBTENIR TOUS LES CONTRATS AVEC PAGINATION, FILTRES ET RECHERCHE
const getAllContracts = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;

    // Paramètres de recherche et filtres
    const search = req.query.search ? sanitizeString(req.query.search) : '';
    const status = req.query.status || '';
    const provider = req.query.provider || '';
    const sortBy = req.query.sortBy || 'renewal_date';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Validation des paramètres
    if (page < 1 || limit < 1 || limit > 10000) {
        return res.status(400).json({ 
            error: 'Paramètres de pagination invalides. Page >= 1, Limit entre 1 et 100.' 
        });
    }

    // Validation du champ de tri
    const validSortFields = ['name', 'provider', 'monthly_cost', 'renewal_date', 'notice_period_days', 'status'];
    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ 
            error: `Champ de tri invalide. Valeurs autorisées: ${validSortFields.join(', ')}` 
        });
    }
    
    try {
        // Construction dynamique de la clause WHERE
        let whereConditions = ['organization_id = $1'];
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

        // Requête pour compter le nombre total de contrats (avec filtres)
        const countQuery = `SELECT COUNT(*) FROM contracts WHERE ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const totalContracts = parseInt(countResult.rows[0].count);

        // ✅ AJOUT COLONNE real_users
        const queryText = `
            SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status,
                   pricing_model, license_count, licenses_used, unit_cost, real_users
            FROM contracts
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const finalParams = [...queryParams, limit, offset];
        const result = await db.query(queryText, finalParams);

        // Calcul des métadonnées
        const totalPages = Math.ceil(totalContracts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log(`${LOG_PREFIX} Page ${page}/${totalPages} - ${result.rowCount} contrats (filtres: ${search ? 'recherche' : 'aucun'}) pour l'organisation ${organizationId}`);

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

// 2. CRÉER UN CONTRAT (✅ AVEC real_users)
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
    
    // ✅ CHAMPS LICENCES
    const pricing_model = req.body.pricing_model || 'fixed';
    const license_count = req.body.license_count ? parseInt(req.body.license_count) : null;
    const licenses_used = req.body.licenses_used ? parseInt(req.body.licenses_used) : null;
    const unit_cost = req.body.unit_cost ? parseFloat(req.body.unit_cost) : null;
    const real_users = req.body.real_users ? parseInt(req.body.real_users) : null; // ✨ NOUVEAU

    // ✅ CALCUL AUTOMATIQUE DU COÛT
    let monthly_cost = req.body.monthly_cost ? parseFloat(req.body.monthly_cost) : null;
    
    if (pricing_model === 'per_user' && license_count && unit_cost) {
        monthly_cost = license_count * unit_cost;
    }

    // Validation
    if (pricing_model === 'fixed' && !monthly_cost) {
        return res.status(400).json({ error: 'Le coût mensuel est requis pour un prix fixe' });
    }

    if (pricing_model === 'per_user' && (!license_count || !unit_cost)) {
        return res.status(400).json({ error: 'Le nombre de licences et le coût unitaire sont requis' });
    }

    try {
        const queryText = `
            INSERT INTO contracts (
                name, provider, monthly_cost, renewal_date, notice_period_days, 
                user_id, status, pricing_model, license_count, licenses_used, unit_cost, real_users
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const values = [
            name, provider, monthly_cost, renewal_date, notice_period_days, 
            userId, pricing_model, license_count, licenses_used, unit_cost, real_users
        ];
        const result = await db.query(queryText, values);
        
        console.log(`${LOG_PREFIX} Création du contrat ${result.rows[0].id} pour l'organisation ${organizationId}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur createContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du contrat.' });
    }
};

// 3. MODIFIER UN CONTRAT (✅ AVEC real_users)
const updateContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        // Vérifier que le contrat existe
        const checkResult = await db.query(
            'SELECT * FROM contracts WHERE id = $1 AND organization_id = $2',
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        const currentContract = checkResult.rows[0];

        // Récupérer les champs
        const name = req.body.name ? sanitizeString(req.body.name) : undefined;
        const provider = req.body.provider !== undefined ? (req.body.provider ? sanitizeString(req.body.provider) : null) : undefined;
        const renewal_date = req.body.renewal_date;
        const notice_period_days = req.body.notice_period_days !== undefined ? parseInt(req.body.notice_period_days) : undefined;
        const status = req.body.status ? req.body.status.toLowerCase() : undefined;
        
        // ✅ CHAMPS LICENCES
        const pricing_model = req.body.pricing_model !== undefined ? req.body.pricing_model : undefined;
        const license_count = req.body.license_count !== undefined ? (req.body.license_count ? parseInt(req.body.license_count) : null) : undefined;
        const licenses_used = req.body.licenses_used !== undefined ? (req.body.licenses_used ? parseInt(req.body.licenses_used) : null) : undefined;
        const unit_cost = req.body.unit_cost !== undefined ? (req.body.unit_cost ? parseFloat(req.body.unit_cost) : null) : undefined;
        const real_users = req.body.real_users !== undefined ? (req.body.real_users ? parseInt(req.body.real_users) : null) : undefined; // ✨ NOUVEAU

        // ✅ CALCUL AUTOMATIQUE DU COÛT
        let monthly_cost = req.body.monthly_cost !== undefined ? parseFloat(req.body.monthly_cost) : undefined;
        
        const finalPricingModel = pricing_model !== undefined ? pricing_model : currentContract.pricing_model;
        const finalLicenseCount = license_count !== undefined ? license_count : currentContract.license_count;
        const finalUnitCost = unit_cost !== undefined ? unit_cost : currentContract.unit_cost;
        
        if (finalPricingModel === 'per_user' && finalLicenseCount && finalUnitCost) {
            monthly_cost = finalLicenseCount * finalUnitCost;
        }

        // Construction dynamique de la requête
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
        
        // ✅ CHAMPS LICENCES
        if (pricing_model !== undefined) { updates.push(`pricing_model = $${paramIndex++}`); values.push(pricing_model); }
        if (license_count !== undefined) { updates.push(`license_count = $${paramIndex++}`); values.push(license_count); }
        if (licenses_used !== undefined) { updates.push(`licenses_used = $${paramIndex++}`); values.push(licenses_used); }
        if (unit_cost !== undefined) { updates.push(`unit_cost = $${paramIndex++}`); values.push(unit_cost); }
        if (real_users !== undefined) { updates.push(`real_users = $${paramIndex++}`); values.push(real_users); } // ✨ NOUVEAU

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
        }

        queryText += updates.join(', ');
        queryText += ` WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
        
        values.push(id, userId);

        const result = await db.query(queryText, values);

        console.log(`${LOG_PREFIX} Contrat ${id} mis à jour par l'utilisateur ${userId}`);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur updateContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du contrat.' });
    }
};

// 4. SUPPRIMER UN CONTRAT
const deleteContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const result = await db.query(
            'DELETE FROM contracts WHERE id = $1 AND organization_id = $2 RETURNING id', 
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        console.log(`${LOG_PREFIX} Contrat ${id} supprimé par l'utilisateur ${userId}`);
        res.status(204).send();
    } catch (error) {
        console.error('Erreur deleteContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du contrat.' });
    }
};

// 5. OBTENIR LA LISTE DES FOURNISSEURS UNIQUES
const getProviders = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const queryText = `
            SELECT DISTINCT provider 
            FROM contracts 
            WHERE organization_id = $1 AND provider IS NOT NULL AND provider != ''
            ORDER BY provider ASC
        `;
        const result = await db.query(queryText, [userId]);
        
        const providers = result.rows.map(row => row.provider);
        res.status(200).json(providers);
    } catch (error) {
        console.error('Erreur getProviders:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des fournisseurs.' });
    }
};

// 6. EXPORTER LES CONTRATS EN CSV (✅ AVEC real_users)
const exportContracts = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
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
        let whereConditions = ['organization_id = $1'];
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

        // ✅ AJOUT COLONNE real_users
        let queryText = 'SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status, ';
        queryText += 'pricing_model, license_count, licenses_used, unit_cost, real_users ';
        queryText += 'FROM contracts ';
        queryText += 'WHERE ' + whereClause + ' ';
        queryText += 'ORDER BY ' + sortBy + ' ' + sortOrder;
        
        console.log(`${LOG_PREFIX} Export CSV - Query:`, queryText);
        console.log(`${LOG_PREFIX} Export CSV - Params:`, queryParams);
        
        const result = await db.query(queryText, queryParams);

        // ✅ CSV AVEC real_users
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
                parseFloat(contract.monthly_cost).toFixed(2),
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

        console.log(`${LOG_PREFIX} Export CSV de ${result.rowCount} contrats pour l'organisation ${organizationId}`);
        
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