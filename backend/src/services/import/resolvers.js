const { pool } = require('../../config/db');

/**
 * Cari site_id berdasarkan site_code. Karena file Excel perusahaan
 * TIDAK punya sheet "Master Data" terpisah, site baru dibuat otomatis
 * di sini kapan pun sebuah kode site ditemukan pada sheet manapun
 * (Input, DATA UNIT, Detail LT Supply, Input Data, dst).
 */
async function ensureSiteId(siteCode) {
    const code = String(siteCode).trim();
    const [rows] = await pool.query('SELECT id FROM sites WHERE site_code = ? LIMIT 1', [code]);
    if (rows[0]) return rows[0].id;

    const [result] = await pool.query(
        'INSERT INTO sites (site_code, site_name, is_active) VALUES (?, NULL, 1)',
        [code]
    );
    return result.insertId;
}

/**
 * Cari site_id berdasarkan site_code TANPA membuat baru. Dipakai saat
 * mencocokkan kode site dari nama file terhadap site yang sudah ada.
 */
async function findSiteIdByCode(siteCode) {
    const [rows] = await pool.query('SELECT id FROM sites WHERE site_code = ? LIMIT 1', [
        String(siteCode).trim(),
    ]);
    return rows[0]?.id || null;
}

/**
 * Ambil semua site_code yang sudah terdaftar (dipakai untuk mencocokkan
 * nama file, mis. "..._BIB.xlsx" -> site BIB).
 */
async function getAllSiteCodes() {
    const [rows] = await pool.query('SELECT site_code FROM sites');
    return rows.map((r) => r.site_code);
}

/**
 * Cari unit_model_id berdasarkan site_id + model_name. Model baru dibuat
 * otomatis di sini (sama seperti site) karena tidak ada sheet master terpisah.
 */
async function ensureUnitModelId(siteId, modelName) {
    const name = String(modelName).trim();
    const [rows] = await pool.query(
        'SELECT id FROM unit_models WHERE site_id = ? AND model_name = ? LIMIT 1',
        [siteId, name]
    );
    if (rows[0]) return rows[0].id;

    const [result] = await pool.query(
        'INSERT INTO unit_models (site_id, model_name) VALUES (?, ?)',
        [siteId, name]
    );
    return result.insertId;
}

module.exports = { ensureSiteId, findSiteIdByCode, getAllSiteCodes, ensureUnitModelId };    