// server/src/db.js
// ✅ CORRECTION #11 : Logs DB uniquement en développement

const { Pool } = require('pg');

// Configuration du pool de connexion avec SSL pour production
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  // ✅ Configuration SSL pour Render / prod
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

/**
 * Exécute une requête SQL (hors transaction).
 * @param {string} text
 * @param {Array<any>} params
 */
const query = (text, params) => {
  // ✅ CORRECTION #11 : Logs uniquement en développement
  if (process.env.NODE_ENV !== 'production') {
    console.log('Requête exécutée:', text, params || '');
  }
  return pool.query(text, params);
};

/**
 * Récupère un client (si tu veux gérer la transaction toi-même).
 */
const getClient = () => pool.connect();

/**
 * Exécute une fonction dans une transaction (même connexion).
 * Usage :
 *   const result = await db.withTransaction(async (client) => {
 *     await client.query('...');
 *     return ...
 *   });
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();

  // ✅ CORRECTION #11 : Logs uniquement en développement
  const originalQuery = client.query.bind(client);
  client.query = (text, params) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Requête exécutée (tx):', text, params || '');
    }
    return originalQuery(text, params);
  };

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getClient,
  withTransaction
};