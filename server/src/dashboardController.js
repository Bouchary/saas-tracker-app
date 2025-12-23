// ============================================================================
// DASHBOARD CONTROLLER - VERSION PRODUCTION MULTI-TENANT
// ============================================================================
// ✅ Chaque utilisateur voit UNIQUEMENT ses propres données
// ✅ Employees: filtre par created_by
// ✅ Assets: filtre par created_by
// ✅ Contracts: filtre par user_id
// ✅ Workflows: filtre par created_by
// ============================================================================

const db = require('./db');

const LOG_PREFIX = 'Dashboard:';

// ============================================================================
// 1. OBTENIR LES KPIs GLOBAUX
// ============================================================================
const getGlobalStats = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Total contrats de cet utilisateur
        const contractsResult = await db.query(
            'SELECT COUNT(*) as total FROM contracts WHERE user_id = $1',
            [userId]
        );
        const totalContracts = parseInt(contractsResult.rows[0].total);

        // Contrats actifs de cet utilisateur
        const activeContractsResult = await db.query(
            "SELECT COUNT(*) as active FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const activeContracts = parseInt(activeContractsResult.rows[0].active);

        // Coût total mensuel de cet utilisateur
        const costResult = await db.query(
            "SELECT COALESCE(SUM(monthly_cost), 0) as total_cost FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const totalCost = parseFloat(costResult.rows[0].total_cost);

        // Total assets créés par cet utilisateur
        const assetsResult = await db.query(
            'SELECT COUNT(*) as total FROM assets WHERE created_by = $1',
            [userId]
        );
        const totalAssets = parseInt(assetsResult.rows[0].total);

        // Assets assignés créés par cet utilisateur
        const assignedAssetsResult = await db.query(
            "SELECT COUNT(DISTINCT asset_id) as assigned FROM asset_assignments WHERE created_by = $1 AND status = 'active'",
            [userId]
        );
        const assignedAssets = parseInt(assignedAssetsResult.rows[0].assigned || 0);

        // Total employés créés par cet utilisateur
        const employeesResult = await db.query(
            'SELECT COUNT(*) as total FROM employees WHERE created_by = $1',
            [userId]
        );
        const totalEmployees = parseInt(employeesResult.rows[0].total);

        // Employés actifs créés par cet utilisateur
        const activeEmployeesResult = await db.query(
            "SELECT COUNT(*) as active FROM employees WHERE created_by = $1 AND status = 'active'",
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

// ============================================================================
// 2. VUE GLOBALE POUR DASHBOARD V2
// ============================================================================
const getGlobalView = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // KPIs - Coût total contrats de cet utilisateur
        const costResult = await db.query(
            "SELECT COALESCE(SUM(monthly_cost), 0) as total_cost FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const totalCost = parseFloat(costResult.rows[0].total_cost);

        // Employés actifs créés par cet utilisateur
        const employeesResult = await db.query(
            "SELECT COUNT(*) as active FROM employees WHERE created_by = $1 AND status = 'active'",
            [userId]
        );
        const activeEmployees = parseInt(employeesResult.rows[0].active);

        const costPerEmployee = activeEmployees > 0 ? totalCost / activeEmployees : 0;

        // Contrats actifs de cet utilisateur
        const contractsResult = await db.query(
            "SELECT COUNT(*) as active FROM contracts WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        const activeContracts = parseInt(contractsResult.rows[0].active);

        // Assets créés par cet utilisateur
        const assetsResult = await db.query(
            'SELECT COUNT(*) as total FROM assets WHERE created_by = $1',
            [userId]
        );
        const totalAssets = parseInt(assetsResult.rows[0].total);

        // Taux d'utilisation licences de cet utilisateur
        const licensesResult = await db.query(`
            SELECT 
                COALESCE(SUM(license_count), 0) as total_licenses,
                COALESCE(SUM(licenses_used), 0) as used_licenses
            FROM contracts
            WHERE user_id = $1 
            AND status = 'active'
            AND pricing_model = 'per_user'
            AND license_count IS NOT NULL
        `, [userId]);
        
        const totalLicenses = parseInt(licensesResult.rows[0].total_licenses);
        const usedLicenses = parseInt(licensesResult.rows[0].used_licenses);
        const utilizationRate = totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0;

        // Économies potentielles de cet utilisateur
        const unusedResult = await db.query(`
            SELECT COALESCE(SUM((license_count - licenses_used) * unit_cost), 0) as wasted
            FROM contracts
            WHERE user_id = $1 
            AND status = 'active'
            AND pricing_model = 'per_user'
            AND licenses_used < license_count
        `, [userId]);
        const potentialSavings = parseFloat(unusedResult.rows[0].wasted);

        // Score efficacité
        const efficiency = Math.min(Math.round(utilizationRate * 1.2), 100);

        // Coûts par département (employés créés par cet utilisateur)
        const deptCostsResult = await db.query(`
            SELECT 
                department,
                COUNT(*) as employees
            FROM employees
            WHERE created_by = $1 
            AND status = 'active'
            AND department IS NOT NULL
            GROUP BY department
            ORDER BY employees DESC
            LIMIT 10
        `, [userId]);

        // Calculer coût par département (répartition proportionnelle)
        const departmentCosts = deptCostsResult.rows.map(row => {
            const employeeCount = parseInt(row.employees);
            const deptCost = activeEmployees > 0 ? (totalCost / activeEmployees) * employeeCount : 0;
            return {
                name: row.department,
                cost: Math.round(deptCost),
                employees: employeeCount,
                costPerEmployee: employeeCount > 0 ? Math.round(deptCost / employeeCount) : 0
            };
        });

        // Distribution des coûts
        const assetsCost = totalCost * 0.27;
        const maintenanceCost = totalCost * 0.11;

        const costDistribution = [
            { name: 'Contrats SaaS', value: totalCost, percent: 62.2 },
            { name: 'Matériel', value: assetsCost, percent: 26.7 },
            { name: 'Maintenance', value: maintenanceCost, percent: 11.1 }
        ];

        // Tendance mensuelle (simulée - à remplacer par historique réel en production)
        const monthlyTrend = [
            { month: 'Oct', contracts: totalCost * 0.9, assets: assetsCost * 0.9, total: (totalCost + assetsCost) * 0.9 },
            { month: 'Nov', contracts: totalCost * 0.95, assets: assetsCost * 0.95, total: (totalCost + assetsCost) * 0.95 },
            { month: 'Déc', contracts: totalCost, assets: assetsCost, total: totalCost + assetsCost }
        ];

        // Alertes
        const alerts = [];
        if (potentialSavings > 1000) {
            alerts.push({
                type: 'warning',
                message: `${Math.round(potentialSavings)}€/mois de licences inutilisées détectées`,
                action: 'Optimiser',
                target: 'contracts'
            });
        }

        // Valeurs précédentes (simulées - à remplacer par historique réel en production)
        const response = {
            kpis: {
                totalCost: { current: totalCost, previous: totalCost * 0.93 },
                activeContracts: { current: activeContracts, previous: Math.round(activeContracts * 0.92) },
                totalAssets: { current: totalAssets, previous: Math.round(totalAssets * 0.95) },
                activeEmployees: { current: activeEmployees, previous: Math.round(activeEmployees * 0.98) },
                costPerEmployee: { current: costPerEmployee, previous: costPerEmployee * 0.94 },
                utilizationRate: { current: utilizationRate, previous: utilizationRate * 0.93 },
                potentialSavings: { current: potentialSavings, previous: potentialSavings * 1.05 },
                efficiency: { current: efficiency, previous: Math.round(efficiency * 0.95) }
            },
            departmentCosts,
            costDistribution,
            monthlyTrend,
            alerts
        };

        console.log(`${LOG_PREFIX} Vue globale pour utilisateur ${userId}`);
        res.status(200).json(response);
        
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getGlobalView:`, error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

// ============================================================================
// 3. ANALYTICS CONTRATS
// ============================================================================
const getContractsAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Répartition par fournisseur (Top 10) - contrats de cet utilisateur
        const providerQuery = `
            SELECT provider, COUNT(*) as count, SUM(monthly_cost) as total_cost
            FROM contracts
            WHERE user_id = $1 AND status = 'active' AND provider IS NOT NULL
            GROUP BY provider
            ORDER BY total_cost DESC
            LIMIT 10
        `;
        const providersResult = await db.query(providerQuery, [userId]);

        // Top 10 contrats les plus coûteux de cet utilisateur
        const topContractsQuery = `
            SELECT name, provider, monthly_cost, pricing_model
            FROM contracts
            WHERE user_id = $1 AND status = 'active'
            ORDER BY monthly_cost DESC
            LIMIT 10
        `;
        const topContractsResult = await db.query(topContractsQuery, [userId]);

        // Répartition par modèle tarifaire de cet utilisateur
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

        // Contrats expirant dans 30 jours de cet utilisateur
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

// ============================================================================
// 4. ANALYTICS LICENCES
// ============================================================================
const getLicensesAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Statistiques licences de cet utilisateur
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

// ============================================================================
// 5. ANALYTICS ASSETS
// ============================================================================
const getAssetsAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Répartition par type - assets créés par cet utilisateur
        const typeQuery = `
            SELECT asset_type, COUNT(*) as count
            FROM assets
            WHERE created_by = $1
            GROUP BY asset_type
            ORDER BY count DESC
        `;
        const typesResult = await db.query(typeQuery, [userId]);

        // Répartition par statut - assets créés par cet utilisateur
        const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM assets
            WHERE created_by = $1
            GROUP BY status
        `;
        const statusResult = await db.query(statusQuery, [userId]);

        // Assets sous garantie - assets créés par cet utilisateur
        const warrantyQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE) as under_warranty,
                COUNT(*) FILTER (WHERE warranty_end_date <= CURRENT_DATE OR warranty_end_date IS NULL) as expired_warranty
            FROM assets
            WHERE created_by = $1
        `;
        const warrantyResult = await db.query(warrantyQuery, [userId]);

        // Assets expiration garantie prochaine (30 jours) - assets créés par cet utilisateur
        const expiringWarrantyQuery = `
            SELECT serial_number, model, asset_type, warranty_end_date
            FROM assets
            WHERE created_by = $1
            AND warranty_end_date IS NOT NULL
            AND warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'
            AND warranty_end_date >= CURRENT_DATE
            ORDER BY warranty_end_date ASC
            LIMIT 10
        `;
        const expiringWarrantyResult = await db.query(expiringWarrantyQuery, [userId]);

        // Valeur totale assets - assets créés par cet utilisateur
        const valueQuery = `
            SELECT 
                COALESCE(SUM(purchase_price), 0) as total_value,
                COALESCE(AVG(purchase_price), 0) as average_value
            FROM assets
            WHERE created_by = $1 AND purchase_price IS NOT NULL
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

// ============================================================================
// 6. ANALYTICS EMPLOYÉS
// ============================================================================
const getEmployeesAnalytics = async (req, res) => {
    const userId = req.user;
    
    if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // Répartition par département - employés créés par cet utilisateur
        const deptQuery = `
            SELECT department, COUNT(*) as count
            FROM employees
            WHERE created_by = $1 AND status = 'active'
            GROUP BY department
            ORDER BY count DESC
        `;
        const deptResult = await db.query(deptQuery, [userId]);

        // Répartition par poste - employés créés par cet utilisateur
        const positionQuery = `
            SELECT job_title as position, COUNT(*) as count
            FROM employees
            WHERE created_by = $1 AND status = 'active' AND job_title IS NOT NULL
            GROUP BY job_title
            ORDER BY count DESC
            LIMIT 10
        `;
        const positionResult = await db.query(positionQuery, [userId]);

        // Top détenteurs d'assets - employés créés par cet utilisateur avec assets créés par cet utilisateur
        const topAssetsQuery = `
            SELECT 
                e.id,
                e.first_name || ' ' || e.last_name as name,
                e.department,
                COUNT(a.id) as asset_count
            FROM employees e
            LEFT JOIN assets a ON a.currently_assigned_to = e.id AND a.created_by = $1
            WHERE e.created_by = $1 AND e.status = 'active'
            GROUP BY e.id, e.first_name, e.last_name, e.department
            HAVING COUNT(a.id) > 0
            ORDER BY asset_count DESC
            LIMIT 10
        `;
        const topAssetsResult = await db.query(topAssetsQuery, [userId]);

        console.log(`${LOG_PREFIX} Analytics employés pour utilisateur ${userId}`);

        res.status(200).json({
            byDepartment: deptResult.rows,
            byPosition: positionResult.rows,
            topAssetHolders: topAssetsResult.rows
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getEmployeesAnalytics:`, error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    getGlobalStats,
    getGlobalView,
    getContractsAnalytics,
    getLicensesAnalytics,
    getAssetsAnalytics,
    getEmployeesAnalytics
};