import { MONTHS } from './constants';

// ============================================================================
// MASTER SITE
// ============================================================================

/**
 * Aturan final site:
 *
 * WARA + ADRW -> WARA
 * PTBA        -> BA
 *
 * AMC + AMC-MAC + LC -> AMC
 *
 * KHUSUS AMC:
 * Data yang diprioritaskan adalah data LC.
 * Jika LC tidak ada, baru fallback ke AMC / AMC-MAC.
 */
export function normalizeSiteCode(siteCode) {
    const code = String(siteCode || '')
        .trim()
        .toUpperCase();

    if (
        code === 'WARA' ||
        code === 'ADRW'
    ) {
        return 'WARA';
    }

    if (
        code === 'PTBA' ||
        code === 'BA'
    ) {
        return 'BA';
    }

    if (
        code === 'AMC' ||
        code === 'AMC-MAC' ||
        code === 'AMC-LAC' ||
        code === 'LAC' ||
        code === 'LC'
    ) {
        return 'AMC';
    }

    return code;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getRawSiteCode(row) {
    return String(
        row?.site_code || ''
    )
        .trim()
        .toUpperCase();
}

/**
 * Memilih data yang akan digunakan untuk satu site.
 *
 * KHUSUS AMC:
 * - kalau LC tersedia -> hanya LC yang digunakan
 * - kalau LC tidak tersedia -> AMC / AMC-MAC digunakan
 */
function selectPreferredSiteRows(
    normalizedSiteCode,
    rows = []
) {
    if (
        normalizedSiteCode !== 'AMC'
    ) {
        return rows;
    }

    const lcRows = rows.filter((row) => {
        const code = getRawSiteCode(row);

        return (
            code === 'LC' ||
            code === 'LAC'
        );
    });

    if (lcRows.length > 0) {
        return lcRows;
    }

    return rows.filter((row) => {
        const code =
            getRawSiteCode(row);

        return (
            code === 'AMC' ||
            code === 'AMC-MAC' ||
            code === 'AMC-LAC'
        );
    });
}

/**
 * Menghasilkan identitas site setelah normalisasi.
 */
function resolveSiteIdentity(row) {
    const rawCode =
        row?.site_code ??
        row?.site_id;

    if (
        rawCode === null ||
        rawCode === undefined ||
        rawCode === ''
    ) {
        return null;
    }

    const normalizedCode =
        normalizeSiteCode(rawCode);

    if (!normalizedCode) {
        return null;
    }

    return {
        key: normalizedCode,
        label: normalizedCode,
    };
}

/**
 * Sorting site A-Z.
 */
function sortBySite(a, b) {
    const siteA = String(
        a?.site_code ??
        a?.site ??
        ''
    );

    const siteB = String(
        b?.site_code ??
        b?.site ??
        ''
    );

    return siteA.localeCompare(
        siteB,
        'id',
        {
            sensitivity: 'base',
            numeric: true,
        }
    );
}

/**
 * Ubah decimal 0-1 menjadi persen.
 *
 * 0.9 -> 90
 */
function toPercent(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return Number(
        (number * 100).toFixed(1)
    );
}

// ============================================================================
// GENERAL
// ============================================================================

export function safeAvg(
    values = []
) {
    const valid = values
        .filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        )
        .map(Number)
        .filter(Number.isFinite);

    if (valid.length === 0) {
        return null;
    }

    return (
        valid.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / valid.length
    );
}

export function safeSum(
    values = []
) {
    const valid = values
        .filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        )
        .map(Number)
        .filter(Number.isFinite);

    return valid.reduce(
        (sum, value) =>
            sum + value,
        0
    );
}

// ============================================================================
// KPI PER SITE
// ============================================================================

export function buildKpiSummaryPerSite(
    kpiRows
) {
    if (
        !Array.isArray(kpiRows) ||
        kpiRows.length === 0
    ) {
        return [];
    }

    const map = new Map();

    for (const row of kpiRows) {
        const identity =
            resolveSiteIdentity(row);

        if (!identity) {
            continue;
        }

        const {
            key,
            label,
        } = identity;

        if (!map.has(key)) {
            map.set(key, {
                site_id:
                    row.site_id ?? null,

                site_code:
                    label,

                site_name:
                    label,

                rows: [],
            });
        }

        map.get(key)
            .rows.push(row);
    }

    return Array.from(
        map.values()
    )
        .map((group) => {
            /**
             * KHUSUS AMC:
             * kalau LC tersedia,
             * rows di sini hanya berisi LC.
             */
            const rows =
                selectPreferredSiteRows(
                    group.site_code,
                    group.rows
                );

            const readynessActual =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.readyness_actual
                    )
                );

            const readynessTarget =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.readyness_target
                    )
                );

            const availabilityActual =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.availability_actual
                    )
                );

            const availabilityTarget =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.availability_target
                    )
                );

            const leadtimeActual =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.leadtime_actual
                    )
                );

            const leadtimeTarget =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.leadtime_target
                    )
                );

            return {
                site_id:
                    group.site_id,

                site_code:
                    group.site_code,

                site_name:
                    group.site_name,

                // READINESS
                readyness_actual:
                    readynessActual,

                readyness_target:
                    readynessTarget,

                readyness_is_good:
                    readynessActual !== null &&
                        readynessTarget !== null
                        ? readynessActual >=
                        readynessTarget
                        : true,

                // AVAILABILITY
                availability_actual:
                    availabilityActual,

                availability_target:
                    availabilityTarget,

                availability_is_good:
                    availabilityActual !== null &&
                        availabilityTarget !== null
                        ? availabilityActual >=
                        availabilityTarget
                        : true,

                // LEAD TIME
                leadtime_actual:
                    leadtimeActual,

                leadtime_target:
                    leadtimeTarget,

                leadtime_is_good:
                    leadtimeActual !== null &&
                        leadtimeTarget !== null
                        ? leadtimeActual >=
                        leadtimeTarget
                        : true,
            };
        })
        .sort(sortBySite);
}

// ============================================================================
// KPI ALL SITE
// ============================================================================

export function aggregateKpiSummary(
    kpiRows
) {
    const sites =
        buildKpiSummaryPerSite(
            kpiRows
        );

    if (sites.length === 0) {
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
        readyness_actual:
            safeAvg(
                sites.map(
                    (site) =>
                        site.readyness_actual
                )
            ),

        readyness_target:
            safeAvg(
                sites.map(
                    (site) =>
                        site.readyness_target
                )
            ),

        availability_actual:
            safeAvg(
                sites.map(
                    (site) =>
                        site.availability_actual
                )
            ),

        availability_target:
            safeAvg(
                sites.map(
                    (site) =>
                        site.availability_target
                )
            ),

        leadtime_actual:
            safeAvg(
                sites.map(
                    (site) =>
                        site.leadtime_actual
                )
            ),

        leadtime_target:
            safeAvg(
                sites.map(
                    (site) =>
                        site.leadtime_target
                )
            ),
    };
}

// ============================================================================
// ANALISIS KPI BELUM TARGET
// ============================================================================

export function buildKpiBelowTargetAnalysis(
    kpiRows
) {
    const sites =
        buildKpiSummaryPerSite(
            kpiRows
        );

    const result = [];

    const definitions = [
        {
            key: 'readyness',
            label: 'Readiness',

            actual:
                'readyness_actual',

            target:
                'readyness_target',
        },
        {
            key: 'availability',
            label:
                'Availability VHS',

            actual:
                'availability_actual',

            target:
                'availability_target',
        },
        {
            key: 'leadtime',
            label:
                'Lead Time Supply',

            actual:
                'leadtime_actual',

            target:
                'leadtime_target',
        },
    ];

    for (const site of sites) {
        for (
            const definition of
            definitions
        ) {
            const actual =
                site[
                definition.actual
                ];

            const target =
                site[
                definition.target
                ];

            if (
                actual === null ||
                actual === undefined ||
                target === null ||
                target === undefined ||
                actual >= target
            ) {
                continue;
            }

            const gap =
                target - actual;

            const gapPercent =
                gap * 100;

            let priority =
                'Perlu Perhatian';

            if (
                gapPercent >= 10
            ) {
                priority =
                    'Prioritas Tinggi';
            } else if (
                gapPercent >= 5
            ) {
                priority =
                    'Prioritas Sedang';
            }

            result.push({
                id:
                    `${site.site_code}-${definition.key}`,

                site_id:
                    site.site_id,

                site_code:
                    site.site_code,

                site_name:
                    site.site_name,

                kpi:
                    definition.label,

                actual,

                target,

                gap,

                actual_percent:
                    Number(
                        (
                            actual * 100
                        ).toFixed(1)
                    ),

                target_percent:
                    Number(
                        (
                            target * 100
                        ).toFixed(1)
                    ),

                gap_percent:
                    Number(
                        gapPercent.toFixed(
                            1
                        )
                    ),

                priority,
            });
        }
    }

    /**
     * Sorting:
     * AMC
     * BA
     * BGE
     * BIB
     * ...
     * WARA
     *
     * Jika site sama,
     * KPI juga diurutkan A-Z.
     */
    return result.sort(
        (a, b) => {
            const siteCompare =
                String(
                    a.site_code
                ).localeCompare(
                    String(
                        b.site_code
                    ),
                    'id',
                    {
                        sensitivity:
                            'base',

                        numeric:
                            true,
                    }
                );

            if (
                siteCompare !== 0
            ) {
                return siteCompare;
            }

            return String(
                a.kpi
            ).localeCompare(
                String(
                    b.kpi
                ),
                'id',
                {
                    sensitivity:
                        'base',
                }
            );
        }
    );
}

// ============================================================================
// READINESS PER SITE
// ============================================================================

export function buildReadinessPerSiteChart(
    kpiRows
) {
    return buildKpiSummaryPerSite(
        kpiRows
    ).map((site) => ({
        site:
            site.site_code,

        actual:
            toPercent(
                site.readyness_actual
            ),

        target:
            toPercent(
                site.readyness_target
            ),
    }));
}

export function buildAvailabilityPerSiteChart(
    kpiRows
) {
    return buildKpiSummaryPerSite(
        kpiRows
    ).map((site) => ({
        site:
            site.site_code,

        actual:
            toPercent(
                site.availability_actual
            ),

        target:
            toPercent(
                site.availability_target
            ),
    }));
}

// ============================================================================
// LEAD TIME PER SITE
// ============================================================================

export function buildLeadTimePerSiteChart(
    kpiRows
) {
    return buildKpiSummaryPerSite(
        kpiRows
    ).map((site) => ({
        site:
            site.site_code,

        actual:
            toPercent(
                site.leadtime_actual
            ),

        target:
            toPercent(
                site.leadtime_target
            ),
    }));
}

// ============================================================================
// AVAILABILITY BULANAN
// ============================================================================

export function buildAvailabilityMonthlyChart(
    kpiRows
) {
    if (
        !Array.isArray(kpiRows) ||
        kpiRows.length === 0
    ) {
        return [];
    }

    const map = new Map();

    for (const row of kpiRows) {
        const month =
            Number(
                row.period_month
            );

        const year =
            Number(
                row.period_year
            );

        if (
            !Number.isFinite(
                month
            ) ||
            month < 1 ||
            month > 12
        ) {
            continue;
        }

        const key =
            `${year}-${month}`;

        if (!map.has(key)) {
            map.set(key, {
                year,
                month,
                rows: [],
            });
        }

        map.get(key)
            .rows.push(row);
    }

    return Array.from(
        map.values()
    )
        .sort(
            (a, b) =>
                a.year !== b.year
                    ? a.year -
                    b.year
                    : a.month -
                    b.month
        )
        .map((group) => {
            /**
             * Karena melalui
             * buildKpiSummaryPerSite(),
             * AMC otomatis memakai data LC.
             */
            const sites =
                buildKpiSummaryPerSite(
                    group.rows
                );

            const actual =
                safeAvg(
                    sites.map(
                        (site) =>
                            site.availability_actual
                    )
                );

            const target =
                safeAvg(
                    sites.map(
                        (site) =>
                            site.availability_target
                    )
                );

            return {
                month:
                    MONTHS.find(
                        (item) =>
                            Number(
                                item.value
                            ) ===
                            group.month
                    )?.label ??
                    group.month,

                actual:
                    toPercent(
                        actual
                    ),

                target:
                    toPercent(
                        target
                    ),
            };
        });
}

// ============================================================================
// UNIT PERFORMANCE BY MODEL
// ============================================================================

export function buildUnitPerformanceByModel(
    perfRows
) {
    if (
        !Array.isArray(perfRows) ||
        perfRows.length === 0
    ) {
        return [];
    }

    const modelMap =
        new Map();

    for (const row of perfRows) {
        const modelName =
            row.model_name ||
            'Lainnya';

        const siteCode =
            normalizeSiteCode(
                row.site_code
            );

        if (!siteCode) {
            continue;
        }

        if (
            !modelMap.has(
                modelName
            )
        ) {
            modelMap.set(
                modelName,
                new Map()
            );
        }

        const siteMap =
            modelMap.get(
                modelName
            );

        if (
            !siteMap.has(
                siteCode
            )
        ) {
            siteMap.set(
                siteCode,
                {
                    rows: [],
                }
            );
        }

        siteMap
            .get(siteCode)
            .rows.push(row);
    }

    const result = [];

    for (
        const [
            modelName,
            siteMap,
        ] of modelMap.entries()
    ) {
        const chartData = [];

        for (
            const [
                siteCode,
                group,
            ] of siteMap.entries()
        ) {
            /**
             * KHUSUS AMC:
             * kalau LC tersedia,
             * hanya LC digunakan.
             */
            const rows =
                selectPreferredSiteRows(
                    siteCode,
                    group.rows
                );

            const pa =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.physical_availability
                    )
                );

            const ua =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.unit_availability
                    )
                );

            const mtbf =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.mtbf
                    )
                );

            const mttr =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.mttr
                    )
                );

            const fuel =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.fuel_consumption
                    )
                );

            const productivity =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.productivity
                    )
                );

            chartData.push({
                site_code:
                    siteCode,

                site_name:
                    siteCode,

                physical_availability:
                    toPercent(pa),

                unit_availability:
                    toPercent(ua),

                mtbf:
                    mtbf !== null
                        ? Number(
                            mtbf.toFixed(
                                1
                            )
                        )
                        : null,

                mttr:
                    mttr !== null
                        ? Number(
                            mttr.toFixed(
                                1
                            )
                        )
                        : null,

                fuel_consumption:
                    fuel !== null
                        ? Number(
                            fuel.toFixed(
                                1
                            )
                        )
                        : null,

                productivity:
                    productivity !== null
                        ? Number(
                            productivity.toFixed(
                                1
                            )
                        )
                        : null,
            });
        }

        chartData.sort(
            sortBySite
        );

        result.push({
            model_name:
                modelName,

            chartData,
        });
    }

    return result.sort(
        (a, b) =>
            String(
                a.model_name
            ).localeCompare(
                String(
                    b.model_name
                ),
                'id',
                {
                    numeric: true,
                    sensitivity:
                        'base',
                }
            )
    );
}

// ============================================================================
// FUNGSI LAMA
// Tetap dipertahankan supaya halaman lain tidak error
// ============================================================================

export function buildKpiPerSiteChart(
    kpiRows
) {
    return buildKpiSummaryPerSite(
        kpiRows
    ).map((site) => ({
        site:
            site.site_code,

        readyness:
            toPercent(
                site.readyness_actual
            ),

        availability:
            toPercent(
                site.availability_actual
            ),

        leadtime:
            toPercent(
                site.leadtime_actual
            ),
    }));
}

// ============================================================================
// KPI BULANAN LAMA
// ============================================================================

export function aggregateKpiByMonth(
    kpiRows
) {
    if (
        !Array.isArray(kpiRows) ||
        kpiRows.length === 0
    ) {
        return [];
    }

    const monthMap =
        new Map();

    for (const row of kpiRows) {
        const year =
            Number(
                row.period_year
            );

        const month =
            Number(
                row.period_month
            );

        const key =
            `${year}-${month}`;

        if (
            !monthMap.has(key)
        ) {
            monthMap.set(
                key,
                {
                    year,
                    month,
                    rows: [],
                }
            );
        }

        monthMap
            .get(key)
            .rows.push(row);
    }

    return Array.from(
        monthMap.values()
    )
        .sort(
            (a, b) =>
                a.year !== b.year
                    ? a.year -
                    b.year
                    : a.month -
                    b.month
        )
        .map((group) => {
            const sites =
                buildKpiSummaryPerSite(
                    group.rows
                );

            const readiness =
                safeAvg(
                    sites.map(
                        (site) =>
                            site.readyness_actual
                    )
                );

            const availability =
                safeAvg(
                    sites.map(
                        (site) =>
                            site.availability_actual
                    )
                );

            const leadtime =
                safeAvg(
                    sites.map(
                        (site) =>
                            site.leadtime_actual
                    )
                );

            return {
                month:
                    MONTHS.find(
                        (item) =>
                            Number(
                                item.value
                            ) ===
                            group.month
                    )?.label ??
                    group.month,

                Readiness:
                    toPercent(
                        readiness
                    ),

                Availability:
                    toPercent(
                        availability
                    ),

                'Lead Time':
                    toPercent(
                        leadtime
                    ),
            };
        });
}

// ============================================================================
// UNIT PERFORMANCE PER BULAN
// ============================================================================

export function aggregatePerfByMonth(
    perfRows
) {
    if (
        !Array.isArray(perfRows) ||
        perfRows.length === 0
    ) {
        return [];
    }

    const map = new Map();

    for (const row of perfRows) {
        const year =
            Number(
                row.period_year
            );

        const month =
            Number(
                row.period_month
            );

        const key =
            `${year}-${month}`;

        if (!map.has(key)) {
            map.set(key, {
                year,
                month,
                rows: [],
            });
        }

        map.get(key)
            .rows.push(row);
    }

    return Array.from(
        map.values()
    )
        .sort(
            (a, b) =>
                a.year !== b.year
                    ? a.year -
                    b.year
                    : a.month -
                    b.month
        )
        .map((group) => ({
            month:
                MONTHS.find(
                    (item) =>
                        Number(
                            item.value
                        ) ===
                        group.month
                )?.label ??
                group.month,

            physical_availability:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.physical_availability
                    )
                ),

            unit_availability:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.unit_availability
                    )
                ),

            mtbf:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.mtbf
                    )
                ),

            mttr:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.mttr
                    )
                ),

            productivity:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.productivity
                    )
                ),

            fuel_consumption:
                safeAvg(
                    group.rows.map(
                        (row) =>
                            row.fuel_consumption
                    )
                ),
        }));
}

// ============================================================================
// AGGREGATE PER UNIT
// ============================================================================

export function aggregatePerfByUnit(
    perfRows
) {
    if (
        !Array.isArray(perfRows) ||
        perfRows.length === 0
    ) {
        return [];
    }

    return buildUnitPerformanceByModel(
        perfRows
    ).flatMap(
        (model) =>
            model.chartData.map(
                (row) => ({
                    model_name:
                        model.model_name,

                    ...row,
                })
            )
    );
}

// ============================================================================
// UNIT PERFORMANCE PER SITE
// ============================================================================

export function buildUnitPerformanceBySite(
    perfRows
) {
    if (
        !Array.isArray(perfRows) ||
        perfRows.length === 0
    ) {
        return [];
    }

    const map = new Map();

    for (const row of perfRows) {
        const identity =
            resolveSiteIdentity(row);

        if (!identity) {
            continue;
        }

        if (
            !map.has(
                identity.key
            )
        ) {
            map.set(
                identity.key,
                {
                    site_code:
                        identity.label,

                    rows: [],
                }
            );
        }

        map.get(
            identity.key
        ).rows.push(row);
    }

    return Array.from(
        map.values()
    )
        .map((group) => {
            const rows =
                selectPreferredSiteRows(
                    group.site_code,
                    group.rows
                );

            const pa =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.physical_availability
                    )
                );

            const ua =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.unit_availability
                    )
                );

            const mtbf =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.mtbf
                    )
                );

            const mttr =
                safeAvg(
                    rows.map(
                        (row) =>
                            row.mttr
                    )
                );

            return {
                site_code:
                    group.site_code,

                site_name:
                    group.site_code,

                physical_availability:
                    toPercent(pa),

                unit_availability:
                    toPercent(ua),

                mtbf:
                    mtbf !== null
                        ? Number(
                            mtbf.toFixed(
                                1
                            )
                        )
                        : null,

                mttr:
                    mttr !== null
                        ? Number(
                            mttr.toFixed(
                                1
                            )
                        )
                        : null,
            };
        })
        .sort(sortBySite);
}

// ============================================================================
// AVAILABILITY TREND UNIT
// ============================================================================

export function buildAvailabilityTrendChart(
    perfRows
) {
    return aggregatePerfByMonth(
        perfRows
    ).map((row) => ({
        month:
            row.month,

        'PA (%)':
            row.physical_availability !==
                null
                ? toPercent(
                    row.physical_availability
                )
                : null,

        'UA (%)':
            row.unit_availability !==
                null
                ? toPercent(
                    row.unit_availability
                )
                : null,
    }));
}

// ============================================================================
// COUNTERS
// ============================================================================

export function countUnits(
    perfRows
) {
    if (
        !Array.isArray(perfRows)
    ) {
        return 0;
    }

    return new Set(
        perfRows.map(
            (row) =>
                row.unit_model_id
        )
    ).size;
}

export function countPendingSupply(
    rows
) {
    return Array.isArray(rows)
        ? rows.length
        : 0;
}

export function sumPendingQty(
    rows
) {
    if (!Array.isArray(rows)) {
        return 0;
    }

    return rows.reduce(
        (sum, row) =>
            sum +
            (
                Number(
                    row.qty
                ) || 0
            ),
        0
    );
}