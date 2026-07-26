const { pool } = require('../config/db');

async function findAll(filter = {}) {
    const { site_id } = filter;
    let sql = `
    SELECT um.*, s.site_code, s.site_name
    FROM unit_models um
    JOIN sites s ON s.id = um.site_id
  `;
    const params = [];

    if (site_id) {
        sql += ' WHERE um.site_id = ?';
        params.push(site_id);
    }

    sql += ' ORDER BY s.site_code ASC, um.model_name ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
}

async function findById(id) {
    const [rows] = await pool.query(
        `SELECT um.*, s.site_code, s.site_name
     FROM unit_models um
     JOIN sites s ON s.id = um.site_id
     WHERE um.id = ?
     LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

async function create(data) {
    const { site_id, model_name } = data;
    const [result] = await pool.query(
        'INSERT INTO unit_models (site_id, model_name) VALUES (?, ?)',
        [site_id, model_name]
    );
    return findById(result.insertId);
}

async function update(id, data) {
    const { site_id, model_name } = data;
    await pool.query(
        'UPDATE unit_models SET site_id = ?, model_name = ? WHERE id = ?',
        [site_id, model_name, id]
    );
    return findById(id);
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM unit_models WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };