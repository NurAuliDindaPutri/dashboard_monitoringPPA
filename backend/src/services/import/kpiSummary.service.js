const { pool } = require('../../config/db');
const { findRowIndex, extractSiteColumns, toDecimalOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

/**
 * Cari satu blok KPI pada matrix sheet "Input". Pola tiap blok:
 *   [judul blok: Readyness VHS / Availability VHS / Leadtime Supply]
 *   [header: Remarks/Site, <site1>, <site2>, ..., ALL SITE]
 *   [baris actual]
 *   [ ...opsional baris dekoratif... ]
 *   [baris target, kolom pertama diawali kata "target"]
 */
function extractKpiBlock(matrix, titleMatch) {
    const titleIdx = findRowIndex(matrix, (v) => titleMatch(String(v).toLowerCase()));
    if (titleIdx === -1) return null;

    const headerRow = matrix[titleIdx + 1] || [];
    const actualRow = matrix[titleIdx + 2] || [];

    let targetRow = null;
    for (let r = titleIdx + 3; r < Math.min(titleIdx + 8, matrix.length); r += 1) {
        const label = matrix[r]?.[0];
        if (label && String(label).trim().toLowerCase().startsWith('target')) {
            targetRow = matrix[r];
            break;
        }
    }

    return { headerRow, actualRow, targetRow };
}

/**
 * Parse sheet "Input" - 3 blok KPI: Readyness VHS, Availability VHS, Leadtime Supply.
 * Periode (month & year) diambil secara wajib dari parameter (form request).
 */
async function importKpiSummarySheet(matrix, periodMonth, periodYear) {
    const month = Number(periodMonth);
    const year = Number(periodYear);

    if (!month || !year || Number.isNaN(month) || Number.isNaN(year)) {
        throw new Error('Periode data (bulan dan tahun) wajib ditentukan.');
    }

    const readyness = extractKpiBlock(matrix, (t) => t.includes('readyness') || t.includes('readiness'));
    const availability = extractKpiBlock(matrix, (t) => t.includes('availability vhs') || t.includes('availability'));
    const leadtime = extractKpiBlock(matrix, (t) => t.includes('leadtime supply') || t.includes('leadtime') || t.includes('lead time'));

    const siteDataMap = new Map();

    function mergeBlock(block, actualKey, targetKey) {
        if (!block) return;
        const siteColumns = extractSiteColumns(block.headerRow);
        for (const { siteCode, colIndex } of siteColumns) {
            const entry = siteDataMap.get(siteCode) || {};
            entry[actualKey] = toDecimalOrNull(block.actualRow[colIndex]);
            entry[targetKey] = block.targetRow ? toDecimalOrNull(block.targetRow[colIndex]) : null;
            siteDataMap.set(siteCode, entry);
        }
    }

    mergeBlock(readyness, 'readyness_actual', 'readyness_target');
    mergeBlock(availability, 'availability_actual', 'availability_target');
    mergeBlock(leadtime, 'leadtime_actual', 'leadtime_target');

    if (siteDataMap.size === 0) {
        return {
            summary: 'Blok KPI (Readyness/Availability/Leadtime) tidak ditemukan pada sheet "Input"',
            skippedDetails: [],
        };
    }

    let successCount = 0;
    const skippedDetails = [];

    for (const [siteCode, values] of siteDataMap.entries()) {
        const siteId = await ensureSiteId(siteCode);

        const [existing] = await pool.query(
            'SELECT id FROM monthly_kpi_summary WHERE site_id = ? AND period_year = ? AND period_month = ? LIMIT 1',
            [siteId, year, month]
        );

        const values6 = [
            values.readyness_actual ?? null,
            values.readyness_target ?? null,
            values.availability_actual ?? null,
            values.availability_target ?? null,
            values.leadtime_actual ?? null,
            values.leadtime_target ?? null,
        ];

        if (existing[0]) {
            await pool.query(
                `UPDATE monthly_kpi_summary
         SET readyness_actual = ?, readyness_target = ?,
             availability_actual = ?, availability_target = ?,
             leadtime_actual = ?, leadtime_target = ?
         WHERE id = ?`,
                [...values6, existing[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO monthly_kpi_summary
           (site_id, period_year, period_month, readyness_actual, readyness_target,
            availability_actual, availability_target, leadtime_actual, leadtime_target)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [siteId, year, month, ...values6]
            );
        }

        successCount += 1;
    }

    return {
        summary: `${successCount} site berhasil diproses untuk periode ${month}/${year}`,
        skippedDetails,
    };
}

module.exports = { importKpiSummarySheet };