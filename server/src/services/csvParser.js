// server/src/services/csvParser.js
// Service pour parser fichiers CSV avec papaparse

const Papa = require('papaparse');
const fs = require('fs').promises;
const path = require('path');

/**
 * Parser un fichier CSV et retourner les données
 * @param {string} filepath - Chemin complet du fichier
 * @param {object} options - Options de parsing
 * @returns {Promise<object>} - Données parsées avec métadonnées
 */
async function parseCSV(filepath, options = {}) {
  try {
    // Lire le contenu du fichier
    const fileContent = await fs.readFile(filepath, 'utf-8');

    // Configuration papaparse
    const config = {
      header: true,              // Première ligne = headers
      skipEmptyLines: true,       // Ignorer lignes vides
      dynamicTyping: true,        // Convertir nombres automatiquement
      transformHeader: (header) => {
        // Nettoyer les headers (trim, lowercase)
        return header.trim();
      },
      ...options
    };

    // Parser avec papaparse
    const result = Papa.parse(fileContent, config);

    if (result.errors.length > 0) {
      console.warn('⚠️  CSV parsing warnings:', result.errors);
    }

    // Détecter les types de colonnes
    const columnTypes = detectColumnTypes(result.data, result.meta.fields);

    // Statistiques
    const stats = {
      totalRows: result.data.length,
      totalColumns: result.meta.fields.length,
      columns: result.meta.fields,
      columnTypes: columnTypes,
      hasErrors: result.errors.length > 0,
      errors: result.errors.slice(0, 10), // Max 10 erreurs
    };

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      stats: stats,
      preview: result.data.slice(0, 10), // Premières 10 lignes
    };

  } catch (error) {
    console.error('❌ Erreur parsing CSV:', error);
    throw new Error(`Erreur lors du parsing CSV: ${error.message}`);
  }
}

/**
 * Détecter les types de colonnes
 * @param {array} data - Données parsées
 * @param {array} fields - Noms des colonnes
 * @returns {object} - Types détectés pour chaque colonne
 */
function detectColumnTypes(data, fields) {
  const types = {};

  if (!data || data.length === 0) {
    return types;
  }

  fields.forEach(field => {
    const samples = data
      .slice(0, 100) // Analyser max 100 lignes
      .map(row => row[field])
      .filter(val => val !== null && val !== undefined && val !== '');

    if (samples.length === 0) {
      types[field] = 'empty';
      return;
    }

    // Détecter le type
    const firstValue = samples[0];

    if (typeof firstValue === 'number') {
      types[field] = 'number';
    } else if (typeof firstValue === 'boolean') {
      types[field] = 'boolean';
    } else if (isDate(firstValue)) {
      types[field] = 'date';
    } else if (isEmail(firstValue)) {
      types[field] = 'email';
    } else {
      types[field] = 'string';
    }
  });

  return types;
}

/**
 * Vérifier si une valeur est une date
 */
function isDate(value) {
  if (typeof value !== 'string') return false;
  
  // Patterns de date courants
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,           // 2024-12-26
    /^\d{2}\/\d{2}\/\d{4}$/,         // 26/12/2024
    /^\d{2}-\d{2}-\d{4}$/,           // 26-12-2024
  ];

  return datePatterns.some(pattern => pattern.test(value));
}

/**
 * Vérifier si une valeur est un email
 */
function isEmail(value) {
  if (typeof value !== 'string') return false;
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

/**
 * Suggérer le mapping des colonnes pour un type d'entité
 * @param {array} columns - Colonnes du CSV
 * @param {string} entityType - Type d'entité (contracts, assets, employees)
 * @returns {object} - Mapping suggéré
 */
function suggestColumnMapping(columns, entityType) {
  const mapping = {};

  // Patterns de matching pour chaque type d'entité
  const patterns = {
    contracts: {
      name: ['name', 'nom', 'contract_name', 'contrat'],
      provider: ['provider', 'fournisseur', 'vendor', 'vendeur'],
      monthly_cost: ['monthly_cost', 'cost', 'cout', 'prix', 'price', 'montant'],
      renewal_date: ['renewal_date', 'renouvellement', 'expiration', 'date'],
      status: ['status', 'statut', 'etat'],
      license_count: ['license_count', 'licenses', 'licences', 'users', 'utilisateurs'],
    },
    assets: {
      name: ['name', 'nom', 'asset_name', 'designation'],
      asset_tag: ['asset_tag', 'tag', 'reference', 'ref'],
      asset_type: ['asset_type', 'type', 'category', 'categorie'],
      manufacturer: ['manufacturer', 'fabricant', 'brand', 'marque'],
      model: ['model', 'modele'],
      serial_number: ['serial_number', 'serial', 'sn', 'numero_serie'],
      status: ['status', 'statut', 'etat'],
      purchase_date: ['purchase_date', 'date_achat', 'acquisition_date'],
      purchase_price: ['purchase_price', 'prix', 'price', 'cost'],
    },
    employees: {
      first_name: ['first_name', 'prenom', 'firstname', 'fname'],
      last_name: ['last_name', 'nom', 'lastname', 'lname'],
      email: ['email', 'mail', 'courriel'],
      department: ['department', 'departement', 'service'],
      job_title: ['job_title', 'title', 'poste', 'fonction'],
      phone: ['phone', 'telephone', 'tel', 'mobile'],
      start_date: ['start_date', 'date_embauche', 'hire_date', 'joining_date'],
      status: ['status', 'statut', 'etat'],
    }
  };

  const entityPatterns = patterns[entityType] || {};

  // Pour chaque colonne cible
  Object.keys(entityPatterns).forEach(targetField => {
    const possibleNames = entityPatterns[targetField];

    // Chercher une correspondance
    const match = columns.find(col => {
      const colLower = col.toLowerCase().replace(/[_\s-]/g, '');
      return possibleNames.some(pattern => {
        const patternLower = pattern.toLowerCase().replace(/[_\s-]/g, '');
        return colLower.includes(patternLower) || patternLower.includes(colLower);
      });
    });

    if (match) {
      mapping[targetField] = match;
    }
  });

  return mapping;
}

module.exports = {
  parseCSV,
  detectColumnTypes,
  suggestColumnMapping
};