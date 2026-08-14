const { pool } = require('../config/db');

async function findAll(filter = {}) {
    const {
        site_id,
        period_year,
        period_month,
        start_month,
        end_month,
    } = filter;

    let sql = `
        SELECT
            mks.*,
            s.site_code,
            s.site_name
        FROM monthly_kpi_summary mks
        JOIN sites s
            ON s.id = mks.site_id
        WHERE 1 = 1
    `;

    const params = [];

    if (site_id) {
        sql += `
            AND mks.site_id = ?
        `;

        params.push(site_id);
    }

    if (period_year) {
        sql += `
            AND mks.period_year = ?
        `;

        params.push(period_year);
    }

    /*
     * Mode bulan tunggal
     * Dipakai Dashboard All Site
     */
    if (period_month) {
        sql += `
            AND mks.period_month = ?
        `;

        params.push(period_month);
    }

    /*
     * Mode rentang bulan
     * Dipakai Dashboard Per Site
     */
    if (
        start_month &&
        end_month
    ) {
        sql += `
            AND mks.period_month
                BETWEEN ? AND ?
        `;

        params.push(
            start_month,
            end_month
        );
    }

    sql += `
        ORDER BY
            mks.period_year ASC,
            mks.period_month ASC,
            s.site_code ASC
    `;

    const [rows] =
        await pool.query(
            sql,
            params
        );

    return rows;
}

async function findById(id) {
    const [rows] =
        await pool.query(
            `
            SELECT
                mks.*,
                s.site_code,
                s.site_name
            FROM monthly_kpi_summary mks
            JOIN sites s
                ON s.id = mks.site_id
            WHERE mks.id = ?
            LIMIT 1
            `,
            [id]
        );

    return rows[0] || null;
}

async function create(data) {
    const {
        site_id,
        period_year,
        period_month,
        readyness_actual,
        readyness_target,
        availability_actual,
        availability_target,
        leadtime_actual,
        leadtime_target,
    } = data;

    const [result] =
        await pool.query(
            `
            INSERT INTO monthly_kpi_summary
            (
                site_id,
                period_year,
                period_month,
                readyness_actual,
                readyness_target,
                availability_actual,
                availability_target,
                leadtime_actual,
                leadtime_target
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                site_id,
                period_year,
                period_month,
                readyness_actual ?? null,
                readyness_target ?? null,
                availability_actual ?? null,
                availability_target ?? null,
                leadtime_actual ?? null,
                leadtime_target ?? null,
            ]
        );

    return findById(
        result.insertId
    );
}

async function update(
    id,
    data
) {
    const {
        site_id,
        period_year,
        period_month,
        readyness_actual,
        readyness_target,
        availability_actual,
        availability_target,
        leadtime_actual,
        leadtime_target,
    } = data;

    await pool.query(
        `
        UPDATE monthly_kpi_summary
        SET
            site_id = ?,
            period_year = ?,
            period_month = ?,
            readyness_actual = ?,
            readyness_target = ?,
            availability_actual = ?,
            availability_target = ?,
            leadtime_actual = ?,
            leadtime_target = ?
        WHERE id = ?
        `,
        [
            site_id,
            period_year,
            period_month,
            readyness_actual ?? null,
            readyness_target ?? null,
            availability_actual ?? null,
            availability_target ?? null,
            leadtime_actual ?? null,
            leadtime_target ?? null,
            id,
        ]
    );

    return findById(id);
}

async function remove(id) {
    const [result] =
        await pool.query(
            `
            DELETE FROM monthly_kpi_summary
            WHERE id = ?
            `,
            [id]
        );

    return (
        result.affectedRows >
        0
    );
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
};