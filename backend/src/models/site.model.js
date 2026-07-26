const { pool } = require('../config/db');

async function findAll() {
    const [rows] = await pool.query(
        'SELECT * FROM sites ORDER BY site_code ASC'
    );
    return rows;
}

async function findById(id) {
    const [rows] = await pool.query(
        'SELECT * FROM sites WHERE id = ? LIMIT 1',
        [id]
    );
    return rows[0] || null;
}

async function create(data) {
    const { site_code, site_name, is_active } = data;
    const [result] = await pool.query(
        'INSERT INTO sites (site_code, site_name, is_active) VALUES (?, ?, ?)',
        [site_code, site_name ?? null, is_active ?? 1]
    );
    return findById(result.insertId);
}

async function update(id, data) {
    const { site_code, site_name, is_active } = data;
    await pool.query(
        `UPDATE sites
     SET site_code = ?, site_name = ?, is_active = ?
     WHERE id = ?`,
        [site_code, site_name ?? null, is_active ?? 1, id]
    );
    return findById(id);
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM sites WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };