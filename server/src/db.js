// server/src/db.js

const { Pool } = require('pg');

// Configuration du pool de connexion avec SSL pour production
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  // ✅ AJOUT CRITIQUE : Configuration SSL pour Render
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

/**
 * Exécute une requête SQL.
 * @param {string} text - La requête SQL.
 * @param {Array<any>} params - Les paramètres pour la requête.
 * @returns {Promise<import('pg').QueryResult>} Le résultat de la requête.
 */
const query = (text, params) => {
  console.log('Requête exécutée:', text, params || '');
  return pool.query(text, params);
};


module.exports = {
  query,
};