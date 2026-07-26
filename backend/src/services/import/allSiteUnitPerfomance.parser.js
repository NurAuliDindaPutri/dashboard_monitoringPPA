const { pool } = require('../../config/db');
const { findRowIndex, toDecimalOrNull, toNumberOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId, ensureUnitModelId } = require('./resolvers');

/**
 * Parse sheet "DATA UNIT" (All Site). Kolom A-F adalah tabel asli:
 * SITE | MODEL UNIT | AVERAGE PA | UA | AVERAGE MTBF | AVERAGE MTTR.
 * Kolom G ke kanan adalah PivotTable bawaan Excel dan SENGAJA diabaikan
 * (tidak pernah dibaca sama sekali).
 *
 * Sheet ini tidak punya productivity/fuel_consumption maupun info periode,
 * jadi periode wajib dikirim eksplisit oleh user.
 */
async function importAllSiteUnitPerformanceSheet(matrix, periodMonth, periodYear) {
    const headerIdx = findRowIndex(matrix, (v) => v.toLowerCase() === 'site');
    if (headerIdx === -1) {
        return {
            summary: 'Header "SITE" tidak ditemukan pada sheet "DATA UNIT"',
            skippedDetails: [],
        };
    }

    let successCount = 0;
    const skippedDetails = [];

    for (let r = headerIdx + 1; r < matrix.length; r += 1) {
        const row = matrix[r] || [];
        const siteCode = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : '';
        const modelName = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : '';

        // Baris kosong dianggap akhir data pada blok ini, bukan error.
        if (!siteCode && !modelName) continue;

        if (!siteCode || !modelName) {
            skippedDetails.push({
                sheet: 'DATA UNIT',
                row: { rowIndex: r + 1, values: row.slice(0, 6) },
                reason: 'Kolom SITE atau MODEL UNIT kosong',
            });
            continue;
        }

        const physicalAvailability = toDecimalOrNull(row[2]);
        const unitAvailability = toDecimalOrNull(row[3]);
        const mtbf = toNumberOrNull(row[4]);
        const mttr = toNumberOrNull(row[5]);

        const siteId = await ensureSiteId(siteCode);
        const unitModelId = await ensureUnitModelId(siteId, modelName);

        const [existing] = await pool.query(
            'SELECT id FROM monthly_unit_performance WHERE unit_model_id = ? AND period_year = ? AND period_month = ? LIMIT 1',
            [unitModelId, periodYear, periodMonth]
        );

        if (existing[0]) {
            await pool.query(
                `UPDATE monthly_unit_performance
         SET physical_availability = ?, unit_availability = ?, mtbf = ?, mttr = ?
         WHERE id = ?`,
                [physicalAvailability, unitAvailability, mtbf, mttr, existing[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO monthly_unit_performance
           (unit_model_id, period_year, period_month, physical_availability, unit_availability, mtbf, mttr)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [unitModelId, periodYear, periodMonth, physicalAvailability, unitAvailability, mtbf, mttr]
            );
        }

        successCount += 1;
    }

    return {
        summary: `${successCount} baris unit berhasil diproses untuk periode ${periodMonth}/${periodYear}`,
        skippedDetails,
    };
}

module.exports = { importAllSiteUnitPerformanceSheet };