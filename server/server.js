// VERSION AVEC DÉPARTEMENTS RÉELS - Fallback sur mock si table vide
// + WORKFLOW SCHEDULER POUR NOTIFICATIONS AUTOMATIQUES

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const db = require('./src/db');

const app = express();
const port = process.env.PORT || 5000; 

app.use(cors()); 
app.use(express.json());

const { protect } = require('./src/middlewares/authMiddleware');

const authRoutes = require('./src/auth.routes.js'); 
const contractRoutes = require('./src/contracts.routes.js'); 
const emailRoutes = require('./src/routes/emails.js');
const profileRoutes = require('./src/routes/profile.js');
const documentsRoutes = require('./src/routes/documents.js');
const passwordResetRoutes = require('./src/routes/password-reset.js');
const employeesRoutes = require('./src/employees.routes.js');
const assetsRoutes = require('./src/assets.routes.js');
const workflowRoutes = require('./src/workflows.routes.js');

// Schedulers pour notifications automatiques
const emailScheduler = require('./src/jobs/emailScheduler');
const workflowScheduler = require('./src/jobs/workflowScheduler'); // ✅ NOUVEAU

// ====================================
// ✅ NOUVELLE FONCTION : COÛTS PAR DÉPARTEMENT
// ====================================

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
            const employeesResult = await db.query(
                `SELECT department, COUNT(*) as count 
                 FROM employees 
                 WHERE user_id = $1 AND status = 'active' AND department IS NOT NULL
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
        
        return departments.length > 0 ? departments : null;
        
    } catch (error) {
        console.error('📊 Départements: Erreur lecture allocations:', error.message);
        return null; // En cas d'erreur → utiliser le mock
    }
};

// ====================================
// ✅ CONTROLLER PRINCIPAL (avec départements réels)
// ====================================

const getGlobalData = async (req, res) => {
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
        const employeesResult = await db.query(
            `SELECT COUNT(*) as total FROM employees WHERE user_id = $1 AND status = 'active'`,
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
        let departmentCosts = await getDepartmentCostsFromAllocations(userId);
        
        // Si pas d'allocations, utiliser le mock basé sur le coût total
        if (!departmentCosts) {
            const totalEmployeesForCalc = activeEmployees > 0 ? activeEmployees : 1;
            departmentCosts = [
                { 
                    name: 'IT', 
                    cost: currentCost * 0.3, 
                    employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.2)), 
                    costPerEmployee: (currentCost * 0.3) / Math.max(1, Math.round(totalEmployeesForCalc * 0.2))
                },
                { 
                    name: 'Marketing', 
                    cost: currentCost * 0.25, 
                    employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.24)), 
                    costPerEmployee: (currentCost * 0.25) / Math.max(1, Math.round(totalEmployeesForCalc * 0.24))
                },
                { 
                    name: 'Sales', 
                    cost: currentCost * 0.2, 
                    employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.3)), 
                    costPerEmployee: (currentCost * 0.2) / Math.max(1, Math.round(totalEmployeesForCalc * 0.3))
                },
                { 
                    name: 'Support', 
                    cost: currentCost * 0.15, 
                    employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.16)), 
                    costPerEmployee: (currentCost * 0.15) / Math.max(1, Math.round(totalEmployeesForCalc * 0.16))
                },
                { 
                    name: 'Finance', 
                    cost: currentCost * 0.1, 
                    employees: Math.max(1, Math.round(totalEmployeesForCalc * 0.1)), 
                    costPerEmployee: (currentCost * 0.1) / Math.max(1, Math.round(totalEmployeesForCalc * 0.1))
                }
            ];
        }
        
        // 8. Calculs dérivés
        const efficiencyScore = Math.round(utilizationRate * 0.85 + 15);
        const costPerEmployee = activeEmployees > 0 ? currentCost / activeEmployees : 0;
        const assetsCost = totalAssets * 150;
        const totalCostWithAssets = currentCost + assetsCost;
        
        console.log('🎯 COMPLET: ✅✅✅ SUCCÈS TOTAL');
        
        res.status(200).json({
            kpis: {
                totalCost: { current: currentCost, previous: currentCost * 0.92, label: 'Coût IT Total/mois' },
                activeContracts: { current: activeContracts, previous: Math.round(activeContracts * 0.95), label: 'Contrats Actifs' },
                totalAssets: { current: totalAssets, previous: Math.round(totalAssets * 0.93), label: 'Assets en Parc' },
                activeEmployees: { current: activeEmployees, previous: Math.max(1, activeEmployees - 2), label: 'Employés Actifs' },
                costPerEmployee: { current: costPerEmployee, previous: costPerEmployee * 1.05, label: 'Coût IT/Employé' },
                utilizationRate: { current: utilizationRate, previous: utilizationRate * 0.95, label: 'Taux Utilisation' },
                potentialSavings: { current: potentialSavings, previous: potentialSavings * 1.1, label: 'Économies Potentielles' },
                efficiency: { current: efficiencyScore, previous: Math.round(efficiencyScore * 0.96), label: 'Score Efficacité' }
            },
            departmentCosts, // ✅ Données réelles ou mock selon disponibilité
            costDistribution: [
                { name: 'Contrats SaaS', value: currentCost, percent: totalCostWithAssets > 0 ? (currentCost / totalCostWithAssets) * 100 : 0 },
                { name: 'Matériel', value: assetsCost * 0.8, percent: totalCostWithAssets > 0 ? (assetsCost * 0.8 / totalCostWithAssets) * 100 : 0 },
                { name: 'Maintenance', value: assetsCost * 0.2, percent: totalCostWithAssets > 0 ? (assetsCost * 0.2 / totalCostWithAssets) * 100 : 0 }
            ],
            monthlyTrend: [
                { month: 'Juil', contracts: currentCost * 0.88, assets: assetsCost * 0.85, total: currentCost * 0.88 + assetsCost * 0.85 },
                { month: 'Août', contracts: currentCost * 0.90, assets: assetsCost * 0.88, total: currentCost * 0.90 + assetsCost * 0.88 },
                { month: 'Sept', contracts: currentCost * 0.92, assets: assetsCost * 0.92, total: currentCost * 0.92 + assetsCost * 0.92 },
                { month: 'Oct', contracts: currentCost * 0.95, assets: assetsCost * 0.95, total: currentCost * 0.95 + assetsCost * 0.95 },
                { month: 'Nov', contracts: currentCost * 0.98, assets: assetsCost * 0.98, total: currentCost * 0.98 + assetsCost * 0.98 },
                { month: 'Déc', contracts: currentCost, assets: assetsCost, total: currentCost + assetsCost }
            ],
            alerts: potentialSavings > 500 ? [
                { 
                    type: 'warning', 
                    message: `Économies de ${Math.round(potentialSavings)}€/mois possibles sur licences inutilisées`, 
                    action: 'Optimiser',
                    target: 'contracts'
                }
            ] : []
        });
        
        console.log('🎯 COMPLET: Réponse envoyée !');
        
    } catch (error) {
        console.error('🎯 COMPLET: ❌ ERREUR:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

// ====================================
// ROUTES
// ====================================

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/workflows', workflowRoutes);

app.get('/api/dashboard/global', protect, getGlobalData);

app.get('/', (req, res) => {
  res.json({ message: "SaaS Tracker API OK" });
});

// ====================================
// ✅ DÉMARRAGE DES SCHEDULERS
// ====================================

if (process.env.NODE_ENV === 'production') {
    // Scheduler pour notifications contrats
    emailScheduler.start();
    
    // ✅ NOUVEAU : Scheduler pour notifications workflows
    if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
        workflowScheduler.start();
    }
}

// ====================================
// DÉMARRAGE DU SERVEUR
// ====================================

app.listen(port, () => {
  console.log(`🚀 Serveur sur port ${port}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'OK' : 'ERREUR'}`);
  console.log('🎯 Dashboard Global avec départements réels (fallback mock)');
  
  // ✅ NOUVEAU : Logs des schedulers
  if (process.env.NODE_ENV === 'production') {
      console.log('📧 EmailScheduler (contrats): ACTIF');
      if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
          console.log('🔔 WorkflowScheduler (workflows): ACTIF');
      } else {
          console.log('⏸️  WorkflowScheduler (workflows): DÉSACTIVÉ');
      }
  } else {
      console.log('⚠️  Schedulers désactivés (mode développement)');
  }
});

// ====================================
// ARRÊT PROPRE DES SCHEDULERS
// ====================================

process.on('SIGTERM', () => {
  console.log('Arrêt...');
  if (process.env.NODE_ENV === 'production') {
      emailScheduler.stop();
      if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
          workflowScheduler.stop(); // ✅ NOUVEAU
      }
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Arrêt...');
  if (process.env.NODE_ENV === 'production') {
      emailScheduler.stop();
      if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
          workflowScheduler.stop(); // ✅ NOUVEAU
      }
  }
  process.exit(0);
});