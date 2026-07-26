const { getAllSiteCodes } = require('./resolvers');

/**
 * Coba identifikasi site_code dari nama file berdasarkan daftar site_code
 * yang sudah terdaftar di database (mis. "Final_Dashboard_Report_BIB.xlsx"
 * -> "BIB" jika site dengan kode "BIB" sudah ada).
 * Pencarian pakai word-boundary agar "BIB" tidak salah cocok dengan "BIBS".
 * @returns {Promise<string|null>}
 */
async function guessSiteCodeFromFilename(filename) {
    const knownCodes = await getAllSiteCodes();
    const upperFilename = filename.toUpperCase();

    // Urutkan dari kode terpanjang agar kode yang lebih spesifik diprioritaskan
    // (mis. "AMC-LAC" dicoba sebelum "AMC").
    const sorted = [...knownCodes].sort((a, b) => b.length - a.length);

    for (const code of sorted) {
        const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`, 'i');
        if (pattern.test(upperFilename)) {
            return code;
        }
    }

    return null;
}

/**
 * Tentukan site_code final: coba dari nama file dulu, kalau gagal
 * pakai site_code yang dikirim user secara eksplisit (dari form upload).
 * @returns {Promise<{ siteCode: string|null, source: 'filename'|'manual'|'none' }>}
 */
async function resolveSiteCodeForFile(filename, manualSiteCode) {
    const fromFilename = await guessSiteCodeFromFilename(filename);
    if (fromFilename) {
        return { siteCode: fromFilename, source: 'filename' };
    }

    if (manualSiteCode && String(manualSiteCode).trim()) {
        return { siteCode: String(manualSiteCode).trim(), source: 'manual' };
    }

    return { siteCode: null, source: 'none' };
}

module.exports = { guessSiteCodeFromFilename, resolveSiteCodeForFile };