import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getUnitPerformances } from '../../api/unitPerformance.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import ChartCard from '../../components/common/ChartCard';

import { aggregatePerfByMonth, countUnits, safeAvg } from '../../utils/aggregate';
import { formatNumber } from '../../utils/kpiStatus';
import { dummySites, dummyUnitPerformances } from '../../data/dummyData';

const NOW = new Date();

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

function DataUnit() {
    const [siteId, setSiteId] = useState('');
    const [month, setMonth] = useState(NOW.getMonth() + 1);
    const [year, setYear] = useState(NOW.getFullYear());

    const [sites, setSites] = useState([]);
    const [perfRows, setPerfRows] = useState([]);

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [dataSource, setDataSource] = useState('database');

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    // Fetch sites sekali
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((response) => setSites(extractRows(response)))
            .catch((err) => {
                console.warn(
                    'Backend tidak aktif. Menggunakan dummy sites:',
                    err
                );
                setSites(dummySites);
            })
            .finally(() => setLoadingSites(false));
    }, []);

    // Fetch unit performance
    const fetchData = useCallback(() => {
        setError(null);
        setLoadingData(true);
        const params = {
            ...(siteId ? { site_id: siteId } : {}),
            period_year: year,
            period_month: month,
        };
        getUnitPerformances(params)
            .then((response) => {
                setPerfRows(extractRows(response));
                setDataSource('database');
            })
            .catch((err) => {
                console.warn(
                    'Backend tidak aktif. Menggunakan data dummy unit:',
                    err
                );

                const filteredDummy = dummyUnitPerformances.filter(
                    (row) => {
                        const matchSite =
                            !siteId ||
                            String(row.site_id) === String(siteId);

                        const matchMonth =
                            Number(row.period_month) === Number(month);

                        const matchYear =
                            Number(row.period_year) === Number(year);

                        return matchSite && matchMonth && matchYear;
                    }
                );

                setPerfRows(filteredDummy);
                setDataSource('dummy');
            })
            .finally(() => setLoadingData(false));
    }, [siteId, month, year]);

    useEffect(() => {
        setCurrentPage(1);
        fetchData();
    }, [fetchData]);

    // Derived
    const safePerfRows = Array.isArray(perfRows) ? perfRows : [];

    const totalPages = Math.max(
        1,
        Math.ceil(safePerfRows.length / rowsPerPage)
    );

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const paginatedRows = safePerfRows.slice(
        startIndex,
        endIndex
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const totalUnits = countUnits(safePerfRows);
    const avgPA = safeAvg(
        safePerfRows.map((r) => r.physical_availability)
    );
    const avgUA = safeAvg(
        safePerfRows.map((r) => r.unit_availability)
    );
    const avgMTBF = safeAvg(
        safePerfRows.map((r) => r.mtbf)
    );
    const avgMTTR = safeAvg(
        safePerfRows.map((r) => r.mttr)
    );

    // Chart: Rata-rata PA/UA per bulan
    const availTrend = aggregatePerfByMonth(safePerfRows).map((p) => ({
        month: p.month,
        'PA (%)': p.physical_availability !== null ? parseFloat((p.physical_availability * 100).toFixed(1)) : null,
        'UA (%)': p.unit_availability !== null ? parseFloat((p.unit_availability * 100).toFixed(1)) : null,
    }));

    // Chart: Produktivitas & Fuel per bulan
    const prodFuelTrend = aggregatePerfByMonth(safePerfRows).map((p) => ({
        month: p.month,
        Produktivitas: p.productivity !== null ? parseFloat(p.productivity.toFixed(1)) : null,
        'Fuel (L)': p.fuel_consumption !== null ? parseFloat(p.fuel_consumption.toFixed(0)) : null,
    }));

    // Kolom tabel
    const columns = [
        { key: 'site_code', label: 'Site', align: 'left' },
        { key: 'model_name', label: 'Model Unit', align: 'left' },
        {
            key: 'physical_availability',
            label: 'PA (%)',
            align: 'center',
            render: (row) => {
                const v = row.physical_availability;
                if (v === null || v === undefined) return <span className="text-muted">-</span>;
                const pct = (v * 100).toFixed(1);
                const color = v >= 0.98 ? '#16a34a' : v >= 0.95 ? '#d97706' : '#dc2626';
                return (
                    <span className="badge rounded-pill" style={{ backgroundColor: `${color}1A`, color }}>
                        {pct}%
                    </span>
                );
            },
        },
        {
            key: 'unit_availability',
            label: 'UA (%)',
            align: 'center',
            render: (row) => {
                const v = row.unit_availability;
                if (v === null || v === undefined) return <span className="text-muted">-</span>;
                const pct = (v * 100).toFixed(1);
                const color = v >= 0.98 ? '#16a34a' : v >= 0.95 ? '#d97706' : '#dc2626';
                return (
                    <span className="badge rounded-pill" style={{ backgroundColor: `${color}1A`, color }}>
                        {pct}%
                    </span>
                );
            },
        },
        { key: 'mtbf', label: 'MTBF (jam)', align: 'right', render: (r) => formatNumber(r.mtbf) },
        { key: 'mttr', label: 'MTTR (jam)', align: 'right', render: (r) => formatNumber(r.mttr) },
        { key: 'productivity', label: 'Produktivitas', align: 'right', render: (r) => formatNumber(r.productivity) },
        { key: 'fuel_consumption', label: 'Fuel (L)', align: 'right', render: (r) => formatNumber(r.fuel_consumption, 0) },
        {
            key: 'period_month',
            label: 'Periode',
            align: 'center',
            render: (r) => `${r.period_month}/${r.period_year}`,
        },
    ];

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                        Data Unit
                    </h4>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                        Data performa seluruh unit — PA, UA, MTBF, MTTR, produktivitas, dan fuel.
                    </p>
                </div>
                {loadingData && (
                    <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.8rem' }}>
                        <div className="spinner-border spinner-border-sm text-primary-custom" role="status" />
                        <span>Memuat data…</span>
                    </div>
                )}
            </div>

            {/* ── Error Banner ─────────────────────────────────────────── */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span>{error}</span>
                    <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => { setError(null); fetchData(); }}>
                        Coba lagi
                    </button>
                </div>
            )}

            {dataSource === 'dummy' && (
                <div
                    className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3"
                    role="alert"
                >
                    <i className="bi bi-database-exclamation" />
                    <span>
                        Backend atau database tidak terhubung. Halaman sedang menampilkan data dummy.
                    </span>
                </div>
            )}

            {/* ── Filter ───────────────────────────────────────────────── */}
            <FilterBar
                sites={loadingSites ? [] : sites}
                siteId={siteId}
                month={month}
                year={year}
                onSiteChange={setSiteId}
                onMonthChange={setMonth}
                onYearChange={setYear}
                showSiteFilter={true}
            />

            {/* ── KPI Cards ────────────────────────────────────────────── */}
            <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-truck"
                        label="Jumlah Unit"
                        value={loadingData ? null : totalUnits}
                        loading={loadingData}
                        variant="primary"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-activity"
                        label="Rata-rata PA"
                        value={loadingData ? null : (avgPA !== null ? `${(avgPA * 100).toFixed(1)}%` : '-')}
                        loading={loadingData}
                        variant="success"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-bar-chart-line"
                        label="Rata-rata MTBF"
                        value={loadingData ? null : formatNumber(avgMTBF)}
                        suffix="jam"
                        loading={loadingData}
                        variant="secondary"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-tools"
                        label="Rata-rata MTTR"
                        value={loadingData ? null : formatNumber(avgMTTR)}
                        suffix="jam"
                        loading={loadingData}
                        variant="warning"
                    />
                </div>
            </div>

            {/* ── Charts ───────────────────────────────────────────────── */}
            <div className="row g-3 mb-3">
                <div className="col-12 col-lg-6">
                    <ChartCard
                        title="Tren Physical & Unit Availability (%)"
                        type="line"
                        data={availTrend}
                        xKey="month"
                        series={[
                            { key: 'PA (%)', label: 'Physical Availability', color: '#1a56db' },
                            { key: 'UA (%)', label: 'Unit Availability', color: '#16a34a' },
                        ]}
                        loading={loadingData}
                        height={260}
                    />
                </div>
                <div className="col-12 col-lg-6">
                    <ChartCard
                        title="Produktivitas & Konsumsi Fuel"
                        type="bar"
                        data={prodFuelTrend}
                        xKey="month"
                        series={[
                            { key: 'Produktivitas', label: 'Produktivitas', color: '#d97706' },
                            { key: 'Fuel (L)', label: 'Fuel (L)', color: '#dc2626' },
                        ]}
                        loading={loadingData}
                        height={260}
                    />
                </div>
            </div>

            {/* ── Tabel Data Unit ──────────────────────────────────────── */}
            <div className="app-card p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-3">
                    <div>
                        <div
                            className="fw-semibold d-flex align-items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <i className="bi bi-table text-primary-custom" />
                            Detail Performa Unit
                        </div>

                        <div className="small text-secondary mt-1">
                            {totalUnits} unit · Rata-rata UA:{' '}
                            {avgUA !== null
                                ? `${(avgUA * 100).toFixed(1)}%`
                                : '-'}
                        </div>
                    </div>

                    <div className="small text-secondary">
                        Menampilkan{' '}
                        {safePerfRows.length === 0
                            ? 0
                            : startIndex + 1}
                        {' - '}
                        {Math.min(endIndex, safePerfRows.length)}
                        {' dari '}
                        {safePerfRows.length} data
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                        <thead>
                            <tr
                                className="text-secondary"
                                style={{ fontSize: '0.8rem' }}
                            >
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={
                                            column.align === 'center'
                                                ? 'text-center'
                                                : column.align === 'right'
                                                    ? 'text-end'
                                                    : ''
                                        }
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center py-4"
                                    >
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Memuat data performa unit...
                                    </td>
                                </tr>
                            ) : paginatedRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center text-muted py-4"
                                    >
                                        Tidak ada data performa unit untuk filter yang dipilih
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row) => (
                                    <tr key={row.id}>
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={
                                                    column.align === 'center'
                                                        ? 'text-center'
                                                        : column.align === 'right'
                                                            ? 'text-end'
                                                            : ''
                                                }
                                            >
                                                {column.render
                                                    ? column.render(row)
                                                    : row[column.key] ?? '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingData && safePerfRows.length > 0 && (
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                        <small className="text-secondary">
                            Halaman {currentPage} dari {totalPages}
                        </small>

                        <nav aria-label="Pagination Data Unit">
                            <ul className="pagination pagination-sm mb-0">
                                <li
                                    className={`page-item ${currentPage === 1
                                        ? 'disabled'
                                        : ''
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.max(1, page - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        aria-label="Halaman sebelumnya"
                                    >
                                        <i className="bi bi-chevron-left" />
                                    </button>
                                </li>

                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((pageNumber) => (
                                    <li
                                        key={pageNumber}
                                        className={`page-item ${currentPage === pageNumber
                                            ? 'active'
                                            : ''
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() =>
                                                setCurrentPage(pageNumber)
                                            }
                                        >
                                            {pageNumber}
                                        </button>
                                    </li>
                                ))}

                                <li
                                    className={`page-item ${currentPage === totalPages
                                        ? 'disabled'
                                        : ''
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.min(
                                                    totalPages,
                                                    page + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            currentPage === totalPages
                                        }
                                        aria-label="Halaman berikutnya"
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
    );
}

export default DataUnit;