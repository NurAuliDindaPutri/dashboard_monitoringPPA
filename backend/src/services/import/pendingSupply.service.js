const { pool } = require('../../config/db');
const { findHeaderRowIndex, buildColumnIndexMap, toNumberOrNull, toDateStringOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

const COLUMN_LABELS = {
    partsNumber: ['Parts Number', 'Part Number', 'No Part', 'PARTS NUMBER'],
    description: ['Description', 'DESCRIPTION'],
    qty: ['Qty', 'QTY'],
    noPo: ['No PO', 'NO PO', 'PO'],
    site: ['Site', 'SITE'],
    eta: ['ETA'],
    remarks: ['Remarks', 'REMARKS'],
};

/**
 * Parse sheet "Pending Supply". Header: No, Parts Number, Description, Qty, No PO, Site, ETA, Remarks.
 * Baris kosong dilewati. Setiap baris valid dimasukkan ke tabel pending_supply.
 */
async function importPendingSupplySheet(matrix) {
    let headerRowIdx = findHeaderRowIndex(matrix, 'Parts Number');
    if (headerRowIdx === -1) {
        headerRowIdx = findHeaderRowIndex(matrix, 'SITE');
    }

    if (headerRowIdx === -1) {
        return {
            summary: 'Sheet Pending Supply kosong, dilewati',
            skippedDetails: [],
        };
    }

    const headerRow = matrix[headerRowIdx];
    const colIdx = buildColumnIndexMap(headerRow, COLUMN_LABELS);

    let successCount = 0;
    const skippedDetails = [];

    for (let r = headerRowIdx + 1; r < matrix.length; r += 1) {
        const row = matrix[r] || [];

        const partsNumber =
            colIdx.partsNumber >= 0 && row[colIdx.partsNumber] !== null && row[colIdx.partsNumber] !== undefined
                ? String(row[colIdx.partsNumber]).trim()
                : '';
        const siteCode =
            colIdx.site >= 0 && row[colIdx.site] !== null && row[colIdx.site] !== undefined
                ? String(row[colIdx.site]).trim()
                : '';

        // Skip baris kosong
        if (!partsNumber && !siteCode) continue;

        if (!partsNumber || !siteCode) {
            skippedDetails.push({
                sheet: 'Pending Supply',
                row: { rowIndex: r + 1, partsNumber, siteCode },
                reason: 'Kolom Parts Number atau Site kosong',
            });
            continue;
        }

        const siteId = await ensureSiteId(siteCode);
        const description = colIdx.description >= 0 ? row[colIdx.description] : null;
        const qty = colIdx.qty >= 0 ? toNumberOrNull(row[colIdx.qty]) ?? 0 : 0;
        const noPo = colIdx.noPo >= 0 ? row[colIdx.noPo] : null;
        const etaRaw = colIdx.eta >= 0 ? row[colIdx.eta] : null;
        const eta = toDateStringOrNull(etaRaw);
        const remarks = colIdx.remarks >= 0 ? row[colIdx.remarks] : null;

        await pool.query(
            `INSERT INTO pending_supply (site_id, parts_number, description, qty, no_po, eta, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [siteId, partsNumber, description, qty, noPo, eta, remarks]
        );

        successCount += 1;
    }

    return {
        summary: `${successCount} baris pending supply berhasil diproses`,
        skippedDetails,
    };
}

module.exports = { importPendingSupplySheet };