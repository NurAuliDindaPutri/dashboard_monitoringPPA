import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import { getSites } from '../../api/site.api';
import { getUnitModels } from '../../api/unitModel.api';
import { getKpiSummary } from '../../api/kpiSummary.api';
import { getUnitPerformances } from '../../api/unitPerformance.api';
import { getPendingSupply } from '../../api/pendingSupply.api';
import { MONTHS } from '../../utils/constants';

import FilterBar from '../../components/common/FilterBar';
import BigStatCard from '../../components/common/BigStatCard';
import KpiCard from '../../components/common/KpiCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import SummarySpeedometerCard from '../../components/common/SummarySpeedometerCard';

import {
    aggregateKpiSummary,
    countUnits,
    countPendingSupply,
    sumPendingQty,
    safeAvg,
} from '../../utils/aggregate';

import {
    formatPercent,
    formatNumber,
    normalizePercentage,
} from '../../utils/kpiStatus';

import {
    buildUnitOptions,
    filterRowsByUnitGroup,
} from '../../utils/unitFilter';

const NOW = new Date();

const DEFAULT_YEAR =
    NOW.getFullYear();

const DEFAULT_MONTH =
    NOW.getMonth() + 1;

// ============================================================================
// LABEL BULAN SINGKAT (untuk sumbu chart tren)
// ============================================================================

const ID_MONTH_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

function monthShortLabel(monthValue) {
    return (
        ID_MONTH_SHORT[
        Number(monthValue) - 1
        ] || String(monthValue)
    );
}

function monthLongLabel(monthValue) {
    const found = MONTHS.find(
        (m) =>
            Number(m.value) ===
            Number(monthValue)
    );

    return found
        ? found.label
        : String(monthValue);
}

// Bangun daftar bulan dari startMonth s.d endMonth (inklusif, satu tahun yang sama).
function buildMonthRange(
    startMonth,
    endMonth
) {
    const safeStart = Math.min(
        Number(startMonth),
        Number(endMonth)
    );

    const safeEnd = Math.max(
        Number(startMonth),
        Number(endMonth)
    );

    const months = [];

    for (
        let m = safeStart;
        m <= safeEnd;
        m += 1
    ) {
        months.push(m);
    }

    return months;
}

// Pembulatan aman untuk nilai numerik non-persen (MTBF, MTTR, Productivity, Fuel).
function roundOrNull(
    value,
    decimals = 1
) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {
        return null;
    }

    const factor =
        10 ** decimals;

    return (
        Math.round(
            Number(value) * factor
        ) / factor
    );
}

// ============================================================================
// NORMALISASI SITE AGAR SAMA DENGAN DASHBOARD ALL SITE
// ============================================================================
//
// Daftar final site yang boleh tampil:
// AMC, BA, BGE, BIB, DMP, IPT, MHU, MIFA, MIP, MLP, PIK, SBS, SKS, VALE, WARA
//
// Penggabungan:
// - AMC / AMC-LAC / AMC-MAC / LAC -> tampil sebagai AMC
//   Prioritas data: AMC-LAC / LAC terlebih dahulu.
// - PTBA -> BA
// - ADRW -> WARA
//
const DASHBOARD_SITE_ORDER = [
    'AMC',
    'BA',
    'BGE',
    'BIB',
    'DMP',
    'IPT',
    'MHU',
    'MIFA',
    'MIP',
    'MLP',
    'PIK',
    'SBS',
    'SKS',
    'VALE',
    'WARA',
];

function normalizeSiteCode(siteCode) {
    const code = String(siteCode ?? '')
        .trim()
        .toUpperCase();

    if (
        code === 'AMC' ||
        code === 'AMC-LAC' ||
        code === 'AMC-MAC' ||
        code === 'LAC'
    ) {
        return 'AMC';
    }

    if (
        code === 'PTBA' ||
        code === 'BA'
    ) {
        return 'BA';
    }

    if (
        code === 'ADRW' ||
        code === 'WARA'
    ) {
        return 'WARA';
    }

    return code;
}

function getSitePriority(siteCode) {
    const code = String(siteCode ?? '')
        .trim()
        .toUpperCase();

    // AMC menggunakan data LAC/AMC-LAC jika tersedia.
    if (
        code === 'AMC-LAC' ||
        code === 'LAC'
    ) {
        return 1;
    }

    if (code === 'AMC-MAC') {
        return 2;
    }

    if (code === 'AMC') {
        return 3;
    }

    // BA diprioritaskan daripada PTBA.
    if (code === 'BA') {
        return 1;
    }

    if (code === 'PTBA') {
        return 2;
    }

    // WARA diprioritaskan daripada ADRW.
    if (code === 'WARA') {
        return 1;
    }

    if (code === 'ADRW') {
        return 2;
    }

    return 1;
}

function normalizeDashboardSites(rawSites = []) {
    const groupedSites = new Map();

    rawSites.forEach((site) => {
        const normalizedCode =
            normalizeSiteCode(site.site_code);

        // Site yang tidak tampil di Dashboard All Site dibuang dari dropdown.
        if (
            !DASHBOARD_SITE_ORDER.includes(
                normalizedCode
            )
        ) {
            return;
        }

        const candidate = {
            ...site,
            site_code: normalizedCode,
            original_site_code:
                site.site_code,
        };

        const existing =
            groupedSites.get(
                normalizedCode
            );

        if (!existing) {
            groupedSites.set(
                normalizedCode,
                candidate
            );
            return;
        }

        const candidatePriority =
            getSitePriority(
                site.site_code
            );

        const existingPriority =
            getSitePriority(
                existing.original_site_code
            );

        if (
            candidatePriority <
            existingPriority
        ) {
            groupedSites.set(
                normalizedCode,
                candidate
            );
        }
    });

    return DASHBOARD_SITE_ORDER
        .map((siteCode) =>
            groupedSites.get(siteCode)
        )
        .filter(Boolean);
}

// ============================================================================
// RESPONSE HELPER
// ============================================================================

function extractRows(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (
        Array.isArray(
            response?.data?.data
        )
    ) {
        return response.data.data;
    }

    if (
        Array.isArray(
            response?.data
        )
    ) {
        return response.data;
    }

    return [];
}

// ============================================================================
// PERCENT HELPER
// ============================================================================

function toPct(value) {
    const percentage =
        normalizePercentage(value);

    return percentage === null
        ? null
        : Number(
            percentage.toFixed(1)
        );
}

// ============================================================================
// DATE HELPER
// ============================================================================

function formatDateID(value) {
    if (!value) {
        return '-';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '-';
    }

    return date.toLocaleDateString(
        'id-ID',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}

// ============================================================================
// DASHBOARD PER SITE
// ============================================================================

function DashboardPerSite() {
    // ------------------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------------------

    const [
        siteId,
        setSiteId,
    ] = useState('');

    const [
        unitId,
        setUnitId,
    ] = useState('');

    // Rentang bulan: default Januari s.d bulan berjalan (Year-to-Date).
    const [
        startMonth,
        setStartMonth,
    ] = useState(1);

    const [
        endMonth,
        setEndMonth,
    ] = useState(
        DEFAULT_MONTH
    );

    const [
        year,
        setYear,
    ] = useState(
        DEFAULT_YEAR
    );

    // Jaga supaya "Dari Bulan" tidak pernah melewati "Sampai Bulan", dan sebaliknya.
    function handleStartMonthChange(
        value
    ) {
        setStartMonth(value);

        if (value > endMonth) {
            setEndMonth(value);
        }
    }

    function handleEndMonthChange(
        value
    ) {
        setEndMonth(value);

        if (value < startMonth) {
            setStartMonth(value);
        }
    }

    // RESET FILTER
    function handleResetFilter() {
        setSiteId('');
        setUnitId('');
        setStartMonth(1);
        setEndMonth(DEFAULT_MONTH);
        setYear(DEFAULT_YEAR);
    }

    // ------------------------------------------------------------------------
    // DATA
    // ------------------------------------------------------------------------

    const [
        sites,
        setSites,
    ] = useState([]);

    const [
        units,
        setUnits,
    ] = useState([]);

    const [
        kpiRows,
        setKpiRows,
    ] = useState([]);

    const [
        perfRows,
        setPerfRows,
    ] = useState([]);

    const [
        supplyRows,
        setSupplyRows,
    ] = useState([]);

    // ------------------------------------------------------------------------
    // LOADING
    // ------------------------------------------------------------------------

    const [
        loadingSites,
        setLoadingSites,
    ] = useState(true);

    const [
        loadingUnits,
        setLoadingUnits,
    ] = useState(false);

    const [
        loadingKpi,
        setLoadingKpi,
    ] = useState(false);

    const [
        loadingPerf,
        setLoadingPerf,
    ] = useState(false);

    const [
        loadingSupply,
        setLoadingSupply,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState(null);

    // =========================================================================
    // LOAD SITES
    // =========================================================================

    useEffect(() => {
        setLoadingSites(true);

        getSites()
            .then(
                (response) => {
                    const rawSites =
                        extractRows(
                            response
                        );

                    const filteredSites =
                        normalizeDashboardSites(
                            rawSites
                        );

                    setSites(
                        filteredSites
                    );

                    if (
                        filteredSites.length >
                        0 &&
                        !siteId
                    ) {
                        setSiteId(
                            String(
                                filteredSites[0]
                                    .id
                            )
                        );
                    }
                }
            )
            .catch((err) => {
                console.error(
                    'Gagal memuat daftar site:',
                    err
                );

                setSites([]);

                setError(
                    'Gagal memuat daftar site'
                );
            })
            .finally(() => {
                setLoadingSites(
                    false
                );
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================================
    // LOAD UNITS BY SITE
    // =========================================================================

    useEffect(() => {
        setUnitId('');

        if (!siteId) {
            setUnits([]);
            return;
        }

        setLoadingUnits(
            true
        );

        getUnitModels({
            site_id: siteId,
        })
            .then(
                (response) => {
                    setUnits(
                        extractRows(
                            response
                        )
                    );
                }
            )
            .catch(() => {
                setUnits([]);
            })
            .finally(() => {
                setLoadingUnits(
                    false
                );
            });
    }, [siteId]);

    // =========================================================================
    // LOAD DASHBOARD DATA
    // =========================================================================

    const fetchData =
        useCallback(() => {
            if (!siteId) {
                return;
            }

            const monthsInRange =
                buildMonthRange(
                    startMonth,
                    endMonth
                );

            setError(null);

            // KPI — ambil per bulan dalam rentang, lalu digabung.
            setLoadingKpi(
                true
            );

            Promise.all(
                monthsInRange.map(
                    (m) =>
                        getKpiSummary({
                            site_id:
                                siteId,

                            period_year:
                                year,

                            period_month:
                                m,
                        })
                )
            )
                .then(
                    (responses) => {
                        setKpiRows(
                            responses.flatMap(
                                (
                                    response
                                ) =>
                                    extractRows(
                                        response
                                    )
                            )
                        );
                    }
                )
                .catch(
                    (err) => {
                        console.error(
                            'Gagal memuat KPI:',
                            err
                        );

                        setKpiRows(
                            []
                        );

                        setError(
                            'Gagal memuat data KPI'
                        );
                    }
                )
                .finally(() => {
                    setLoadingKpi(
                        false
                    );
                });

            // UNIT PERFORMANCE — sama, ambil per bulan dalam rentang.
            setLoadingPerf(
                true
            );

            Promise.all(
                monthsInRange.map(
                    (m) =>
                        getUnitPerformances({
                            site_id:
                                siteId,

                            period_year:
                                year,

                            period_month:
                                m,
                        })
                )
            )
                .then(
                    (responses) => {
                        setPerfRows(
                            responses.flatMap(
                                (
                                    response
                                ) =>
                                    extractRows(
                                        response
                                    )
                            )
                        );
                    }
                )
                .catch(
                    (err) => {
                        console.error(
                            'Gagal memuat performa unit:',
                            err
                        );

                        setPerfRows(
                            []
                        );

                        setError(
                            'Gagal memuat data performa unit'
                        );
                    }
                )
                .finally(() => {
                    setLoadingPerf(
                        false
                    );
                });

            // PENDING SUPPLY — tidak terikat periode, tetap seperti semula.
            setLoadingSupply(
                true
            );

            getPendingSupply({
                site_id:
                    siteId,
            })
                .then(
                    (response) => {
                        setSupplyRows(
                            extractRows(
                                response
                            )
                        );
                    }
                )
                .catch(
                    (err) => {
                        console.error(
                            'Gagal memuat pending supply:',
                            err
                        );

                        setSupplyRows(
                            []
                        );

                        setError(
                            'Gagal memuat data pending supply'
                        );
                    }
                )
                .finally(() => {
                    setLoadingSupply(
                        false
                    );
                });
        }, [
            siteId,
            startMonth,
            endMonth,
            year,
        ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // =========================================================================
    // SAFE DATA
    // =========================================================================

    const safeKpiRows =
        Array.isArray(
            kpiRows
        )
            ? kpiRows
            : [];

    const rawPerfRows =
        Array.isArray(
            perfRows
        )
            ? perfRows
            : [];

    const safeSupplyRows =
        Array.isArray(
            supplyRows
        )
            ? supplyRows
            : [];

    // =========================================================================
    // SELECTED SITE + UNIT
    // =========================================================================

    const selectedSite =
        sites.find(
            (site) =>
                String(site.id) ===
                String(siteId)
        );

    // =========================================================================
    // UNIT OPTIONS
    // =========================================================================

    const unitOptions =
        buildUnitOptions(
            units,
            selectedSite?.site_code
        );

    const selectedUnit =
        unitId
            ? unitOptions.find(
                (option) =>
                    String(
                        option.id
                    ) ===
                    String(unitId)
            ) || {
                id: unitId,
                label: unitId,
            }
            : null;

    // =========================================================================
    // KPI SUMMARY — snapshot bulan akhir + rata-rata sepanjang rentang
    // =========================================================================

    const kpiRowsSnapshot =
        safeKpiRows.filter(
            (row) =>
                Number(
                    row.period_year
                ) ===
                Number(year) &&
                Number(
                    row.period_month
                ) ===
                Number(endMonth)
        );

    const kpiSummary =
        aggregateKpiSummary(
            kpiRowsSnapshot
        );

    const kpiSummaryRangeAvg =
        aggregateKpiSummary(
            safeKpiRows
        );

    // =========================================================================
    // FILTER UNIT GROUP — snapshot bulan akhir (dipakai untuk ringkasan & tabel)
    // =========================================================================

    const rawPerfRowsSnapshot =
        rawPerfRows.filter(
            (row) =>
                Number(
                    row.period_year
                ) ===
                Number(year) &&
                Number(
                    row.period_month
                ) ===
                Number(endMonth)
        );

    const safePerfRows =
        filterRowsByUnitGroup(
            rawPerfRowsSnapshot,
            selectedSite
                ?.site_code,
            unitId
        );

    // =========================================================================
    // TOTALS
    // =========================================================================

    const totalUnits =
        countUnits(
            safePerfRows
        );

    const totalPendingSupply =
        countPendingSupply(
            safeSupplyRows
        );

    const totalPendingQty =
        sumPendingQty(
            safeSupplyRows
        );

    // =========================================================================
    // OVERALL PERFORMANCE
    // =========================================================================

    const overallPerf = {
        physical_availability:
            safeAvg(
                safePerfRows.map(
                    (row) =>
                        row.physical_availability
                )
            ),

        unit_availability:
            safeAvg(
                safePerfRows.map(
                    (row) =>
                        row.unit_availability
                )
            ),

        mtbf:
            safeAvg(
                safePerfRows.map(
                    (row) =>
                        row.mtbf
                )
            ),

        mttr:
            safeAvg(
                safePerfRows.map(
                    (row) =>
                        row.mttr
                )
            ),
    };

    const overallProductivity =
        safeAvg(
            safePerfRows.map(
                (row) =>
                    row.productivity
            )
        );

    const overallFuelConsumption =
        safeAvg(
            safePerfRows.map(
                (row) =>
                    row.fuel_consumption
            )
        );

    // =========================================================================
    // BIG STAT ITEMS
    // =========================================================================

    const perfSummaryItems = [
        {
            label:
                'PA (Physical Availability)',

            value:
                formatPercent(
                    overallPerf.physical_availability
                ),

            icon:
                'bi-shield-check',

            color:
                'var(--chart-blue)',
        },

        {
            label:
                'UA (Unit Availability)',

            value:
                formatPercent(
                    overallPerf.unit_availability
                ),

            icon:
                'bi-truck',

            color:
                'var(--chart-green)',
        },

        {
            label:
                'MTBF',

            value:
                formatNumber(
                    overallPerf.mtbf
                ),

            suffix:
                'jam',

            icon:
                'bi-arrow-repeat',

            color:
                'var(--chart-purple)',
        },

        {
            label:
                'MTTR',

            value:
                formatNumber(
                    overallPerf.mttr
                ),

            suffix:
                'jam',

            icon:
                'bi-tools',

            color:
                'var(--chart-red)',
        },
    ];

    // =========================================================================
    // TREN PERFORMA MODEL TERPILIH (Dari Bulan – Sampai Bulan)
    // ============================================================================
    //
    // Chart tren cuma berlaku kalau user sudah memilih 1 Model Unit spesifik
    // (bukan "Semua Unit"), karena tren per bulan cuma masuk akal untuk satu
    // model — bukan campuran beberapa model sekaligus.

    const monthsInRange =
        buildMonthRange(
            startMonth,
            endMonth
        );

    const modelTrendSourceRows =
        unitId
            ? filterRowsByUnitGroup(
                rawPerfRows,
                selectedSite
                    ?.site_code,
                unitId
            )
            : [];

    const perfTrendByMonth =
        unitId
            ? monthsInRange.map(
                (m) => {
                    const rowsForMonth =
                        modelTrendSourceRows.filter(
                            (
                                row
                            ) =>
                                Number(
                                    row.period_year
                                ) ===
                                Number(
                                    year
                                ) &&
                                Number(
                                    row.period_month
                                ) ===
                                Number(
                                    m
                                )
                        );

                    return {
                        month_label:
                            monthShortLabel(
                                m
                            ),

                        physical_availability:
                            toPct(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.physical_availability
                                    )
                                )
                            ),

                        unit_availability:
                            toPct(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.unit_availability
                                    )
                                )
                            ),

                        mtbf:
                            roundOrNull(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.mtbf
                                    )
                                )
                            ),

                        mttr:
                            roundOrNull(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.mttr
                                    )
                                )
                            ),

                        productivity:
                            roundOrNull(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.productivity
                                    )
                                )
                            ),

                        fuel_consumption:
                            roundOrNull(
                                safeAvg(
                                    rowsForMonth.map(
                                        (
                                            row
                                        ) =>
                                            row.fuel_consumption
                                    )
                                )
                            ),
                    };
                }
            )
            : [];

    // =========================================================================
    // DATA AVAILABILITY
    // ============================================================================

    const hasProductivity =
        perfTrendByMonth.some(
            (item) =>
                item.productivity !==
                null &&
                item.productivity !==
                undefined
        );

    const hasFuelConsumption =
        perfTrendByMonth.some(
            (item) =>
                item.fuel_consumption !==
                null &&
                item.fuel_consumption !==
                undefined
        );

    // =========================================================================
    // UNIT PERFORMANCE TABLE
    // ============================================================================

    const perfColumns = [
        {
            key:
                'model_name',

            label:
                'Model Unit',

            align:
                'left',
        },

        {
            key:
                'physical_availability',

            label:
                'PA (%)',

            align:
                'center',

            render:
                (row) => {
                    const percentage =
                        normalizePercentage(
                            row.physical_availability
                        );

                    if (
                        percentage ===
                        null
                    ) {
                        return (
                            <span className="text-muted">
                                -
                            </span>
                        );
                    }

                    const color =
                        percentage >=
                            98
                            ? 'var(--chart-green)'
                            : percentage >=
                                95
                                ? 'var(--chart-orange)'
                                : 'var(--chart-red)';

                    return (
                        <span
                            className="badge rounded-pill"
                            style={{
                                backgroundColor:
                                    'color-mix(in srgb, currentColor 12%, transparent)',

                                color,
                            }}
                        >
                            {percentage.toFixed(
                                1
                            )}
                            %
                        </span>
                    );
                },
        },

        {
            key:
                'unit_availability',

            label:
                'UA (%)',

            align:
                'center',

            render:
                (row) => {
                    const percentage =
                        normalizePercentage(
                            row.unit_availability
                        );

                    if (
                        percentage ===
                        null
                    ) {
                        return (
                            <span className="text-muted">
                                -
                            </span>
                        );
                    }

                    const color =
                        percentage >=
                            98
                            ? 'var(--chart-green)'
                            : percentage >=
                                95
                                ? 'var(--chart-orange)'
                                : 'var(--chart-red)';

                    return (
                        <span
                            className="badge rounded-pill"
                            style={{
                                color,
                                background:
                                    'var(--navy-800)',
                            }}
                        >
                            {percentage.toFixed(
                                1
                            )}
                            %
                        </span>
                    );
                },
        },

        {
            key:
                'mtbf',

            label:
                'MTBF (jam)',

            align:
                'right',

            render:
                (row) =>
                    formatNumber(
                        row.mtbf
                    ),
        },

        {
            key:
                'mttr',

            label:
                'MTTR (jam)',

            align:
                'right',

            render:
                (row) =>
                    formatNumber(
                        row.mttr
                    ),
        },

        {
            key:
                'productivity',

            label:
                'Produktivitas',

            align:
                'right',

            render:
                (row) =>
                    formatNumber(
                        row.productivity
                    ),
        },

        {
            key:
                'fuel_consumption',

            label:
                'Fuel (L)',

            align:
                'right',

            render:
                (row) =>
                    formatNumber(
                        row.fuel_consumption,
                        0
                    ),
        },
    ];

    // ============================================================================
    // PENDING SUPPLY TABLE
    // ============================================================================

    const safePendingRows = safeSupplyRows.map((row) => ({
        id: row.id,
        parts_number: row.parts_number,
        description: row.description,
        qty: row.qty,
        no_po: row.no_po,
        eta: row.eta,
        remarks: row.remarks,
    }));

    const pendingColumns = [
        {
            key: 'parts_number',
            label: 'Part No.',
            align: 'left',
        },
        {
            key: 'description',
            label: 'Deskripsi',
            align: 'left',
        },
        {
            key: 'qty',
            label: 'Qty',
            align: 'center',
        },
        {
            key: 'no_po',
            label: 'No. PO',
            align: 'left',
        },
        {
            key: 'eta',
            label: 'ETA',
            align: 'center',
            render: (row) => formatDateID(row.eta),
        },
        {
            key: 'remarks',
            label: 'Keterangan',
            align: 'left',
            render: (row) => row.remarks || '-',
        },
    ];

    const combinedColumns = [
        {
            key:
                'category',

            label:
                'Kategori',

            align:
                'left',

            render:
                (row) => {
                    const isCritical =
                        row.category ===
                        'Critical Item';

                    const color =
                        isCritical
                            ? 'var(--chart-red)'
                            : 'var(--chart-blue)';

                    return (
                        <span
                            className="badge rounded-pill"
                            style={{
                                color,

                                background:
                                    'var(--navy-800)',
                            }}
                        >
                            {
                                row.category
                            }
                        </span>
                    );
                },
        },

        {
            key:
                'parts_number',

            label:
                'Part No.',

            align:
                'left',
        },

        {
            key:
                'description',

            label:
                'Deskripsi',

            align:
                'left',
        },

        {
            key:
                'qty',

            label:
                'Qty',

            align:
                'center',
        },

        {
            key:
                'no_po',

            label:
                'No. PO',

            align:
                'left',
        },

        {
            key:
                'date',

            label:
                'ETA / Estimasi',

            align:
                'center',

            render:
                (row) =>
                    formatDateID(
                        row.date
                    ),
        },

        {
            key:
                'remarks',

            label:
                'Keterangan',

            align:
                'left',

            render:
                (row) =>
                    row.remarks ||
                    '-',
        },
    ];

    // =========================================================================
    // LOADING
    // ============================================================================

    const isLoading =
        loadingKpi ||
        loadingPerf ||
        loadingSupply;

    // =========================================================================
    // RENDER
    // ============================================================================

    return (
        <div>
            {/* ================================================================
                HEADER
            ================================================================= */}

            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4
                        className="fw-bold mb-0"
                        style={{
                            color:
                                'var(--text-primary)',
                        }}
                    >
                        Dashboard Per Site

                        {selectedSite
                            ? ` — ${selectedSite.site_code}`
                            : ''}
                    </h4>

                    <p
                        className="text-secondary mb-0"
                        style={{
                            fontSize:
                                '0.875rem',
                        }}
                    >
                        {selectedSite
                            ? `${selectedSite.site_name ||
                            ''
                            }${selectedUnit
                                ? `${selectedSite.site_name ? ' — ' : ''}${selectedUnit.label}`
                                : ''
                            }`
                            : 'Pilih site untuk melihat detail performa'}
                    </p>

                    {selectedSite && (
                        <p
                            className="text-secondary mb-0"
                            style={{
                                fontSize:
                                    '0.8rem',
                            }}
                        >
                            <i className="bi bi-calendar-range me-1" />
                            Menampilkan data:{' '}
                            {monthLongLabel(
                                startMonth
                            )}
                            {startMonth !==
                                endMonth
                                ? ` – ${monthLongLabel(
                                    endMonth
                                )}`
                                : ''}{' '}
                            {year}
                        </p>
                    )}
                </div>

                {isLoading && (
                    <div
                        className="d-flex align-items-center gap-2 text-secondary"
                        style={{
                            fontSize:
                                '0.8rem',
                        }}
                    >
                        <div className="spinner-border spinner-border-sm text-primary-custom" />

                        <span>
                            Memuat data…
                        </span>
                    </div>
                )}
            </div>

            {/* ================================================================
                ERROR
            ================================================================= */}

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                    <i className="bi bi-exclamation-triangle-fill" />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-auto"
                        onClick={() => {
                            setError(
                                null
                            );

                            fetchData();
                        }}
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* ================================================================
                FILTER
            ================================================================= */}

            <FilterBar
                sites={
                    loadingSites
                        ? []
                        : sites
                }
                siteId={
                    siteId
                }
                units={
                    loadingUnits
                        ? []
                        : unitOptions
                }
                unitId={
                    unitId
                }
                year={
                    year
                }
                startMonth={
                    startMonth
                }
                endMonth={
                    endMonth
                }
                onSiteChange={
                    setSiteId
                }
                onUnitChange={
                    setUnitId
                }
                onYearChange={
                    setYear
                }
                onStartMonthChange={
                    handleStartMonthChange
                }
                onEndMonthChange={
                    handleEndMonthChange
                }
                showSiteFilter
                showUnitFilter
                showMonthFilter={false}
                showMonthRangeFilter
            />

            <div className="d-flex justify-content-end mb-3">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleResetFilter}
                >
                    <i className="bi bi-arrow-counterclockwise me-1" />
                    Reset Filter
                </button>
            </div>

            {/* ================================================================
                NO SITE
            ================================================================= */}

            {!siteId &&
                !loadingSites && (
                    <div className="app-card p-5 text-center mb-3">
                        <i className="bi bi-building fs-1 text-muted" />

                        <p className="text-muted mt-3 mb-0">
                            Pilih site di
                            filter atas untuk
                            menampilkan data
                            performa.
                        </p>
                    </div>
                )}

            {siteId && (
                <>
                    {/* ========================================================
                        BIG PERFORMANCE SUMMARY
                    ======================================================== */}

                    <div className="row g-3 mb-3">
                        <div className="col-12">
                            <BigStatCard
                                title={`Ringkasan Performa Unit${selectedUnit
                                    ? ` — ${selectedUnit.label}`
                                    : ''
                                    }`}
                                items={
                                    perfSummaryItems
                                }
                                loading={
                                    loadingPerf
                                }
                            />
                        </div>
                    </div>

                    {/* ========================================================
                        EXTRA KPI
                    ======================================================== */}

                    <div className="row g-3 mb-3">
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-speedometer2"
                                label="Productivity"
                                value={
                                    loadingPerf
                                        ? null
                                        : formatNumber(
                                            overallProductivity
                                        )
                                }
                                loading={
                                    loadingPerf
                                }
                                variant="secondary"
                            />
                        </div>

                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-fuel-pump"
                                label="Fuel Consumption"
                                value={
                                    loadingPerf
                                        ? null
                                        : formatNumber(
                                            overallFuelConsumption,
                                            0
                                        )
                                }
                                suffix="L"
                                loading={
                                    loadingPerf
                                }
                                variant="primary"
                            />
                        </div>

                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-truck"
                                label="Total Unit"
                                value={
                                    loadingPerf
                                        ? null
                                        : totalUnits
                                }
                                loading={
                                    loadingPerf
                                }
                                variant="success"
                            />
                        </div>

                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-hourglass-split"
                                label="Pending Supply"
                                value={
                                    loadingSupply
                                        ? null
                                        : totalPendingSupply
                                }
                                suffix="item"
                                loading={loadingSupply}
                                variant="warning"
                            />
                        </div>
                    </div>

                    {/* ========================================================
                        KPI SPEEDOMETER
                    ======================================================== */}

                    <div className="row g-3 mb-3">
                        <div className="col-12 col-lg-4">
                            <SummarySpeedometerCard
                                title="Readiness"
                                actual={
                                    kpiSummary.readyness_actual
                                }
                                target={
                                    kpiSummary.readyness_target
                                }
                                loading={
                                    loadingKpi
                                }
                            />
                        </div>

                        <div className="col-12 col-lg-4">
                            <SummarySpeedometerCard
                                title="Availability VHS"
                                actual={
                                    kpiSummary.availability_actual
                                }
                                target={
                                    kpiSummary.availability_target
                                }
                                loading={
                                    loadingKpi
                                }
                            />
                        </div>

                        <div className="col-12 col-lg-4">
                            <SummarySpeedometerCard
                                title="Lead Time Supply"
                                actual={
                                    kpiSummary.leadtime_actual
                                }
                                target={
                                    kpiSummary.leadtime_target
                                }
                                loading={
                                    loadingKpi
                                }
                            />
                        </div>
                    </div>

                    {/* ========================================================
                        KPI TEXT SUMMARY
                    ======================================================== */}

                    {!loadingKpi && (
                        <div className="app-card p-3 mb-3">
                            <div
                                className="fw-semibold mb-2"
                                style={{
                                    color:
                                        'var(--text-primary)',
                                }}
                            >
                                Ringkasan KPI —
                                Periode ini
                            </div>

                            <div className="row g-2">
                                {[
                                    {
                                        label:
                                            'Readiness',

                                        actual:
                                            kpiSummary.readyness_actual,

                                        target:
                                            kpiSummary.readyness_target,

                                        rangeAvg:
                                            kpiSummaryRangeAvg.readyness_actual,
                                    },

                                    {
                                        label:
                                            'Availability VHS',

                                        actual:
                                            kpiSummary.availability_actual,

                                        target:
                                            kpiSummary.availability_target,

                                        rangeAvg:
                                            kpiSummaryRangeAvg.availability_actual,
                                    },

                                    {
                                        label:
                                            'Lead Time Supply',

                                        actual:
                                            kpiSummary.leadtime_actual,

                                        target:
                                            kpiSummary.leadtime_target,

                                        rangeAvg:
                                            kpiSummaryRangeAvg.leadtime_actual,
                                    },
                                ].map(
                                    (
                                        item
                                    ) => (
                                        <div
                                            key={
                                                item.label
                                            }
                                            className="col-12 col-md-4"
                                        >
                                            <div
                                                className="rounded p-2 d-flex justify-content-between align-items-center"
                                                style={{
                                                    backgroundColor:
                                                        'var(--navy-800)',

                                                    border:
                                                        '1px solid var(--border-color)',
                                                }}
                                            >
                                                <span className="text-secondary small">
                                                    {
                                                        item.label
                                                    }
                                                </span>

                                                <div className="text-end">
                                                    <div
                                                        className="fw-bold"
                                                        style={{
                                                            color:
                                                                'var(--text-primary)',
                                                        }}
                                                    >
                                                        {formatPercent(
                                                            item.actual
                                                        )}
                                                    </div>

                                                    <small className="text-muted">
                                                        Target:{' '}
                                                        {formatPercent(
                                                            item.target
                                                        )}
                                                    </small>

                                                    {startMonth !==
                                                        endMonth && (
                                                            <div>
                                                                <small className="text-muted">
                                                                    Rata-rata{' '}
                                                                    {monthShortLabel(
                                                                        startMonth
                                                                    )}
                                                                    –
                                                                    {monthShortLabel(
                                                                        endMonth
                                                                    )}
                                                                    :{' '}
                                                                    {formatPercent(
                                                                        item.rangeAvg
                                                                    )}
                                                                </small>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        PERFORMANCE CHARTS
                    ======================================================== */}

                    <div className="app-card p-3 mb-3">
                        <div
                            className="fw-semibold mb-3"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            Tren Performa Unit
                            {selectedUnit
                                ? ` — ${selectedUnit.label}`
                                : ''}
                        </div>

                        {!unitId ? (
                            <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
                                <i className="bi bi-cursor fs-2 text-muted mb-2" />

                                <span className="fw-semibold text-secondary small">
                                    Pilih Model
                                    Unit
                                </span>

                                <small className="text-muted">
                                    Pilih Model
                                    Unit di filter
                                    atas untuk
                                    menampilkan
                                    grafik tren
                                    per bulan
                                </small>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {/* PA */}
                                <div className="col-12 col-lg-6 col-xl-3">
                                    <ChartCard
                                        title={`Physical Availability (%) — ${selectedUnit.label}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'physical_availability',

                                                label:
                                                    'PA (%)',

                                                color:
                                                    '#0A3991',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            250
                                        }
                                    />
                                </div>

                                {/* UA */}
                                <div className="col-12 col-lg-6 col-xl-3">
                                    <ChartCard
                                        title={`Unit Availability (%) — ${selectedUnit.label}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'unit_availability',

                                                label:
                                                    'UA (%)',

                                                color:
                                                    '#9CC6ED',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            250
                                        }
                                    />
                                </div>

                                {/* MTBF */}
                                <div className="col-12 col-lg-6 col-xl-3">
                                    <ChartCard
                                        title={`MTBF (jam) — ${selectedUnit.label}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'mtbf',

                                                label:
                                                    'MTBF',

                                                color:
                                                    '#6A0B23',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            250
                                        }
                                    />
                                </div>

                                {/* MTTR */}
                                <div className="col-12 col-lg-6 col-xl-3">
                                    <ChartCard
                                        title={`MTTR (jam) — ${selectedUnit.label}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'mttr',

                                                label:
                                                    'MTTR',

                                                color:
                                                    '#F2AFBC',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            250
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ========================================================
                        PRODUCTIVITY + FUEL
                    ======================================================== */}

                    <div className="mb-3">
                        <h6
                            className="fw-semibold mb-2"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            Productivity & Fuel
                            Consumption
                            {selectedUnit
                                ? ` — ${selectedUnit.label}`
                                : ' per Model'}
                        </h6>

                        <div className="row g-3">
                            {/* PRODUCTIVITY */}
                            <div className="col-12 col-lg-6">
                                {hasProductivity ? (
                                    <ChartCard
                                        title={`Productivity — ${selectedUnit?.label || ''}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'productivity',

                                                label:
                                                    'Productivity',

                                                color:
                                                    '#7EA336',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            270
                                        }
                                    />
                                ) : (
                                    <div className="app-card p-3 h-100">
                                        <div
                                            className="fw-semibold"
                                            style={{
                                                color:
                                                    'var(--text-primary)',
                                            }}
                                        >
                                            Productivity
                                            {selectedUnit
                                                ? ` — ${selectedUnit.label}`
                                                : ' per Model'}
                                        </div>

                                        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
                                            <i className="bi bi-inbox fs-2 text-muted mb-2" />

                                            <span className="fw-semibold text-secondary small">
                                                Data belum
                                                tersedia
                                            </span>

                                            <small className="text-muted">
                                                {unitId
                                                    ? 'Productivity bernilai NULL pada periode terpilih'
                                                    : 'Pilih Model Unit di filter atas untuk menampilkan grafik'}
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FUEL */}
                            <div className="col-12 col-lg-6">
                                {hasFuelConsumption ? (
                                    <ChartCard
                                        title={`Fuel Consumption — ${selectedUnit?.label || ''}`}
                                        type="line"
                                        data={
                                            perfTrendByMonth
                                        }
                                        xKey="month_label"
                                        series={[
                                            {
                                                key:
                                                    'fuel_consumption',

                                                label:
                                                    'Fuel (L)',

                                                color:
                                                    '#F2913D',
                                            },
                                        ]}
                                        loading={
                                            loadingPerf
                                        }
                                        height={
                                            270
                                        }
                                    />
                                ) : (
                                    <div className="app-card p-3 h-100">
                                        <div
                                            className="fw-semibold"
                                            style={{
                                                color:
                                                    'var(--text-primary)',
                                            }}
                                        >
                                            Fuel Consumption
                                            {selectedUnit
                                                ? ` — ${selectedUnit.label}`
                                                : ' per Model'}
                                        </div>

                                        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
                                            <i className="bi bi-fuel-pump fs-2 text-muted mb-2" />

                                            <span className="fw-semibold text-secondary small">
                                                Data belum
                                                tersedia
                                            </span>

                                            <small className="text-muted">
                                                {unitId
                                                    ? 'Fuel Consumption bernilai NULL pada periode terpilih'
                                                    : 'Pilih Model Unit di filter atas untuk menampilkan grafik'}
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================
                        PERFORMANCE TABLE
                    ======================================================== */}

                    <div className="mb-3">
                        <DataTable
                            title={`Performa Unit — ${totalUnits} unit`}
                            columns={
                                perfColumns
                            }
                            data={
                                safePerfRows
                            }
                            loading={
                                loadingPerf
                            }
                            emptyMessage="Tidak ada data performa unit untuk periode yang dipilih"
                            rowKey="id"
                        />
                    </div>

                    {/* ========================================================
                        PENDING + CRITICAL
                    ======================================================== */}

                    <div className="mb-3">
                        <DataTable
                            title={`Pending Supply — ${safePendingRows.length} item (${totalPendingQty} pcs)`}
                            columns={pendingColumns}
                            data={safePendingRows}
                            loading={loadingSupply}
                            emptyMessage="Tidak ada pending supply untuk site ini"
                            rowKey="id"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardPerSite;