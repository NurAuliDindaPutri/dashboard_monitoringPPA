const { findHeaderRowIndex, buildColumnIndexMap, toDecimalOrNull, toNumberOrNull, MONTH_NAME_MAP } = require('../../utils/excelHelpers');

/**
 * Mengekstrak data Unit Performance dari matrix sheet.
 *
 * @param {Array<Array<any>>} matrix Matrix sheet
 * @param {object} context { detectedSite, detectedPeriod, fallbackMonth, fallbackYear }
 * @returns {{ items: Array<object>, confidence: number, layout: string }}
 */
function parseUnitPerformanceBlock(matrix, context = {}) {
    const items = [];
    if (!matrix || matrix.length === 0) return { items, confidence: 0, layout: 'none' };

    // ── Layout 1: Data Unit / All Site Table (SITE | MODEL UNIT | PA | UA | MTBF | MTTR | PRODUCTIVITY | FUEL) ──
    const siteHeaderIdx = findHeaderRowIndex(matrix, 'site');

    if (siteHeaderIdx !== -1) {
        const headerRow = matrix[siteHeaderIdx] || [];
        const colMap = buildColumnIndexMap(headerRow, {
            site: ['site', 'kode site', 'site code'],
            model: ['model unit', 'unit model', 'model', 'tipe unit'],
            pa: ['average pa', 'pa (%)', 'pa', 'physical availability'],
            ua: ['ua (%)', 'ua', 'unit availability'],
            mtbf: ['average mtbf', 'mtbf (jam)', 'mtbf'],
            mttr: ['average mttr', 'mttr (jam)', 'mttr'],
            productivity: ['productivity', 'produktivitas', 'prod'],
            fuel: ['fuel consumption', 'fuel', 'konsumsi bbm', 'fuel (l)'],
        });

        if (colMap.site !== -1 && colMap.model !== -1) {
            const defaultPeriod = context.detectedPeriod?.periods?.[0] || {
                year: Number(context.fallbackYear) || new Date().getFullYear(),
                month: Number(context.fallbackMonth) || 1,
            };

            for (let r = siteHeaderIdx + 1; r < matrix.length; r += 1) {
                const row = matrix[r] || [];
                const siteCode = String(row[colMap.site] || '').trim();
                const modelName = String(row[colMap.model] || '').trim();

                if (!siteCode && !modelName) continue;
                if (!siteCode || !modelName) continue;
                if (siteCode.toLowerCase() === 'total' || modelName.toLowerCase() === 'total') continue;

                items.push({
                    site_code: siteCode,
                    model_name: modelName,
                    period_year: defaultPeriod.year,
                    period_month: defaultPeriod.month,
                    physical_availability: colMap.pa !== -1 ? toDecimalOrNull(row[colMap.pa]) : null,
                    unit_availability: colMap.ua !== -1 ? toDecimalOrNull(row[colMap.ua]) : null,
                    mtbf: colMap.mtbf !== -1 ? toNumberOrNull(row[colMap.mtbf]) : null,
                    mttr: colMap.mttr !== -1 ? toNumberOrNull(row[colMap.mttr]) : null,
                    productivity: colMap.productivity !== -1 ? toNumberOrNull(row[colMap.productivity]) : null,
                    fuel_consumption: colMap.fuel !== -1 ? toNumberOrNull(row[colMap.fuel]) : null,
                });
            }

            if (items.length > 0) {
                return { items, confidence: 0.95, layout: 'standard_table' };
            }
        }
    }

    // ── Layout 2: Per-Site Model Blocks (Model unit seperti PC3400/PC2000 dengan kolom bulan) ──
    const monthCols = [];
    let headerRowIdx = -1;

    for (let r = 0; r < Math.min(matrix.length, 20); r += 1) {
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

        let currentModel = null;
        const modelMap = new Map(); // key "modelName-month" -> item

        for (let r = headerRowIdx + 1; r < matrix.length; r += 1) {
            const firstCell = String(matrix[r]?.[0] || '').trim();
            if (!firstCell) continue;

            const lower = firstCell.toLowerCase();

            // Deteksi judul model (mis. PC3400, PC2000, PC1250, HD785)
            if (/^(pc\d+|hd\d+|dz\d+|gd\d+|wa\d+|scania|volvo|cat)/i.test(firstCell) || lower.includes('model')) {
                currentModel = firstCell.replace(/model/i, '').trim();
                continue;
            }

            if (!currentModel) continue;

            let metricKey = null;
            if (lower.includes('pa') || lower.includes('physical')) metricKey = 'physical_availability';
            else if (lower.includes('ua') || lower.includes('unit availability')) metricKey = 'unit_availability';
            else if (lower.includes('mtbf')) metricKey = 'mtbf';
            else if (lower.includes('mttr')) metricKey = 'mttr';
            else if (lower.includes('prod') || lower.includes('productivity')) metricKey = 'productivity';
            else if (lower.includes('fuel')) metricKey = 'fuel_consumption';

            if (metricKey) {
                for (const { month, colIndex } of monthCols) {
                    const mapKey = `${currentModel}-${month}`;
                    if (!modelMap.has(mapKey)) {
                        modelMap.set(mapKey, {
                            site_code: siteCode,
                            model_name: currentModel,
                            period_year: year,
                            period_month: month,
                            physical_availability: null,
                            unit_availability: null,
                            mtbf: null,
                            mttr: null,
                            productivity: null,
                            fuel_consumption: null,
                        });
                    }
                    const item = modelMap.get(mapKey);
                    const val = matrix[r][colIndex];
                    if (metricKey === 'physical_availability' || metricKey === 'unit_availability') {
                        item[metricKey] = toDecimalOrNull(val);
                    } else {
                        item[metricKey] = toNumberOrNull(val);
                    }
                }
            }
        }

        const modelItems = Array.from(modelMap.values()).filter(
            (i) => i.physical_availability !== null || i.unit_availability !== null || i.mtbf !== null || i.mttr !== null
        );

        if (modelItems.length > 0) {
            return { items: modelItems, confidence: 0.88, layout: 'per_site_model_matrix' };
        }
    }

    return { items: [], confidence: 0, layout: 'none' };
}

module.exports = { parseUnitPerformanceBlock };
