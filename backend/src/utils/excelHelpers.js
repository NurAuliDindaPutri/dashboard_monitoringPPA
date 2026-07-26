const XLSX = require('xlsx');

/**
 * Ubah sheet menjadi array 2 dimensi (baris x kolom), index mulai 0,
 * TANPA menganggap baris pertama sebagai header. Cocok untuk sheet
 * berlayout blok/matriks seperti "Input" dan "Input Data".
 */
function sheetToMatrix(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
}

/**
 * Cari nama sheet pada workbook secara case-insensitive & trim,
 * mendukung beberapa kemungkinan variasi penulisan nama sheet.
 */
function findSheetName(workbook, ...possibleNames) {
    const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const targets = possibleNames.map(normalize);
    const found = workbook.SheetNames.find((name) => targets.includes(normalize(name)));
    return found || null;
}

/**
 * Cari index baris (0-based) pertama pada matrix yang kolom pertamanya
 * cocok dengan predicate (mis. judul blok "Readyness VHS").
 */
function findRowIndex(matrix, predicate, startFrom = 0) {
    for (let r = startFrom; r < matrix.length; r += 1) {
        const firstCell = matrix[r]?.[0];
        if (firstCell !== null && firstCell !== undefined && predicate(String(firstCell).trim())) {
            return r;
        }
    }
    return -1;
}

/**
 * Cari index baris yang seluruh barisnya (bukan hanya kolom pertama)
 * mengandung salah satu label yang dicari di kolom manapun.
 * Berguna untuk menemukan baris header tabel (mis. "Parts Number").
 */
function findHeaderRowIndex(matrix, labelToFind) {
    const target = labelToFind.trim().toLowerCase();
    for (let r = 0; r < matrix.length; r += 1) {
        const row = matrix[r] || [];
        const hasLabel = row.some(
            (cell) => cell !== null && cell !== undefined && String(cell).trim().toLowerCase() === target
        );
        if (hasLabel) return r;
    }
    return -1;
}

/**
 * Dari sebuah baris header berisi kode site (mis. ['Remarks/Site','BA','BIB',...,'ALL SITE']),
 * kembalikan daftar {siteCode, colIndex}. Kolom "ALL SITE"/"ALL SITES" (agregat, bukan site
 * sesungguhnya) otomatis dikecualikan.
 */
function extractSiteColumns(headerRow) {
    const result = [];
    for (let c = 1; c < headerRow.length; c += 1) {
        const val = headerRow[c];
        if (val === null || val === undefined) continue;
        const code = String(val).trim();
        if (!code) continue;
        if (/^all\s*sites?$/i.test(code)) continue;
        result.push({ siteCode: code, colIndex: c });
    }
    return result;
}

/**
 * Parse nilai desimal KPI (0-1). Jika nilai > 1, diasumsikan dalam bentuk
 * persen (mis. 90 -> 0.9).
 */
function toDecimalOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    let num = Number(value);
    if (Number.isNaN(num)) return null;
    if (num > 1) num = num / 100;
    return num;
}

/**
 * Parse nilai numerik biasa (MTBF, MTTR, Qty, dll), tanpa scaling.
 */
function toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}

/**
 * Ambil {year, month} dari cell header tanggal. Karena workbook dibaca
 * dengan opsi cellDates:true, cell tanggal Excel akan berupa objek
 * JS Date asli (bukan serial number) - lihat pemanggilan XLSX.read di controller.
 */
function toYearMonthOrNull(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return { year: value.getFullYear(), month: value.getMonth() + 1 };
    }
    return null;
}

/**
 * Parse tanggal Excel (Date object atau string) menjadi 'YYYY-MM-DD'.
 */
function toDateStringOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

/**
 * Dari sebuah baris header (array), petakan setiap key ke index kolom
 * berdasarkan label yang cocok (case-insensitive). Berguna untuk sheet yang
 * punya header label sungguhan tapi posisi baris/kolomnya tidak pasti,
 * mis. "Pending Supply" (header di baris 2, mulai kolom B).
 * @param {Array} headerRow
 * @param {Record<string, string[]>} labelMap key -> daftar kemungkinan label
 * @returns {Record<string, number>} key -> colIndex (-1 jika tidak ditemukan)
 */
function buildColumnIndexMap(headerRow, labelMap) {
    const result = {};
    for (const [key, variants] of Object.entries(labelMap)) {
        let foundIdx = -1;
        for (let c = 0; c < headerRow.length; c += 1) {
            const cell = headerRow[c];
            if (cell === null || cell === undefined) continue;
            const normalized = String(cell).trim().toLowerCase();
            if (variants.some((v) => v.toLowerCase() === normalized)) {
                foundIdx = c;
                break;
            }
        }
        result[key] = foundIdx;
    }
    return result;
}

const MONTH_NAME_MAP = {
    jan: 1, januari: 1, january: 1,
    feb: 2, februari: 2, february: 2,
    mar: 3, maret: 3, march: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6, june: 6,
    jul: 7, juli: 7, july: 7,
    agu: 8, agustus: 8, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    okt: 10, oktober: 10, oct: 10, october: 10,
    nov: 11, november: 11,
    des: 12, desember: 12, dec: 12, december: 12,
};

/**
 * Parse label bulan dari header kolom (mis. "Jan", "Februari", atau angka 1-12).
 * @returns {number|null}
 */
function parseMonthLabel(value) {
    if (value === null || value === undefined || value === '') return null;

    const num = Number(value);
    if (!Number.isNaN(num) && num >= 1 && num <= 12) return num;

    const key = String(value).trim().toLowerCase();
    return MONTH_NAME_MAP[key] || null;
}

module.exports = {
    sheetToMatrix,
    findSheetName,
    findRowIndex,
    findHeaderRowIndex,
    extractSiteColumns,
    buildColumnIndexMap,
    parseMonthLabel,
    toDecimalOrNull,
    toNumberOrNull,
    toYearMonthOrNull,
    toDateStringOrNull,
};