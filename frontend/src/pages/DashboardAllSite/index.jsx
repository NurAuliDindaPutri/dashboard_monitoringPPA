import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    useSearchParams,
} from 'react-router-dom';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

// API
import {
    getKpiSummary,
} from '../../api/kpiSummary.api';

import {
    getUnitPerformances,
} from '../../api/unitPerformance.api';

// Dummy fallback
import {
    dummyKpiSummary,
    dummyUnitPerformances,
} from '../../data/dummyData';

// Components
import FilterBar from '../../components/common/FilterBar';
import ChartCard from '../../components/common/ChartCard';
import SummarySpeedometerCard from '../../components/common/SummarySpeedometerCard';

// Utils
import {
    aggregateKpiSummary,
    buildKpiSummaryPerSite,
    buildAvailabilityPerSiteChart,
    buildKpiBelowTargetAnalysis,
    buildLeadTimePerSiteChart,
    buildReadinessPerSiteChart,
} from '../../utils/aggregate';

import {
    DASHBOARD_SITE_ORDER,
    normalizeSiteCode as normalizeSiteForDashboard,
} from '../../utils/siteNormalization';

import {
    normalizeUnitModel,
} from '../../utils/unitFilter';

const NOW = new Date();

// Dummy hanya boleh dipakai saat development.
// Set VITE_ENABLE_DUMMY_DATA=false jika ingin mematikannya saat development.
const ENABLE_DUMMY_FALLBACK =
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_DUMMY_DATA !== 'false';

const DEFAULT_YEAR =
    NOW.getFullYear();

const DEFAULT_MONTH =
    NOW.getMonth() + 1;

const UNIT_MODEL_OPTIONS = [
    'PC2000',
    'PC1250',
    'HD785',
    'PC3400',
];

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
// DUMMY FILTER
// ============================================================================

function filterDummyRows(
    rows,
    {
        month = '',
        year = '',
    } = {}
) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.filter(
        (row) => {
            const monthMatch =
                !month ||
                Number(
                    row.period_month
                ) ===
                Number(month);

            const yearMatch =
                !year ||
                Number(
                    row.period_year
                ) ===
                Number(year);

            return (
                monthMatch &&
                yearMatch
            );
        }
    );
}

// ============================================================================
// GENERAL HELPER
// ============================================================================

function safeAverage(values = []) {
    const validValues = values
        .filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        )
        .map(Number)
        .filter(Number.isFinite);

    if (
        validValues.length === 0
    ) {
        return null;
    }

    return (
        validValues.reduce(
            (total, value) =>
                total + value,
            0
        ) /
        validValues.length
    );
}

function convertToPercent(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return null;
    }

    const result =
        Math.abs(number) <= 1
            ? number * 100
            : number;

    return Number(
        result.toFixed(1)
    );
}

function getRawSiteCode(row) {
    return String(
        row?.site_code || ''
    )
        .trim()
        .toUpperCase();
}

function choosePreferredRows(
    siteCode,
    rows
) {
    if (
        siteCode !== 'AMC'
    ) {
        return rows;
    }

    const lcRows =
        rows.filter((row) => {
            const code =
                getRawSiteCode(
                    row
                );

            return (
                code === 'AMC-LAC' ||
                code === 'LAC'
            );
        });

    if (
        lcRows.length > 0
    ) {
        return lcRows;
    }

    return rows;
}

// ============================================================================
// BUILD PERFORMANCE CHART DATA
// ============================================================================

function buildPerformanceBySelectedModel(
    perfRows,
    selectedModel
) {
    if (
        !Array.isArray(perfRows) ||
        perfRows.length === 0
    ) {
        return [];
    }

    const groupedBySite =
        new Map();

    for (
        const row of perfRows
    ) {
        const category =
            normalizeUnitModel(
                row.model_name
            );

        if (
            category !==
            selectedModel
        ) {
            continue;
        }

        const siteCode =
            normalizeSiteForDashboard(
                row.site_code
            );

        if (!siteCode) {
            continue;
        }

        if (
            selectedModel ===
            'PC3400' &&
            siteCode !== 'BIB'
        ) {
            continue;
        }

        if (
            !groupedBySite.has(
                siteCode
            )
        ) {
            groupedBySite.set(
                siteCode,
                []
            );
        }

        groupedBySite
            .get(siteCode)
            .push(row);
    }

    return Array.from(
        groupedBySite.entries()
    )
        .map(
            ([
                siteCode,
                siteRows,
            ]) => {
                const rows =
                    choosePreferredRows(
                        siteCode,
                        siteRows
                    );

                const pa =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.physical_availability
                        )
                    );

                const ua =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.unit_availability
                        )
                    );

                const mtbf =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.mtbf
                        )
                    );

                const mttr =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.mttr
                        )
                    );

                const fuel =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.fuel_consumption
                        )
                    );

                const productivity =
                    safeAverage(
                        rows.map(
                            (row) =>
                                row.productivity
                        )
                    );

                return {
                    site:
                        siteCode,

                    pa:
                        convertToPercent(
                            pa
                        ),

                    ua:
                        convertToPercent(
                            ua
                        ),

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

                    fuel:
                        fuel !== null
                            ? Number(
                                fuel.toFixed(
                                    1
                                )
                            )
                            : null,

                    productivity:
                        productivity !==
                            null
                            ? Number(
                                productivity.toFixed(
                                    1
                                )
                            )
                            : null,
                };
            }
        )
        .sort((a, b) =>
            a.site.localeCompare(
                b.site,
                'id',
                {
                    sensitivity:
                        'base',
                }
            )
        );
}

// ============================================================================
// KPI DONUT - COMPACT VERSION
// ============================================================================

function KpiDonut({
    label,
    actual,
    target,
    isGood,
}) {
    const hasData =
        actual !== null &&
        actual !== undefined &&
        actual !== '';

    const actualPercent =
        hasData
            ? Number(
                (
                    Number(actual) *
                    100
                ).toFixed(0)
            )
            : 0;

    const targetPercent =
        target !== null &&
            target !== undefined &&
            target !== ''
            ? Number(
                (
                    Number(target) *
                    100
                ).toFixed(0)
            )
            : null;

    const gap =
        hasData &&
            targetPercent !== null
            ? targetPercent -
            actualPercent
            : null;

    let status =
        'no-data';

    if (hasData) {
        if (isGood) {
            status =
                'achieved';
        } else if (
            gap !== null &&
            gap <= 2
        ) {
            status =
                'near';
        } else {
            status =
                'below';
        }
    }

    /**
 * PATCH — DashboardAllSite.jsx
 * ---------------------------------------------------------------
 * Ganti isi object `visualMap` di dalam komponen `KpiDonut`
 * (satu-satunya tempat di file JSX yang pakai warna hex hardcoded,
 * bukan CSS variable) dengan versi palette baru di bawah ini.
 * Tidak ada perubahan logic — murni styling/warna.
 * ---------------------------------------------------------------
 */

    const visualMap = {
        achieved: {
            label: 'Memenuhi',
            start: '#7FC7CC',
            middle: '#7FC7CC',
            end: '#7FC7CC',
            text: '#4F9DA3',
            badgeBg: 'rgba(127, 199, 204, 0.14)',
            badgeText: '#4F9DA3',
        },

        near: {
            label: 'Mendekati',
            start: '#EA8913',
            middle: '#EA8913',
            end: '#EA8913',
            text: '#D9780A',
            badgeBg: 'rgba(234, 137, 19, 0.13)',
            badgeText: '#C96E08',
        },

        below: {
            label: 'Belum Target',
            start: '#980204',
            middle: '#980204',
            end: '#980204',
            text: '#980204',
            badgeBg: 'rgba(152, 2, 4, 0.09)',
            badgeText: '#980204',
        },

        'no-data': {
            label: 'Belum Ada',
            start: '#A8B4B5',
            middle: '#A8B4B5',
            end: '#A8B4B5',
            text: '#879597',
            badgeBg: 'rgba(135, 149, 151, 0.12)',
            badgeText: '#718083',
        },
    };

    const visual =
        visualMap[status];

    const radius = 25;

    const circumference =
        2 *
        Math.PI *
        radius;

    const normalizedPercent =
        Math.min(
            Math.max(
                actualPercent,
                0
            ),
            100
        );

    const offset =
        circumference -
        (
            normalizedPercent /
            100
        ) *
        circumference;

    const gradientId =
        `kpi-gradient-${label
            .replace(
                /\s+/g,
                '-'
            )
            .toLowerCase()}-${actualPercent}-${targetPercent}`;

    return (
        <div className="kpi-mini-card">
            <div className="kpi-mini-donut">
                <svg
                    width="74"
                    height="74"
                    viewBox="0 0 66 66"
                >
                    <defs>
                        <linearGradient
                            id={
                                gradientId
                            }
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                stopColor={
                                    visual.start
                                }
                            />

                            <stop
                                offset="50%"
                                stopColor={
                                    visual.middle
                                }
                            />

                            <stop
                                offset="100%"
                                stopColor={
                                    visual.end
                                }
                            />
                        </linearGradient>
                    </defs>

                    <circle
                        cx="33"
                        cy="33"
                        r={radius}
                        fill="none"
                        stroke="var(--kpi-track)"
                        strokeWidth="6"
                    />

                    {hasData && (
                        <circle
                            cx="33"
                            cy="33"
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={
                                circumference
                            }
                            strokeDashoffset={
                                offset
                            }
                            transform="rotate(-90 33 33)"
                            className="kpi-donut-progress"
                        />
                    )}
                </svg>

                <span
                    className="kpi-mini-value"
                    style={{
                        color:
                            visual.text,
                    }}
                >
                    {hasData
                        ? `${actualPercent}%`
                        : 'N/A'}
                </span>
            </div>

            <div className="kpi-mini-label">
                {label}
            </div>

            <div className="kpi-mini-target">
                Target:{' '}
                {targetPercent !==
                    null
                    ? `${targetPercent}%`
                    : '-'}
            </div>

            <span
                className="kpi-mini-status"
                style={{
                    background:
                        visual.badgeBg,

                    color:
                        visual.badgeText,
                }}
            >
                {visual.label}
            </span>
        </div>
    );
}

// ============================================================================
// PERFORMANCE CHART
// ============================================================================
function PerformanceBarChart({
    title,
    data,
    series,
    unit = '',
    height = 280,
}) {
    const availableSeries =
        series.filter(
            (item) =>
                data.some(
                    (row) =>
                        row[item.key] !== null &&
                        row[item.key] !== undefined
                )
        );

    const safeTitleId =
        String(title)
            .replace(
                /[^a-zA-Z0-9]/g,
                '-'
            )
            .replace(
                /-+/g,
                '-'
            )
            .toLowerCase();

    return (
        <div className="app-card p-3 h-100">
            <div
                className="fw-semibold mb-3"
                style={{
                    color:
                        'var(--text-primary)',
                }}
            >
                {title}
            </div>

            {data.length === 0 ||
                availableSeries.length === 0 ? (
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center text-muted"
                    style={{
                        height,
                    }}
                >
                    <i className="bi bi-bar-chart fs-3" />
                    <small className="mt-2">
                        Data belum tersedia
                    </small>
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={height}
                >
                    <BarChart
                        data={data}
                        margin={{
                            top: 18,
                            right: 18,
                            left: -5,
                            bottom: 5,
                        }}
                        barGap={8}
                    >
                        <defs>
                            {availableSeries.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const color =
                                        item.color;

                                    const gradientId =
                                        `perf-gradient-${safeTitleId}-${index}`;

                                    const shadowId =
                                        `perf-shadow-${safeTitleId}-${index}`;

                                    return (
                                        <g
                                            key={
                                                item.key
                                            }
                                        >
                                            <linearGradient
                                                id={
                                                    gradientId
                                                }
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor={color}
                                                    stopOpacity="0.40"
                                                />

                                                <stop
                                                    offset="10%"
                                                    stopColor={
                                                        color
                                                    }
                                                    stopOpacity="1"
                                                />

                                                <stop
                                                    offset="55%"
                                                    stopColor={
                                                        color
                                                    }
                                                    stopOpacity="0.98"
                                                />

                                                <stop
                                                    offset="85%"
                                                    stopColor={color}
                                                    stopOpacity="0.72"
                                                />

                                                <stop
                                                    offset="100%"
                                                    stopColor={color}
                                                    stopOpacity="0.88"
                                                />

                                                <stop
                                                    offset="100%"
                                                    stopColor={color}
                                                    stopOpacity="0.72"
                                                />
                                            </linearGradient>

                                            <filter
                                                key={`shadow-${gradientId}`}
                                                id={`shadow-${gradientId}`}
                                                x="-20%"
                                                y="-20%"
                                                width="140%"
                                                height="150%"
                                            >
                                                <feDropShadow
                                                    dx="2"
                                                    dy="5"
                                                    stdDeviation="4"
                                                    floodColor="#000000"
                                                    floodOpacity="0.22"
                                                />
                                            </filter>
                                        </g>
                                    );
                                }
                            )}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="5 4"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="site"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 12,
                                fill:
                                    'var(--text-secondary)',
                            }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 12,
                                fill:
                                    'var(--text-secondary)',
                            }}
                        />

                        <Tooltip
                            cursor={{
                                fill:
                                    'var(--chart-hover)',
                            }}
                            contentStyle={{
                                backgroundColor:
                                    'var(--card-bg)',
                                border:
                                    '1px solid var(--border-color)',
                                borderRadius: 10,
                                color:
                                    'var(--text-primary)',
                            }}
                            formatter={(
                                value,
                                name
                            ) => [
                                    value === null ||
                                        value === undefined
                                        ? '-'
                                        : `${value}${unit}`,
                                    name,
                                ]}
                        />

                        <Legend
                            iconType="circle"
                            iconSize={7}
                            wrapperStyle={{
                                fontSize: 12,
                            }}
                        />

                        {availableSeries.map(
                            (
                                item,
                                index
                            ) => {
                                const gradientId =
                                    `perf-gradient-${safeTitleId}-${index}`;

                                const shadowId =
                                    `perf-shadow-${safeTitleId}-${index}`;

                                return (
                                    <Bar
                                        key={
                                            item.key
                                        }
                                        dataKey={
                                            item.key
                                        }
                                        name={
                                            item.label
                                        }
                                        fill={`url(#${gradientId})`}
                                        stroke={
                                            item.color
                                        }
                                        strokeWidth={
                                            1
                                        }
                                        radius={[
                                            10,
                                            10,
                                            3,
                                            3,
                                        ]}
                                        filter={`url(#${shadowId})`}
                                        maxBarSize={
                                            48
                                        }
                                        isAnimationActive
                                    />
                                );
                            }
                        )}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ============================================================================
// DASHBOARD
// ============================================================================

function completeSiteChartData(rows = []) {
    const rowsBySite = new Map(
        rows.map((row) => [
            normalizeSiteForDashboard(
                row.site
            ),
            row,
        ])
    );

    return DASHBOARD_SITE_ORDER.map(
        (siteCode) => {
            const row =
                rowsBySite.get(siteCode);

            return {
                site: siteCode,
                actual:
                    row?.actual ?? null,
                target:
                    row?.target ?? null,
            };
        }
    );
}

function DashboardAllSite() {
    const [searchParams] =
        useSearchParams();

    const monthFromNotification =
        Number(
            searchParams.get('month')
        );

    const yearFromNotification =
        Number(
            searchParams.get('year')
        );

    const [
        month,
        setMonth,
    ] = useState(() => {
        if (
            monthFromNotification >= 1 &&
            monthFromNotification <= 12
        ) {
            return monthFromNotification;
        }

        return DEFAULT_MONTH;
    });

    const [
        year,
        setYear,
    ] = useState(() => {
        if (
            yearFromNotification >= 2000 &&
            yearFromNotification <= 2100
        ) {
            return yearFromNotification;
        }

        return DEFAULT_YEAR;
    });

    function handleResetFilter() {
        setMonth(DEFAULT_MONTH);
        setYear(DEFAULT_YEAR);
    }

    const [
        selectedUnitModel,
        setSelectedUnitModel,
    ] = useState(
        'PC2000'
    );

    const [
        kpiRows,
        setKpiRows,
    ] = useState([]);

    const [
        perfRows,
        setPerfRows,
    ] = useState([]);

    const [
        loadingKpi,
        setLoadingKpi,
    ] = useState(true);

    const [
        loadingPerf,
        setLoadingPerf,
    ] = useState(true);

    const [
        dataSource,
        setDataSource,
    ] = useState(
        'database'
    );

    const [
        error,
        setError,
    ] = useState(null);

    const fetchDashboardData =
        useCallback(() => {
            const params = {
                period_year:
                    year,

                period_month:
                    month,
            };

            setError(null);

            setLoadingKpi(true);

            getKpiSummary(params)
                .then(
                    (response) => {
                        setKpiRows(
                            extractRows(
                                response
                            )
                        );
                    }
                )
                .catch(
                    (err) => {
                        console.error(
                            'KPI API gagal:',
                            err
                        );

                        if (ENABLE_DUMMY_FALLBACK) {
                            setKpiRows(
                                filterDummyRows(
                                    dummyKpiSummary,
                                    { month, year }
                                )
                            );
                            setDataSource('dummy');
                        } else {
                            setKpiRows([]);
                            setDataSource('error');
                            setError(
                                'Gagal memuat KPI dari database.'
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        setLoadingKpi(
                            false
                        );
                    }
                );

            setLoadingPerf(
                true
            );

            getUnitPerformances(
                params
            )
                .then(
                    (response) => {
                        setPerfRows(
                            extractRows(
                                response
                            )
                        );
                    }
                )
                .catch(
                    (err) => {
                        console.error(
                            'Unit Performance API gagal:',
                            err
                        );

                        if (ENABLE_DUMMY_FALLBACK) {
                            setPerfRows(
                                filterDummyRows(
                                    dummyUnitPerformances,
                                    { month, year }
                                )
                            );
                            setDataSource('dummy');
                        } else {
                            setPerfRows([]);
                            setDataSource('error');
                            setError(
                                'Gagal memuat performa unit dari database.'
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        setLoadingPerf(
                            false
                        );
                    }
                );
        }, [
            month,
            year,
        ]);

    useEffect(() => {
        setDataSource(
            'database'
        );

        fetchDashboardData();
    }, [
        fetchDashboardData,
    ]);

    useEffect(() => {
        if (
            loadingKpi ||
            window.location.hash !==
            '#kpi-analysis'
        ) {
            return;
        }

        const analysisElement =
            document.getElementById(
                'kpi-analysis'
            );

        if (analysisElement) {
            analysisElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [loadingKpi]);
    const kpiSummary =
        aggregateKpiSummary(
            kpiRows
        );

    const siteKpiSummary =
        buildKpiSummaryPerSite(
            kpiRows
        );

    const belowTargetAnalysis =
        buildKpiBelowTargetAnalysis(
            kpiRows
        );

    const readinessChartData =
        completeSiteChartData(
            buildReadinessPerSiteChart(
                kpiRows
            )
        );

    const availabilityChartData =
        completeSiteChartData(
            buildAvailabilityPerSiteChart(
                kpiRows
            )
        );

    const leadTimeChartData =
        completeSiteChartData(
            buildLeadTimePerSiteChart(
                kpiRows
            )
        );

    const performanceChartData =
        useMemo(
            () =>
                buildPerformanceBySelectedModel(
                    perfRows,
                    selectedUnitModel
                ),
            [
                perfRows,
                selectedUnitModel,
            ]
        );

    const availableSiteCount =
        performanceChartData.length;

    const isLoading =
        loadingKpi ||
        loadingPerf;

    return (
        <div>
            {/* HEADER */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4
                        className="fw-bold mb-0"
                        style={{
                            color:
                                'var(--text-primary)',
                        }}
                    >
                        Dashboard All Site
                    </h4>

                    <p className="text-secondary mb-0 small">
                        Monitoring KPI dan
                        performa unit
                        seluruh site.
                    </p>
                </div>

                {isLoading && (
                    <div className="d-flex align-items-center gap-2 text-secondary small">
                        <div className="spinner-border spinner-border-sm" />

                        Memuat data…
                    </div>
                )}
            </div>

            {/* ERROR / DUMMY */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {dataSource ===
                'dummy' && (
                    <div className="alert alert-warning">
                        <i className="bi bi-database-exclamation me-2" />

                        Backend/database
                        belum terhubung.
                        Menampilkan data
                        dummy.
                    </div>
                )}

            {/* FILTER */}
            <FilterBar
                month={month}
                year={year}
                onMonthChange={
                    setMonth
                }
                onYearChange={
                    setYear
                }
                showSiteFilter={
                    false
                }
                showMonthFilter
                showYearFilter
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

            {/* KPI UTAMA */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-4">
                    <SummarySpeedometerCard
                        title="Readiness All Site"
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
                        title="Availability VHS All Site"
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
                        title="Lead Time Supply All Site"
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

            {/* RINGKASAN KPI PER SITE */}
            <div
                id="kpi-analysis"
                className="app-card p-3 mb-4"
            >
                <div className="mb-3">
                    <h6
                        className="fw-semibold mb-1"
                        style={{
                            color:
                                'var(--text-primary)',
                        }}
                    >
                        Ringkasan KPI Per Site
                        — Status Pencapaian
                        Target
                    </h6>

                    <small className="text-secondary">
                        Menunjukkan apakah
                        tiap site sudah
                        memenuhi target
                        Readiness,
                        Availability VHS,
                        dan Lead Time
                        Supply pada periode
                        terpilih.
                    </small>
                </div>

                {loadingKpi ? (
                    <div className="row g-3">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={
                                        item
                                    }
                                    className="col-12 col-md-6 col-xxl-4"
                                >
                                    <div className="placeholder-glow">
                                        <span
                                            className="placeholder w-100 rounded"
                                            style={{
                                                height:
                                                    185,
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : siteKpiSummary.length ===
                    0 ? (
                    <div className="text-center py-5 text-muted">
                        Data KPI per site
                        belum tersedia.
                    </div>
                ) : (
                    <div className="row g-3">
                        {siteKpiSummary.map(
                            (
                                site
                            ) => (
                                <div
                                    key={
                                        site.site_code
                                    }
                                    className="col-12 col-md-6 col-xxl-4"
                                >
                                    <div
                                        className="border rounded-4 p-2 h-100"
                                        style={{
                                            borderColor:
                                                'var(--border-color)',
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                                            <h6
                                                className="fw-bold mb-0"
                                                style={{
                                                    color:
                                                        'var(--text-primary)',
                                                }}
                                            >
                                                {
                                                    site.site_code
                                                }
                                            </h6>

                                            <small
                                                className="text-secondary"
                                                style={{
                                                    fontSize:
                                                        '0.7rem',
                                                }}
                                            >
                                                Site
                                            </small>
                                        </div>

                                        <div className="row g-1">
                                            <div className="col-4">
                                                <KpiDonut
                                                    label="Readiness"
                                                    actual={
                                                        site.readyness_actual
                                                    }
                                                    target={
                                                        site.readyness_target
                                                    }
                                                    isGood={
                                                        site.readyness_is_good
                                                    }
                                                />
                                            </div>

                                            <div className="col-4">
                                                <KpiDonut
                                                    label="Availability"
                                                    actual={
                                                        site.availability_actual
                                                    }
                                                    target={
                                                        site.availability_target
                                                    }
                                                    isGood={
                                                        site.availability_is_good
                                                    }
                                                />
                                            </div>

                                            <div className="col-4">
                                                <KpiDonut
                                                    label="Lead Time"
                                                    actual={
                                                        site.leadtime_actual
                                                    }
                                                    target={
                                                        site.leadtime_target
                                                    }
                                                    isGood={
                                                        site.leadtime_is_good
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* ANALISIS KPI */}
            <div className="app-card p-3 mb-4">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3 flex-wrap">
                    <div>
                        <h6
                            className="fw-semibold mb-1"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            Analisis KPI Belum
                            Mencapai Target
                        </h6>

                        <small className="text-secondary">
                            Data diurutkan
                            berdasarkan site
                            A-Z.
                        </small>
                    </div>

                    {!loadingKpi && (
                        <span
                            className={`badge rounded-pill ${belowTargetAnalysis.length >
                                0
                                ? 'text-bg-danger'
                                : 'text-bg-success'
                                }`}
                        >
                            {belowTargetAnalysis.length >
                                0
                                ? `${belowTargetAnalysis.length} KPI perlu perhatian`
                                : 'Semua KPI memenuhi target'}
                        </span>
                    )}
                </div>

                {loadingKpi ? (
                    <div className="placeholder-glow">
                        <span
                            className="placeholder w-100 rounded"
                            style={{
                                height:
                                    130,
                            }}
                        />
                    </div>
                ) : belowTargetAnalysis.length ===
                    0 ? (
                    <div className="text-center py-4">
                        <i className="bi bi-check-circle-fill text-success fs-2" />

                        <p className="mb-0 mt-2">
                            Semua KPI mencapai
                            target.
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        Site
                                    </th>
                                    <th>
                                        KPI
                                    </th>
                                    <th className="text-end">
                                        Aktual
                                    </th>
                                    <th className="text-end">
                                        Target
                                    </th>
                                    <th className="text-end">
                                        Kekurangan
                                    </th>
                                    <th className="text-center">
                                        Prioritas
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {belowTargetAnalysis.map(
                                    (
                                        item
                                    ) => {
                                        const badge =
                                            item.priority ===
                                                'Prioritas Tinggi'
                                                ? 'text-bg-danger'
                                                : item.priority ===
                                                    'Prioritas Sedang'
                                                    ? 'text-bg-warning'
                                                    : 'text-bg-secondary';

                                        return (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >
                                                <td className="fw-semibold">
                                                    {
                                                        item.site_code
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.kpi
                                                    }
                                                </td>

                                                <td className="text-end text-danger fw-semibold">
                                                    {
                                                        item.actual_percent
                                                    }
                                                    %
                                                </td>

                                                <td className="text-end">
                                                    {
                                                        item.target_percent
                                                    }
                                                    %
                                                </td>

                                                <td className="text-end text-danger">
                                                    -
                                                    {
                                                        item.gap_percent
                                                    }
                                                    %
                                                </td>

                                                <td className="text-center">
                                                    <span
                                                        className={`badge rounded-pill ${badge}`}
                                                    >
                                                        {
                                                            item.priority
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* READINESS + AVAILABILITY */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-xl-6">
                    <ChartCard
                        title="Readiness Antar Site (%)"
                        type="bar"
                        data={
                            readinessChartData
                        }
                        xKey="site"
                        series={[
                            {
                                key: 'actual',
                                label:
                                    'Actual Readiness',
                                color:
                                    '#5f5aa5',
                                renderAs:
                                    'bar',
                            },

                            {
                                key: 'target',
                                label:
                                    'Target Readiness',
                                color:
                                    'var(--chart-pink)',
                                renderAs:
                                    'line',
                                dashed:
                                    true,
                                connectNulls:
                                    true,
                            },
                        ]}
                        loading={
                            loadingKpi
                        }
                        height={300}
                    />
                </div>

                <div className="col-12 col-xl-6">
                    <ChartCard
                        title="Availability VHS Antar Site (%)"
                        type="bar"
                        data={
                            availabilityChartData
                        }
                        xKey="site"
                        series={[
                            {
                                key: 'actual',
                                label:
                                    'Actual Availability',
                                color:
                                    '#5f5aa5',
                                renderAs:
                                    'bar',
                            },
                            {
                                key: 'target',
                                label:
                                    'Target Availability',
                                color:
                                    'var(--chart-pink)',
                                renderAs:
                                    'line',
                                dashed:
                                    true,
                                connectNulls:
                                    true,
                            },
                        ]}
                        loading={
                            loadingKpi
                        }
                        height={300}
                    />
                </div>
            </div>

            {/* LEAD TIME */}
            <div className="mb-4">
                <ChartCard
                    title="Lead Time Supply Antar Site (%)"
                    type="bar"
                    data={
                        leadTimeChartData
                    }
                    xKey="site"
                    series={[
                        {
                            key: 'actual',
                            label:
                                'Actual Lead Time Supply',
                            color: '#5f5aa5',
                            renderAs:
                                'bar',
                        },

                        {
                            key: 'target',
                            label:
                                'Target Lead Time Supply',
                            color:
                                'var(--chart-pink)',
                            renderAs:
                                'line',
                            dashed:
                                true,
                            connectNulls: true,
                        },
                    ]}
                    loading={
                        loadingKpi
                    }
                    height={300}
                />
            </div>

            {/* PERFORMA UNIT */}
            <div className="app-card p-3 mb-4">
                <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                    <div>
                        <h6
                            className="fw-semibold mb-1"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            Performa Unit All
                            Site
                        </h6>

                        <small className="text-secondary">
                            Perbandingan PA,
                            UA, MTBF, MTTR,
                            Fuel, dan
                            Productivity
                            berdasarkan model
                            unit.
                        </small>
                    </div>

                    {!loadingPerf && (
                        <span className="badge rounded-pill text-bg-light">
                            {
                                availableSiteCount
                            }{' '}
                            site
                        </span>
                    )}
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    {UNIT_MODEL_OPTIONS.map(
                        (
                            model
                        ) => (
                            <button
                                key={
                                    model
                                }
                                type="button"
                                className={`btn btn-sm ${selectedUnitModel ===
                                    model
                                    ? 'btn-primary'
                                    : 'btn-outline-secondary'
                                    }`}
                                onClick={() =>
                                    setSelectedUnitModel(
                                        model
                                    )
                                }
                            >
                                {
                                    model
                                }

                                {model ===
                                    'PC3400' && (
                                        <small className="ms-1">
                                            (BIB)
                                        </small>
                                    )}
                            </button>
                        )
                    )}
                </div>

                <div
                    className="alert alert-light border py-2 mb-3"
                    style={{
                        fontSize:
                            '0.8rem',
                    }}
                >
                    <i className="bi bi-info-circle me-2" />

                    PC2000, PC1250 dan
                    HD785 menampilkan
                    seluruh site yang
                    memiliki model
                    tersebut. PC3400
                    khusus site BIB.
                    PC1250SP masuk ke
                    kategori PC1250.
                </div>

                {loadingPerf ? (
                    <div className="placeholder-glow">
                        <span
                            className="placeholder w-100 rounded"
                            style={{
                                height:
                                    300,
                            }}
                        />
                    </div>
                ) : performanceChartData.length ===
                    0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-truck fs-2" />

                        <p className="mb-1 mt-2">
                            Data{' '}
                            {
                                selectedUnitModel
                            }{' '}
                            belum tersedia.
                        </p>

                        <small>
                            Pilih model unit
                            lainnya.
                        </small>
                    </div>
                ) : (
                    <div className="row g-3">
                        <div className="col-12 col-xl-6">
                            <PerformanceBarChart
                                title={`PA & UA — ${selectedUnitModel} (%)`}
                                data={
                                    performanceChartData
                                }
                                unit="%"
                                series={[
                                    {
                                        key: 'pa',
                                        label:
                                            'PA (%)',
                                        color:
                                            '#0A3991',
                                    },

                                    {
                                        key: 'ua',
                                        label:
                                            'UA (%)',
                                        color:
                                            '#9CC6ED',
                                    },
                                ]}
                                height={
                                    290
                                }
                            />
                        </div>

                        <div className="col-12 col-xl-6">
                            <PerformanceBarChart
                                title={`MTBF & MTTR — ${selectedUnitModel}`}
                                data={
                                    performanceChartData
                                }
                                series={[
                                    {
                                        key: 'mtbf',
                                        label:
                                            'MTBF',
                                        color:
                                            '#6A0B23',
                                    },

                                    {
                                        key: 'mttr',
                                        label:
                                            'MTTR',
                                        color:
                                            '#F2AFBC',
                                    },
                                ]}
                                height={
                                    290
                                }
                            />
                        </div>

                        <div className="col-12 col-xl-6">
                            <PerformanceBarChart
                                title={`Fuel Consumption — ${selectedUnitModel}`}
                                data={
                                    performanceChartData
                                }
                                series={[
                                    {
                                        key: 'fuel',
                                        label:
                                            'Fuel',
                                        color:
                                            '#F2913D',
                                    },
                                ]}
                                height={
                                    270
                                }
                            />
                        </div>

                        <div className="col-12 col-xl-6">
                            <PerformanceBarChart
                                title={`Productivity — ${selectedUnitModel}`}
                                data={
                                    performanceChartData
                                }
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
                                height={
                                    270
                                }
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardAllSite;
