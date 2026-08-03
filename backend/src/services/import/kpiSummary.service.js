const { pool } = require('../../config/db');
const { toDecimalOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function findHeaderIndex(matrix) {
    return matrix.findIndex((row) => {
        const headers = (row || []).map(normalizeHeader);

        return (
            headers.includes('site_code') &&
            headers.includes('period_year') &&
            headers.includes('period_month')
        );
    });
}

function buildColumnMap(headerRow) {
    const map = {};

    headerRow.forEach((value, index) => {
        const key = normalizeHeader(value);

        if (key) {
            map[key] = index;
        }
    });

    return map;
}

function getCell(row, columns, key) {
    const index = columns[key];

    if (index === undefined) {
        return null;
    }

    return row[index];
}

function toInteger(value) {
    const number = Number(value);

    return Number.isInteger(number) ? number : null;
}

function isValidPercentage(value) {
    return value === null || (value >= 0 && value <= 1);
}

async function importKpiSummarySheet(matrix) {
    const headerIndex = findHeaderIndex(matrix);

    if (headerIndex === -1) {
        return {
            summary: 'Header template KPI Summary tidak ditemukan',
            skippedDetails: [],
        };
    }

    const columns = buildColumnMap(matrix[headerIndex]);
    const skippedDetails = [];

    let insertedCount = 0;
    let updatedCount = 0;

    for (
        let rowIndex = headerIndex + 1;
        rowIndex < matrix.length;
        rowIndex += 1
    ) {
        const row = matrix[rowIndex] || [];

        const rowIsEmpty = row.every(
            (value) =>
                value === null ||
                value === undefined ||
                String(value).trim() === ''
        );

        if (rowIsEmpty) {
            continue;
        }

        const siteCode = String(
            getCell(row, columns, 'site_code') ?? ''
        )
            .trim()
            .toUpperCase();

        const year = toInteger(
            getCell(row, columns, 'period_year')
        );

        const month = toInteger(
            getCell(row, columns, 'period_month')
        );

        if (!siteCode) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: 'site_code wajib diisi',
            });

            continue;
        }

        if (!year || year < 2000 || year > 2100) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: 'period_year harus bernilai 2000-2100',
            });

            continue;
        }

        if (!month || month < 1 || month > 12) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: 'period_month harus bernilai 1-12',
            });

            continue;
        }

        const values = {
            readynessActual: toDecimalOrNull(
                getCell(row, columns, 'readyness_actual')
            ),
            readynessTarget: toDecimalOrNull(
                getCell(row, columns, 'readyness_target')
            ),
            availabilityActual: toDecimalOrNull(
                getCell(row, columns, 'availability_actual')
            ),
            availabilityTarget: toDecimalOrNull(
                getCell(row, columns, 'availability_target')
            ),
            leadtimeActual: toDecimalOrNull(
                getCell(row, columns, 'leadtime_actual')
            ),
            leadtimeTarget: toDecimalOrNull(
                getCell(row, columns, 'leadtime_target')
            ),
        };

        const percentageFields = [
            ['readyness_actual', values.readynessActual],
            ['readyness_target', values.readynessTarget],
            ['availability_actual', values.availabilityActual],
            ['availability_target', values.availabilityTarget],
            ['leadtime_actual', values.leadtimeActual],
            ['leadtime_target', values.leadtimeTarget],
        ];

        const invalidField = percentageFields.find(
            ([, value]) => !isValidPercentage(value)
        );

        if (invalidField) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: `${invalidField[0]} harus bernilai antara 0 dan 1`,
            });

            continue;
        }

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

        const queryValues = [
            values.readynessActual,
            values.readynessTarget,
            values.availabilityActual,
            values.availabilityTarget,
            values.leadtimeActual,
            values.leadtimeTarget,
        ];

        if (existingRows[0]) {
            await pool.query(
                `UPDATE monthly_kpi_summary
                 SET readyness_actual = ?,
                     readyness_target = ?,
                     availability_actual = ?,
                     availability_target = ?,
                     leadtime_actual = ?,
                     leadtime_target = ?
                 WHERE id = ?`,
                [...queryValues, existingRows[0].id]
            );

            updatedCount += 1;
        } else {
            await pool.query(
                `INSERT INTO monthly_kpi_summary
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [siteId, year, month, ...queryValues]
            );

            insertedCount += 1;
        }
    }

    return {
        summary:
            `${insertedCount} ditambahkan, ` +
            `${updatedCount} diperbarui, ` +
            `${skippedDetails.length} dilewati`,
        skippedDetails,
    };
}

module.exports = { importKpiSummarySheet };