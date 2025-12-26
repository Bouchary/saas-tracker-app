// server/src/services/importService.js
// Service pour valider et transformer les données avant import en BDD

const db = require('../db');

/**
 * Valider et transformer les données d'un contrat
 * @param {object} row - Ligne CSV
 * @param {object} mapping - Mapping colonnes CSV → BDD
 * @param {number} organizationId - ID de l'organization
 * @param {number} userId - ID de l'utilisateur
 * @returns {object} - Données validées ou erreur
 */
function validateAndTransformContract(row, mapping, organizationId, userId) {
  const errors = [];
  const warnings = [];

  // Extraire les valeurs selon le mapping
  const contract = {
    organization_id: organizationId,
    created_by: userId,
    updated_by: userId,
  };

  // Champs obligatoires
  const requiredFields = ['name', 'provider'];

  requiredFields.forEach(field => {
    const csvColumn = mapping[field];
    if (!csvColumn || !row[csvColumn] || row[csvColumn].toString().trim() === '') {
      errors.push(`Champ obligatoire manquant: ${field}`);
    } else {
      contract[field] = row[csvColumn].toString().trim();
    }
  });

  // Si erreurs sur champs obligatoires, arrêter ici
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Champs optionnels avec transformation

  // monthly_cost (doit être un nombre)
  if (mapping.monthly_cost && row[mapping.monthly_cost]) {
    const value = parseFloat(row[mapping.monthly_cost]);
    if (isNaN(value) || value < 0) {
      errors.push(`monthly_cost invalide: ${row[mapping.monthly_cost]}`);
    } else {
      contract.monthly_cost = value;
    }
  }

  // renewal_date (format date)
  if (mapping.renewal_date && row[mapping.renewal_date]) {
    const dateStr = row[mapping.renewal_date].toString().trim();
    const date = parseDate(dateStr);
    if (!date) {
      errors.push(`renewal_date invalide: ${dateStr}`);
    } else {
      contract.renewal_date = date;
    }
  }

  // status (valeurs valides)
  const validStatuses = ['active', 'inactive', 'cancelled', 'expired'];
  if (mapping.status && row[mapping.status]) {
    const status = row[mapping.status].toString().toLowerCase().trim();
    if (validStatuses.includes(status)) {
      contract.status = status;
    } else {
      warnings.push(`Status "${row[mapping.status]}" converti en "active"`);
      contract.status = 'active'; // Valeur par défaut
    }
  } else {
    contract.status = 'active'; // Défaut si pas fourni
  }

  // license_count (entier positif)
  if (mapping.license_count && row[mapping.license_count]) {
    const value = parseInt(row[mapping.license_count]);
    if (isNaN(value) || value < 0) {
      warnings.push(`license_count invalide: ${row[mapping.license_count]}, ignoré`);
    } else {
      contract.license_count = value;
    }
  }

  // pricing_model
  const validPricingModels = ['per_user', 'per_month', 'one_time', 'usage_based'];
  if (mapping.pricing_model && row[mapping.pricing_model]) {
    const model = row[mapping.pricing_model].toString().toLowerCase().trim();
    if (validPricingModels.includes(model)) {
      contract.pricing_model = model;
    } else {
      warnings.push(`pricing_model "${row[mapping.pricing_model]}" converti en "per_month"`);
      contract.pricing_model = 'per_month';
    }
  }

  // notice_period_days
  if (mapping.notice_period_days && row[mapping.notice_period_days]) {
    const value = parseInt(row[mapping.notice_period_days]);
    if (!isNaN(value) && value >= 0) {
      contract.notice_period_days = value;
    }
  }

  // currency (par défaut EUR)
  // DÉSACTIVÉ - La colonne currency n'existe pas dans la table contracts
  // if (mapping.currency && row[mapping.currency]) {
  //   contract.currency = row[mapping.currency].toString().trim().toUpperCase();
  // } else if (contract.monthly_cost) {
  //   contract.currency = 'EUR'; // Défaut
  // }

  // Champs texte simples
  const textFields = ['description', 'contract_number', 'billing_frequency'];
  textFields.forEach(field => {
    if (mapping[field] && row[mapping[field]]) {
      contract[field] = row[mapping[field]].toString().trim();
    }
  });

  return {
    valid: errors.length === 0,
    data: contract,
    errors,
    warnings
  };
}

/**
 * Parser une date depuis différents formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Essayer différents formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,           // 2024-12-26
    /^(\d{2})\/(\d{2})\/(\d{4})$/,         // 26/12/2024
    /^(\d{2})-(\d{2})-(\d{4})$/,           // 26-12-2024
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day;

      if (format === formats[0]) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD/MM/YYYY ou DD-MM-YYYY
        [, day, month, year] = match;
      }

      const date = new Date(year, month - 1, day);
      
      // Vérifier que la date est valide
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      }
    }
  }

  return null;
}

/**
 * Importer un contrat en base de données
 */
async function importContract(contractData) {
  const fields = Object.keys(contractData);
  const values = Object.values(contractData);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO contracts (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING id, name, provider
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Importer plusieurs contrats (batch)
 */
async function importContracts(rows, mapping, organizationId, userId) {
  const results = {
    total: rows.length,
    success: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 car ligne 1 = headers, index commence à 0

    try {
      // Valider et transformer
      const validation = validateAndTransformContract(row, mapping, organizationId, userId);

      if (!validation.valid) {
        results.failed++;
        results.details.push({
          row: rowNumber,
          status: 'error',
          data: row,
          errors: validation.errors,
          warnings: validation.warnings
        });
        continue;
      }

      // Importer en BDD
      const imported = await importContract(validation.data);

      results.success++;
      
      if (validation.warnings.length > 0) {
        results.warnings++;
      }

      results.details.push({
        row: rowNumber,
        status: 'success',
        id: imported.id,
        name: imported.name,
        provider: imported.provider,
        warnings: validation.warnings
      });

    } catch (error) {
      results.failed++;
      results.details.push({
        row: rowNumber,
        status: 'error',
        data: row,
        errors: [`Erreur BDD: ${error.message}`],
        warnings: []
      });
    }
  }

  return results;
}

module.exports = {
  validateAndTransformContract,
  importContract,
  importContracts,
  parseDate
};