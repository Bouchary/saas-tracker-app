// server/src/contracts.controller.js

const db = require('./db');

// Remplacement des logs par la variable
const LOG_PREFIX = 'Contrats SQL:';

// 1. OBTENIR TOUS LES CONTRATS (filtré par user_id)
const getAllContracts = async (req, res) => {
    // Récupération de l'ID utilisateur à partir du middleware
    const userId = req.userId; 
    
    try {
        const queryText = `
            SELECT id, name, provider, monthly_cost, renewal_date, notice_period_days, status
            FROM contracts
            WHERE user_id = $1  
            ORDER BY renewal_date ASC
        `;
        const result = await db.query(queryText, [userId]);
        console.log(`${LOG_PREFIX} Sélection de ${result.rowCount} contrats pour l'utilisateur ${userId}`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur getAllContracts:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des contrats.' });
    }
};

// 2. CRÉER UN CONTRAT (insère user_id)
const createContract = async (req, res) => {
    const { name, provider, monthly_cost, renewal_date, notice_period_days } = req.body;
    const userId = req.userId; // Récupération de l'ID utilisateur
    
    // Validation minimale
    if (!name || !monthly_cost || !renewal_date) {
        return res.status(400).json({ error: 'Nom, coût et date de renouvellement sont requis.' });
    }

    try {
        const queryText = `
            INSERT INTO contracts (name, provider, monthly_cost, renewal_date, notice_period_days, user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
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
    const { name, provider, monthly_cost, renewal_date, notice_period_days, status } = req.body;
    const userId = req.userId; // Récupération de l'ID utilisateur
    
    // Construction dynamique de la requête de mise à jour (pour ne mettre à jour que les champs fournis)
    let queryText = 'UPDATE contracts SET ';
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Ajouter les champs modifiés à la requête
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
    
    // Condition : l'ID doit correspondre ET l'utilisateur doit être le propriétaire
    queryText += ` WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;
    
    values.push(id, userId);

    try {
        const result = await db.query(queryText, values);
        
        if (result.rowCount === 0) {
            // Contrat non trouvé OU l'utilisateur n'en est pas le propriétaire
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
    const userId = req.userId; // Récupération de l'ID utilisateur

    try {
        // Suppression conditionnelle par ID et user_id
        const result = await db.query('DELETE FROM contracts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

        if (result.rowCount === 0) {
            // Contrat non trouvé OU l'utilisateur n'en est pas le propriétaire
            return res.status(404).json({ error: 'Contrat non trouvé ou accès non autorisé.' });
        }

        console.log(`${LOG_PREFIX} Contrat ${id} supprimé par l'utilisateur ${userId}`);
        res.status(204).send(); // 204 No Content pour une suppression réussie
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