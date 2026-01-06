const db = require('../db');

const globalSearch = async (req, res) => {
    const organizationId = req.organizationId;
    const query = req.query.q ? req.query.q.trim() : '';
    
    if (!query || query.length < 2) {
        return res.status(400).json({ 
            error: 'La recherche doit contenir au moins 2 caractères' 
        });
    }

    console.log(`🔍 Recherche: "${query}" pour org: ${organizationId}`);

    try {
        const searchPattern = `%${query.toLowerCase()}%`;
        
        // ✅ CONTRACTS - Cherche dans name et provider
        const contractsQuery = `
            SELECT 
                'contract' as type,
                id,
                name as title,
                provider as subtitle,
                monthly_cost as value,
                renewal_date as date,
                status
            FROM contracts
            WHERE organization_id = $1
            AND (
                LOWER(name) LIKE $2 
                OR LOWER(provider) LIKE $2
            )
            AND deleted_at IS NULL
            ORDER BY name
            LIMIT 20
        `;
        
        // ✅ EMPLOYEES - Affiche job_title, cherche dans job_title ET department
        const employeesQuery = `
            SELECT 
                'employee' as type,
                id,
                CONCAT(first_name, ' ', last_name) as title,
                email as subtitle,
                job_title as value,
                hire_date as date,
                status
            FROM employees
            WHERE organization_id = $1
            AND (
                LOWER(first_name) LIKE $2 
                OR LOWER(last_name) LIKE $2
                OR LOWER(email) LIKE $2
                OR LOWER(job_title) LIKE $2
                OR LOWER(department) LIKE $2
            )
            AND deleted_at IS NULL
            ORDER BY last_name, first_name
            LIMIT 20
        `;
        
        // ✅ ASSETS - Affiche asset_type, cherche dans name, asset_type, manufacturer, model, serial_number
        const assetsQuery = `
            SELECT 
                'asset' as type,
                id,
                name as title,
                asset_type as subtitle,
                purchase_price as value,
                purchase_date as date,
                status
            FROM assets
            WHERE organization_id = $1
            AND (
                LOWER(name) LIKE $2 
                OR LOWER(asset_type) LIKE $2
                OR LOWER(manufacturer) LIKE $2
                OR LOWER(model) LIKE $2
                OR LOWER(serial_number) LIKE $2
            )
            AND deleted_at IS NULL
            ORDER BY name
            LIMIT 20
        `;
        
        // ✅ PURCHASE REQUESTS - Cherche dans title, description, request_number, supplier_name
        const purchaseRequestsQuery = `
            SELECT 
                'purchase_request' as type,
                pr.id,
                pr.title,
                pr.request_number as subtitle,
                pr.amount as value,
                pr.created_at as date,
                pr.status
            FROM purchase_requests pr
            WHERE pr.organization_id = $1
            AND (
                LOWER(pr.title) LIKE $2 
                OR LOWER(pr.description) LIKE $2
                OR LOWER(pr.request_number) LIKE $2
                OR LOWER(pr.supplier_name) LIKE $2
            )
            ORDER BY pr.created_at DESC
            LIMIT 20
        `;
        
        // ✅ Exécution parallèle des 4 requêtes
        const [contracts, employees, assets, purchaseRequests] = await Promise.all([
            db.query(contractsQuery, [organizationId, searchPattern]),
            db.query(employeesQuery, [organizationId, searchPattern]),
            db.query(assetsQuery, [organizationId, searchPattern]),
            db.query(purchaseRequestsQuery, [organizationId, searchPattern])
        ]);
        
        const totalResults = 
            contracts.rows.length + 
            employees.rows.length + 
            assets.rows.length + 
            purchaseRequests.rows.length;
        
        console.log(`✅ Recherche "${query}" : ${totalResults} résultats (${contracts.rows.length} contrats, ${employees.rows.length} employés, ${assets.rows.length} assets, ${purchaseRequests.rows.length} demandes)`);
        
        res.status(200).json({
            query,
            totalResults,
            results: {
                contracts: contracts.rows,
                employees: employees.rows,
                assets: assets.rows,
                purchaseRequests: purchaseRequests.rows
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur recherche globale:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

module.exports = {
    globalSearch
};