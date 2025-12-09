// server/src/contractsController.js

const db = require('./db');
const { sanitizeString } = require('./middlewares/validation');

const LOG_PREFIX = 'Contrats SQL:';

// 1. OBTENIR TOUS LES CONTRATS (filtré par user_id) AVEC PAGINATION
const getAllContracts = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    // Paramètres de pagination avec valeurs par défaut
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validation des paramètres
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
            error: 'Paramètres de pagination invalides. Page >= 1, Limit entre 1 et 100.' 
        });
    }
    
    try {
        // Requête pour compter le nombre total de contrats
        const countQuery = 'SELECT COUNT(*) FROM contracts WHERE user_id = $1';
        const countResult = await db.query(countQuery, [userId]);
        const totalContracts = parseInt(countResult.rows[0].count);

        // Requête pour récupérer les contrats paginés
        const queryText = `
            SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status
            FROM contracts
            WHERE user_id = $1  
            ORDER BY renewal_date ASC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(queryText, [userId, limit, offset]);

        // Calcul des métadonnées
        const totalPages = Math.ceil(totalContracts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        console.log(`${LOG_PREFIX} Page ${page}/${totalPages} - ${result.rowCount} contrats pour l'utilisateur ${userId}`);

        res.status(200).json({
            contracts: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalContracts: totalContracts,
                limit: limit,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
            }
        });
    } catch (error) {
        console.error('Erreur getAllContracts:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des contrats.' });
    }
};

// 2. CRÉER UN CONTRAT (insère user_id)
const createContract = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }
    
    // Sanitize les données
    const name = sanitizeString(req.body.name);
    const provider = req.body.provider ? sanitizeString(req.body.provider) : null;
    const monthly_cost = parseFloat(req.body.monthly_cost);
    const renewal_date = req.body.renewal_date;
    const notice_period_days = parseInt(req.body.notice_period_days) || 0;

    try {
        const queryText = `
            INSERT INTO contracts (name, provider, monthly_cost, renewal_date, notice_period_days, user_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING *
        `;
        const values = [name, provider, monthly_cost, renewal_date, notice_period_days, userId];
        const result = await db.query(queryText, values);
        
        console.log(`${LOG_PREFIX} Création du contrat ${result.rows[0].id} pour l'utilisateur ${userId}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur createContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du contrat.' });
    }
};

// 3. MODIFIER UN CONTRAT (vérifie le user_id)
const updateContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }
    
    // Sanitize les données
    const name = req.body.name ? sanitizeString(req.body.name) : undefined;
    const provider = req.body.provider ? sanitizeString(req.body.provider) : undefined;
    const monthly_cost = req.body.monthly_cost !== undefined ? parseFloat(req.body.monthly_cost) : undefined;
    const renewal_date = req.body.renewal_date;
    const notice_period_days = req.body.notice_period_days !== undefined ? parseInt(req.body.notice_period_days) : undefined;
    const status = req.body.status ? req.body.status.toLowerCase() : undefined;
    
    // Construction dynamique de la requête de mise à jour
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

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour fourni.' });
    }

    queryText += updates.join(', ');
    queryText += ` WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;
    
    values.push(id, userId);

    try {
        const result = await db.query(queryText, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        console.log(`${LOG_PREFIX} Contrat ${id} mis à jour par l'utilisateur ${userId}`);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur updateContract:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du contrat.' });
    }
};

// 4. SUPPRIMER UN CONTRAT (vérifie le user_id)
const deleteContract = async (req, res) => {
    const { id } = req.params;
    const userId = req.user;

    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé. ID utilisateur manquant.' });
    }

    try {
        const result = await db.query(
            'DELETE FROM contracts WHERE id = $1 AND user_id = $2 RETURNING id', 
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

module.exports = {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract,
};