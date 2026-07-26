const { findRowIndex, extractSiteColumns, toDecimalOrNull, MONTH_NAME_MAP } = require('../../utils/excelHelpers');

/**
 * Mengekstrak blok KPI dari matrix sheet.
 * Mendukung layout: All Site Multi-Blok, Per-Site Bulanan, dan Tabel Sederhana.
 *
 * @param {Array<Array<any>>} matrix Matrix sheet
 * @param {object} context { detectedSite, detectedPeriod, fallbackMonth, fallbackYear }
 * @returns {{ items: Array<object>, confidence: number, layout: string }}
 */
function parseKpiBlock(matrix, context = {}) {
    const items = [];
    if (!matrix || matrix.length === 0) return { items, confidence: 0, layout: 'none' };

    // ── Layout 1: All Site Multi-Blok (Readyness VHS, Availability VHS, Leadtime Supply) ──
    const readynessIdx = findRowIndex(matrix, (v) => v.includes('readyness') || v.includes('readiness'));
    const availabilityIdx = findRowIndex(matrix, (v) => v.includes('availability vhs') || v.includes('availability'));
    const leadtimeIdx = findRowIndex(matrix, (v) => v.includes('leadtime supply') || v.includes('leadtime') || v.includes('lead time'));

    if (readynessIdx !== -1 || availabilityIdx !== -1 || leadtimeIdx !== -1) {
        const siteDataMap = new Map();

        const extractBlock = (titleIdx) => {
            if (titleIdx === -1) return null;
            const headerRow = matrix[titleIdx + 1] || [];
            const actualRow = matrix[titleIdx + 2] || [];
            let targetRow = null;
            for (let r = titleIdx + 3; r < Math.min(titleIdx + 8, matrix.length); r += 1) {
                const label = String(matrix[r]?.[0] || '').trim().toLowerCase();
                if (label.startsWith('target')) {
                    targetRow = matrix[r];
                    break;
                }
            }
            return { headerRow, actualRow, targetRow };
        };

        const mergeBlock = (block, actualKey, targetKey) => {
            if (!block) return;
            const siteCols = extractSiteColumns(block.headerRow);
            for (const { siteCode, colIndex } of siteCols) {
                const entry = siteDataMap.get(siteCode) || {};
                entry[actualKey] = toDecimalOrNull(block.actualRow[colIndex]);
                entry[targetKey] = block.targetRow ? toDecimalOrNull(block.targetRow[colIndex]) : null;
                siteDataMap.set(siteCode, entry);
            }
        };

        mergeBlock(extractBlock(readynessIdx), 'readyness_actual', 'readyness_target');
        mergeBlock(extractBlock(availabilityIdx), 'availability_actual', 'availability_target');
        mergeBlock(extractBlock(leadtimeIdx), 'leadtime_actual', 'leadtime_target');

        const defaultPeriod = context.detectedPeriod?.periods?.[0] || {
            year: Number(context.fallbackYear) || new Date().getFullYear(),
            month: Number(context.fallbackMonth) || 1,
        };

        for (const [siteCode, vals] of siteDataMap.entries()) {
            items.push({
                site_code: siteCode,
                period_year: defaultPeriod.year,
                period_month: defaultPeriod.month,
                ...vals,
            });
        }

        if (items.length > 0) {
            return { items, confidence: 0.95, layout: 'all_site_matrix' };
        }
    }

    // ── Layout 2: Per-Site Bulanan (KPI pada baris, bulan Jan-Des pada kolom) ──
    const monthCols = [];
    let headerRowIdx = -1;

    for (let r = 0; r < Math.min(matrix.length, 15); r += 1) {
        const row = matrix[r] || [];
        for (let c = 1; c < row.length; c += 1) {
            const val = String(row[c] || '').trim().toLowerCase();
            if (MONTH_NAME_MAP[val]) {
                monthCols.push({ month: MONTH_NAME_MAP[val], colIndex: c });
                headerRowIdx = r;
            }
        }
        if (monthCols.length >= 3) break;
    }

    if (headerRowIdx !== -1 && monthCols.length > 0) {
        const siteCode = context.detectedSite?.sites?.[0] || context.fallbackSiteCode || 'SITE';
        const year = context.detectedPeriod?.periods?.[0]?.year || Number(context.fallbackYear) || new Date().getFullYear();

        const periodMap = new Map(); // month -> item

        const getOrCreate = (m) => {
            if (!periodMap.has(m)) {
                periodMap.set(m, {
                    site_code: siteCode,
                    period_year: year,
                    period_month: m,
                    readyness_actual: null,
                    readyness_target: null,
                    availability_actual: null,
                    availability_target: null,
                    leadtime_actual: null,
                    leadtime_target: null,
                });
            }
            return periodMap.get(m);
        };

        for (let r = headerRowIdx + 1; r < Math.min(headerRowIdx + 30, matrix.length); r += 1) {
            const label = String(matrix[r]?.[0] || '').trim().toLowerCase();
            if (!label) continue;

            let key = null;
            let isTarget = label.includes('target');

            if (label.includes('readiness') || label.includes('readyness')) key = isTarget ? 'readyness_target' : 'readyness_actual';
            else if (label.includes('availability')) key = isTarget ? 'availability_target' : 'availability_actual';
            else if (label.includes('leadtime') || label.includes('lead time')) key = isTarget ? 'leadtime_target' : 'leadtime_actual';

            if (key) {
                for (const { month, colIndex } of monthCols) {
                    const item = getOrCreate(month);
                    item[key] = toDecimalOrNull(matrix[r][colIndex]);
                }
            }
        }

        const monthlyItems = Array.from(periodMap.values()).filter(
            (i) => i.readyness_actual !== null || i.availability_actual !== null || i.leadtime_actual !== null
        );

        if (monthlyItems.length > 0) {
            return { items: monthlyItems, confidence: 0.9, layout: 'per_site_monthly' };
        }
    }

    return { items: [], confidence: 0, layout: 'none' };
}

module.exports = { parseKpiBlock };
