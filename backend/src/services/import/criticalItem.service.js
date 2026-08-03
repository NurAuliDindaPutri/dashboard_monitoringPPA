const { pool } = require('../../config/db');
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
            headers.includes('parts_number')
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

function toNumberOrNull(value) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isNaN(number) ? null : number;
}

async function importCriticalItemSheet(matrix) {
    const headerIndex = findHeaderIndex(matrix);

    if (headerIndex === -1) {
        return {
            summary:
                'Sheet Critical Items kosong atau header tidak ditemukan',
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

        const partsNumber = String(
            getCell(row, columns, 'parts_number') ?? ''
        ).trim();

        const description =
            String(
                getCell(row, columns, 'description') ?? ''
            ).trim() || null;

        const qty = toNumberOrNull(
            getCell(row, columns, 'qty')
        );

        const noPo =
            String(
                getCell(row, columns, 'no_po') ?? ''
            ).trim() || null;

        const estimasi =
            String(
                getCell(row, columns, 'estimasi') ?? ''
            ).trim() || null;

        if (!siteCode || !partsNumber) {
            skippedDetails.push({
                sheet: 'Critical Items',
                row: rowIndex + 1,
                reason: 'site_code atau parts_number kosong',
            });

            continue;
        }

        const siteId = await ensureSiteId(siteCode);

        const [existingRows] = await pool.query(
            `SELECT id
             FROM critical_items
             WHERE site_id = ?
               AND parts_number = ?
             LIMIT 1`,
            [siteId, partsNumber]
        );

        if (existingRows[0]) {
            await pool.query(
                `UPDATE critical_items
                 SET description = ?,
                     qty = ?,
                     no_po = ?,
                     estimasi = ?
                 WHERE id = ?`,
                [
                    description,
                    qty,
                    noPo,
                    estimasi,
                    existingRows[0].id,
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO critical_items
                (
                    site_id,
                    parts_number,
                    description,
                    qty,
                    no_po,
                    estimasi
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    siteId,
                    partsNumber,
                    description,
                    qty,
                    noPo,
                    estimasi,
                ]
            );
        }

        successCount += 1;
    }

    return {
        summary: `${successCount} critical item berhasil diproses`,
        skippedDetails,
    };
}

module.exports = { importCriticalItemSheet };