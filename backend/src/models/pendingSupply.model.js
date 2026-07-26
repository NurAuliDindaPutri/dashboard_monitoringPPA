const { pool } = require('../config/db');

async function findAll(filter = {}) {
    const { site_id } = filter;
    let sql = `
    SELECT ps.*, s.site_code, s.site_name
    FROM pending_supply ps
    JOIN sites s ON s.id = ps.site_id
  `;
    const params = [];

    if (site_id) {
        sql += ' WHERE ps.site_id = ?';
        params.push(site_id);
    }

    sql += ' ORDER BY ps.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
}

async function findById(id) {
    const [rows] = await pool.query(
        `SELECT ps.*, s.site_code, s.site_name
     FROM pending_supply ps
     JOIN sites s ON s.id = ps.site_id
     WHERE ps.id = ?
     LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}

async function create(data) {
    const { site_id, parts_number, description, qty, no_po, eta, remarks } = data;
    const [result] = await pool.query(
        `INSERT INTO pending_supply
       (site_id, parts_number, description, qty, no_po, eta, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            site_id,
            parts_number,
            description ?? null,
            qty ?? 0,
            no_po ?? null,
            eta ?? null,
            remarks ?? null,
        ]
    );
    return findById(result.insertId);
}

async function update(id, data) {
    const { site_id, parts_number, description, qty, no_po, eta, remarks } = data;
    await pool.query(
        `UPDATE pending_supply
     SET site_id = ?, parts_number = ?, description = ?, qty = ?,
         no_po = ?, eta = ?, remarks = ?
     WHERE id = ?`,
        [
            site_id,
            parts_number,
            description ?? null,
            qty ?? 0,
            no_po ?? null,
            eta ?? null,
            remarks ?? null,
            id,
        ]
    );
    return findById(id);
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM pending_supply WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };