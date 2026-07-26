import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getUnitPerformance } from '../../api/unitPerformance.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

import { aggregatePerfByMonth, countUnits, safeAvg } from '../../utils/aggregate';
import { formatNumber } from '../../utils/kpiStatus';

const NOW = new Date();

function DataUnit() {
    const [siteId, setSiteId] = useState('');
    const [month, setMonth] = useState(NOW.getMonth() + 1);
    const [year, setYear] = useState(NOW.getFullYear());

    const [sites, setSites] = useState([]);
    const [perfRows, setPerfRows] = useState([]);

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // Fetch sites sekali
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((d) => setSites(d ?? []))
            .catch(() => setError('Gagal memuat daftar site'))
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
        getUnitPerformance(params)
            .then((d) => setPerfRows(d ?? []))
            .catch(() => { setPerfRows([]); setError('Gagal memuat data performa unit'); })
            .finally(() => setLoadingData(false));
    }, [siteId, month, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Derived
    const totalUnits = countUnits(perfRows);
    const avgPA = safeAvg(perfRows.map((r) => r.physical_availability));
    const avgUA = safeAvg(perfRows.map((r) => r.unit_availability));
    const avgMTBF = safeAvg(perfRows.map((r) => r.mtbf));
    const avgMTTR = safeAvg(perfRows.map((r) => r.mttr));

    // Chart: Rata-rata PA/UA per bulan
    const availTrend = aggregatePerfByMonth(perfRows).map((p) => ({
        month: p.month,
        'PA (%)': p.physical_availability !== null ? parseFloat((p.physical_availability * 100).toFixed(1)) : null,
        'UA (%)': p.unit_availability !== null ? parseFloat((p.unit_availability * 100).toFixed(1)) : null,
    }));

    // Chart: Produktivitas & Fuel per bulan
    const prodFuelTrend = aggregatePerfByMonth(perfRows).map((p) => ({
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
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--color-text-primary)' }}>
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
            <DataTable
                title={`Detail Performa Unit — ${totalUnits} unit · Rata-rata UA: ${avgUA !== null ? (avgUA * 100).toFixed(1) + '%' : '-'}`}
                columns={columns}
                data={perfRows}
                loading={loadingData}
                emptyMessage="Tidak ada data performa unit untuk filter yang dipilih"
                rowKey="id"
            />
        </div>
    );
}

export default DataUnit;