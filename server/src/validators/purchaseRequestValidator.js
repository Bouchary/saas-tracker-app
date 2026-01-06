// server/src/validators/purchaseRequestValidator.js
// ============================================================================
// VALIDATORS MODULE PURCHASE REQUESTS
// ============================================================================

const { body } = require('express-validator');

// Catégories autorisées
const VALID_CATEGORIES = [
    'Équipement informatique',
    'Logiciels & Licences',
    'Mobilier',
    'Services',
    'Formation',
    'Fournitures',
    'Autre'
];

// Niveaux urgence
const VALID_URGENCIES = ['normal', 'urgent', 'critical'];

// ============================================================================
// VALIDATION CRÉATION DEMANDE
// ============================================================================
const createPurchaseRequestValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Le titre est requis')
        .isLength({ min: 5, max: 255 }).withMessage('Le titre doit contenir entre 5 et 255 caractères'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('La description ne peut dépasser 2000 caractères'),
    
    body('justification')
        .trim()
        .notEmpty().withMessage('La justification est requise')
        .isLength({ min: 10, max: 2000 }).withMessage('La justification doit contenir entre 10 et 2000 caractères'),
    
    body('amount')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    
    body('currency')
        .optional()
        .isIn(['EUR', 'USD', 'GBP', 'CHF']).withMessage('Devise non valide'),
    
    body('category')
        .notEmpty().withMessage('La catégorie est requise')
        .isIn(VALID_CATEGORIES).withMessage('Catégorie non valide'),
    
    body('custom_category_text')
        .if(body('category').equals('Autre'))
        .notEmpty().withMessage('Veuillez spécifier la catégorie personnalisée')
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('La catégorie personnalisée doit contenir entre 3 et 255 caractères'),
    
    body('urgency')
        .optional()
        .isIn(VALID_URGENCIES).withMessage('Niveau d\'urgence non valide'),
    
    body('supplier_name')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Le nom du fournisseur ne peut dépasser 255 caractères'),
    
    body('supplier_email')
        .optional()
        .trim()
        .isEmail().withMessage('Email fournisseur non valide'),
    
    body('supplier_phone')
        .optional()
        .trim()
        .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Numéro de téléphone non valide'),
    
    body('needed_date')
        .optional()
        .isISO8601().withMessage('Date non valide')
        .toDate()
];

// ============================================================================
// VALIDATION MODIFICATION DEMANDE
// ============================================================================
const updatePurchaseRequestValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 }).withMessage('Le titre doit contenir entre 5 et 255 caractères'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('La description ne peut dépasser 2000 caractères'),
    
    body('justification')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('La justification doit contenir entre 10 et 2000 caractères'),
    
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    
    body('currency')
        .optional()
        .isIn(['EUR', 'USD', 'GBP', 'CHF']).withMessage('Devise non valide'),
    
    body('category')
        .optional()
        .isIn(VALID_CATEGORIES).withMessage('Catégorie non valide'),
    
    body('custom_category_text')
        .if(body('category').equals('Autre'))
        .notEmpty().withMessage('Veuillez spécifier la catégorie personnalisée'),
    
    body('urgency')
        .optional()
        .isIn(VALID_URGENCIES).withMessage('Niveau d\'urgence non valide'),
    
    body('supplier_email')
        .optional()
        .isEmail().withMessage('Email fournisseur non valide'),
    
    body('needed_date')
        .optional()
        .isISO8601().withMessage('Date non valide')
        .toDate()
];

// ============================================================================
// VALIDATION SOUMISSION
// ============================================================================
const submitPurchaseRequestValidation = [
    // Pas de body nécessaire pour soumettre
];

// ============================================================================
// VALIDATION APPROBATION
// ============================================================================
const approveRequestValidation = [
    body('comments')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Le commentaire ne peut dépasser 1000 caractères')
];

// ============================================================================
// VALIDATION REJET
// ============================================================================
const rejectRequestValidation = [
    body('rejection_reason')
        .trim()
        .notEmpty().withMessage('La raison du rejet est requise')
        .isLength({ min: 10, max: 1000 }).withMessage('La raison doit contenir entre 10 et 1000 caractères')
];

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
    createPurchaseRequestValidation,
    updatePurchaseRequestValidation,
    submitPurchaseRequestValidation,
    approveRequestValidation,
    rejectRequestValidation,
    
    // Export constantes pour utilisation ailleurs
    VALID_CATEGORIES,
    VALID_URGENCIES
};