const { MONTH_NAME_MAP } = require('../../utils/excelHelpers');

/**
 * Deteksi periode (bulan dan tahun) dari sheet matrix atau fallback context.
 *
 * @param {Array<Array<any>>} matrix Matrix sheet 2D
 * @param {object} context { fallbackMonth, fallbackYear }
 * @returns {{ periods: Array<{ year: number, month: number }>, source: string, isFallback: boolean }}
 */
function detectPeriods(matrix, context = {}) {
    const fallbackMonth = Number(context.fallbackMonth) || null;
    const fallbackYear = Number(context.fallbackYear) || null;

    const detectedSet = new Map(); // key "YYYY-MM" -> { year, month }

    // Helper pendaftaran periode
    const addPeriod = (year, month) => {
        if (year && month && year >= 2000 && year <= 2099 && month >= 1 && month <= 12) {
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!detectedSet.has(key)) {
                detectedSet.set(key, { year, month });
            }
        }
    };

    // 1. Pindai header & cell (15 baris x 20 kolom pertama) untuk mencari pola periode
    const maxRows = Math.min(matrix.length, 25);
    for (let r = 0; r < maxRows; r += 1) {
        const row = matrix[r] || [];
        for (let c = 0; c < Math.min(row.length, 20); c += 1) {
            const cellVal = String(row[c] || '').trim();
            if (!cellVal) continue;

            // Date Object (jika cell berupa Javascript Date)
            if (row[c] instanceof Date && !Number.isNaN(row[c].getTime())) {
                addPeriod(row[c].getFullYear(), row[c].getMonth() + 1);
                continue;
            }

            // Pola format "Jan-26" atau "Jan 2026" atau "Jan-2026"
            const shortMatch = cellVal.match(/\b([A-Za-z]{3,9})[-/\s]+(20\d{2}|\d{2})\b/i);
            if (shortMatch) {
                const mName = shortMatch[1].toLowerCase();
                const mNum = MONTH_NAME_MAP[mName];
                let yNum = Number(shortMatch[2]);
                if (yNum < 100) yNum += 2000;
                if (mNum) {
                    addPeriod(yNum, mNum);
                }
            }

            // Pola format "Juni 2026", "Desember 2025"
            const fullMatch = cellVal.match(/\b([A-Za-z]{3,9})\s+(20\d{2})\b/i);
            if (fullMatch) {
                const mName = fullMatch[1].toLowerCase();
                const mNum = MONTH_NAME_MAP[mName];
                if (mNum) {
                    addPeriod(Number(fullMatch[2]), mNum);
                }
            }
        }
    }

    const periods = Array.from(detectedSet.values());

    if (periods.length > 0) {
        return {
            periods,
            source: 'detected_from_sheet',
            isFallback: false,
        };
    }

    // 2. Jika tidak terdeteksi dari sheet, gunakan fallback dari form upload (jika lengkap)
    if (fallbackMonth && fallbackYear) {
        return {
            periods: [{ year: fallbackYear, month: fallbackMonth }],
            source: 'form_fallback',
            isFallback: true,
        };
    }

    return {
        periods: [],
        source: 'none',
        isFallback: true,
    };
}

module.exports = { detectPeriods };
