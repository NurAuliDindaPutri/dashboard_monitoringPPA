/**
 * aggregate.js
 * Kumpulan fungsi untuk mengolah data mentah dari API menjadi
 * format yang siap ditampilkan di komponen-komponen Dashboard.
 */

import { MONTHS } from './constants';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Tentukan key & label unik untuk satu site dari sebuah baris data, dengan aman.
 * - Jika site_id kosong tapi site_code ada, gunakan site_code sebagai fallback.
 * - Jika site_id dan site_code sama-sama kosong, baris dianggap tidak valid (return null)
 *   sehingga baris tsb bisa di-skip oleh pemanggil, dan tidak pernah muncul label
 *   "Site undefined" di UI.
 *
 * @param {object} row Baris data yang punya field site_id / site_code
 * @returns {{ key: string|number, label: string }|null}
 */
function resolveSiteIdentity(row) {
    const rawSiteId = row?.site_id;
    const rawSiteCode = row?.site_code;

    const hasSiteId = rawSiteId !== null && rawSiteId !== undefined && rawSiteId !== '';
    const hasSiteCode = rawSiteCode !== null && rawSiteCode !== undefined && rawSiteCode !== '';

    if (!hasSiteId && !hasSiteCode) return null;

    return {
        key: hasSiteId ? rawSiteId : rawSiteCode,
        label: hasSiteCode ? rawSiteCode : String(rawSiteId),
    };
}

// ---------------------------------------------------------------------------
// KPI Summary helpers
// ---------------------------------------------------------------------------

/**
 * Hitung rata-rata dari array angka, abaikan nilai null/undefined/NaN.
 * @param {Array<number|null>} values
 * @returns {number|null}
 */
export function safeAvg(values = []) {
    const validValues = values
        .filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        )
        .map(Number)
        .filter(Number.isFinite);

    if (validValues.length === 0) {
        return null;
    }

    const total = validValues.reduce(
        (sum, value) => sum + value,
        0
    );

    return total / validValues.length;
}

/**
 * Hitung jumlah dari array angka, abaikan nilai null/undefined/NaN.
 * @param {Array<number|null>} values
 * @returns {number|null}
 */
export function safeSum(values = []) {
    const validValues = values
        .filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        )
        .map(Number)
        .filter(Number.isFinite);

    if (validValues.length === 0) {
        return 0;
    }

    return validValues.reduce(
        (sum, value) => sum + value,
        0
    );
}

/**
 * Agregasi data kpi-summary menjadi satu objek ringkasan untuk ditampilkan
 * di Gauge dan KPI Cards. Jika ada beberapa site, nilai dirata-rata.
 *
 * @param {Array<object>} kpiRows Baris dari /api/kpi-summary
 * @returns {{
 *   readyness_actual: number|null,
 *   readyness_target: number|null,
 *   availability_actual: number|null,
 *   availability_target: number|null,
 *   leadtime_actual: number|null,
 *   leadtime_target: number|null,
 * }}
 */
export function aggregateKpiSummary(kpiRows) {
    if (!kpiRows || kpiRows.length === 0) {
        return {
            readyness_actual: null,
            readyness_target: null,
            availability_actual: null,
            availability_target: null,
            leadtime_actual: null,
            leadtime_target: null,
        };
    }

    return {
        readyness_actual: safeAvg(
            kpiRows.map((row) => row.readyness_actual)
        ),

        readyness_target: safeAvg(
            kpiRows.map((row) => row.readyness_target)
        ),

        availability_actual: safeAvg(
            kpiRows.map((row) => row.availability_actual)
        ),

        availability_target: safeAvg(
            kpiRows.map((row) => row.availability_target)
        ),

        leadtime_actual: safeAvg(
            kpiRows.map((row) => row.leadtime_actual)
        ),

        leadtime_target: safeAvg(
            kpiRows.map((row) => row.leadtime_target)
        ),
    };
}
// ---------------------------------------------------------------------------
// Unit Performance helpers
// ---------------------------------------------------------------------------

/**
 * Agregasi data unit-performance menjadi ringkasan per bulan untuk chart.
 * Setiap titik pada sumbu X adalah nama bulan.
 *
 * @param {Array<object>} perfRows Baris dari /api/unit-performance
 * @returns {Array<{
 *   month: string,
 *   physical_availability: number|null,
 *   unit_availability: number|null,
 *   mtbf: number|null,
 *   mttr: number|null,
 *   productivity: number|null,
 *   fuel_consumption: number|null,
 * }>}
 */
export function aggregatePerfByMonth(perfRows) {
    if (!perfRows || perfRows.length === 0) return [];

    // Kelompokkan per (year, month)
    const map = new Map();
    for (const row of perfRows) {
        const key = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        if (!map.has(key)) {
            map.set(key, {
                year: row.period_year,
                monthNum: row.period_month,
                rows: [],
            });
        }
        map.get(key).rows.push(row);
    }

    // Urutkan kronologis dan bentuk titik data
    return Array.from(map.values())
        .sort((a, b) =>
            a.year !== b.year ? a.year - b.year : a.monthNum - b.monthNum
        )
        .map(({ monthNum, rows }) => {
            const label = MONTHS.find((m) => m.value === Number(monthNum))?.label ?? monthNum;
            return {
                month: label,
                physical_availability: safeAvg(rows.map((r) => r.physical_availability)),
                unit_availability: safeAvg(rows.map((r) => r.unit_availability)),
                mtbf: safeAvg(rows.map((r) => r.mtbf)),
                mttr: safeAvg(rows.map((r) => r.mttr)),
                productivity: safeAvg(rows.map((r) => r.productivity)),
                fuel_consumption: safeAvg(rows.map((r) => r.fuel_consumption)),
            };
        });
}

/**
 * Agregasi data unit-performance menjadi ringkasan per unit model untuk tabel.
 * Setiap baris adalah satu model unit dengan rata-rata KPI-nya.
 *
 * @param {Array<object>} perfRows
 * @returns {Array<object>}
 */
export function aggregatePerfByUnit(perfRows) {
    if (!perfRows || perfRows.length === 0) return [];

    const map = new Map();
    for (const row of perfRows) {
        const key = row.unit_model_id;
        if (!map.has(key)) {
            map.set(key, {
                unit_model_id: row.unit_model_id,
                model_name: row.model_name,
                site_code: row.site_code,
                site_name: row.site_name,
                rows: [],
            });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values()).map(({ unit_model_id, model_name, site_code, site_name, rows }) => ({
        unit_model_id,
        model_name,
        site_code,
        site_name,
        physical_availability: safeAvg(rows.map((r) => r.physical_availability)),
        unit_availability: safeAvg(rows.map((r) => r.unit_availability)),
        mtbf: safeAvg(rows.map((r) => r.mtbf)),
        mttr: safeAvg(rows.map((r) => r.mttr)),
        productivity: safeAvg(rows.map((r) => r.productivity)),
        fuel_consumption: safeAvg(rows.map((r) => r.fuel_consumption)),
    }));
}

// ---------------------------------------------------------------------------
// KPI Cards summary helpers
// ---------------------------------------------------------------------------

/**
 * Hitung jumlah unit dari data unit-performance (distinct unit_model_id).
 * @param {Array<object>} perfRows
 * @returns {number}
 */
export function countUnits(perfRows) {
    if (!perfRows || perfRows.length === 0) return 0;
    return new Set(perfRows.map((r) => r.unit_model_id)).size;
}

/**
 * Hitung jumlah total pending supply.
 * @param {Array<object>} supplyRows
 * @returns {number}
 */
export function countPendingSupply(supplyRows) {
    if (!supplyRows || supplyRows.length === 0) return 0;
    return supplyRows.length;
}

/**
 * Hitung total qty pending supply.
 * @param {Array<object>} supplyRows
 * @returns {number}
 */
export function sumPendingQty(supplyRows) {
    if (!supplyRows || supplyRows.length === 0) return 0;
    return supplyRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
}

// ---------------------------------------------------------------------------
// Chart: KPI per site (bar chart)
// ---------------------------------------------------------------------------

/**
 * Bentuk data untuk bar chart perbandingan KPI antar site.
 * Setiap bar adalah satu site, dengan nilai readyness, availability, leadtime.
 *
 * @param {Array<object>} kpiRows Baris dari /api/kpi-summary (tanpa filter site)
 * @returns {Array<{ site: string, readyness: number|null, availability: number|null, leadtime: number|null }>}
 */
export function buildKpiPerSiteChart(kpiRows) {
    if (!kpiRows || kpiRows.length === 0) return [];

    const map = new Map();
    for (const row of kpiRows) {
        const identity = resolveSiteIdentity(row);
        if (!identity) continue; // site_id & site_code sama-sama kosong -> skip

        const { key, label } = identity;
        if (!map.has(key)) {
            map.set(key, {
                site: label,
                rows: [],
            });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values()).map(({ site, rows }) => ({
        site,
        readyness: safeAvg(rows.map((r) => r.readyness_actual)) !== null
            ? parseFloat((safeAvg(rows.map((r) => r.readyness_actual)) * 100).toFixed(1))
            : null,
        availability: safeAvg(rows.map((r) => r.availability_actual)) !== null
            ? parseFloat((safeAvg(rows.map((r) => r.availability_actual)) * 100).toFixed(1))
            : null,
        leadtime: safeAvg(rows.map((r) => r.leadtime_actual)) !== null
            ? parseFloat((safeAvg(rows.map((r) => r.leadtime_actual)) * 100).toFixed(1))
            : null,
    }));
}

/**
 * Bentuk data ringkasan KPI per site untuk komponen Donut/Ring KPI.
 * Mengabaikan site yang tidak memiliki data pada periode terpilih.
 *
 * @param {Array<object>} kpiRows Baris dari /api/kpi-summary
 * @returns {Array<object>}
 */
export function buildKpiSummaryPerSite(kpiRows) {
    if (!kpiRows || kpiRows.length === 0) return [];

    const map = new Map();
    for (const row of kpiRows) {
        const identity = resolveSiteIdentity(row);
        if (!identity) continue; // site_id & site_code sama-sama kosong -> skip

        const { key, label } = identity;
        if (!map.has(key)) {
            map.set(key, {
                site_id: row.site_id ?? null,
                site_code: label,
                site_name: row.site_name || '',
                rows: [],
            });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values()).map(({ site_id, site_code, site_name, rows }) => {
        const readyness_actual = safeAvg(rows.map((r) => r.readyness_actual));
        const readyness_target = safeAvg(rows.map((r) => r.readyness_target));
        const availability_actual = safeAvg(rows.map((r) => r.availability_actual));
        const availability_target = safeAvg(rows.map((r) => r.availability_target));
        const leadtime_actual = safeAvg(rows.map((r) => r.leadtime_actual));
        const leadtime_target = safeAvg(rows.map((r) => r.leadtime_target));

        return {
            site_id,
            site_code,
            site_name,
            readyness_actual,
            readyness_target,
            readyness_is_good: readyness_actual !== null && readyness_target !== null ? readyness_actual >= readyness_target : true,
            availability_actual,
            availability_target,
            availability_is_good: availability_actual !== null && availability_target !== null ? availability_actual >= availability_target : true,
            leadtime_actual,
            leadtime_target,
            leadtime_is_good: leadtime_actual !== null && leadtime_target !== null ? leadtime_actual >= leadtime_target : true,
        };
    });
}

/**
 * Membuat daftar KPI per site yang belum mencapai target.
 *
 * @param {Array<object>} kpiRows
 * @returns {Array<object>}
 */
export function buildKpiBelowTargetAnalysis(kpiRows) {
    const siteSummaries =
        buildKpiSummaryPerSite(kpiRows);

    const result = [];

    const kpiDefinitions = [
        {
            key: 'readyness',
            label: 'Readiness',
            actualKey: 'readyness_actual',
            targetKey: 'readyness_target',
        },
        {
            key: 'availability',
            label: 'Availability VHS',
            actualKey: 'availability_actual',
            targetKey: 'availability_target',
        },
        {
            key: 'leadtime',
            label: 'Lead Time Supply',
            actualKey: 'leadtime_actual',
            targetKey: 'leadtime_target',
        },
    ];

    for (const site of siteSummaries) {
        for (const kpi of kpiDefinitions) {
            const actual = site[kpi.actualKey];
            const target = site[kpi.targetKey];

            if (
                actual === null ||
                actual === undefined ||
                target === null ||
                target === undefined ||
                actual >= target
            ) {
                continue;
            }

            const gap = target - actual;
            const gapPercent = gap * 100;

            let priority = 'Perlu Perhatian';

            if (gapPercent >= 10) {
                priority = 'Prioritas Tinggi';
            } else if (gapPercent >= 5) {
                priority = 'Prioritas Sedang';
            }

            result.push({
                id: `${site.site_id ?? site.site_code}-${kpi.key}`,
                site_id: site.site_id,
                site_code: site.site_code,
                site_name: site.site_name,
                kpi: kpi.label,
                actual,
                target,
                gap,
                actual_percent: Number(
                    (actual * 100).toFixed(1)
                ),
                target_percent: Number(
                    (target * 100).toFixed(1)
                ),
                gap_percent: Number(
                    gapPercent.toFixed(1)
                ),
                priority,
            });
        }
    }

    return result.sort(
        (a, b) => b.gap_percent - a.gap_percent
    );
}

/**
 * Mengelompokkan data unit performance berdasarkan Model Unit (mis. PC3400, PC2000, dll.).
 * Mengabaikan site yang tidak memiliki data pada periode terpilih (Rule 6).
 * Sumbu X adalah Site (`site_code`).
 *
 * @param {Array<object>} perfRows Baris data /api/unit-performance
 * @returns {Array<object>}
 */
export function buildUnitPerformanceByModel(perfRows) {
    if (!perfRows || perfRows.length === 0) return [];

    const modelMap = new Map();

    for (const row of perfRows) {
        const modelName = row.model_name || 'Lainnya';
        if (!modelMap.has(modelName)) {
            modelMap.set(modelName, new Map());
        }
        const siteMap = modelMap.get(modelName);
        const siteKey = row.site_code || `Site ${row.site_id || ''}`;
        if (!siteMap.has(siteKey)) {
            siteMap.set(siteKey, {
                site_code: siteKey,
                site_name: row.site_name || '',
                rows: [],
            });
        }
        siteMap.get(siteKey).rows.push(row);
    }

    const result = [];

    for (const [model_name, siteMap] of modelMap.entries()) {
        const chartData = [];
        let hasProductivity = false;
        let hasFuelConsumption = false;

        for (const [site_code, { site_name, rows }] of siteMap.entries()) {
            const paAvg = safeAvg(rows.map((r) => r.physical_availability));
            const uaAvg = safeAvg(rows.map((r) => r.unit_availability));
            const mtbfAvg = safeAvg(rows.map((r) => r.mtbf));
            const mttrAvg = safeAvg(rows.map((r) => r.mttr));
            const prodAvg = safeAvg(rows.map((r) => r.productivity));
            const fuelAvg = safeAvg(rows.map((r) => r.fuel_consumption));

            if (prodAvg !== null && prodAvg > 0) hasProductivity = true;
            if (fuelAvg !== null && fuelAvg > 0) hasFuelConsumption = true;

            chartData.push({
                site_code,
                site_name,
                physical_availability: paAvg !== null ? parseFloat((paAvg * 100).toFixed(1)) : null,
                unit_availability: uaAvg !== null ? parseFloat((uaAvg * 100).toFixed(1)) : null,
                mtbf: mtbfAvg !== null ? parseFloat(mtbfAvg.toFixed(1)) : null,
                mttr: mttrAvg !== null ? parseFloat(mttrAvg.toFixed(1)) : null,
                productivity: prodAvg !== null ? parseFloat(prodAvg.toFixed(1)) : null,
                fuel_consumption: fuelAvg !== null ? parseFloat(fuelAvg.toFixed(1)) : null,
            });
        }

        result.push({
            model_name,
            chartData,
            hasProductivity,
            hasFuelConsumption,
        });
    }

    return result;
}

// ---------------------------------------------------------------------------
// Chart: Availability trend (line chart, per bulan)
// ---------------------------------------------------------------------------

/**
 * Bentuk data ringkasan performa unit AGREGAT per site (lintas semua model
 * di site tsb). Dipakai Dashboard All Site untuk membandingkan performa
 * unit antar-site tanpa merinci ke level model.
 *
 * @param {Array<object>} perfRows Baris dari /api/unit-performance
 * @returns {Array<{ site_code: string, site_name: string, physical_availability: number|null, unit_availability: number|null, mtbf: number|null, mttr: number|null }>}
 */
export function buildUnitPerformanceBySite(perfRows) {
    if (!perfRows || perfRows.length === 0) return [];

    const map = new Map();
    for (const row of perfRows) {
        const identity = resolveSiteIdentity(row);
        if (!identity) continue; // site_id & site_code sama-sama kosong -> skip

        const { key, label } = identity;
        if (!map.has(key)) {
            map.set(key, {
                site_code: label,
                site_name: row.site_name || '',
                rows: [],
            });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values()).map(({ site_code, site_name, rows }) => {
        const paAvg = safeAvg(rows.map((r) => r.physical_availability));
        const uaAvg = safeAvg(rows.map((r) => r.unit_availability));
        const mtbfAvg = safeAvg(rows.map((r) => r.mtbf));
        const mttrAvg = safeAvg(rows.map((r) => r.mttr));

        return {
            site_code,
            site_name,
            physical_availability: paAvg !== null ? parseFloat((paAvg * 100).toFixed(1)) : null,
            unit_availability: uaAvg !== null ? parseFloat((uaAvg * 100).toFixed(1)) : null,
            mtbf: mtbfAvg !== null ? parseFloat(mtbfAvg.toFixed(1)) : null,
            mttr: mttrAvg !== null ? parseFloat(mttrAvg.toFixed(1)) : null,
        };
    });
}

/**
 * Agregasi data kpi-summary (lintas seluruh site atau site terpilih) menjadi
 * tren per bulan untuk chart. Nilai actual dikonversi ke persen (0-100).
 * Dipakai Dashboard All Site untuk "tren bulanan seluruh site".
 *
 * @param {Array<object>} kpiRows Baris dari /api/kpi-summary (biasanya hasil query 1 tahun penuh, tanpa filter bulan)
 * @returns {Array<{ month: string, Readiness: number|null, Availability: number|null, 'Lead Time': number|null }>}
 */
export function aggregateKpiByMonth(kpiRows) {
    if (!kpiRows || kpiRows.length === 0) return [];

    const map = new Map();
    for (const row of kpiRows) {
        const key = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        if (!map.has(key)) {
            map.set(key, { year: row.period_year, monthNum: row.period_month, rows: [] });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values())
        .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthNum - b.monthNum))
        .map(({ monthNum, rows }) => {
            const label = MONTHS.find((m) => m.value === Number(monthNum))?.label ?? monthNum;
            const readyness = safeAvg(rows.map((r) => r.readyness_actual));
            const availability = safeAvg(rows.map((r) => r.availability_actual));
            const leadtime = safeAvg(rows.map((r) => r.leadtime_actual));
            return {
                month: label,
                Readiness: readyness !== null ? parseFloat((readyness * 100).toFixed(1)) : null,
                Availability: availability !== null ? parseFloat((availability * 100).toFixed(1)) : null,
                'Lead Time': leadtime !== null ? parseFloat((leadtime * 100).toFixed(1)) : null,
            };
        });
}

/**
 * Bentuk data untuk line chart tren availability per bulan.
 * Nilai dikonversi ke persen (0-100).
 *
 * @param {Array<object>} perfRows
 * @returns {Array<{ month: string, 'PA (%)': number|null, 'UA (%)': number|null }>}
 */
export function buildAvailabilityTrendChart(perfRows) {
    return aggregatePerfByMonth(perfRows).map((point) => ({
        month: point.month,
        'PA (%)': point.physical_availability !== null
            ? parseFloat((point.physical_availability * 100).toFixed(1))
            : null,
        'UA (%)': point.unit_availability !== null
            ? parseFloat((point.unit_availability * 100).toFixed(1))
            : null,
    }));
}