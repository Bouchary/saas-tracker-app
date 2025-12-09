// server/src/validators/contractValidator.js

const { 
    validateString, 
    validatePositiveNumber, 
    validateDate, 
    validatePositiveInteger 
} = require('../middlewares/validation');

/**
 * Validations pour la création d'un contrat
 */
const createContractValidation = [
    (body) => {
        const nameError = validateString(body.name, 'Nom du contrat', 1, 255);
        if (nameError) return { field: 'name', message: nameError };
        return null;
    },
    (body) => {
        // Provider est optionnel, mais si fourni doit être valide
        if (body.provider !== undefined && body.provider !== null && body.provider !== '') {
            const providerError = validateString(body.provider, 'Fournisseur', 1, 255);
            if (providerError) return { field: 'provider', message: providerError };
        }
        return null;
    },
    (body) => {
        const costError = validatePositiveNumber(body.monthly_cost, 'Coût mensuel', false);
        if (costError) return { field: 'monthly_cost', message: costError };
        return null;
    },
    (body) => {
        const dateError = validateDate(body.renewal_date, 'Date de renouvellement', false);
        if (dateError) return { field: 'renewal_date', message: dateError };
        return null;
    },
    (body) => {
        // Notice period est optionnel, par défaut 0
        if (body.notice_period_days !== undefined && body.notice_period_days !== null && body.notice_period_days !== '') {
            const noticeError = validatePositiveInteger(body.notice_period_days, 'Délai de préavis', true);
            if (noticeError) return { field: 'notice_period_days', message: noticeError };
        }
        return null;
    },
];

/**
 * Validations pour la mise à jour d'un contrat
 * Les champs sont optionnels, mais s'ils sont fournis, ils doivent être valides
 */
const updateContractValidation = [
    (body) => {
        if (body.name !== undefined && body.name !== null && body.name !== '') {
            const nameError = validateString(body.name, 'Nom du contrat', 1, 255);
            if (nameError) return { field: 'name', message: nameError };
        }
        return null;
    },
    (body) => {
        if (body.provider !== undefined && body.provider !== null && body.provider !== '') {
            const providerError = validateString(body.provider, 'Fournisseur', 1, 255);
            if (providerError) return { field: 'provider', message: providerError };
        }
        return null;
    },
    (body) => {
        if (body.monthly_cost !== undefined && body.monthly_cost !== null && body.monthly_cost !== '') {
            const costError = validatePositiveNumber(body.monthly_cost, 'Coût mensuel', false);
            if (costError) return { field: 'monthly_cost', message: costError };
        }
        return null;
    },
    (body) => {
        if (body.renewal_date !== undefined && body.renewal_date !== null && body.renewal_date !== '') {
            const dateError = validateDate(body.renewal_date, 'Date de renouvellement', false);
            if (dateError) return { field: 'renewal_date', message: dateError };
        }
        return null;
    },
    (body) => {
        if (body.notice_period_days !== undefined && body.notice_period_days !== null && body.notice_period_days !== '') {
            const noticeError = validatePositiveInteger(body.notice_period_days, 'Délai de préavis', true);
            if (noticeError) return { field: 'notice_period_days', message: noticeError };
        }
        return null;
    },
    (body) => {
        // Validation du statut s'il est fourni
        if (body.status !== undefined && body.status !== null && body.status !== '') {
            const validStatuses = ['active', 'inactive', 'cancelled'];
            if (!validStatuses.includes(body.status.toLowerCase())) {
                return { 
                    field: 'status', 
                    message: `Statut doit être parmi: ${validStatuses.join(', ')}` 
                };
            }
        }
        return null;
    },
];

module.exports = {
    createContractValidation,
    updateContractValidation,
};