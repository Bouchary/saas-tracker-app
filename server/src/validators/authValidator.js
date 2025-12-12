// server/src/validators/authValidator.js
// Version corrigée compatible avec express-validator

const { body } = require('express-validator');

/**
 * Validations pour l'inscription (register)
 * Utilise express-validator pour la validation côté serveur
 */
const registerValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email requis')
        .isEmail()
        .withMessage('Format d\'email invalide')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email ne doit pas dépasser 255 caractères'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mot de passe requis')
        .isLength({ min: 8 })
        .withMessage('Mot de passe doit contenir au moins 8 caractères')
        .isLength({ max: 128 })
        .withMessage('Mot de passe ne doit pas dépasser 128 caractères')
        .matches(/[A-Z]/)
        .withMessage('Mot de passe doit contenir au moins une majuscule')
        .matches(/[0-9]/)
        .withMessage('Mot de passe doit contenir au moins un chiffre'),
];

/**
 * Validations pour la connexion (login)
 * Validation minimale car l'authentification se fait côté serveur
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email requis')
        .isEmail()
        .withMessage('Format d\'email invalide')
        .normalizeEmail(),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mot de passe requis'),
];

module.exports = {
    registerValidation,
    loginValidation,
};