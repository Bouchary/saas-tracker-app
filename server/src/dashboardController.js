// ============================================================================
// DASHBOARD CONTROLLER - VERSION CORRIGÉE (Sans LIMIT + Coût IT Total)
// ============================================================================
// ✅ CORRECTIONS:
// - Suppression LIMIT 10 dans analytics (données complètes)
// - Coût IT par employé = Contrats + Assets
// - Cohérence totale entre Global et Onglets
// ============================================================================

const db = require('./db');

const LOG_PREFIX = 'Dashboard:';

// ============================================================================
// HELPER: RÉCUPÉRER DONNÉES MOIS PRÉCÉDENT
// ============================================================================
const getPreviousMonthData = async (organizationId) => {
  try {
    const query = `
      SELECT 
        total_contracts_cost,
        active_contracts_count,
        total_assets_count,
        active_employees_count,
        cost_per_employee,
        utilization_rate,
        potential_savings,
        efficiency_score
      FROM monthly_stats
      WHERE organization_id = $1 
      AND month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      LIMIT 1
    `;
    
    const result = await db.query(query, [organizationId]);
    
    if (result.rows.length > 0) {
      return {
        data: result.rows[0],
        isMocked: false
      };
    }
    
    return { data: null, isMocked: true };
    
  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getPreviousMonthData:`, error.message);
    return { data: null, isMocked: true };
  }
};

// ============================================================================
// HELPER: RÉCUPÉRER TREND 6 MOIS
// ============================================================================
const getMonthlyTrend = async (organizationId) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(month, 'Mon') as month,
        total_contracts_cost as contracts,
        total_assets_value / 36 as assets,
        total_contracts_cost + (total_assets_value / 36) as total
      FROM monthly_stats
      WHERE organization_id = $1
      AND month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      ORDER BY month ASC
    `;
    
    const result = await db.query(query, [organizationId]);
    
    if (result.rows.length >= 2) {
      return {
        data: result.rows.map(r => ({
          month: r.month,
          contracts: parseFloat(r.contracts) || 0,
          assets: parseFloat(r.assets) || 0,
          total: parseFloat(r.total) || 0
        })),
        isMocked: false
      };
    }
    
    return { data: null, isMocked: true };
    
  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getMonthlyTrend:`, error.message);
    return { data: null, isMocked: true };
  }
};

// ============================================================================
// HELPER: COÛTS PAR DÉPARTEMENT
// ============================================================================
const getDepartmentCosts = async (organizationId, activeEmployees, currentCost) => {
  try {
    const checkResult = await db.query(
      `SELECT COUNT(*) as count FROM department_allocations WHERE organization_id = $1`,
      [organizationId]
    );

    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log(`${LOG_PREFIX} Départements: Aucune allocation → mock`);
      return { data: null, isMocked: true };
    }

    const contractCostsResult = await db.query(
      `SELECT 
        da.department,
        SUM(c.monthly_cost * (da.allocation_percent / 100)) as cost
       FROM department_allocations da
       JOIN contracts c ON da.contract_id = c.id
       WHERE da.organization_id = $1 AND c.status = 'active' AND da.contract_id IS NOT NULL
       GROUP BY da.department`,
      [organizationId]
    );

    const assetCostsResult = await db.query(
      `SELECT 
        da.department,
        SUM(COALESCE(a.purchase_price / 36, 0) * (da.allocation_percent / 100)) as cost
       FROM department_allocations da
       JOIN assets a ON da.asset_id = a.id
       WHERE da.organization_id = $1 AND da.asset_id IS NOT NULL
       GROUP BY da.department`,
      [organizationId]
    );

    const departmentMap = new Map();
    
    contractCostsResult.rows.forEach(row => {
      const cost = parseFloat(row.cost) || 0;
      departmentMap.set(row.department, (departmentMap.get(row.department) || 0) + cost);
    });

    assetCostsResult.rows.forEach(row => {
      const cost = parseFloat(row.cost) || 0;
      departmentMap.set(row.department, (departmentMap.get(row.department) || 0) + cost);
    });

    const employeesResult = await db.query(
      `SELECT department, COUNT(*) as count 
       FROM employees 
       WHERE organization_id = $1 AND status = 'active' AND department IS NOT NULL
       GROUP BY department`,
      [organizationId]
    );
    
    const employeesByDept = new Map();
    employeesResult.rows.forEach(row => {
      employeesByDept.set(row.department, parseInt(row.count));
    });

    const departments = Array.from(departmentMap.entries()).map(([name, cost]) => {
      const employees = employeesByDept.get(name) || 1;
      return {
        name,
        cost: Math.round(cost * 100) / 100,
        employees,
        costPerEmployee: Math.round((cost / employees) * 100) / 100
      };
    });

    departments.sort((a, b) => b.cost - a.cost);

    console.log(`${LOG_PREFIX} Départements: ${departments.length} avec allocations réelles`);

    return { data: departments, isMocked: false };

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getDepartmentCosts:`, error.message);
    return { data: null, isMocked: true };
  }
};

// ============================================================================
// 1. OBTENIR LES KPIs GLOBAUX
// ============================================================================
const getGlobalStats = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        const contractsResult = await db.query(
            'SELECT COUNT(*) as total FROM contracts WHERE organization_id = $1',
            [organizationId]
        );
        const totalContracts = parseInt(contractsResult.rows[0].total);

        const activeContractsResult = await db.query(
            "SELECT COUNT(*) as active FROM contracts WHERE organization_id = $1 AND status = 'active'",
            [organizationId]
        );
        const activeContracts = parseInt(activeContractsResult.rows[0].active);

        const costResult = await db.query(
            "SELECT COALESCE(SUM(monthly_cost), 0) as total_cost FROM contracts WHERE organization_id = $1 AND status = 'active'",
            [organizationId]
        );
        const totalCost = parseFloat(costResult.rows[0].total_cost);

        const assetsResult = await db.query(
            'SELECT COUNT(*) as total FROM assets WHERE organization_id = $1',
            [organizationId]
        );
        const totalAssets = parseInt(assetsResult.rows[0].total);

        const assignedAssetsResult = await db.query(
            `SELECT COUNT(DISTINCT aa.asset_id) as assigned 
             FROM asset_assignments aa
             JOIN assets a ON aa.asset_id = a.id
             WHERE a.organization_id = $1 AND aa.status = 'active'`,
            [organizationId]
        );
        const assignedAssets = parseInt(assignedAssetsResult.rows[0].assigned || 0);

        const employeesResult = await db.query(
            'SELECT COUNT(*) as total FROM employees WHERE organization_id = $1',
            [organizationId]
        );
        const totalEmployees = parseInt(employeesResult.rows[0].total);

        const activeEmployeesResult = await db.query(
            "SELECT COUNT(*) as active FROM employees WHERE organization_id = $1 AND status = 'active'",
            [organizationId]
        );
        const activeEmployees = parseInt(activeEmployeesResult.rows[0].active);

        console.log(`${LOG_PREFIX} Stats globales pour organisation ${organizationId}`);

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
  const userId = req.user.id;
  const organizationId = req.organizationId;

  if (!userId || !organizationId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  console.log(`${LOG_PREFIX} Vue globale pour organisation ${organizationId}`);

  try {
    // Coût total contrats
    const costResult = await db.query(
      `SELECT COALESCE(SUM(monthly_cost), 0) as total FROM contracts WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );
    const currentCost = parseFloat(costResult.rows[0].total);

    // Contrats actifs
    const contractsResult = await db.query(
      `SELECT COUNT(*) as current FROM contracts WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );
    const activeContracts = parseInt(contractsResult.rows[0].current);

    // Assets
    const assetsResult = await db.query(
      `SELECT COUNT(*) as total FROM assets WHERE organization_id = $1`,
      [organizationId]
    );
    const totalAssets = parseInt(assetsResult.rows[0].total);

    // ✅ Coût RÉEL assets depuis purchase_price
    const assetsCostResult = await db.query(
      `SELECT 
        COALESCE(SUM(purchase_price), 0) as total_value,
        COALESCE(SUM(purchase_price / 36), 0) as monthly_amortization
       FROM assets 
       WHERE organization_id = $1`,
      [organizationId]
    );
    const assetsMonthlyCost = parseFloat(assetsCostResult.rows[0].monthly_amortization);
    const assetsTotalValue = parseFloat(assetsCostResult.rows[0].total_value);

    // Employés actifs
    const employeesResult = await db.query(
      `SELECT COUNT(*) as total FROM employees WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );
    const activeEmployees = parseInt(employeesResult.rows[0].total) || 1;

    // Utilisation licences
    const utilizationResult = await db.query(
      `SELECT 
        COALESCE(SUM(license_count), 0) as total_licenses, 
        COALESCE(SUM(licenses_used), 0) as total_used
       FROM contracts 
       WHERE organization_id = $1 AND status = 'active' AND pricing_model = 'per_user'`,
      [organizationId]
    );
    const totalLicenses = parseInt(utilizationResult.rows[0].total_licenses);
    const totalUsed = parseInt(utilizationResult.rows[0].total_used);
    const utilizationRate = totalLicenses > 0 ? (totalUsed / totalLicenses) * 100 : 0;

    // Économies potentielles
    const savingsResult = await db.query(
      `SELECT COALESCE(SUM((license_count - licenses_used) * unit_cost), 0) as potential_savings
       FROM contracts 
       WHERE organization_id = $1 AND status = 'active' AND pricing_model = 'per_user' 
       AND licenses_used < license_count AND unit_cost IS NOT NULL`,
      [organizationId]
    );
    const potentialSavings = parseFloat(savingsResult.rows[0].potential_savings) || 0;

    // ========================================================================
    // DONNÉES MOIS PRÉCÉDENT
    // ========================================================================
    const previousMonth = await getPreviousMonthData(organizationId);
    const prevData = previousMonth.data;

    // ========================================================================
    // ✅ CORRECTION: COÛT IT TOTAL (Contrats + Assets)
    // ========================================================================
    const totalCostWithAssets = currentCost + assetsMonthlyCost;
    const costPerEmployee = totalCostWithAssets / activeEmployees;
    
    // Calcul précédent pour comparaison
    const prevTotalCost = prevData 
      ? parseFloat(prevData.total_contracts_cost) + (prevData.total_assets_value || 0) / 36
      : totalCostWithAssets * 0.92;
    
    const prevCostPerEmployee = prevData
      ? parseFloat(prevData.cost_per_employee)
      : costPerEmployee * 1.05;

    const efficiencyScore = Math.round(utilizationRate * 0.85 + 15);

    // ========================================================================
    // DÉPARTEMENTS
    // ========================================================================
    const departmentCostsResult = await getDepartmentCosts(organizationId, activeEmployees, currentCost);
    let departmentCosts;
    
    if (!departmentCostsResult.data) {
      departmentCosts = [
        { name: 'IT', cost: currentCost * 0.3, employees: Math.max(1, Math.round(activeEmployees * 0.2)), costPerEmployee: (currentCost * 0.3) / Math.max(1, Math.round(activeEmployees * 0.2)) },
        { name: 'Marketing', cost: currentCost * 0.25, employees: Math.max(1, Math.round(activeEmployees * 0.24)), costPerEmployee: (currentCost * 0.25) / Math.max(1, Math.round(activeEmployees * 0.24)) },
        { name: 'Sales', cost: currentCost * 0.2, employees: Math.max(1, Math.round(activeEmployees * 0.3)), costPerEmployee: (currentCost * 0.2) / Math.max(1, Math.round(activeEmployees * 0.3)) },
        { name: 'Support', cost: currentCost * 0.15, employees: Math.max(1, Math.round(activeEmployees * 0.16)), costPerEmployee: (currentCost * 0.15) / Math.max(1, Math.round(activeEmployees * 0.16)) },
        { name: 'Finance', cost: currentCost * 0.1, employees: Math.max(1, Math.round(activeEmployees * 0.1)), costPerEmployee: (currentCost * 0.1) / Math.max(1, Math.round(activeEmployees * 0.1)) }
      ];
    } else {
      departmentCosts = departmentCostsResult.data;
    }

    // ========================================================================
    // MONTHLY TREND
    // ========================================================================
    const trendResult = await getMonthlyTrend(organizationId);
    let monthlyTrend;
    
    if (!trendResult.data) {
      monthlyTrend = [
        { month: 'Juil', contracts: currentCost * 0.88, assets: assetsMonthlyCost * 0.85, total: currentCost * 0.88 + assetsMonthlyCost * 0.85 },
        { month: 'Août', contracts: currentCost * 0.90, assets: assetsMonthlyCost * 0.88, total: currentCost * 0.90 + assetsMonthlyCost * 0.88 },
        { month: 'Sept', contracts: currentCost * 0.92, assets: assetsMonthlyCost * 0.92, total: currentCost * 0.92 + assetsMonthlyCost * 0.92 },
        { month: 'Oct', contracts: currentCost * 0.95, assets: assetsMonthlyCost * 0.95, total: currentCost * 0.95 + assetsMonthlyCost * 0.95 },
        { month: 'Nov', contracts: currentCost * 0.98, assets: assetsMonthlyCost * 0.98, total: currentCost * 0.98 + assetsMonthlyCost * 0.98 },
        { month: 'Déc', contracts: currentCost, assets: assetsMonthlyCost, total: currentCost + assetsMonthlyCost }
      ];
    } else {
      monthlyTrend = trendResult.data;
    }

    // ========================================================================
    // RÉPONSE
    // ========================================================================
    res.status(200).json({
      kpis: {
        totalCost: { 
          current: totalCostWithAssets,  // ✅ CORRIGÉ: Contrats + Assets
          previous: prevTotalCost,
          isMocked: previousMonth.isMocked,
          label: 'Coût IT Total/mois',
          breakdown: {
            contracts: currentCost,
            assets: assetsMonthlyCost
          }
        },
        activeContracts: { 
          current: activeContracts, 
          previous: prevData ? parseInt(prevData.active_contracts_count) : Math.round(activeContracts * 0.95),
          isMocked: previousMonth.isMocked,
          label: 'Contrats Actifs' 
        },
        totalAssets: { 
          current: totalAssets, 
          previous: prevData ? parseInt(prevData.total_assets_count) : Math.round(totalAssets * 0.93),
          isMocked: previousMonth.isMocked,
          label: 'Assets en Parc' 
        },
        activeEmployees: { 
          current: activeEmployees, 
          previous: prevData ? parseInt(prevData.active_employees_count) : Math.max(1, activeEmployees - 2),
          isMocked: previousMonth.isMocked,
          label: 'Employés Actifs' 
        },
        costPerEmployee: { 
          current: Math.round(costPerEmployee * 100) / 100,  // ✅ CORRIGÉ: Inclut assets
          previous: Math.round(prevCostPerEmployee * 100) / 100,
          isMocked: previousMonth.isMocked,
          label: 'Coût IT/Employé',
          formula: '(Contrats SaaS + Amortissement Matériel) / Employés Actifs'
        },
        utilizationRate: { 
          current: Math.round(utilizationRate * 100) / 100, 
          previous: prevData ? parseFloat(prevData.utilization_rate) : utilizationRate * 0.95,
          isMocked: previousMonth.isMocked,
          label: 'Taux Utilisation Licences' 
        },
        potentialSavings: { 
          current: Math.round(potentialSavings * 100) / 100, 
          previous: prevData ? parseFloat(prevData.potential_savings) : potentialSavings * 1.1,
          isMocked: previousMonth.isMocked,
          label: 'Économies Potentielles' 
        },
        efficiency: { 
          current: efficiencyScore, 
          previous: prevData ? parseInt(prevData.efficiency_score) : Math.round(efficiencyScore * 0.96),
          isMocked: previousMonth.isMocked,
          label: 'Score Efficacité' 
        }
      },
      departmentCosts,
      costDistribution: [
        { 
          name: 'Contrats SaaS', 
          value: currentCost, 
          percent: (currentCost / totalCostWithAssets) * 100,
          source: 'real'
        },
        { 
          name: 'Matériel (amortissement)', 
          value: assetsMonthlyCost, 
          percent: (assetsMonthlyCost / totalCostWithAssets) * 100,
          source: assetsMonthlyCost > 0 ? 'real' : 'estimated'
        }
      ],
      monthlyTrend,
      alerts: potentialSavings > 500 ? [
        {
          type: 'warning',
          message: `Économies de ${Math.round(potentialSavings)}€/mois possibles sur licences inutilisées`,
          action: 'Optimiser',
          target: 'contracts'
        }
      ] : [],
      _metadata: {
        previousMonthMocked: previousMonth.isMocked,
        departmentsMocked: departmentCostsResult.isMocked,
        monthlyTrendMocked: trendResult.isMocked
      }
    });

    console.log(`${LOG_PREFIX} Vue globale OK`);

  } catch (error) {
    console.error(`${LOG_PREFIX} Erreur getGlobalView:`, error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ============================================================================
// 3. ANALYTICS CONTRATS - ✅ SANS LIMIT
// ============================================================================
const getContractsAnalytics = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        // ✅ SANS LIMIT - Tous les providers
        const providerQuery = `
            SELECT provider, COUNT(*) as count, SUM(monthly_cost) as total_cost
            FROM contracts
            WHERE organization_id = $1 AND status = 'active' AND provider IS NOT NULL
            GROUP BY provider
            ORDER BY total_cost DESC
        `;
        const providersResult = await db.query(providerQuery, [organizationId]);

        // ✅ SANS LIMIT - Tous les contrats triés par coût
        const topContractsQuery = `
            SELECT name, provider, monthly_cost, pricing_model
            FROM contracts
            WHERE organization_id = $1 AND status = 'active'
            ORDER BY monthly_cost DESC
        `;
        const topContractsResult = await db.query(topContractsQuery, [organizationId]);

        const pricingModelQuery = `
            SELECT 
                pricing_model,
                COUNT(*) as count,
                SUM(monthly_cost) as total_cost
            FROM contracts
            WHERE organization_id = $1 AND status = 'active'
            GROUP BY pricing_model
        `;
        const pricingModelsResult = await db.query(pricingModelQuery, [organizationId]);

        const expiringQuery = `
            SELECT name, provider, renewal_date, monthly_cost
            FROM contracts
            WHERE organization_id = $1 
            AND status = 'active'
            AND renewal_date IS NOT NULL
            AND renewal_date <= CURRENT_DATE + INTERVAL '30 days'
            AND renewal_date >= CURRENT_DATE
            ORDER BY renewal_date ASC
        `;
        const expiringResult = await db.query(expiringQuery, [organizationId]);

        res.status(200).json({
            providers: providersResult.rows,
            topContracts: topContractsResult.rows,
            pricingModels: pricingModelsResult.rows,
            expiringSoon: expiringResult.rows,
            _metadata: {
                providersCount: providersResult.rows.length,
                contractsCount: topContractsResult.rows.length,
                note: 'Données complètes sans limite'
            }
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} Erreur getContractsAnalytics:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ============================================================================
// 4. ANALYTICS LICENCES - ✅ SANS LIMIT
// ============================================================================
const getLicensesAnalytics = async (req, res) => {
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
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
            WHERE organization_id = $1 
            AND status = 'active'
            AND pricing_model = 'per_user'
            AND license_count IS NOT NULL
        `;
        const licensesResult = await db.query(licensesQuery, [organizationId]);

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

            if (realUsers > licenseCount) {
                const overconsumption = realUsers - licenseCount;
                const cost = overconsumption * unitCost;
                overconsumedContracts.push({
                    name: contract.name,
                    provider: contract.provider,
                    licenseCount,
                    realUsers,
                    overconsumption,
                    cost
                });
                totalOverconsumptionCost += cost;
            }

            if (licensesUsed < licenseCount) {
                const unused = licenseCount - licensesUsed;
                const wastedCost = unused * unitCost;
                if (unused > 0 && wastedCost > 0) {
                    underusedContracts.push({
                        name: contract.name,
                        provider: contract.provider,
                        licenseCount,
                        licensesUsed,
                        unused,
                        wastedCost,
                        usageRate: ((licensesUsed / licenseCount) * 100).toFixed(1)
                    });
                    totalWasted += wastedCost;
                }
            }
        });

        const averageUsageRate = totalLicenses > 0 
            ? ((totalUsed / totalLicenses) * 100).toFixed(1)
            : 0;

        // ✅ SANS LIMIT - Tous les contrats
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
            overconsumed: overconsumedContracts.sort((a, b) => b.cost - a.cost),  // ✅ Tous
            underused: underusedContracts.sort((a, b) => b.wastedCost - a.wastedCost),  // ✅ Tous
            _metadata: {
                overconsumedCount: overconsumedContracts.length,
                underusedCount: underusedContracts.length,
                note: 'Données complètes sans limite'
            }
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
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        const typeQuery = `
            SELECT asset_type, COUNT(*) as count
            FROM assets
            WHERE organization_id = $1
            GROUP BY asset_type
            ORDER BY count DESC
        `;
        const typesResult = await db.query(typeQuery, [organizationId]);

        const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM assets
            WHERE organization_id = $1
            GROUP BY status
        `;
        const statusResult = await db.query(statusQuery, [organizationId]);

        const warrantyQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE) as under_warranty,
                COUNT(*) FILTER (WHERE warranty_end_date <= CURRENT_DATE OR warranty_end_date IS NULL) as expired_warranty
            FROM assets
            WHERE organization_id = $1
        `;
        const warrantyResult = await db.query(warrantyQuery, [organizationId]);

        const expiringWarrantyQuery = `
            SELECT serial_number, model, asset_type, warranty_end_date
            FROM assets
            WHERE organization_id = $1
            AND warranty_end_date IS NOT NULL
            AND warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'
            AND warranty_end_date >= CURRENT_DATE
            ORDER BY warranty_end_date ASC
        `;
        const expiringWarrantyResult = await db.query(expiringWarrantyQuery, [organizationId]);

        const valueQuery = `
            SELECT 
                COALESCE(SUM(purchase_price), 0) as total_value,
                COALESCE(AVG(purchase_price), 0) as average_value
            FROM assets
            WHERE organization_id = $1 AND purchase_price IS NOT NULL
        `;
        const valueResult = await db.query(valueQuery, [organizationId]);

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
    const userId = req.user.id;
    const organizationId = req.organizationId;
    
    if (!userId || !organizationId) {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        const deptQuery = `
            SELECT department, COUNT(*) as count
            FROM employees
            WHERE organization_id = $1 AND status = 'active'
            GROUP BY department
            ORDER BY count DESC
        `;
        const deptResult = await db.query(deptQuery, [organizationId]);

        const positionQuery = `
            SELECT job_title as position, COUNT(*) as count
            FROM employees
            WHERE organization_id = $1 AND status = 'active' AND job_title IS NOT NULL
            GROUP BY job_title
            ORDER BY count DESC
        `;
        const positionResult = await db.query(positionQuery, [organizationId]);

        const topAssetsQuery = `
            SELECT 
                e.id,
                e.first_name || ' ' || e.last_name as name,
                e.department,
                COUNT(a.id) as asset_count
            FROM employees e
            LEFT JOIN assets a ON a.currently_assigned_to = e.id AND a.organization_id = $1
            WHERE e.organization_id = $1 AND e.status = 'active'
            GROUP BY e.id, e.first_name, e.last_name, e.department
            HAVING COUNT(a.id) > 0
            ORDER BY asset_count DESC
        `;
        const topAssetsResult = await db.query(topAssetsQuery, [organizationId]);

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