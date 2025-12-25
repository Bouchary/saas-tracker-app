// ============================================================================
// DASHBOARD CONTROLLER - VERSION PRODUCTION MULTI-TENANT
// ============================================================================
// ✅ Chaque utilisateur voit UNIQUEMENT ses propres données
// ✅ Employees: filtre par created_by
// ✅ Assets: filtre par created_by
// ✅ Contracts: filtre par user_id
// ✅ Workflows: filtre par created_by
// ✅ CORRECTION #1 : getGlobalView avec départements réels (depuis server.js)
// ============================================================================

const db = require('./db');

const LOG_PREFIX = 'Dashboard:';

// ============================================================================
// HELPER : COÛTS PAR DÉPARTEMENT
// ============================================================================

/**
 * Récupère les coûts réels par département depuis department_allocations
 * Si la table est vide, retourne null pour utiliser le mock
 */
const getDepartmentCostsFromAllocations = async (userId) => {
  try {
    // Vérifier si des allocations existent
    const checkResult = await db.query(
      `SELECT COUNT(*) as count FROM department_allocations WHERE user_id = $1`,
      [userId]
    );

    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log('📊 Départements: Aucune allocation → utilisation mock');
      return null; // Pas d'allocations → utiliser le mock
    }

    // Récupérer les coûts par département (contrats)
    const contractCostsResult = await db.query(
      `SELECT 
                da.department,
                SUM(c.monthly_cost * (da.allocation_percent / 100)) as cost
             FROM department_allocations da
             JOIN contracts c ON da.contract_id = c.id
             WHERE da.user_id = $1 AND c.status = 'active' AND da.contract_id IS NOT NULL
             GROUP BY da.department`,
      [userId]
    );

    // Récupérer les coûts par département (assets - estimation mensuelle)
    // ✅ CORRECTION #16 : Coefficients documentés
    // - /36 = amortissement sur 3 ans (36 mois) pour calculer coût mensuel
    // - 150€ = valeur par défaut si purchase_price est NULL (estimation moyenne laptop/matériel)
    const assetCostsResult = await db.query(
      `SELECT 
                da.department,
                SUM(COALESCE(a.purchase_price / 36, 150) * (da.allocation_percent / 100)) as cost
             FROM department_allocations da
             JOIN assets a ON da.asset_id = a.id
             WHERE da.user_id = $1 AND da.asset_id IS NOT NULL
             GROUP BY da.department`,
      [userId]
    );

    // Fusionner les coûts contrats + assets par département
    const departmentMap = new Map();

    contractCostsResult.rows.forEach(row => {
      const dept = row.department;
      const cost = parseFloat(row.cost) || 0;
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + cost);
    });

    assetCostsResult.rows.forEach(row => {
      const dept = row.department;
      const cost = parseFloat(row.cost) || 0;
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + cost);
    });

    // Récupérer le nombre d'employés par département (si colonne existe)
    let employeesByDept = new Map();
    try {
      // ✅ FIX MULTI-TENANT : employees filtrés par created_by (pas user_id)
      const employeesResult = await db.query(
        `SELECT department, COUNT(*) as count 
                 FROM employees 
                 WHERE created_by = $1 AND status = 'active' AND department IS NOT NULL
                 GROUP BY department`,
        [userId]
      );
      employeesResult.rows.forEach(row => {
        employeesByDept.set(row.department, parseInt(row.count));
      });
    } catch (err) {
      // Colonne department n'existe pas dans employees - pas grave
      console.log('📊 Départements: employees.department non disponible');
    }

    // Construire le résultat final
    const departments = Array.from(departmentMap.entries()).map(([name, cost]) => {
      const employees = employeesByDept.get(name) || 1; // Minimum 1 pour éviter division par 0
      return {
        name,
        cost: Math.round(cost * 100) / 100,
        employees,
        costPerEmployee: Math.round((cost / employees) * 100) / 100
      };
    });

    // Trier par coût décroissant
    departments.sort((a, b) => b.cost - a.cost);

    console.log(`📊 Départements: ${departments.length} départements avec allocations réelles`);

    return { departments, isMocked: false };

  } catch (error) {
    console.error('📊 Départements: Erreur lecture allocations:', error.message);
    return null; // En cas d'erreur → utiliser le mock
  }
};

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
        // ✅ CORRECTION #6 : JOIN avec assets pour filtre tenant
        const assignedAssetsResult = await db.query(
            `SELECT COUNT(DISTINCT aa.asset_id) as assigned 
             FROM asset_assignments aa
             JOIN assets a ON aa.asset_id = a.id
             WHERE a.created_by = $1 AND aa.status = 'active'`,
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
// 2. VUE GLOBALE POUR DASHBOARD V2 (avec départements réels)
// ✅ CORRECTION #1 : Version complète depuis server.js
// ============================================================================
const getGlobalView = async (req, res) => {
  const userId = req.user;

  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  console.log('🎯 COMPLET: Début pour user', userId);

  try {
    // 1. Coût total
    console.log('🎯 COMPLET: Requête coût...');
    const costResult = await db.query(
      `SELECT COALESCE(SUM(monthly_cost), 0) as total FROM contracts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const currentCost = parseFloat(costResult.rows[0].total);
    console.log('✅ Coût:', currentCost);

    // 2. Contrats
    console.log('🎯 COMPLET: Requête contrats...');
    const contractsResult = await db.query(
      `SELECT COUNT(*) as current FROM contracts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const activeContracts = parseInt(contractsResult.rows[0].current);
    console.log('✅ Contrats:', activeContracts);

    // 3. Assets
    console.log('🎯 COMPLET: Requête assets...');
    const assetsResult = await db.query(
      `SELECT COUNT(*) as total FROM assets WHERE created_by = $1`,
      [userId]
    );
    const totalAssets = parseInt(assetsResult.rows[0].total);
    console.log('✅ Assets:', totalAssets);

    // 4. Employés
    console.log('🎯 COMPLET: Requête employés...');
    // ✅ FIX MULTI-TENANT : employees filtrés par created_by (pas user_id)
    const employeesResult = await db.query(
      `SELECT COUNT(*) as total FROM employees WHERE created_by = $1 AND status = 'active'`,
      [userId]
    );
    const activeEmployees = parseInt(employeesResult.rows[0].total);
    console.log('✅ Employés:', activeEmployees);

    // 5. Utilisation licences
    console.log('🎯 COMPLET: Requête licences...');
    const utilizationResult = await db.query(
      `SELECT 
                COALESCE(SUM(license_count), 0) as total_licenses, 
                COALESCE(SUM(licenses_used), 0) as total_used
             FROM contracts 
             WHERE user_id = $1 AND status = 'active' AND pricing_model = 'per_user'`,
      [userId]
    );
    const totalLicenses = parseInt(utilizationResult.rows[0].total_licenses);
    const totalUsed = parseInt(utilizationResult.rows[0].total_used);
    const utilizationRate = totalLicenses > 0 ? (totalUsed / totalLicenses) * 100 : 0;
    console.log('✅ Licences:', { totalLicenses, totalUsed, utilizationRate });

    // 6. Économies
    console.log('🎯 COMPLET: Requête économies...');
    const savingsResult = await db.query(
      `SELECT COALESCE(SUM((license_count - licenses_used) * unit_cost), 0) as potential_savings
             FROM contracts 
             WHERE user_id = $1 AND status = 'active' AND pricing_model = 'per_user' AND licenses_used < license_count`,
      [userId]
    );
    const potentialSavings = parseFloat(savingsResult.rows[0].potential_savings) || 0;
    console.log('✅ Économies:', potentialSavings);

    // 7. ✅ NOUVEAU : Départements (réels ou mock)
    console.log('🎯 COMPLET: Requête départements...');
    let departmentCostsResult = await getDepartmentCostsFromAllocations(userId);
    let departmentCosts;
    let departmentsMocked = false;

    // Si pas d'allocations, utiliser le mock basé sur le coût total
    // ✅ CORRECTION #16 : Coefficients mock départements documentés
    // ✅ CORRECTION #17 : Flag isMocked pour données simulées
    // Répartition typique des coûts IT dans une PME :
    // - IT: 30% (infrastructure, licences techniques)
    // - Marketing: 25% (CRM, analytics, automation)
    // - Sales: 20% (CRM, prospection)
    // - Support: 15% (helpdesk, ticketing)
    // - Finance: 10% (ERP, comptabilité)
    // Répartition employés basée sur structure PME standard
    if (!departmentCostsResult) {
      departmentsMocked = true;
      const totalEmployeesForCalc = activeEmployees > 0 ? activeEmployees : 1;
      departmentCosts = [
        {
          name: 'IT',
          cost: currentCost * 0.3, // 30% du coût total
          employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.2)), // 20% des employés
          costPerEmployee: (currentCost * 0.3) / Math.max(1, Math.round(totalEmployeesForCalc * 0.2))
        },
        {
          name: 'Marketing',
          cost: currentCost * 0.25, // 25% du coût total
          employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.24)), // 24% des employés
          costPerEmployee: (currentCost * 0.25) / Math.max(1, Math.round(totalEmployeesForCalc * 0.24))
        },
        {
          name: 'Sales',
          cost: currentCost * 0.2, // 20% du coût total
          employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.3)), // 30% des employés
          costPerEmployee: (currentCost * 0.2) / Math.max(1, Math.round(totalEmployeesForCalc * 0.3))
        },
        {
          name: 'Support',
          cost: currentCost * 0.15, // 15% du coût total
          employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.16)), // 16% des employés
          costPerEmployee: (currentCost * 0.15) / Math.max(1, Math.round(totalEmployeesForCalc * 0.16))
        },
        {
          name: 'Finance',
          cost: currentCost * 0.1, // 10% du coût total
          employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.1)), // 10% des employés
          costPerEmployee: (currentCost * 0.1) / Math.max(1, Math.round(totalEmployeesForCalc * 0.1))
        }
      ];
    } else {
      departmentCosts = departmentCostsResult.departments;
      departmentsMocked = departmentCostsResult.isMocked;
    }

    // 8. Calculs dérivés
    // ✅ CORRECTION #16 : Coefficients documentés
    // Score d'efficacité = (taux utilisation × 0.85) + 15
    // - 0.85 = pondération du taux d'utilisation (85% de poids)
    // - +15 = score plancher minimum pour éviter scores trop bas
    // Exemple : 80% utilisation → (80 × 0.85) + 15 = 83/100
    const efficiencyScore = Math.round(utilizationRate * 0.85 + 15);
    const costPerEmployee = activeEmployees > 0 ? currentCost / activeEmployees : 0;
    // 150€ = coût mensuel moyen estimé par asset (amortissement matériel)
    const assetsCost = totalAssets * 150;
    const totalCostWithAssets = currentCost + assetsCost;

    console.log('🎯 COMPLET: ✅✅✅ SUCCÈS TOTAL');

    res.status(200).json({
      kpis: {
        // ✅ CORRECTION #16 : Coefficients "previous" documentés
        // ✅ CORRECTION #17 : Flag isMocked pour identifier données simulées
        // Valeurs "previous" simulées pour afficher tendances (en attendant historique réel)
        // - 0.92 = -8% mois dernier (croissance typique coûts IT)
        // - 0.95 = -5% mois dernier (évolution contrats)
        // - 0.93 = -7% mois dernier (acquisition assets)
        // - 1.05 = +5% mois dernier (optimisation coût/employé)
        // - 1.1 = +10% mois dernier (augmentation économies potentielles)
        // - 0.96 = -4% mois dernier (amélioration efficacité)
        totalCost: { current: currentCost, previous: currentCost * 0.92, isMocked: true, label: 'Coût IT Total/mois' },
        activeContracts: { current: activeContracts, previous: Math.round(activeContracts * 0.95), isMocked: true, label: 'Contrats Actifs' },
        totalAssets: { current: totalAssets, previous: Math.round(totalAssets * 0.93), isMocked: true, label: 'Assets en Parc' },
        activeEmployees: { current: activeEmployees, previous: Math.max(1, activeEmployees - 2), isMocked: true, label: 'Employés Actifs' },
        costPerEmployee: { current: costPerEmployee, previous: costPerEmployee * 1.05, isMocked: true, label: 'Coût IT/Employé' },
        utilizationRate: { current: utilizationRate, previous: utilizationRate * 0.95, isMocked: true, label: 'Taux Utilisation' },
        potentialSavings: { current: potentialSavings, previous: potentialSavings * 1.1, isMocked: true, label: 'Économies Potentielles' },
        efficiency: { current: efficiencyScore, previous: Math.round(efficiencyScore * 0.96), isMocked: true, label: 'Score Efficacité' }
      },
      departmentCosts, // ✅ Données réelles ou mock selon disponibilité
      // ✅ CORRECTION #16 : Distribution coûts documentée
      // Répartition typique coûts IT : 80% matériel, 20% maintenance annuelle
      costDistribution: [
        { name: 'Contrats SaaS', value: currentCost, percent: totalCostWithAssets > 0 ? (currentCost / totalCostWithAssets) * 100 : 0 },
        { name: 'Matériel', value: assetsCost * 0.8, percent: totalCostWithAssets > 0 ? (assetsCost * 0.8 / totalCostWithAssets) * 100 : 0 }, // 80% achat
        { name: 'Maintenance', value: assetsCost * 0.2, percent: totalCostWithAssets > 0 ? (assetsCost * 0.2 / totalCostWithAssets) * 100 : 0 } // 20% maintenance
      ],
      // ✅ CORRECTION #16 : Trend mensuel documenté
      // Simulation croissance progressive sur 6 mois (en attendant historique réel)
      // Croissance mensuelle : +2% (0.88 → 0.90 → 0.92 → 0.95 → 0.98 → 1.00)
      monthlyTrend: [
        { month: 'Juil', contracts: currentCost * 0.88, assets: assetsCost * 0.85, total: currentCost * 0.88 + assetsCost * 0.85 }, // -12%
        { month: 'Août', contracts: currentCost * 0.90, assets: assetsCost * 0.88, total: currentCost * 0.90 + assetsCost * 0.88 }, // -10%
        { month: 'Sept', contracts: currentCost * 0.92, assets: assetsCost * 0.92, total: currentCost * 0.92 + assetsCost * 0.92 }, // -8%
        { month: 'Oct', contracts: currentCost * 0.95, assets: assetsCost * 0.95, total: currentCost * 0.95 + assetsCost * 0.95 }, // -5%
        { month: 'Nov', contracts: currentCost * 0.98, assets: assetsCost * 0.98, total: currentCost * 0.98 + assetsCost * 0.98 }, // -2%
        { month: 'Déc', contracts: currentCost, assets: assetsCost, total: currentCost + assetsCost } // Mois actuel
      ],
      alerts: potentialSavings > 500 ? [
        {
          type: 'warning',
          message: `Économies de ${Math.round(potentialSavings)}€/mois possibles sur licences inutilisées`,
          action: 'Optimiser',
          target: 'contracts'
        }
      ] : [],
      // ✅ CORRECTION #17 : Métadonnées sur données simulées
      _metadata: {
        departmentsMocked: departmentsMocked,
        costDistributionMocked: true,
        monthlyTrendMocked: true
      }
    });

    console.log('🎯 COMPLET: Réponse envoyée !');

  } catch (error) {
    console.error('🎯 COMPLET: ❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
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