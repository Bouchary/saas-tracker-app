// ============================================================================
// ASSET VALIDATOR - VERSION SIMPLIFIÉE
// ============================================================================
// Module : Matériel IT (Phase 10)
// Description : Validations pour les assets (sans express-validator)
// ============================================================================

// Validation pour création d'asset
const validateAssetCreation = (data) => {
  const errors = [];

  // Champs requis
  if (!data.asset_tag || data.asset_tag.trim() === '') {
    errors.push({ field: 'asset_tag', message: 'Asset tag est requis' });
  }

  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Le nom est requis' });
  }

  if (!data.asset_type || data.asset_type.trim() === '') {
    errors.push({ field: 'asset_type', message: 'Le type est requis' });
  }

  // Valider asset_type
  const validTypes = ['laptop', 'phone', 'monitor', 'tablet', 'accessory', 'other'];
  if (data.asset_type && !validTypes.includes(data.asset_type)) {
    errors.push({ 
      field: 'asset_type', 
      message: `Type invalide. Types autorisés: ${validTypes.join(', ')}` 
    });
  }

  // Valider status
  if (data.status) {
    const validStatuses = ['available', 'assigned', 'maintenance', 'retired', 'lost'];
    if (!validStatuses.includes(data.status)) {
      errors.push({ 
        field: 'status', 
        message: `Statut invalide. Statuts autorisés: ${validStatuses.join(', ')}` 
      });
    }
  }

  // Valider condition
  if (data.condition) {
    const validConditions = ['new', 'good', 'fair', 'poor', 'damaged'];
    if (!validConditions.includes(data.condition)) {
      errors.push({ 
        field: 'condition', 
        message: `Condition invalide. Conditions autorisées: ${validConditions.join(', ')}` 
      });
    }
  }

  // Valider dates
  if (data.purchase_date && !isValidDate(data.purchase_date)) {
    errors.push({ field: 'purchase_date', message: 'Date d\'achat invalide' });
  }

  if (data.warranty_end_date && !isValidDate(data.warranty_end_date)) {
    errors.push({ field: 'warranty_end_date', message: 'Date de garantie invalide' });
  }

  // Valider prix
  if (data.purchase_price && (isNaN(data.purchase_price) || data.purchase_price < 0)) {
    errors.push({ field: 'purchase_price', message: 'Prix invalide' });
  }

  // Valider specifications (doit être un objet JSON)
  if (data.specifications) {
    try {
      if (typeof data.specifications === 'string') {
        JSON.parse(data.specifications);
      } else if (typeof data.specifications !== 'object') {
        throw new Error('Invalid format');
      }
    } catch (e) {
      errors.push({ field: 'specifications', message: 'Spécifications JSON invalides' });
    }
  }

  return errors;
};

// Validation pour assignation
const validateAssignment = (data) => {
  const errors = [];

  if (!data.employee_id) {
    errors.push({ field: 'employee_id', message: 'L\'ID de l\'employé est requis' });
  }

  // Valider condition_on_assignment
  if (data.condition_on_assignment) {
    const validConditions = ['new', 'good', 'fair', 'poor', 'damaged'];
    if (!validConditions.includes(data.condition_on_assignment)) {
      errors.push({ 
        field: 'condition_on_assignment', 
        message: `Condition invalide. Conditions autorisées: ${validConditions.join(', ')}` 
      });
    }
  }

  return errors;
};

// Validation pour retour d'asset
const validateReturn = (data) => {
  const errors = [];

  // Valider condition_on_return
  if (data.condition_on_return) {
    const validConditions = ['new', 'good', 'fair', 'poor', 'damaged'];
    if (!validConditions.includes(data.condition_on_return)) {
      errors.push({ 
        field: 'condition_on_return', 
        message: `Condition invalide. Conditions autorisées: ${validConditions.join(', ')}` 
      });
    }
  }

  return errors;
};

// Helper pour valider les dates
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Middleware de validation pour création
const createAssetValidator = (req, res, next) => {
  const errors = validateAssetCreation(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

// Middleware de validation pour modification
const updateAssetValidator = (req, res, next) => {
  // Pour la modification, tous les champs sont optionnels
  // On valide juste les types si fournis
  const errors = [];

  if (req.body.asset_type) {
    const validTypes = ['laptop', 'phone', 'monitor', 'tablet', 'accessory', 'other'];
    if (!validTypes.includes(req.body.asset_type)) {
      errors.push({ 
        field: 'asset_type', 
        message: `Type invalide. Types autorisés: ${validTypes.join(', ')}` 
      });
    }
  }

  if (req.body.status) {
    const validStatuses = ['available', 'assigned', 'maintenance', 'retired', 'lost'];
    if (!validStatuses.includes(req.body.status)) {
      errors.push({ 
        field: 'status', 
        message: `Statut invalide. Statuts autorisés: ${validStatuses.join(', ')}` 
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

// Middleware de validation pour assignation
const assignAssetValidator = (req, res, next) => {
  const errors = validateAssignment(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

// Middleware de validation pour retour
const unassignAssetValidator = (req, res, next) => {
  const errors = validateReturn(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

module.exports = {
  createAssetValidator,
  updateAssetValidator,
  assignAssetValidator,
  unassignAssetValidator
};