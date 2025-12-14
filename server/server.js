// Fichier : saas-tracker-app/server/server.js

// 🚨 ÉTAPE CRITIQUE : Charger les variables d'environnement en premier
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');

// 🌟 Chemins corrigés pour les fichiers de routes dans server/src/ 🌟
const authRoutes = require('./src/auth.routes.js'); 
const contractRoutes = require('./src/contracts.routes.js'); 
const emailRoutes = require('./src/routes/emails.js');
const profileRoutes = require('./src/routes/profile.js');
const documentsRoutes = require('./src/routes/documents.js');
const passwordResetRoutes = require('./src/routes/password-reset.js');

// 🆕 MODULE EMPLOYÉS (Phase 9) - Ajouté le 13 décembre 2024
const employeesRoutes = require('./src/employees.routes.js');

// 🆕 MODULE MATÉRIEL (Phase 10) - Ajouté le 13 décembre 2024
const assetsRoutes = require('./src/assets.routes.js');

// 📧 Import du planificateur d'emails
const emailScheduler = require('./src/jobs/emailScheduler');

const app = express();
const port = process.env.PORT || 5000; 

// Middlewares
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contracts', documentsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/auth', passwordResetRoutes);

// 🆕 Routes Employés (Phase 9)
app.use('/api/employees', employeesRoutes);

// 🆕 Routes Assets (Phase 10)
app.use('/api/assets', assetsRoutes);

app.get('/', (req, res) => {
  res.json({ message: "SaaS Tracker API est opérationnelle!" });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${port}`);
  console.log(`Debug JWT_SECRET: ${process.env.JWT_SECRET ? 'OK (' + process.env.JWT_SECRET.length + ' chars)' : 'ERREUR: UNDEFINED'}`);
  
  // 📧 DÉMARRER LE PLANIFICATEUR D'EMAILS
  if (process.env.NODE_ENV === 'production') {
    emailScheduler.start();
    console.log('✅ Planificateur d\'emails activé en production');
    console.log('   - Alertes quotidiennes : 9h00');
    console.log('   - Résumés hebdomadaires : Lundi 9h00');
  } else {
    console.log('ℹ️  Planificateur d\'emails désactivé en développement');
    console.log('   Utilisez POST /api/emails/test pour tester les emails');
  }
  
  // 🆕 Confirmation modules chargés
  console.log('✅ Module Employés chargé : /api/employees');
  console.log('✅ Module Matériel chargé : /api/assets');
});

// 🛑 Gérer l'arrêt propre du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  if (process.env.NODE_ENV === 'production') {
    emailScheduler.stop();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  if (process.env.NODE_ENV === 'production') {
    emailScheduler.stop();
  }
  process.exit(0);
});