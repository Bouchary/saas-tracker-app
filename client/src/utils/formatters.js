// client/src/utils/formatters.js
// ✅ NOUVEAU FICHIER - Fonctions utilitaires pour formatage (séparateurs milliers)

/**
 * Formate un nombre avec séparateurs de milliers (espace)
 * @param {number} value - Nombre à formater
 * @param {number} decimals - Nombre de décimales (défaut: 0)
 * @returns {string} - Nombre formaté
 * 
 * Exemples :
 * formatNumber(1234) -> "1 234"
 * formatNumber(1234.56, 2) -> "1 234.56"
 * formatNumber(1234567.89, 2) -> "1 234 567.89"
 */
export const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    const num = parseFloat(value);
    
    // Formater avec décimales
    const formatted = num.toFixed(decimals);
    
    // Séparer partie entière et décimale
    const [integer, decimal] = formatted.split('.');
    
    // Ajouter séparateurs de milliers (espace)
    const integerWithSpaces = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Reconstituer avec décimales si présentes
    return decimal ? `${integerWithSpaces}.${decimal}` : integerWithSpaces;
};

/**
 * Formate un montant en euros avec séparateurs
 * @param {number} value - Montant à formater
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} - Montant formaté avec € et séparateurs
 * 
 * Exemples :
 * formatCurrency(1234) -> "1 234.00 €"
 * formatCurrency(1234.5) -> "1 234.50 €"
 * formatCurrency(1234567.89) -> "1 234 567.89 €"
 */
export const formatCurrency = (value, decimals = 2) => {
    return `${formatNumber(value, decimals)} €`;
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur à formater (0-100)
 * @param {number} decimals - Nombre de décimales (défaut: 1)
 * @returns {string} - Pourcentage formaté
 * 
 * Exemples :
 * formatPercent(73.5) -> "73.5%"
 * formatPercent(73.567, 2) -> "73.57%"
 */
export const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Formate une différence (avec +/-)
 * @param {number} value - Valeur différence
 * @param {boolean} isPercent - Si true, ajoute %
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Différence formatée avec signe
 * 
 * Exemples :
 * formatDifference(15.5, true) -> "+15.5%"
 * formatDifference(-8.2, true) -> "-8.2%"
 * formatDifference(250) -> "+250"
 */
export const formatDifference = (value, isPercent = false, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    
    const sign = value >= 0 ? '+' : '';
    const formatted = parseFloat(value).toFixed(decimals);
    const suffix = isPercent ? '%' : '';
    
    return `${sign}${formatted}${suffix}`;
};

/**
 * Formate une date en français
 * @param {string|Date} date - Date à formater
 * @param {boolean} includeTime - Inclure l'heure (défaut: false)
 * @returns {string} - Date formatée
 * 
 * Exemples :
 * formatDate('2024-12-15') -> "15 décembre 2024"
 * formatDate('2024-12-15T14:30:00') -> "15 décembre 2024"
 * formatDate('2024-12-15T14:30:00', true) -> "15 décembre 2024 à 14:30"
 */
export const formatDate = (date, includeTime = false) => {
    if (!date) return '-';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une date courte (jj/mm/aaaa)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée courte
 * 
 * Exemples :
 * formatDateShort('2024-12-15') -> "15/12/2024"
 */
export const formatDateShort = (date) => {
    if (!date) return '-';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('fr-FR');
};

/**
 * Calcule et formate la différence entre deux valeurs (%)
 * @param {number} current - Valeur actuelle
 * @param {number} previous - Valeur précédente
 * @returns {object} - { value: différence en %, formatted: string formaté, trend: 'up'|'down'|'stable' }
 * 
 * Exemples :
 * calculateDifference(1500, 1200) -> { value: 25, formatted: "+25.0%", trend: "up" }
 * calculateDifference(1000, 1200) -> { value: -16.67, formatted: "-16.7%", trend: "down" }
 */
export const calculateDifference = (current, previous) => {
    if (!previous || previous === 0) {
        return { value: 0, formatted: '0%', trend: 'stable' };
    }
    
    const diff = ((current - previous) / previous) * 100;
    const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
    
    return {
        value: diff,
        formatted: formatDifference(diff, true),
        trend
    };
};

/**
 * Tronque un texte avec ellipsis
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} - Texte tronqué
 * 
 * Exemples :
 * truncateText('Lorem ipsum dolor sit amet', 10) -> "Lorem ipsu..."
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Retourne la couleur appropriée selon le trend
 * @param {string} trend - 'up' | 'down' | 'stable'
 * @param {boolean} inverse - Si true, inverse la logique (down = good)
 * @returns {string} - Classe CSS Tailwind
 */
export const getTrendColor = (trend, inverse = false) => {
    if (trend === 'stable') return 'text-gray-600';
    
    if (inverse) {
        return trend === 'up' ? 'text-red-600' : 'text-green-600';
    }
    
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
};

export default {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatDifference,
    formatDate,
    formatDateShort,
    calculateDifference,
    truncateText,
    getTrendColor
};