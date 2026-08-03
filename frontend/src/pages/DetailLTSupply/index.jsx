import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { getSites } from '../../api/site.api';
import { getKpiSummary } from '../../api/kpiSummary.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import {
    dummySites,
    dummyKpiSummary,
    dummyUnitPerformances,
    dummyPendingSupply,
    filterDummyByPeriod,
} from '../../data/dummyData';

import { MONTHS } from '../../utils/constants';
import { formatPercent } from '../../utils/kpiStatus';
import { safeAvg } from '../../utils/aggregate';

const NOW = new Date();
const ROWS_PER_PAGE = 20;

function extractRows(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];
}

function getMonthLabel(monthValue) {
    return (
        MONTHS.find(
            (month) =>
                Number(month.value) ===
                Number(monthValue)
        )?.label ?? monthValue
    );
}

function buildLtTrend(kpiRows) {
    if (!Array.isArray(kpiRows) || kpiRows.length === 0) {
        return [];
    }

    const groupedRows = new Map();

    for (const row of kpiRows) {
        const key = `${row.period_year}-${String(
            row.period_month
        ).padStart(2, '0')}`;

        if (!groupedRows.has(key)) {
            groupedRows.set(key, {
                year: Number(row.period_year),
                monthNum: Number(row.period_month),
                rows: [],
            });
        }

        groupedRows.get(key).rows.push(row);
    }

    return Array.from(groupedRows.values())
        .sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }

            return a.monthNum - b.monthNum;
        })
        .map(({ year, monthNum, rows }) => {
            const actual = safeAvg(
                rows.map((row) => row.leadtime_actual)
            );

            const target = safeAvg(
                rows.map((row) => row.leadtime_target)
            );

            return {
                month: `${getMonthLabel(monthNum)} ${year}`,
                'Aktual (%)':
                    actual !== null
                        ? Number(
                            (actual * 100).toFixed(1)
                        )
                        : null,
                'Target (%)':
                    target !== null
                        ? Number(
                            (target * 100).toFixed(1)
                        )
                        : null,
            };
        });
}

function buildLtPerSite(kpiRows) {
    if (!Array.isArray(kpiRows) || kpiRows.length === 0) {
        return [];
    }

    const groupedRows = new Map();

    for (const row of kpiRows) {
        const key =
            row.site_id ??
            row.site_code ??
            `site-${row.id}`;

        if (!groupedRows.has(key)) {
            groupedRows.set(key, {
                site:
                    row.site_code ||
                    `Site ${row.site_id}`,
                rows: [],
            });
        }

        groupedRows.get(key).rows.push(row);
    }

    return Array.from(groupedRows.values()).map(
        ({ site, rows }) => {
            const actual = safeAvg(
                rows.map((row) => row.leadtime_actual)
            );

            const target = safeAvg(
                rows.map((row) => row.leadtime_target)
            );

            return {
                site,
                'Aktual (%)':
                    actual !== null
                        ? Number(
                            (actual * 100).toFixed(1)
                        )
                        : null,
                'Target (%)':
                    target !== null
                        ? Number(
                            (target * 100).toFixed(1)
                        )
                        : null,
            };
        }
    );
}

function formatGap(actualValue, targetValue) {
    if (
        actualValue === null ||
        actualValue === undefined ||
        targetValue === null ||
        targetValue === undefined
    ) {
        return {
            text: '-',
            positive: null,
        };
    }

    const gap =
        (Number(actualValue) -
            Number(targetValue)) *
        100;

    return {
        text: `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}%`,
        positive: gap >= 0,
    };
}

function DetailLTSupply() {
    const [siteId, setSiteId] = useState('');
    const [month, setMonth] = useState(
        NOW.getMonth() + 1
    );
    const [year, setYear] = useState(
        NOW.getFullYear()
    );

    const [sites, setSites] = useState([]);
    const [kpiRows, setKpiRows] = useState([]);
    const [trendRows, setTrendRows] = useState([]);

    const [loadingSites, setLoadingSites] =
        useState(true);
    const [loadingData, setLoadingData] =
        useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] =
        useState(1);

    useEffect(() => {
        let active = true;

        async function fetchSites() {
            try {
                setLoadingSites(true);

                const response = await getSites();
                const rows = extractRows(response);

                if (active) {
                    setSites(rows);
                }
            } catch (err) {
                console.error(
                    'Gagal memuat daftar site:',
                    err
                );

                if (active) {
                    setSites([]);
                    setError(
                        'Gagal memuat daftar site'
                    );
                }
            } finally {
                if (active) {
                    setLoadingSites(false);
                }
            }
        }

        fetchSites();

        return () => {
            active = false;
        };
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoadingData(true);
            setError(null);

            const selectedPeriodParams = {
                ...(siteId
                    ? { site_id: siteId }
                    : {}),
                period_year: year,
                period_month: month,
            };

            const trendParams = {
                ...(siteId
                    ? { site_id: siteId }
                    : {}),
                period_year: year,
            };

            const [
                selectedPeriodResponse,
                trendResponse,
            ] = await Promise.all([
                getKpiSummary(
                    selectedPeriodParams
                ),
                getKpiSummary(trendParams),
            ]);

            const selectedRows = extractRows(
                selectedPeriodResponse
            );

            const yearlyRows = extractRows(
                trendResponse
            );

            setKpiRows(selectedRows);
            setTrendRows(yearlyRows);
        } catch (err) {
            console.error(
                'Gagal memuat data Lead Time Supply:',
                err
            );

            setKpiRows([]);
            setTrendRows([]);
            setError(
                err.response?.data?.message ||
                'Gagal memuat data Lead Time Supply'
            );
        } finally {
            setLoadingData(false);
        }
    }, [siteId, month, year]);

    useEffect(() => {
        setCurrentPage(1);
        fetchData();
    }, [fetchData]);

    const safeKpiRows = Array.isArray(kpiRows)
        ? kpiRows
        : [];

    const safeTrendRows = Array.isArray(trendRows)
        ? trendRows
        : [];

    const rowsWithActual = safeKpiRows.filter(
        (row) =>
            row.leadtime_actual !== null &&
            row.leadtime_actual !== undefined
    );

    const rowsWithTarget = safeKpiRows.filter(
        (row) =>
            row.leadtime_target !== null &&
            row.leadtime_target !== undefined
    );

    const avgActual = safeAvg(
        rowsWithActual.map(
            (row) => row.leadtime_actual
        )
    );

    const avgTarget = safeAvg(
        rowsWithTarget.map(
            (row) => row.leadtime_target
        )
    );

    const ltTrendData = useMemo(
        () => buildLtTrend(safeTrendRows),
        [safeTrendRows]
    );

    const ltPerSiteData = useMemo(
        () => buildLtPerSite(safeKpiRows),
        [safeKpiRows]
    );

    const siteMeetTarget =
        safeKpiRows.filter(
            (row) =>
                row.leadtime_actual !== null &&
                row.leadtime_actual !== undefined &&
                row.leadtime_target !== null &&
                row.leadtime_target !== undefined &&
                Number(row.leadtime_actual) >=
                Number(row.leadtime_target)
        ).length;

    const totalSiteWithData =
        safeKpiRows.filter(
            (row) =>
                row.leadtime_actual !== null &&
                row.leadtime_actual !== undefined
        ).length;

    const siteNotMeetTarget = Math.max(
        totalSiteWithData - siteMeetTarget,
        0
    );

    const totalPages = Math.max(
        1,
        Math.ceil(
            safeKpiRows.length /
            ROWS_PER_PAGE
        )
    );

    const startIndex =
        (currentPage - 1) *
        ROWS_PER_PAGE;

    const endIndex =
        startIndex + ROWS_PER_PAGE;

    const paginatedRows =
        safeKpiRows.slice(
            startIndex,
            endIndex
        );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4
                        className="fw-bold mb-0"
                        style={{
                            color: 'var(--text-primary)',
                        }}
                    >
                        Detail Lead Time Supply
                    </h4>

                    <p
                        className="text-secondary mb-0"
                        style={{
                            fontSize: '0.875rem',
                        }}
                    >
                        Analisis ketepatan waktu lead
                        time supply — aktual vs target
                        per site dan periode.
                    </p>
                </div>

                {loadingData && (
                    <div
                        className="d-flex align-items-center gap-2 text-secondary"
                        style={{
                            fontSize: '0.8rem',
                        }}
                    >
                        <div
                            className="spinner-border spinner-border-sm text-primary-custom"
                            role="status"
                        />
                        <span>Memuat data…</span>
                    </div>
                )}
            </div>

            {error && (
                <div
                    className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3"
                    role="alert"
                >
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span>{error}</span>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-auto"
                        onClick={() => {
                            setError(null);
                            fetchData();
                        }}
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            <FilterBar
                sites={
                    loadingSites ? [] : sites
                }
                siteId={siteId}
                month={month}
                year={year}
                onSiteChange={setSiteId}
                onMonthChange={setMonth}
                onYearChange={setYear}
                showSiteFilter={true}
            />

            <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-clock-history"
                        label="LT Supply Aktual"
                        value={
                            loadingData
                                ? null
                                : formatPercent(
                                    avgActual
                                )
                        }
                        loading={loadingData}
                        variant={
                            avgActual !== null &&
                                avgTarget !== null &&
                                avgActual >= avgTarget
                                ? 'success'
                                : 'danger'
                        }
                    />
                </div>

                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-bullseye"
                        label="Target LT Supply"
                        value={
                            loadingData
                                ? null
                                : formatPercent(
                                    avgTarget
                                )
                        }
                        loading={loadingData}
                        variant="primary"
                    />
                </div>

                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-check-circle"
                        label="Site Memenuhi Target"
                        value={
                            loadingData
                                ? null
                                : siteMeetTarget
                        }
                        suffix={`/ ${totalSiteWithData}`}
                        loading={loadingData}
                        variant="success"
                    />
                </div>

                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-x-circle"
                        label="Site Belum Memenuhi"
                        value={
                            loadingData
                                ? null
                                : siteNotMeetTarget
                        }
                        suffix={`/ ${totalSiteWithData}`}
                        loading={loadingData}
                        variant="warning"
                    />
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                    <GaugeCard
                        title="Lead Time Supply Rata-rata"
                        value={avgActual}
                        target={avgTarget}
                        loading={loadingData}
                    />
                </div>

                <div className="col-12 col-md-8">
                    <ChartCard
                        title="Perbandingan LT Supply Aktual vs Target per Site (%)"
                        type="bar"
                        data={ltPerSiteData}
                        xKey="site"
                        series={[
                            {
                                key: 'Aktual (%)',
                                label: 'Aktual',
                                color: '#1a56db',
                            },
                            {
                                key: 'Target (%)',
                                label: 'Target',
                                color: '#16a34a',
                            },
                        ]}
                        loading={loadingData}
                        height={200}
                    />
                </div>
            </div>

            <div className="mb-3">
                <ChartCard
                    title="Tren Lead Time Supply per Bulan (%)"
                    type="line"
                    data={ltTrendData}
                    xKey="month"
                    series={[
                        {
                            key: 'Aktual (%)',
                            label: 'Aktual',
                            color: '#1a56db',
                        },
                        {
                            key: 'Target (%)',
                            label: 'Target',
                            color: '#16a34a',
                        },
                    ]}
                    loading={loadingData}
                    height={260}
                />
            </div>

            <div className="app-card p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <div
                            className="fw-semibold d-flex align-items-center gap-2"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                        >
                            <i className="bi bi-table text-primary-custom" />
                            Detail Data Lead Time Supply
                        </div>

                        <div className="small text-secondary mt-1">
                            Menampilkan{' '}
                            {safeKpiRows.length === 0
                                ? 0
                                : startIndex + 1}
                            {' - '}
                            {Math.min(
                                endIndex,
                                safeKpiRows.length
                            )}
                            {' dari '}
                            {safeKpiRows.length} data
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={fetchData}
                        disabled={loadingData}
                    >
                        {loadingData ? (
                            <span className="spinner-border spinner-border-sm me-2" />
                        ) : (
                            <i className="bi bi-arrow-clockwise me-2" />
                        )}
                        Refresh
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                        <thead>
                            <tr
                                className="text-secondary"
                                style={{
                                    fontSize: '0.8rem',
                                }}
                            >
                                <th>Site</th>
                                <th className="text-center">
                                    Bulan
                                </th>
                                <th className="text-center">
                                    Tahun
                                </th>
                                <th className="text-center">
                                    Aktual
                                </th>
                                <th className="text-center">
                                    Target
                                </th>
                                <th className="text-center">
                                    Gap
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center py-4"
                                    >
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : paginatedRows.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center text-muted py-4"
                                    >
                                        Tidak ada data lead
                                        time supply untuk
                                        filter yang dipilih
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map(
                                    (row) => {
                                        const gap =
                                            formatGap(
                                                row.leadtime_actual,
                                                row.leadtime_target
                                            );

                                        const actualValue =
                                            row.leadtime_actual;

                                        const targetValue =
                                            row.leadtime_target;

                                        const meetsTarget =
                                            actualValue !==
                                            null &&
                                            actualValue !==
                                            undefined &&
                                            targetValue !==
                                            null &&
                                            targetValue !==
                                            undefined &&
                                            Number(
                                                actualValue
                                            ) >=
                                            Number(
                                                targetValue
                                            );

                                        const actualColor =
                                            meetsTarget
                                                ? '#16a34a'
                                                : '#dc2626';

                                        return (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                <td>
                                                    {row.site_code ??
                                                        '-'}
                                                </td>

                                                <td className="text-center">
                                                    {getMonthLabel(
                                                        row.period_month
                                                    )}
                                                </td>

                                                <td className="text-center">
                                                    {row.period_year ??
                                                        '-'}
                                                </td>

                                                <td className="text-center">
                                                    {actualValue ===
                                                        null ||
                                                        actualValue ===
                                                        undefined ? (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="badge rounded-pill"
                                                            style={{
                                                                backgroundColor: `${actualColor}1A`,
                                                                color: actualColor,
                                                            }}
                                                        >
                                                            {(
                                                                Number(
                                                                    actualValue
                                                                ) *
                                                                100
                                                            ).toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="text-center">
                                                    {formatPercent(
                                                        targetValue
                                                    )}
                                                </td>

                                                <td className="text-center">
                                                    {gap.positive ===
                                                        null ? (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                color: gap.positive
                                                                    ? '#16a34a'
                                                                    : '#dc2626',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {
                                                                gap.text
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>

                    {!loadingData &&
                        safeKpiRows.length > 0 && (
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                                <small className="text-secondary">
                                    Halaman{' '}
                                    {currentPage} dari{' '}
                                    {totalPages}
                                </small>

                                <nav aria-label="Pagination Detail Lead Time Supply">
                                    <ul className="pagination pagination-sm mb-0">
                                        <li
                                            className={`page-item ${currentPage ===
                                                1
                                                ? 'disabled'
                                                : ''
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                className="page-link"
                                                onClick={() =>
                                                    setCurrentPage(
                                                        (
                                                            page
                                                        ) =>
                                                            Math.max(
                                                                1,
                                                                page -
                                                                1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    1
                                                }
                                            >
                                                <i className="bi bi-chevron-left" />
                                            </button>
                                        </li>

                                        {Array.from(
                                            {
                                                length: totalPages,
                                            },
                                            (
                                                _,
                                                index
                                            ) =>
                                                index +
                                                1
                                        ).map(
                                            (
                                                pageNumber
                                            ) => (
                                                <li
                                                    key={
                                                        pageNumber
                                                    }
                                                    className={`page-item ${currentPage ===
                                                        pageNumber
                                                        ? 'active'
                                                        : ''
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="page-link"
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                pageNumber
                                                            )
                                                        }
                                                    >
                                                        {
                                                            pageNumber
                                                        }
                                                    </button>
                                                </li>
                                            )
                                        )}

                                        <li
                                            className={`page-item ${currentPage ===
                                                totalPages
                                                ? 'disabled'
                                                : ''
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                className="page-link"
                                                onClick={() =>
                                                    setCurrentPage(
                                                        (
                                                            page
                                                        ) =>
                                                            Math.min(
                                                                totalPages,
                                                                page +
                                                                1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    totalPages
                                                }
                                            >
                                                <i className="bi bi-chevron-right" />
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

export default DetailLTSupply;
