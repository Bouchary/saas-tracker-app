// VERSION AVEC DÉPARTEMENTS RÉELS - Fallback sur mock si table vide
// + WORKFLOW SCHEDULER POUR NOTIFICATIONS AUTOMATIQUES
// ✅ CORRECTION #1 : getGlobalData déplacé dans dashboardController
// ✅ NOUVEAU : Route /api/users pour gestion des utilisateurs

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const compression = require('compression'); // ✅ CORRECTION #21
const db = require('./src/db.js'); // ✅ CORRECTION #18

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORRECTION #20 : Configuration CORS sécurisée
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, process.env.APP_URL].filter(Boolean) // Production : domaines autorisés
    : '*', // Développement : tous domaines autorisés
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
// ✅ CORRECTION #21 : Compression gzip pour meilleures performances
app.use(compression());

const { protect } = require('./src/middlewares/authMiddleware.js'); // ✅ CORRECTION #18

const authRoutes = require('./src/auth.routes.js');
const contractRoutes = require('./src/contracts.routes.js');
const emailRoutes = require('./src/routes/emails.js');
const profileRoutes = require('./src/routes/profile.js');
const documentsRoutes = require('./src/routes/documents.js');
const passwordResetRoutes = require('./src/routes/password-reset.js');
const employeesRoutes = require('./src/employees.routes.js');
const assetsRoutes = require('./src/assets.routes.js');
const workflowRoutes = require('./src/workflows.routes.js');
const dashboardRoutes = require('./src/dashboard.routes.js'); // ✅ CORRECTION #18
const dashboardController = require('./src/dashboardController.js'); // ✅ CORRECTION #18
const usersRoutes = require('./src/users.routes.js'); // ✅ NOUVEAU : Routes utilisateurs

// Schedulers pour notifications automatiques
const emailScheduler = require('./src/jobs/emailScheduler.js'); // ✅ CORRECTION #18
const workflowScheduler = require('./src/jobs/workflowScheduler.js'); // ✅ CORRECTION #18

// ====================================
// ROUTES
// ====================================

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);

app.use('/api/contracts', contractRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentsRoutes);

// ✅ FIX CRITIQUE : PROTÈGE employees & assets (sinon accessibles sans login)
app.use('/api/employees', protect, employeesRoutes);
app.use('/api/assets', protect, assetsRoutes);

app.use('/api/workflows', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ NOUVEAU : Route pour gestion des utilisateurs (super_admin uniquement)
app.use('/api/users', usersRoutes);

// ✅ CORRECTION #1 : Utilise dashboardController.getGlobalView
app.get('/api/dashboard/global', protect, dashboardController.getGlobalView);

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