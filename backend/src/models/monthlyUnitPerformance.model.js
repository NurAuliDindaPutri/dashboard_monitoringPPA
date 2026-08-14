const { pool } = require('../config/db');

async function findAll(filter = {}) {
    const {
        unit_model_id,
        site_id,
        period_year,
        period_month,
        start_month,
        end_month,
    } = filter;

    let sql = `
        SELECT
            mup.*,
            um.model_name,
            um.site_id,
            s.site_code,
            s.site_name
        FROM monthly_unit_performance mup
        JOIN unit_models um
            ON um.id = mup.unit_model_id
        JOIN sites s
            ON s.id = um.site_id
        WHERE 1 = 1
    `;

    const params = [];

    if (unit_model_id) {
        sql += `
            AND mup.unit_model_id = ?
        `;

        params.push(
            unit_model_id
        );
    }

    if (site_id) {
        sql += `
            AND um.site_id = ?
        `;

        params.push(
            site_id
        );
    }

    if (period_year) {
        sql += `
            AND mup.period_year = ?
        `;

        params.push(
            period_year
        );
    }

    /*
     * Bulan tunggal
     * Untuk Dashboard All Site
     */
    if (period_month) {
        sql += `
            AND mup.period_month = ?
        `;

        params.push(
            period_month
        );
    }

    /*
     * Rentang bulan
     * Untuk Dashboard Per Site
     */
    if (
        start_month &&
        end_month
    ) {
        sql += `
            AND mup.period_month
                BETWEEN ? AND ?
        `;

        params.push(
            start_month,
            end_month
        );
    }

    /*
     * ASC penting untuk chart tren.
     * Hasil API langsung Jan -> Feb -> Mar -> ...
     */
    sql += `
        ORDER BY
            mup.period_year ASC,
            mup.period_month ASC,
            um.model_name ASC
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
                mup.*,
                um.model_name,
                um.site_id,
                s.site_code,
                s.site_name
            FROM monthly_unit_performance mup
            JOIN unit_models um
                ON um.id = mup.unit_model_id
            JOIN sites s
                ON s.id = um.site_id
            WHERE mup.id = ?
            LIMIT 1
            `,
            [id]
        );

    return rows[0] || null;
}

async function create(data) {
    const {
        unit_model_id,
        period_year,
        period_month,
        physical_availability,
        unit_availability,
        mtbf,
        mttr,
        productivity,
        fuel_consumption,
    } = data;

    const [result] =
        await pool.query(
            `
            INSERT INTO monthly_unit_performance
            (
                unit_model_id,
                period_year,
                period_month,
                physical_availability,
                unit_availability,
                mtbf,
                mttr,
                productivity,
                fuel_consumption
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                unit_model_id,
                period_year,
                period_month,
                physical_availability ?? null,
                unit_availability ?? null,
                mtbf ?? null,
                mttr ?? null,
                productivity ?? null,
                fuel_consumption ?? null,
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
        unit_model_id,
        period_year,
        period_month,
        physical_availability,
        unit_availability,
        mtbf,
        mttr,
        productivity,
        fuel_consumption,
    } = data;

    await pool.query(
        `
        UPDATE monthly_unit_performance
        SET
            unit_model_id = ?,
            period_year = ?,
            period_month = ?,
            physical_availability = ?,
            unit_availability = ?,
            mtbf = ?,
            mttr = ?,
            productivity = ?,
            fuel_consumption = ?
        WHERE id = ?
        `,
        [
            unit_model_id,
            period_year,
            period_month,
            physical_availability ?? null,
            unit_availability ?? null,
            mtbf ?? null,
            mttr ?? null,
            productivity ?? null,
            fuel_consumption ?? null,
            id,
        ]
    );

    return findById(id);
}

async function remove(id) {
    const [result] =
        await pool.query(
            `
            DELETE FROM monthly_unit_performance
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