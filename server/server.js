// server/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Charge les variables d'environnement du fichier .env
dotenv.config();

// Import des routes
const contractsRoutes = require('./src/contracts.routes');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Permet au frontend de faire des requêtes au backend
app.use(express.json()); // Permet de parser les requêtes au format JSON

// Routes de l'API
app.use('/api/contracts', contractsRoutes);

// Route de base (Test de santé)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SaaS Tracker API est opérationnelle!' });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur en cours d'exécution sur le port ${port}`);
});