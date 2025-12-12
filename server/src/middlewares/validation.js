// server/src/middlewares/validation.js

const { validationResult } = require('express-validator');

/**
 * Middleware pour express-validator
 * Utilisé avec les validations de contractValidator.js
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Exécuter toutes les validations
        for (let validation of validations) {
            const result = await validation.run(req);
        }

        // Vérifier les erreurs
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Retourner les erreurs
        const extractedErrors = [];
        errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

        return res.status(400).json({
            error: 'Erreur de validation',
            details: extractedErrors,
        });
    };
};

/**
 * Validation d'email
 */
const validateEmail = (email) => {
    if (!email) {
        return 'Email requis';
    }

    if (typeof email !== 'string') {
        return 'Email doit être une chaîne de caractères';
    }

    // Trim et lowercase
    const trimmedEmail = email.trim().toLowerCase();

    // Vérification de la longueur
    if (trimmedEmail.length > 255) {
        return 'Email ne doit pas dépasser 255 caractères';
    }

    // Regex pour validation d'email (RFC 5322 simplifié)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return 'Format d\'email invalide';
    }

    return null;
};

/**
 * Validation de mot de passe
 */
const validatePassword = (password) => {
    if (!password) {
        return 'Mot de passe requis';
    }

    if (typeof password !== 'string') {
        return 'Mot de passe doit être une chaîne de caractères';
    }

    if (password.length < 8) {
        return 'Mot de passe doit contenir au moins 8 caractères';
    }

    if (password.length > 128) {
        return 'Mot de passe ne doit pas dépasser 128 caractères';
    }

    // Vérifier qu'il contient au moins une majuscule
    if (!/[A-Z]/.test(password)) {
        return 'Mot de passe doit contenir au moins une majuscule';
    }

    // Vérifier qu'il contient au moins un chiffre
    if (!/[0-9]/.test(password)) {
        return 'Mot de passe doit contenir au moins un chiffre';
    }

    return null;
};

/**
 * Validation de chaîne de caractères
 */
const validateString = (value, fieldName, minLength = 1, maxLength = 255) => {
    if (!value) {
        return `${fieldName} requis`;
    }

    if (typeof value !== 'string') {
        return `${fieldName} doit être une chaîne de caractères`;
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength) {
        return `${fieldName} doit contenir au moins ${minLength} caractère(s)`;
    }

    if (trimmed.length > maxLength) {
        return `${fieldName} ne doit pas dépasser ${maxLength} caractères`;
    }

    return null;
};

/**
 * Validation de nombre positif
 */
const validatePositiveNumber = (value, fieldName, allowZero = false) => {
    if (value === undefined || value === null || value === '') {
        return `${fieldName} requis`;
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
        return `${fieldName} doit être un nombre valide`;
    }

    if (allowZero) {
        if (num < 0) {
            return `${fieldName} doit être positif ou zéro`;
        }
    } else {
        if (num <= 0) {
            return `${fieldName} doit être strictement positif`;
        }
    }

    // Vérifier le nombre de décimales (max 2)
    if ((num.toString().split('.')[1] || '').length > 2) {
        return `${fieldName} ne peut avoir plus de 2 décimales`;
    }

    return null;
};

/**
 * Validation de date
 */
const validateDate = (dateString, fieldName, allowPast = true) => {
    if (!dateString) {
        return `${fieldName} requis`;
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return `${fieldName} doit être une date valide`;
    }

    if (!allowPast) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
            return `${fieldName} ne peut pas être dans le passé`;
        }
    }

    return null;
};

/**
 * Validation d'entier positif
 */
const validatePositiveInteger = (value, fieldName, allowZero = true) => {
    if (value === undefined || value === null || value === '') {
        return `${fieldName} requis`;
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
        return `${fieldName} doit être un nombre entier valide`;
    }

    if (!Number.isInteger(num)) {
        return `${fieldName} doit être un nombre entier`;
    }

    if (allowZero) {
        if (num < 0) {
            return `${fieldName} doit être positif ou zéro`;
        }
    } else {
        if (num <= 0) {
            return `${fieldName} doit être strictement positif`;
        }
    }

    return null;
};

/**
 * Sanitize une chaîne de caractères (protection XSS basique)
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .trim()
        .replace(/[<>]/g, '') // Supprime les balises HTML basiques
        .substring(0, 1000); // Limite la longueur maximale
};

module.exports = {
    validate,
    validateEmail,
    validatePassword,
    validateString,
    validatePositiveNumber,
    validateDate,
    validatePositiveInteger,
    sanitizeString,
};