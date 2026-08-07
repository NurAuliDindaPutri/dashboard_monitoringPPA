/**
 * unitFilter.js
 * Helper khusus untuk logika dropdown Unit di Dashboard Per Site,
 * termasuk aturan khusus site BIB.
 *
 * Catatan: pencocokan unit BIB pakai PREFIX MATCH (bukan exact match),
 * karena nama unit di database bisa punya akhiran tambahan.
 * Contoh nyata dari data: model_name "PC3400-11M0" tetap harus dikenali
 * sebagai unit "PC3400", dan ditampilkan sebagai "PC3400" saja.
 */

// Kode site BIB (dicocokkan case-insensitive)
export const BIB_SITE_CODE = 'BIB';

// 4 unit yang HANYA ditampilkan untuk site BIB.
// `prefix` dipakai mencocokkan model_name dari database (startsWith, case-insensitive).
// `label` adalah teks yang ditampilkan di dropdown — bagian setelah prefix disembunyikan.
export const BIB_UNIT_RULES = [
    { prefix: 'PC2000-8', label: 'PC2000-8' },
    { prefix: 'PC1250-8', label: 'PC1250-8' },
    { prefix: 'PC3400', label: 'PC3400' },
    { prefix: 'HD785', label: 'HD785' },
];

function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
}

/**
 * Cek apakah site_code yang diberikan adalah site BIB.
 * @param {string} siteCode
 * @returns {boolean}
 */
export function isBibSiteCode(siteCode) {
    return normalizeCode(siteCode) === BIB_SITE_CODE;
}

/**
 * Cari aturan BIB yang cocok untuk sebuah model_name (prefix match).
 * @param {string} modelName
 * @returns {{prefix:string, label:string}|null}
 */
function matchBibRule(modelName) {
    const norm = normalizeCode(modelName);

    return (
        BIB_UNIT_RULES.find((rule) =>
            norm.startsWith(normalizeCode(rule.prefix))
        ) || null
    );
}

/**
 * Filter daftar unit model sesuai aturan site.
 * - Untuk site BIB: hanya tampilkan 4 unit sesuai BIB_UNIT_RULES
 *   (PC2000-8, PC1250-8, PC3400, HD785 — termasuk varian dengan akhiran
 *   seperti "PC3400-11M0" atau "HD785-7").
 * - Untuk site lain: tampilkan semua unit apa adanya.
 *
 * @param {Array<{id:number, model_name:string}>} units
 * @param {string} siteCode
 * @returns {Array<{id:number, model_name:string}>}
 */
export function filterUnitsForSite(units = [], siteCode) {
    if (!isBibSiteCode(siteCode)) return units;

    return units.filter((unit) => Boolean(matchBibRule(unit.model_name)));
}

/**
 * Ambil label tampilan untuk sebuah unit.
 * Khusus site BIB, akhiran/kode tambahan pada model_name disembunyikan
 * (mis. "PC3400-11M0" -> "PC3400", "HD785-7" -> "HD785").
 * Untuk site lain, model_name ditampilkan apa adanya.
 *
 * @param {string} modelName
 * @param {string} siteCode
 * @returns {string}
 */
export function getUnitDisplayLabel(modelName, siteCode) {
    if (isBibSiteCode(siteCode)) {
        const rule = matchBibRule(modelName);
        if (rule) return rule.label;
    }

    return modelName;
}

/**
 * Bentuk opsi dropdown { id, label } dari daftar unit model,
 * sudah difilter sesuai site dan sudah menerapkan label tampilan.
 *
 * @param {Array<{id:number, model_name:string}>} units
 * @param {string} siteCode
 * @returns {Array<{id:number, label:string}>}
 */
export function buildUnitOptions(units = [], siteCode) {
    return filterUnitsForSite(units, siteCode).map((unit) => ({
        id: unit.id,
        label: getUnitDisplayLabel(unit.model_name, siteCode),
    }));
}