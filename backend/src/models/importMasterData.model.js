const { pool } = require('../config/db');

async function findSiteByCode(siteCode) {
    const [rows] = await pool.query(
        'SELECT * FROM sites WHERE site_code = ? LIMIT 1',
        [siteCode]
    );
    return rows[0] || null;
}

async function insertSite(siteCode) {
    const [result] = await pool.query(
        'INSERT INTO sites (site_code, site_name, is_active) VALUES (?, NULL, 1)',
        [siteCode]
    );
    return result.insertId;
}

async function findUnitModel(siteId, modelName) {
    const [rows] = await pool.query(
        'SELECT * FROM unit_models WHERE site_id = ? AND model_name = ? LIMIT 1',
        [siteId, modelName]
    );
    return rows[0] || null;
}

async function insertUnitModel(siteId, modelName) {
    const [result] = await pool.query(
        'INSERT INTO unit_models (site_id, model_name) VALUES (?, ?)',
        [siteId, modelName]
    );
    return result.insertId;
}

module.exports = { findSiteByCode, insertSite, findUnitModel, insertUnitModel };