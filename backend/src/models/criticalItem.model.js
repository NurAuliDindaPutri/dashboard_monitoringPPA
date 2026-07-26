const { pool } = require('../config/db');

async function findAll(filter = {}) {
    const { site_id } = filter;
    let sql = `
    SELECT ci.*, s.site_code, s.site_name
    FROM critical_items ci
    JOIN sites s ON s.id = ci.site_id
  `;
    const params = [];

    if (site_id) {
        sql += ' WHERE ci.site_id = ?';
        params.push(site_id);
    }

    sql += ' ORDER BY ci.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
}

async function findById(id) {
    const [rows] = await pool.query(
        `SELECT ci.*, s.site_code, s.site_name
     FROM critical_items ci
     JOIN sites s ON s.id = ci.site_id
     WHERE ci.id = ?
     LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

async function create(data) {
    const { site_id, parts_number, description, qty, no_po, estimasi } = data;
    const [result] = await pool.query(
        `INSERT INTO critical_items
       (site_id, parts_number, description, qty, no_po, estimasi)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            site_id,
            parts_number,
            description ?? null,
            qty ?? 0,
            no_po ?? null,
            estimasi ?? null,
        ]
    );
    return findById(result.insertId);
}

async function update(id, data) {
    const { site_id, parts_number, description, qty, no_po, estimasi } = data;
    await pool.query(
        `UPDATE critical_items
     SET site_id = ?, parts_number = ?, description = ?, qty = ?,
         no_po = ?, estimasi = ?
     WHERE id = ?`,
        [
            site_id,
            parts_number,
            description ?? null,
            qty ?? 0,
            no_po ?? null,
            estimasi ?? null,
            id,
        ]
    );
    return findById(id);
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM critical_items WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };