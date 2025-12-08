// server/src/contracts.controller.js

const db = require('./db');

/**
 * Récupère tous les contrats de la base de données.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllContracts = async (req, res) => {
  try {
    // Requête SQL pour sélectionner toutes les colonnes de la table 'contracts'
    const result = await db.query('SELECT * FROM contracts ORDER BY renewal_date ASC');
    
    // Si la requête est réussie, renvoyer les données
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des contrats:', error);
    // En cas d'erreur (ex: table n'existe pas, problème de connexion), renvoyer 500
    res.status(500).json({ 
      error: 'Erreur serveur interne lors de la récupération des contrats',
      details: error.message
    });
  }
};

module.exports = {
  getAllContracts,
};