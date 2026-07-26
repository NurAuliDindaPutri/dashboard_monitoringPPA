const { getAllSiteCodes } = require('./resolvers');

/**
 * Mendeteksi site dari sheet matrix, nama sheet, atau fallback context.
 *
 * @param {Array<Array<any>>} matrix Matrix sheet
 * @param {string} sheetName Nama sheet
 * @param {object} context { fallbackSiteId, registeredSites }
 * @returns {Promise<{ sites: string[], source: string, isFallback: boolean }>}
 */
async function detectSites(matrix, sheetName = '', context = {}) {
    const knownSiteCodes = context.registeredSites || (await getAllSiteCodes());
    const detectedSitesSet = new Set();

    const normalize = (str) => String(str || '').trim().toUpperCase();

    // 1. Cek dari nama sheet (misal sheet "BIB", "BEKP", "KCM")
    const normSheet = normalize(sheetName);
    for (const code of knownSiteCodes) {
        if (normSheet === code.toUpperCase() || normSheet.includes(code.toUpperCase())) {
            detectedSitesSet.add(code.toUpperCase());
        }
    }

    // 2. Cek dari kolom SITE atau baris header site pada matrix
    const maxRows = Math.min(matrix.length, 30);
    for (let r = 0; r < maxRows; r += 1) {
        const row = matrix[r] || [];
        for (let c = 0; c < Math.min(row.length, 25); c += 1) {
            const cellVal = normalize(row[c]);
            if (!cellVal) continue;

            // Jika nilai cell cocok persis dengan site_code yang terdaftar
            for (const code of knownSiteCodes) {
                if (cellVal === code.toUpperCase()) {
                    detectedSitesSet.add(code.toUpperCase());
                }
            }
        }
    }

    let sites = Array.from(detectedSitesSet);

    if (sites.length > 0) {
        return {
            sites,
            source: 'detected_from_content',
            isFallback: false,
        };
    }

    // 3. Fallback: gunakan site_id dari form jika ada
    if (context.fallbackSiteCode) {
        return {
            sites: [context.fallbackSiteCode.toUpperCase()],
            source: 'form_fallback',
            isFallback: true,
        };
    }

    return {
        sites: [],
        source: 'none',
        isFallback: true,
    };
}

module.exports = { detectSites };
