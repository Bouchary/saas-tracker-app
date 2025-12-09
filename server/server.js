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


const app = express();
const port = process.env.PORT || 5000; 

// Middlewares
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);

app.get('/', (req, res) => {
  res.json({ message: "SaaS Tracker API est opérationnelle!" });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${port}`);
  console.log(`Debug JWT_SECRET: ${process.env.JWT_SECRET ? 'OK (' + process.env.JWT_SECRET.length + ' chars)' : 'ERREUR: UNDEFINED'}`);
});