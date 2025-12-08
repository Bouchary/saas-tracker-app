// server/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Import des routes
const contractsRoutes = require('./src/contracts.routes');
// Import de la nouvelle route d'authentification
const authRoutes = require('./src/auth.routes'); 

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Routes de l'API
app.use('/api/contracts', contractsRoutes);
// Montage de la nouvelle route
app.use('/api/auth', authRoutes); 

// Route de base (Test de santé)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SaaS Tracker API est opérationnelle!' });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${port}`);
});