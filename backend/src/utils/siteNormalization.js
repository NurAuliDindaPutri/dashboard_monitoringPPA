const SITE_ALIASES = Object.freeze({
    WARA: 'WARA',
    ADRW: 'WARA',

    BA: 'BA',
    PTBA: 'BA',

    AMC: 'AMC',
    'AMC-LAC': 'AMC',
    'AMC-MAC': 'AMC',
    LAC: 'AMC',
});

function normalizeSiteCode(value) {
    const code = String(value ?? '')
        .trim()
        .toUpperCase();

    return SITE_ALIASES[code] || code;
}

module.exports = {
    normalizeSiteCode,
};