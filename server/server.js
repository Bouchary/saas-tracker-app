// VERSION AVEC DÉPARTEMENTS RÉELS - Fallback sur mock si table vide
// + WORKFLOW SCHEDULER POUR NOTIFICATIONS AUTOMATIQUES
// ✅ CORRECTION #1 : getGlobalData déplacé dans dashboardController
// ✅ NOUVEAU : Route /api/users pour gestion des utilisateurs
// ✅ CORRECTION MULTI-TENANT : authMiddleware corrigé
// ✅ NOUVEAU : Route /api/import pour import CSV/Excel
// ✅ NOUVEAU : Route /api/optimization pour AI Optimization Score
// ✅ NOUVEAU : Route /api/ai pour analyse IA (Claude API + ML prédictif)
// ✅ CORRECTION UPLOAD : documentsRoutes monté sur /api (pas /api/documents)
// ✅ NOUVEAU : Route /api/contracts/extract pour extraction intelligente PDF

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const db = require('./src/db.js');

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORRECTION #20 : Configuration CORS sécurisée
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

// ✅ CORRECTION MULTI-TENANT : Import direct authMiddleware
const authMiddleware = require('./src/middlewares/authMiddleware.js');
const organizationMiddleware = require('./src/middlewares/organizationMiddleware.js');

const authRoutes = require('./src/auth.routes.js');
const contractRoutes = require('./src/contracts.routes.js');
const contractExtractionRoutes = require('./src/routes/contract-extraction.routes.js'); // ✅ NOUVEAU
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

// Schedulers pour notifications automatiques
const emailScheduler = require('./src/jobs/emailScheduler.js');
const workflowScheduler = require('./src/jobs/workflowScheduler.js');

// ====================================
// ROUTES
// ====================================

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);

app.use('/api/contracts', contractRoutes);
app.use('/api/contracts', contractExtractionRoutes); // ✅ NOUVEAU
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);

// ✅ CORRECTION UPLOAD : Monter sur /api pour créer /api/contracts/:id/documents
app.use('/api', documentsRoutes);

// ✅ CORRECTION MULTI-TENANT : Les routes employees et assets ont déjà leurs middlewares
// On ne les ajoute PAS ici pour éviter la double application
app.use('/api/employees', employeesRoutes);
app.use('/api/assets', assetsRoutes);

app.use('/api/workflows', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ NOUVEAU : Route pour gestion des utilisateurs
app.use('/api/users', usersRoutes);

// ✅ NOUVEAU : Route pour import CSV/Excel
app.use('/api/import', importRoutes);

// ✅ NOUVEAU : Route pour AI Optimization Score
app.use('/api/optimization', optimizationRoutes);

// ✅ NOUVEAU : Route pour analyse IA (Claude API + ML prédictif)
app.use('/api/ai', aiAnalysisRoutes);

// ✅ CORRECTION #1 : Utilise dashboardController.getGlobalView
app.get('/api/dashboard/global', authMiddleware, organizationMiddleware, dashboardController.getGlobalView);

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
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'OK ✅' : 'MANQUANTE ❌'}`);
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
      workflowScheduler.stop();
    }
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Arrêt...');
  if (process.env.NODE_ENV === 'production') {
    emailScheduler.stop();
    if (process.env.ENABLE_WORKFLOW_NOTIFICATIONS === 'true') {
      workflowScheduler.stop();
    }
  }
  process.exit(0);
});