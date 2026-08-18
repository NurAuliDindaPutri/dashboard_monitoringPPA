const { pool } = require('../../config/db');

const {
    toDecimalOrNull,
    toNumberOrNull,
} = require('../../utils/excelHelpers');

const {
    ensureSiteId,
    ensureUnitModelId,
} = require('./resolvers');

function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function isValidUnitAvailability(value) {
    return value === null || (
        value >= -1 &&
        value <= 1
    );
}

function findHeaderIndex(matrix) {
    return matrix.findIndex((row) => {
        const headers = (row || []).map(normalizeHeader);

        return (
            headers.includes('site_code') &&
            headers.includes('model_name') &&
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

function isValidNonNegativeNumber(value) {
    return value === null || value >= 0;
}

async function importUnitPerformanceSheet(matrix) {
    const headerIndex = findHeaderIndex(matrix);

    if (headerIndex === -1) {
        return {
            summary:
                'Header template Unit Performance tidak ditemukan',
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

        const modelName = String(
            getCell(row, columns, 'model_name') ?? ''
        ).trim();

        const year = toInteger(
            getCell(row, columns, 'period_year')
        );

        const month = toInteger(
            getCell(row, columns, 'period_month')
        );

        if (!siteCode) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'site_code wajib diisi',
            });

            continue;
        }

        if (!modelName) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'model_name wajib diisi',
            });

            continue;
        }

        if (!year || year < 2000 || year > 2100) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'period_year harus bernilai 2000-2100',
            });

            continue;
        }

        if (!month || month < 1 || month > 12) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'period_month harus bernilai 1-12',
            });

            continue;
        }

        const physicalAvailability = toDecimalOrNull(
            getCell(
                row,
                columns,
                'physical_availability'
            )
        );

        const unitAvailability = toDecimalOrNull(
            getCell(
                row,
                columns,
                'unit_availability'
            )
        );

        const mtbf = toNumberOrNull(
            getCell(row, columns, 'mtbf')
        );

        const mttr = toNumberOrNull(
            getCell(row, columns, 'mttr')
        );

        const productivity = toNumberOrNull(
            getCell(row, columns, 'productivity')
        );

        const fuelConsumption = toNumberOrNull(
            getCell(row, columns, 'fuel_consumption')
        );

        if (!isValidPercentage(physicalAvailability)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason:
                    'physical_availability harus bernilai antara 0 dan 1',
            });

            continue;
        }

        if (!isValidUnitAvailability(unitAvailability)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason:
                    'unit_availability harus bernilai antara -1 dan 1',
            });

            continue;
        }

        if (!isValidNonNegativeNumber(mtbf)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'mtbf tidak boleh bernilai negatif',
            });

            continue;
        }

        if (!isValidNonNegativeNumber(mttr)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason: 'mttr tidak boleh bernilai negatif',
            });

            continue;
        }

        if (!isValidNonNegativeNumber(productivity)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason:
                    'productivity tidak boleh bernilai negatif',
            });

            continue;
        }

        if (!isValidNonNegativeNumber(fuelConsumption)) {
            skippedDetails.push({
                sheet: 'Unit Performance',
                row: rowIndex + 1,
                reason:
                    'fuel_consumption tidak boleh bernilai negatif',
            });

            continue;
        }

        const siteId = await ensureSiteId(siteCode);

        const unitModelId = await ensureUnitModelId(
            siteId,
            modelName
        );

        const [existingRows] = await pool.query(
            `SELECT id
             FROM monthly_unit_performance
             WHERE unit_model_id = ?
               AND period_year = ?
               AND period_month = ?
             LIMIT 1`,
            [unitModelId, year, month]
        );

        const queryValues = [
            physicalAvailability,
            unitAvailability,
            mtbf,
            mttr,
            productivity,
            fuelConsumption,
        ];

        if (existingRows[0]) {
            await pool.query(
                `UPDATE monthly_unit_performance
                 SET physical_availability = ?,
                     unit_availability = ?,
                     mtbf = ?,
                     mttr = ?,
                     productivity = ?,
                     fuel_consumption = ?
                 WHERE id = ?`,
                [...queryValues, existingRows[0].id]
            );

            updatedCount += 1;
        } else {
            await pool.query(
                `INSERT INTO monthly_unit_performance
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    unitModelId,
                    year,
                    month,
                    ...queryValues,
                ]
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

module.exports = { importUnitPerformanceSheet };