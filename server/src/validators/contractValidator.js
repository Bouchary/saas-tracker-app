// server/src/validators/contractValidator.js

const { body } = require('express-validator');

const createContractValidation = [
    body('name')
        .notEmpty()
        .withMessage('Le nom est requis'),
    
    body('monthly_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le coût doit être un nombre positif'),
    
    body('renewal_date')
        .optional()
        .isISO8601()
        .withMessage('Date invalide'),
    
    body('notice_period_days')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le délai de préavis doit être un entier positif'),
    
    body('pricing_model')
        .optional()
        .isIn(['fixed', 'per_user', 'usage_based'])
        .withMessage('Type de tarification invalide'),
    
    body('license_count')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le nombre de licences doit être un entier positif'),
    
    body('licenses_used')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le nombre de licences utilisées doit être un entier positif'),
    
    // ✅ NOUVEAU : Validation pour real_users
    body('real_users')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le nombre d\'utilisateurs réels doit être un entier positif'),
    
    body('unit_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le coût unitaire doit être un nombre positif'),
];

const updateContractValidation = [
    body('name')
        .optional()
        .notEmpty()
        .withMessage('Le nom ne peut pas être vide'),
    
    body('monthly_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le coût doit être un nombre positif'),
    
    body('renewal_date')
        .optional()
        .isISO8601()
        .withMessage('Date invalide'),
    
    body('notice_period_days')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le délai de préavis doit être un entier positif'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'cancelled'])
        .withMessage('Statut invalide'),
    
    body('pricing_model')
        .optional()
        .isIn(['fixed', 'per_user', 'usage_based'])
        .withMessage('Type de tarification invalide'),
    
    body('license_count')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le nombre de licences doit être un entier positif'),
    
    body('licenses_used')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le nombre de licences utilisées doit être un entier positif'),
    
    // ✅ NOUVEAU : Validation pour real_users
    body('real_users')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Le nombre d\'utilisateurs réels doit être un entier positif'),
    
    body('unit_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Le coût unitaire doit être un nombre positif'),
];

module.exports = {
    createContractValidation,
    updateContractValidation
};