const { pool } = require('../../config/db');
const { findRowIndex, parseMonthLabel, toDecimalOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

/**
 * Parse sheet "Detail LT Supply". Layout: baris site, kolom bulan Jan-Des.
 * Baris "Plan" adalah leadtime_target.
 * Data tiap site adalah leadtime_actual.
 * Tahun dibaca dari judul seperti "YTD 2026", atau menggunakan periodYear dari form sebagai fallback.
 */
async function importDetailLtSupplySheet(matrix, periodMonth, periodYear) {
    const yearRowIdx = findRowIndex(matrix, (v) => /^ytd\s+\d{4}/i.test(String(v)));
    const titleYearMatch = yearRowIdx !== -1 ? Number(String(matrix[yearRowIdx][0]).match(/(\d{4})/)?.[1]) : null;
    const year = titleYearMatch || (periodYear ? Number(periodYear) : null);

    if (!year) {
        throw new Error('Tahun periode tidak ditemukan pada sheet Detail LT Supply maupun form input.');
    }

    const headerIdx = findRowIndex(matrix, (v) => String(v).trim().toLowerCase() === 'site');

    if (headerIdx === -1) {
        return {
            summary: 'Header "SITE" tidak ditemukan pada sheet "Detail LT Supply"',
            skippedDetails: [],
        };
    }

    const headerRow = matrix[headerIdx];
    const monthColumns = [];
    for (let c = 1; c < headerRow.length; c += 1) {
        const month = parseMonthLabel(headerRow[c]);
        if (month) monthColumns.push({ month, colIndex: c });
    }

    let planRow = null;
    let dataEndIdx = matrix.length;
    for (let r = headerIdx + 1; r < matrix.length; r += 1) {
        const label = matrix[r]?.[0];
        if (label && String(label).trim().toLowerCase() === 'plan') {
            planRow = matrix[r];
            dataEndIdx = r;
            break;
        }
    }

    let successCount = 0;
    const skippedDetails = [];

    for (let r = headerIdx + 1; r < dataEndIdx; r += 1) {
        const row = matrix[r] || [];
        const siteCode = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : '';
        if (!siteCode) continue;
        if (/^actual/i.test(siteCode)) continue; // skip "Actual All Site"

        const siteId = await ensureSiteId(siteCode);

        for (const { month, colIndex } of monthColumns) {
            const actual = toDecimalOrNull(row[colIndex]);
            const target = planRow ? toDecimalOrNull(planRow[colIndex]) : null;

            const [existing] = await pool.query(
                'SELECT id FROM monthly_kpi_summary WHERE site_id = ? AND period_year = ? AND period_month = ? LIMIT 1',
                [siteId, year, month]
            );

            if (existing[0]) {
                await pool.query(
                    'UPDATE monthly_kpi_summary SET leadtime_actual = ?, leadtime_target = ? WHERE id = ?',
                    [actual, target, existing[0].id]
                );
            } else {
                await pool.query(
                    `INSERT INTO monthly_kpi_summary (site_id, period_year, period_month, leadtime_actual, leadtime_target)
           VALUES (?, ?, ?, ?, ?)`,
                    [siteId, year, month, actual, target]
                );
            }

            successCount += 1;
        }
    }

    return {
        summary:
            monthColumns.length === 0
                ? 'Tidak ada kolom bulan yang dikenali pada sheet "Detail LT Supply"'
                : `${successCount} baris (site x bulan) berhasil diproses untuk tahun ${year}. Breakdown kategori P1-P4 dilewati.`,
        skippedDetails,
    };
}

module.exports = { importDetailLtSupplySheet };