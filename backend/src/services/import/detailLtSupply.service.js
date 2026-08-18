const { pool } = require('../../config/db');
const { toDecimalOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function isBlank(value) {
    return (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    );
}

function findHeaderIndex(matrix = []) {
    return matrix.findIndex((row) => {
        const headers = (row || []).map(normalizeHeader);

        return (
            headers.includes('site_code') &&
            headers.includes('period_year') &&
            headers.includes('period_month') &&
            headers.includes('leadtime_actual') &&
            headers.includes('leadtime_target')
        );
    });
}

function buildColumnMap(headerRow = []) {
    const columns = {};

    headerRow.forEach((value, index) => {
        const header = normalizeHeader(value);

        if (header) {
            columns[header] = index;
        }
    });

    return columns;
}

function getCell(row, columns, key) {
    const index = columns[key];

    return index === undefined ? null : row[index];
}

function parseInteger(value) {
    const number = Number(value);

    return Number.isInteger(number) ? number : null;
}

function parsePercentage(value) {
    if (isBlank(value)) {
        return {
            provided: false,
            value: null,
        };
    }

    const parsed = toDecimalOrNull(value);

    if (
        parsed === null ||
        parsed < 0 ||
        parsed > 1
    ) {
        return {
            provided: true,
            validationError:
                'harus berupa persentase antara 0 sampai 1',
        };
    }

    return {
        provided: true,
        value: parsed,
    };
}

/**
 * Format sheet:
 * site_code | period_year | period_month |
 * leadtime_actual | leadtime_target
 *
 * Data masuk ke monthly_kpi_summary. Jika periode sudah ada,
 * hanya kolom Lead Time yang diisi di Excel yang diperbarui.
 * Readiness dan Availability tidak diubah.
 */
async function importDetailLtSupplySheet(matrix = []) {
    const headerIndex = findHeaderIndex(matrix);

    if (headerIndex === -1) {
        return {
            summary:
                'Header template Detail LT Supply tidak ditemukan',
            skippedDetails: [
                {
                    sheet: 'Detail LT Supply',
                    reason:
                        'Gunakan kolom site_code, period_year, period_month, leadtime_actual, dan leadtime_target',
                },
            ],
        };
    }

    const columns = buildColumnMap(matrix[headerIndex]);

    const skippedDetails = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (
        let rowIndex = headerIndex + 1;
        rowIndex < matrix.length;
        rowIndex += 1
    ) {
        const row = matrix[rowIndex] || [];

        if (row.every(isBlank)) {
            continue;
        }

        const siteCode = String(
            getCell(row, columns, 'site_code') ?? ''
        )
            .trim()
            .toUpperCase();

        const year = parseInteger(
            getCell(row, columns, 'period_year')
        );

        const month = parseInteger(
            getCell(row, columns, 'period_month')
        );

        if (!siteCode) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason: 'site_code wajib diisi',
            });
            continue;
        }

        if (!year || year < 2000 || year > 2100) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason:
                    'period_year harus berada antara 2000-2100',
            });
            continue;
        }

        if (!month || month < 1 || month > 12) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason:
                    'period_month harus berada antara 1-12',
            });
            continue;
        }

        const actual = parsePercentage(
            getCell(row, columns, 'leadtime_actual')
        );

        const target = parsePercentage(
            getCell(row, columns, 'leadtime_target')
        );

        if (
            actual.validationError ||
            target.validationError
        ) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason: actual.validationError
                    ? `leadtime_actual ${actual.validationError}`
                    : `leadtime_target ${target.validationError}`,
            });
            continue;
        }

        if (!actual.provided && !target.provided) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason:
                    'leadtime_actual dan leadtime_target kosong',
            });
            continue;
        }

        try {
            const siteId = await ensureSiteId(siteCode);

            const [existingRows] = await pool.query(
                `SELECT id
                 FROM monthly_kpi_summary
                 WHERE site_id = ?
                   AND period_year = ?
                   AND period_month = ?
                 LIMIT 1`,
                [siteId, year, month]
            );

            if (existingRows[0]) {
                const updateFields = [];
                const updateValues = [];

                if (actual.provided) {
                    updateFields.push('leadtime_actual = ?');
                    updateValues.push(actual.value);
                }

                if (target.provided) {
                    updateFields.push('leadtime_target = ?');
                    updateValues.push(target.value);
                }

                updateValues.push(existingRows[0].id);

                await pool.query(
                    `UPDATE monthly_kpi_summary
                     SET ${updateFields.join(', ')}
                     WHERE id = ?`,
                    updateValues
                );

                updatedCount += 1;
            } else {
                await pool.query(
                    `INSERT INTO monthly_kpi_summary
                    (
                        site_id,
                        period_year,
                        period_month,
                        leadtime_actual,
                        leadtime_target
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        siteId,
                        year,
                        month,
                        actual.provided ? actual.value : null,
                        target.provided ? target.value : null,
                    ]
                );

                insertedCount += 1;
            }
        } catch (err) {
            skippedCount += 1;
            skippedDetails.push({
                sheet: 'Detail LT Supply',
                row: rowIndex + 1,
                reason:
                    err.message || 'Baris gagal diproses',
            });
        }
    }

    return {
        summary:
            `${insertedCount} ditambahkan, ` +
            `${updatedCount} diperbarui, ` +
            `${skippedCount} dilewati`,
        skippedDetails,
    };
}

module.exports = {
    importDetailLtSupplySheet,
};