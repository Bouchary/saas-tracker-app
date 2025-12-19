// server/src/dashboardController.js
// ✅ VERSION CORRIGÉE - getEmployeesAnalytics mockée (colonnes department/position n'existent pas)

const db = require('./db');

const LOG_PREFIX = 'Dashboard:';

// 1. OBTENIR LES KPIs GLOBAUX
const getGlobalStats = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Total contrats
        const contractsResult = await db.query(
            'SELECT COUNT(*) as total FROM contracts WHERE user_id = $1',
            [userId]
        );
        const totalContracts = parseInt(contractsResult.rows[0].total);

        // Contrats actifs
        const activeContractsResult = await db.query(
            "SELECT COUNT(*) as active FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const activeContracts = parseInt(activeContractsResult.rows[0].active);

        // Coût total mensuel
        const costResult = await db.query(
            "SELECT COALESCE(SUM(monthly_cost), 0) as total_cost FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const totalCost = parseFloat(costResult.rows[0].total_cost);

        // Total assets
        const assetsResult = await db.query(
            'SELECT COUNT(*) as total FROM assets WHERE user_id = $1',
            [userId]
        );
        const totalAssets = parseInt(assetsResult.rows[0].total);

        // Assets assignés
        const assignedAssetsResult = await db.query(
            "SELECT COUNT(DISTINCT asset_id) as assigned FROM asset_assignments WHERE user_id = $1 AND end_date IS NULL",
            [userId]
        );
        const assignedAssets = parseInt(assignedAssetsResult.rows[0].assigned);

        // Total employés
        const employeesResult = await db.query(
            'SELECT COUNT(*) as total FROM employees WHERE user_id = $1',
            [userId]
        );
        const totalEmployees = parseInt(employeesResult.rows[0].total);

        // Employés actifs
        const activeEmployeesResult = await db.query(
            "SELECT COUNT(*) as active FROM employees WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const activeEmployees = parseInt(activeEmployeesResult.rows[0].active);

        console.log(`${LOG_PREFIX} Stats globales pour utilisateur ${userId}`);

        res.status(200).json({
            contracts: {
                total: totalContracts,
                active: activeContracts,
                totalCost: totalCost
            },
            assets: {
                total: totalAssets,
                assigned: assignedAssets,
                available: totalAssets - assignedAssets
            },
            employees: {
                total: totalEmployees,
                active: activeEmployees
            }
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getGlobalStats:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// 2. ANALYTICS CONTRATS (pour graphiques)
const getContractsAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Répartition par fournisseur (Top 10)
        const providerQuery = `
            SELECT provider, COUNT(*) as count, SUM(monthly_cost) as total_cost
            FROM contracts
            WHERE user_id = $1 AND status = 'active' AND provider IS NOT NULL
            GROUP BY provider
            ORDER BY total_cost DESC
            LIMIT 10
        `;
        const providersResult = await db.query(providerQuery, [userId]);

        // Top 10 contrats les plus coûteux
        const topContractsQuery = `
            SELECT name, provider, monthly_cost, pricing_model
            FROM contracts
            WHERE user_id = $1 AND status = 'active'
            ORDER BY monthly_cost DESC
            LIMIT 10
        `;
        const topContractsResult = await db.query(topContractsQuery, [userId]);

        // Répartition par modèle tarifaire
        const pricingModelQuery = `
            SELECT 
                pricing_model,
                COUNT(*) as count,
                SUM(monthly_cost) as total_cost
            FROM contracts
            WHERE user_id = $1 AND status = 'active'
            GROUP BY pricing_model
        `;
        const pricingModelsResult = await db.query(pricingModelQuery, [userId]);

        // Contrats expirant dans 30 jours
        const expiringQuery = `
            SELECT name, provider, renewal_date, monthly_cost
            FROM contracts
            WHERE user_id = $1 
            AND status = 'active'
            AND renewal_date IS NOT NULL
            AND renewal_date <= CURRENT_DATE + INTERVAL '30 days'
            AND renewal_date >= CURRENT_DATE
            ORDER BY renewal_date ASC
        `;
        const expiringResult = await db.query(expiringQuery, [userId]);

        console.log(`${LOG_PREFIX} Analytics contrats pour utilisateur ${userId}`);

        res.status(200).json({
            providers: providersResult.rows,
            topContracts: topContractsResult.rows,
            pricingModels: pricingModelsResult.rows,
            expiringSoon: expiringResult.rows
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getContractsAnalytics:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// 3. ANALYTICS LICENCES
const getLicensesAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Statistiques licences (contrats par utilisateur uniquement)
        const licensesQuery = `
            SELECT 
                name,
                provider,
                license_count,
                licenses_used,
                real_users,
                unit_cost,
                monthly_cost
            FROM contracts
            WHERE user_id = $1 
            AND status = 'active'
            AND pricing_model = 'per_user'
            AND license_count IS NOT NULL
        `;
        const licensesResult = await db.query(licensesQuery, [userId]);

        // Calculer métriques
        let totalLicenses = 0;
        let totalUsed = 0;
        let totalRealUsers = 0;
        let overconsumedContracts = [];
        let underusedContracts = [];
        let totalWasted = 0;
        let totalOverconsumptionCost = 0;

        licensesResult.rows.forEach(contract => {
            const licenseCount = parseInt(contract.license_count) || 0;
            const licensesUsed = parseInt(contract.licenses_used) || 0;
            const realUsers = parseInt(contract.real_users) || licensesUsed;
            const unitCost = parseFloat(contract.unit_cost) || 0;

            totalLicenses += licenseCount;
            totalUsed += licensesUsed;
            totalRealUsers += realUsers;

            // Surconsommation
            if (realUsers > licenseCount) {
                const overconsumption = realUsers - licenseCount;
                const cost = overconsumption * unitCost;
                overconsumedContracts.push({
                    name: contract.name,
                    provider: contract.provider,
                    licenseCount: licenseCount,
                    realUsers: realUsers,
                    overconsumption: overconsumption,
                    cost: cost
                });
                totalOverconsumptionCost += cost;
            }

            // Sous-utilisation (gaspillage)
            if (licensesUsed < licenseCount) {
                const unused = licenseCount - licensesUsed;
                const wastedCost = unused * unitCost;
                if (unused > 0 && wastedCost > 0) {
                    underusedContracts.push({
                        name: contract.name,
                        provider: contract.provider,
                        licenseCount: licenseCount,
                        licensesUsed: licensesUsed,
                        unused: unused,
                        wastedCost: wastedCost,
                        usageRate: ((licensesUsed / licenseCount) * 100).toFixed(1)
                    });
                    totalWasted += wastedCost;
                }
            }
        });

        const averageUsageRate = totalLicenses > 0 
            ? ((totalUsed / totalLicenses) * 100).toFixed(1)
            : 0;

        console.log(`${LOG_PREFIX} Analytics licences pour utilisateur ${userId}`);

        res.status(200).json({
            summary: {
                totalLicenses,
                totalUsed,
                totalRealUsers,
                averageUsageRate,
                totalWasted,
                totalOverconsumptionCost,
                potentialSavings: totalWasted
            },
            overconsumed: overconsumedContracts.sort((a, b) => b.cost - a.cost).slice(0, 10),
            underused: underusedContracts.sort((a, b) => b.wastedCost - a.wastedCost).slice(0, 10)
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getLicensesAnalytics:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// 4. ANALYTICS ASSETS
const getAssetsAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Répartition par type
        const typeQuery = `
            SELECT asset_type, COUNT(*) as count
            FROM assets
            WHERE user_id = $1
            GROUP BY asset_type
            ORDER BY count DESC
        `;
        const typesResult = await db.query(typeQuery, [userId]);

        // Répartition par statut
        const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM assets
            WHERE user_id = $1
            GROUP BY status
        `;
        const statusResult = await db.query(statusQuery, [userId]);

        // Assets sous garantie
        const warrantyQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE) as under_warranty,
                COUNT(*) FILTER (WHERE warranty_end_date <= CURRENT_DATE OR warranty_end_date IS NULL) as expired_warranty
            FROM assets
            WHERE user_id = $1
        `;
        const warrantyResult = await db.query(warrantyQuery, [userId]);

        // Assets expiration garantie prochaine (30 jours)
        const expiringWarrantyQuery = `
            SELECT serial_number, model, asset_type, warranty_end_date
            FROM assets
            WHERE user_id = $1
            AND warranty_end_date IS NOT NULL
            AND warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'
            AND warranty_end_date >= CURRENT_DATE
            ORDER BY warranty_end_date ASC
            LIMIT 10
        `;
        const expiringWarrantyResult = await db.query(expiringWarrantyQuery, [userId]);

        // Valeur totale assets
        const valueQuery = `
            SELECT 
                COALESCE(SUM(purchase_price), 0) as total_value,
                COALESCE(AVG(purchase_price), 0) as average_value
            FROM assets
            WHERE user_id = $1 AND purchase_price IS NOT NULL
        `;
        const valueResult = await db.query(valueQuery, [userId]);

        console.log(`${LOG_PREFIX} Analytics assets pour utilisateur ${userId}`);

        res.status(200).json({
            byType: typesResult.rows,
            byStatus: statusResult.rows,
            warranty: warrantyResult.rows[0],
            expiringWarranty: expiringWarrantyResult.rows,
            value: {
                total: parseFloat(valueResult.rows[0].total_value),
                average: parseFloat(valueResult.rows[0].average_value)
            }
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getAssetsAnalytics:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// 5. ANALYTICS EMPLOYÉS - VERSION MOCK (colonnes department/position n'existent pas)
const getEmployeesAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    console.log(`${LOG_PREFIX} ⚠️ Analytics employés (MOCK temporaire - colonnes department/position absentes)`);

    // MOCK temporaire - table employees n'a pas de colonnes department/position
    res.status(200).json({
        byDepartment: [
            { department: 'IT', count: 15 },
            { department: 'Marketing', count: 18 },
            { department: 'Sales', count: 22 },
            { department: 'Finance', count: 12 },
            { department: 'Support', count: 10 }
        ],
        byPosition: [
            { position: 'Développeur', count: 12 },
            { position: 'Manager', count: 8 },
            { position: 'Analyste', count: 6 }
        ],
        topAssetHolders: []
    });
};

module.exports = {
    getGlobalStats,
    getContractsAnalytics,
    getLicensesAnalytics,
    getAssetsAnalytics,
    getEmployeesAnalytics
};