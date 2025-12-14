// ============================================================================
// EMPLOYEE VALIDATOR - VERSION SIMPLIFIÉE (sans express-validator)
// ============================================================================

// Validation manuelle simple
const validateEmployee = (data, isUpdate = false) => {
  const errors = [];

  // Champs requis pour création
  if (!isUpdate) {
    if (!data.first_name || data.first_name.trim() === '') {
      errors.push({ field: 'first_name', message: 'Le prénom est requis' });
    }

    if (!data.last_name || data.last_name.trim() === '') {
      errors.push({ field: 'last_name', message: 'Le nom est requis' });
    }

    if (!data.email || data.email.trim() === '') {
      errors.push({ field: 'email', message: 'L\'email est requis' });
    } else if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Email invalide' });
    }

    if (!data.job_title || data.job_title.trim() === '') {
      errors.push({ field: 'job_title', message: 'Le poste est requis' });
    }

    if (!data.department || data.department.trim() === '') {
      errors.push({ field: 'department', message: 'Le département est requis' });
    }

    if (!data.hire_date) {
      errors.push({ field: 'hire_date', message: 'La date d\'embauche est requise' });
    }

    if (!data.start_date) {
      errors.push({ field: 'start_date', message: 'La date de début est requise' });
    }
  }

  // Validation email si fourni
  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Email invalide' });
  }

  // Validation dates
  if (data.hire_date && data.start_date) {
    if (new Date(data.start_date) < new Date(data.hire_date)) {
      errors.push({ 
        field: 'start_date', 
        message: 'La date de début ne peut pas être avant la date d\'embauche' 
      });
    }
  }

  return errors;
};

// Fonction helper pour valider email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Middleware de validation pour création
const createEmployeeValidator = (req, res, next) => {
  const errors = validateEmployee(req.body, false);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

// Middleware de validation pour modification
const updateEmployeeValidator = (req, res, next) => {
  const errors = validateEmployee(req.body, true);
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Erreur de validation',
      errors
    });
  }
  
  next();
};

// Middleware vide pour compatibilité
const validate = (req, res, next) => {
  next();
};

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator,
  validate
};