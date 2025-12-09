// server/src/validators/authValidator.js

const { validateEmail, validatePassword } = require('../middlewares/validation');

/**
 * Validations pour l'inscription (register)
 */
const registerValidation = [
    (body) => {
        const emailError = validateEmail(body.email);
        if (emailError) return { field: 'email', message: emailError };
        return null;
    },
    (body) => {
        const passwordError = validatePassword(body.password);
        if (passwordError) return { field: 'password', message: passwordError };
        return null;
    },
];

/**
 * Validations pour la connexion (login)
 */
const loginValidation = [
    (body) => {
        if (!body.email) {
            return { field: 'email', message: 'Email requis' };
        }
        return null;
    },
    (body) => {
        if (!body.password) {
            return { field: 'password', message: 'Mot de passe requis' };
        }
        return null;
    },
];

module.exports = {
    registerValidation,
    loginValidation,
};