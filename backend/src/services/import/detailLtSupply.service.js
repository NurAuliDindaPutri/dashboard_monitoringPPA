const { pool } = require('../../config/db');
const {
    findRowIndex,
    parseMonthLabel,
    toDecimalOrNull,
} = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

function isBlank(value) {
    return (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    );
}

function parsePercentage(value) {
    if (isBlank(value)) {
        return { value: null };
    }

    const parsed = toDecimalOrNull(value);

    if (
        parsed === null ||
        parsed < 0 ||
        parsed > 1
    ) {
        return {
            validationError:
                'nilai harus berupa persentase antara 0% sampai 100%',
        };
    }

    return { value: parsed };
}

function findYear(matrix, fallbackYear) {
    const fallback = Number(fallbackYear);

    for (const row of matrix) {
        for (const cell of row || []) {
            const match = String(cell ?? '')
                .match(/\b(?:YTD\s*)?(20\d{2}|2100)\b/i);

            if (match) {
                return Number(match[1]);
            }
        }
    }

    if (
        Number.isInteger(fallback) &&
        fallback >= 2000 &&
        fallback <= 2100
    ) {
        return fallback;
    }

    return null;
}

/**
 * Parse sheet "Detail LT Supply".
 * Layout: baris site, kolom bulan Januari-Desember, dan baris Plan.
 * Data site disimpan sebagai leadtime_actual; Plan sebagai leadtime_target.
 */
async function importDetailLtSupplySheet(
    matrix,
    periodYear
) {
    const year = findYear(
        matrix,
        periodYear
    );

    if (!year) {
        return {
            summary:
                'Detail LT Supply dilewati karena tahun tidak ditemukan pada sheet atau form import',
            skippedDetails: [
                {
                    sheet: 'Detail LT Supply',
                    reason:
                        'Tahun wajib berada antara 2000-2100',
                },
            ],
        };
    }

    const headerIdx = findRowIndex(
        matrix,
        (value) =>
            String(value)
                .trim()
                .toLowerCase() === 'site'
    );

    if (headerIdx === -1) {
        return {
            summary:
                'Header "SITE" tidak ditemukan pada sheet "Detail LT Supply"',
            skippedDetails: [
                {
                    sheet: 'Detail LT Supply',
                    reason: 'Header SITE tidak ditemukan',
                },
            ],
        };
    }

    const headerRow = matrix[headerIdx] || [];
    const monthColumns = [];
    const seenMonths = new Set();

    for (
        let colIndex = 1;
        colIndex < headerRow.length;
        colIndex += 1
    ) {
        const month =
            parseMonthLabel(
                headerRow[colIndex]
            );

        if (
            month &&
            !seenMonths.has(month)
        ) {
            seenMonths.add(month);
            monthColumns.push({
                month,
                colIndex,
            });
        }
    }

    if (monthColumns.length === 0) {
        return {
            summary:
                'Tidak ada kolom bulan yang dikenali pada sheet "Detail LT Supply"',
            skippedDetails: [
                {
                    sheet: 'Detail LT Supply',
                    row: headerIdx + 1,
                    reason:
                        'Gunakan nama bulan Januari-Desember atau angka 1-12',
                },
            ],
        };
    }

    let planRow = null;
    let dataEndIdx = matrix.length;

    for (
        let rowIndex = headerIdx + 1;
        rowIndex < matrix.length;
        rowIndex += 1
    ) {
        const label = matrix[rowIndex]?.[0];

        if (
            String(label ?? '')
                .trim()
                .toLowerCase() === 'plan'
        ) {
            planRow = matrix[rowIndex];
            dataEndIdx = rowIndex;
            break;
        }
    }

    const skippedDetails = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (
        let rowIndex = headerIdx + 1;
        rowIndex < dataEndIdx;
        rowIndex += 1
    ) {
        const row = matrix[rowIndex] || [];
        const siteCode = String(row[0] ?? '')
            .trim()
            .toUpperCase();

        if (
            !siteCode ||
            /^actual(?:\s+all\s+site)?$/i.test(siteCode)
        ) {
            continue;
        }

        const siteId = await ensureSiteId(siteCode);

        for (const { month, colIndex } of monthColumns) {
            const actualResult =
                parsePercentage(
                    row[colIndex]
                );

            const targetResult =
                parsePercentage(
                    planRow?.[colIndex]
                );

            if (
                actualResult.validationError ||
                targetResult.validationError
            ) {
                skippedDetails.push({
                    sheet: 'Detail LT Supply',
                    row: rowIndex + 1,
                    reason:
                        `${siteCode} bulan ${month}: ${actualResult.validationError || targetResult.validationError}`,
                });
                continue;
            }

            const actual = actualResult.value;
            const target = targetResult.value;

            // Jangan membuat record kosong jika actual dan target sama-sama kosong.
            if (
                actual === null &&
                target === null
            ) {
                continue;
            }

            const [existing] = await pool.query(
                `SELECT id
                 FROM monthly_kpi_summary
                 WHERE site_id = ?
                   AND period_year = ?
                   AND period_month = ?
                 LIMIT 1`,
                [siteId, year, month]
            );

            if (existing[0]) {
                await pool.query(
                    `UPDATE monthly_kpi_summary
                     SET leadtime_actual = ?,
                         leadtime_target = ?
                     WHERE id = ?`,
                    [actual, target, existing[0].id]
                );
                updatedCount += 1;
            } else {
                await pool.query(
                    `INSERT INTO monthly_kpi_summary
                        (site_id, period_year, period_month,
                         leadtime_actual, leadtime_target)
                     VALUES (?, ?, ?, ?, ?)`,
                    [siteId, year, month, actual, target]
                );
                insertedCount += 1;
            }
        }
    }

    return {
        summary:
            `${insertedCount} data ditambahkan, ${updatedCount} data diperbarui untuk tahun ${year}`,
        skippedDetails,
    };
}

module.exports = {
    importDetailLtSupplySheet,
};