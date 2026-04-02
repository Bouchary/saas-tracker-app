// ============================================================================
// SERVER.JS - COMPLET avec MDM + Extractions IA + Purchase Requests + CRON
// ============================================================================
// ✅ AJOUT : Job monthly snapshots pour dashboard 100% réel
// ✅ AJOUT : Serveur fichiers statiques agents MDM
// ✅ PRÉSERVÉ : Toutes routes existantes sans modification
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const db = require('./src/db.js');

const app = express();
const port = process.env.PORT || 5000;

// ============================================================================
// CONFIGURATION CORS
// ============================================================================
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, process.env.APP_URL].filter(Boolean)
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(compression());

// ============================================================================
// SERVIR FICHIERS STATIQUES
// ============================================================================

// Uploads (documents contrats, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🎯 NOUVEAU : Agents MDM (téléchargeables par devices)
app.use('/agents', express.static(path.join(__dirname, 'public/agents')));

// Autres fichiers publics si nécessaire
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================================================
// MIDDLEWARES
// ============================================================================
const authMiddleware = require('./src/middlewares/authMiddleware.js');
const organizationMiddleware = require('./src/middlewares/organizationMiddleware.js');

// ============================================================================
// ROUTES
// ============================================================================
const authRoutes = require('./src/auth.routes.js');
const contractRoutes = require('./src/contracts.routes.js');
const contractExtractionRoutes = require('./src/routes/contract-extraction.routes.js');
const contractExtractionsHistoryRoutes = require('./src/routes/contract-extractions-history.routes.js');
const emailRoutes = require('./src/routes/emails.js');
const profileRoutes = require('./src/routes/profile.js');
const documentsRoutes = require('./src/routes/documents.js');
const passwordResetRoutes = require('./src/routes/password-reset.js');
const employeesRoutes = require('./src/employees.routes.js');
const assetsRoutes = require('./src/assets.routes.js');
const workflowRoutes = require('./src/workflows.routes.js');
const dashboardRoutes = require('./src/dashboard.routes.js');
const dashboardController = require('./src/dashboardController.js');
const usersRoutes = require('./src/users.routes.js');
const importRoutes = require('./src/routes/import.routes.js');
const optimizationRoutes = require('./src/routes/optimization.routes.js');
const aiAnalysisRoutes = require('./src/routes/ai-analysis.routes.js');
const mdmRoutes = require('./src/routes/mdm.routes.js');
const searchRoutes = require('./src/routes/search.routes');
const purchaseRequestsRoutes = require('./src/routes/purchase-requests.routes.js');
const purchaseApprovalRulesRoutes = require('./src/routes/purchase-approval-rules.routes.js');

// ============================================================================
// SCHEDULERS
// ============================================================================
const emailScheduler = require('./src/jobs/emailScheduler.js');
const workflowScheduler = require('./src/jobs/workflowScheduler.js');

// ✅ NOUVEAU : Monthly Snapshot Job
const monthlySnapshotJob = require('./src/jobs/monthlySnapshot.js');

// ============================================================================
// MONTAGE DES ROUTES
// ============================================================================

// Auth
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);

// Contrats
app.use('/api/contracts', contractRoutes);
app.use('/api/contracts', contractExtractionRoutes);

// Historique extractions IA
app.use('/api/contract-extractions', contractExtractionsHistoryRoutes);

// Emails & Profile
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);

// Documents
app.use('/api', documentsRoutes);

// Employés & Assets
app.use('/api/employees', employeesRoutes);
app.use('/api/assets', assetsRoutes);

// Workflows
app.use('/api/workflows', workflowRoutes);

// Dashboard
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/dashboard/global', authMiddleware, organizationMiddleware, dashboardController.getGlobalView);

// Users
app.use('/api/users', usersRoutes);

// Import
app.use('/api/import', importRoutes);

// IA & Optimization
app.use('/api/optimization', optimizationRoutes);
app.use('/api/ai', aiAnalysisRoutes);

// MDM
app.use('/api/mdm', mdmRoutes);

// Search
app.use('/api/search', searchRoutes);

// Purchase Requests
app.use('/api/purchase-requests', purchaseRequestsRoutes);
app.use('/api/purchase-approval-rules', purchaseApprovalRulesRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: "SaaS Tracker API OK",
    version: "1.0.0",
    features: [
      "Contrats",
      "Employés", 
      "Assets",
      "Workflows",
      "Extraction IA",
      "MDM",
      "Optimisation IA",
      "Purchase Requests",
      "Dashboard 100% Réel"
    ]
  });
});

// ============================================================================
// DÉMARRAGE DES SCHEDULERS
// ============================================================================
if (process.env.NODE_ENV === 'production') {
  // Scheduler notifications contrats
  emailScheduler.start();
  
  // Scheduler notifications workflows
  if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
    workflowScheduler.start();
  }
  
  // ✅ NOUVEAU : Monthly snapshots (déjà démarré automatiquement via cron.schedule)
  console.log('📊 MonthlySnapshot: JOB ACTIF (1er du mois à 00:01)');
}

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================
app.listen(port, () => {
  console.log(`🚀 Serveur sur port ${port}`);
  console.log(`📁 Fichiers statiques:`);
  console.log(`   - Uploads: /uploads`);
  console.log(`   - Agents MDM: /agents ✅`);
  console.log(`   - Public: /public`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'OK' : 'ERREUR'}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'OK ✅' : 'MANQUANTE ❌'}`);
  console.log('🎯 Dashboard 100% données réelles (historique monthly_stats)');
  console.log('✅ Routes MDM actives');
  console.log('✅ Routes Extractions IA actives');
  console.log('✅ Routes Purchase Requests actives');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('📧 EmailScheduler (contrats): ACTIF');
    if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
      console.log('🔔 WorkflowScheduler (workflows): ACTIF');
    } else {
      console.log('⏸️  WorkflowScheduler (workflows): DÉSACTIVÉ');
    }
    console.log('📊 MonthlySnapshot: ACTIF (1er du mois à 00:01)');
  } else {
    console.log('⚠️  Schedulers désactivés (mode développement)');
    console.log('💡 Tip: Pour tester monthly snapshot manuellement:');
    console.log('   const { generateAllSnapshots } = require(\'./src/jobs/monthlySnapshot\');');
    console.log('   await generateAllSnapshots();');
  }
});

// ============================================================================
// ARRÊT PROPRE DES SCHEDULERS
// ============================================================================
const shutdown = () => {
  console.log('Arrêt...');
  if (process.env.NODE_ENV === 'production') {
    emailScheduler.stop();
    if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
      workflowScheduler.stop();
    }
    // Monthly snapshot s'arrêtera automatiquement
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);