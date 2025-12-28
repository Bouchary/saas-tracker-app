// server/src/contractsController.js

const db = require('./db');
const { sanitizeString } = require('./middlewares/validation');
const ExcelJS = require('exceljs');

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

// 2. CRÉER UN CONTRAT (✅ CORRIGÉ : organization_id ajouté)
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
    const real_users = req.body.real_users ? parseInt(req.body.real_users) : null;

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
        // ✅ CORRECTION : organization_id ajouté dans INSERT
        const queryText = `
            INSERT INTO contracts (
                name, provider, monthly_cost, renewal_date, notice_period_days, 
                user_id, organization_id, status, pricing_model, license_count, licenses_used, unit_cost, real_users
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const values = [
            name, provider, monthly_cost, renewal_date, notice_period_days, 
            userId, organizationId, pricing_model, license_count, licenses_used, unit_cost, real_users
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
        // Vérifier que le contrat existe ET appartient à l'organisation
        const checkResult = await db.query(
            'SELECT * FROM contracts WHERE id = $1 AND organization_id = $2',
            [id, organizationId]
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
        const real_users = req.body.real_users !== undefined ? (req.body.real_users ? parseInt(req.body.real_users) : null) : undefined;

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
        if (real_users !== undefined) { updates.push(`real_users = $${paramIndex++}`); values.push(real_users); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
        }

        queryText += updates.join(', ');
        queryText += ` WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
        
        values.push(id, organizationId);

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
            [id, organizationId]
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
        const result = await db.query(queryText, [organizationId]);
        
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

// 7. EXPORTER LES CONTRATS EN EXCEL
const exportContractsExcel = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    const search = req.query.search ? sanitizeString(req.query.search) : '';
    const status = req.query.status || '';
    const provider = req.query.provider || '';
    const sortBy = req.query.sortBy || 'renewal_date';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

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

        const queryText = `
            SELECT 
                id,
                name,
                provider,
                monthly_cost,
                renewal_date,
                notice_period_days,
                status,
                pricing_model,
                license_count,
                licenses_used,
                unit_cost,
                real_users,
                created_at
            FROM contracts
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
        `;
        
        const result = await db.query(queryText, queryParams);
        const contracts = result.rows;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SaaS Tracker';
        workbook.created = new Date();
        
        const worksheet = workbook.addWorksheet('Contrats', {
            pageSetup: { 
                paperSize: 9,
                orientation: 'landscape' 
            }
        });

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Nom', key: 'name', width: 30 },
            { header: 'Fournisseur', key: 'provider', width: 25 },
            { header: 'Coût mensuel (€)', key: 'monthly_cost', width: 18 },
            { header: 'Date renouvellement', key: 'renewal_date', width: 20 },
            { header: 'Statut', key: 'status', width: 12 },
            { header: 'Modèle tarifaire', key: 'pricing_model', width: 18 },
            { header: 'Licences totales', key: 'license_count', width: 16 },
            { header: 'Licences utilisées', key: 'licenses_used', width: 18 },
            { header: 'Utilisateurs réels', key: 'real_users', width: 18 },
            { header: 'Coût unitaire (€)', key: 'unit_cost', width: 16 },
            { header: 'Préavis (jours)', key: 'notice_period_days', width: 16 },
            { header: 'Date création', key: 'created_at', width: 20 }
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        contracts.forEach((contract, index) => {
            const row = worksheet.addRow({
                id: contract.id,
                name: contract.name || '',
                provider: contract.provider || '',
                monthly_cost: contract.monthly_cost ? parseFloat(contract.monthly_cost) : 0,
                renewal_date: contract.renewal_date ? new Date(contract.renewal_date) : '',
                status: contract.status || '',
                pricing_model: contract.pricing_model || '',
                license_count: contract.license_count || '',
                licenses_used: contract.licenses_used || '',
                real_users: contract.real_users || '',
                unit_cost: contract.unit_cost ? parseFloat(contract.unit_cost) : '',
                notice_period_days: contract.notice_period_days || '',
                created_at: contract.created_at ? new Date(contract.created_at) : ''
            });

            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF3F4F6' }
                };
            }

            row.alignment = { vertical: 'middle' };
            row.height = 20;

            const costCell = row.getCell('monthly_cost');
            costCell.numFmt = '#,##0.00 €';
            costCell.alignment = { horizontal: 'right', vertical: 'middle' };

            const unitCostCell = row.getCell('unit_cost');
            if (unitCostCell.value) {
                unitCostCell.numFmt = '#,##0.00 €';
                unitCostCell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

            const renewalCell = row.getCell('renewal_date');
            if (renewalCell.value) {
                renewalCell.numFmt = 'dd/mm/yyyy';
                renewalCell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            const createdCell = row.getCell('created_at');
            if (createdCell.value) {
                createdCell.numFmt = 'dd/mm/yyyy hh:mm';
                createdCell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            const statusCell = row.getCell('status');
            statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (contract.status === 'active') {
                statusCell.font = { color: { argb: 'FF059669' }, bold: true };
            } else if (contract.status === 'expired') {
                statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            } else if (contract.status === 'pending') {
                statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
            }
        });

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
            });
        });

        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `contrats_export_${dateStr}_${timeStr}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        
        console.log(`${LOG_PREFIX} Export Excel généré: ${contracts.length} contrats pour organisation ${organizationId}`);
        
        res.end();

    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur exportContractsExcel:`, error);
        res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
    }
};

module.exports = {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract,
    getProviders,
    exportContracts,
    exportContractsExcel
};