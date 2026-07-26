const { findHeaderRowIndex, buildColumnIndexMap, toNumberOrNull, toDateStringOrNull } = require('../../utils/excelHelpers');

/**
 * Mengekstrak data Pending Supply dari matrix sheet.
 *
 * @param {Array<Array<any>>} matrix Matrix sheet
 * @param {object} context { detectedSite, fallbackSiteCode }
 * @returns {{ items: Array<object>, confidence: number, layout: string }}
 */
function parsePendingSupplyBlock(matrix, context = {}) {
    const items = [];
    if (!matrix || matrix.length === 0) return { items, confidence: 0, layout: 'none' };

    const headerIdx = findHeaderRowIndex(matrix, 'parts number') !== -1
        ? findHeaderRowIndex(matrix, 'parts number')
        : findHeaderRowIndex(matrix, 'part number');

    if (headerIdx === -1) return { items: [], confidence: 0, layout: 'none' };

    const headerRow = matrix[headerIdx] || [];
    const colMap = buildColumnIndexMap(headerRow, {
        parts_number: ['parts number', 'part number', 'part no', 'parts no', 'part_number'],
        description: ['description', 'deskripsi', 'nama barang', 'desc'],
        qty: ['qty', 'quantity', 'jumlah'],
        no_po: ['no. po', 'no po', 'po number', 'po', 'no_po'],
        eta: ['eta', 'estimasi', 'eta date'],
        remarks: ['remarks', 'keterangan', 'ket'],
        site: ['site', 'kode site', 'site code'],
    });

    const defaultSite = context.detectedSite?.sites?.[0] || context.fallbackSiteCode || 'SITE';

    for (let r = headerIdx + 1; r < matrix.length; r += 1) {
        const row = matrix[r] || [];
        const partsNumber = String(row[colMap.parts_number] || '').trim();

        if (!partsNumber) continue;
        if (partsNumber.toLowerCase() === 'total' || partsNumber.toLowerCase().includes('parts number')) continue;

        const siteCode = colMap.site !== -1 && row[colMap.site]
            ? String(row[colMap.site]).trim()
            : defaultSite;

        items.push({
            site_code: siteCode,
            parts_number: partsNumber,
            description: colMap.description !== -1 ? String(row[colMap.description] || '').trim() || null : null,
            qty: colMap.qty !== -1 ? toNumberOrNull(row[colMap.qty]) || 0 : 0,
            no_po: colMap.no_po !== -1 ? String(row[colMap.no_po] || '').trim() || null : null,
            eta: colMap.eta !== -1 ? toDateStringOrNull(row[colMap.eta]) : null,
            remarks: colMap.remarks !== -1 ? String(row[colMap.remarks] || '').trim() || null : null,
        });
    }

    return {
        items,
        confidence: items.length > 0 ? 0.95 : 0,
        layout: 'standard_table',
    };
}

module.exports = { parsePendingSupplyBlock };
