const cron = require('node-cron');
const db = require('../db');

// Exécuter le 1er de chaque mois à 00:01
cron.schedule('1 0 1 * *', async () => {
  try {
    console.log('Génération snapshots mensuels...');
    
    const orgs = await db.query('SELECT id FROM organizations');
    
    for (const org of orgs.rows) {
      await db.query('SELECT generate_monthly_snapshot($1)', [org.id]);
      console.log(`Snapshot généré pour org ${org.id}`);
    }
    
    console.log('✅ Snapshots mensuels terminés');
  } catch (error) {
    console.error('❌ Erreur snapshots:', error);
  }
});

module.exports = {};