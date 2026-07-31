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

async function importKpiSummarySheet(matrix) {
    const headerIndex = findHeaderIndex(matrix);

    if (headerIndex === -1) {
        return {
            summary:
                'Header template KPI Summary tidak ditemukan',
            skippedDetails: [],
        };
    }

    const columns = buildColumnMap(matrix[headerIndex]);
    const skippedDetails = [];

    let successCount = 0;

    for (
        let rowIndex = headerIndex + 1;
        rowIndex < matrix.length;
        rowIndex += 1
    ) {
        const row = matrix[rowIndex] || [];

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

        const rowIsEmpty = row.every(
            (value) =>
                value === null ||
                value === undefined ||
                String(value).trim() === ''
        );

        if (rowIsEmpty) {
            continue;
        }

        if (!siteCode) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: 'site_code kosong',
            });
            continue;
        }

        if (!year || year < 2000 || year > 2100) {
            skippedDetails.push({
                sheet: 'KPI Summary',
                row: rowIndex + 1,
                reason: 'period_year tidak valid',
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

        const siteId = await ensureSiteId(siteCode);

        const values = [
            toDecimalOrNull(
                getCell(row, columns, 'readyness_actual')
            ),
            toDecimalOrNull(
                getCell(row, columns, 'readyness_target')
            ),
            toDecimalOrNull(
                getCell(row, columns, 'availability_actual')
            ),
            toDecimalOrNull(
                getCell(row, columns, 'availability_target')
            ),
            toDecimalOrNull(
                getCell(row, columns, 'leadtime_actual')
            ),
            toDecimalOrNull(
                getCell(row, columns, 'leadtime_target')
            ),
        ];

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
            await pool.query(
                `UPDATE monthly_kpi_summary
                 SET readyness_actual = ?,
                     readyness_target = ?,
                     availability_actual = ?,
                     availability_target = ?,
                     leadtime_actual = ?,
                     leadtime_target = ?
                 WHERE id = ?`,
                [...values, existingRows[0].id]
            );
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
                [siteId, year, month, ...values]
            );
        }

        successCount += 1;
    }

    return {
        summary: `${successCount} baris KPI berhasil diproses`,
        skippedDetails,
    };
}

module.exports = { importKpiSummarySheet };