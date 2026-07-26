const { pool } = require('../../config/db');
const { findHeaderRowIndex, buildColumnIndexMap, toNumberOrNull } = require('../../utils/excelHelpers');
const { ensureSiteId } = require('./resolvers');

const COLUMN_LABELS = {
    partsNumber: ['Parts Number'],
    description: ['Description'],
    qty: ['Qty'],
    noPo: ['No PO'],
    site: ['Site'],
    eta: ['ETA'],
    remarks: ['Remarks'],
};

/**
 * Parse sheet "Pending Supply". Header tidak selalu di baris 1 kolom A
 * (pada file asli ada di baris 2 mulai kolom B), jadi baris & kolom header
 * dicari otomatis berdasarkan label "Parts Number" dkk, bukan posisi tetap.
 */
async function importAllSitePendingSupplySheet(matrix) {
    const headerRowIdx = findHeaderRowIndex(matrix, 'Parts Number');
    if (headerRowIdx === -1) {
        return {
            summary: 'Header "Parts Number" tidak ditemukan pada sheet "Pending Supply"',
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

        // Baris tanpa Parts Number dianggap baris kosong/template, bukan error - dilewati diam-diam.
        if (!partsNumber) continue;

        if (!siteCode) {
            skippedDetails.push({
                sheet: 'Pending Supply',
                row: { rowIndex: r + 1, partsNumber },
                reason: 'Kolom Site kosong',
            });
            continue;
        }

        const siteId = await ensureSiteId(siteCode);
        const description = colIdx.description >= 0 ? row[colIdx.description] : null;
        const qty = colIdx.qty >= 0 ? toNumberOrNull(row[colIdx.qty]) ?? 0 : 0;
        const noPo = colIdx.noPo >= 0 ? row[colIdx.noPo] : null;
        const etaRaw = colIdx.eta >= 0 ? row[colIdx.eta] : null;
        const eta = etaRaw instanceof Date ? etaRaw.toISOString().slice(0, 10) : etaRaw;
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

module.exports = { importAllSitePendingSupplySheet };