import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getKpiSummary } from '../../api/kpiSummary.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

import { MONTHS } from '../../utils/constants';
import { formatPercent } from '../../utils/kpiStatus';
import { safeAvg } from '../../utils/aggregate';

const NOW = new Date();

// ── Fungsi: bangun tren leadtime per bulan dari array kpiRows ────────────────
function buildLtTrend(kpiRows) {
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
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthNum - b.monthNum)
        .map(({ monthNum, rows }) => {
            const label = MONTHS.find((m) => m.value === Number(monthNum))?.label ?? monthNum;
            const actual = safeAvg(rows.map((r) => r.leadtime_actual));
            const target = safeAvg(rows.map((r) => r.leadtime_target));
            return {
                month: label,
                'Aktual (%)': actual !== null ? parseFloat((actual * 100).toFixed(1)) : null,
                'Target (%)': target !== null ? parseFloat((target * 100).toFixed(1)) : null,
            };
        });
}

// ── Fungsi: data per site untuk bar chart ───────────────────────────────────
function buildLtPerSite(kpiRows) {
    if (!kpiRows || kpiRows.length === 0) return [];

    const map = new Map();
    for (const row of kpiRows) {
        const key = row.site_id;
        if (!map.has(key)) {
            map.set(key, { site: row.site_code || `Site ${row.site_id}`, rows: [] });
        }
        map.get(key).rows.push(row);
    }

    return Array.from(map.values()).map(({ site, rows }) => ({
        site,
        'Aktual (%)': safeAvg(rows.map((r) => r.leadtime_actual)) !== null
            ? parseFloat((safeAvg(rows.map((r) => r.leadtime_actual)) * 100).toFixed(1))
            : null,
        'Target (%)': safeAvg(rows.map((r) => r.leadtime_target)) !== null
            ? parseFloat((safeAvg(rows.map((r) => r.leadtime_target)) * 100).toFixed(1))
            : null,
    }));
}

function DetailLTSupply() {
    const [siteId, setSiteId] = useState('');
    const [month, setMonth] = useState(NOW.getMonth() + 1);
    const [year, setYear] = useState(NOW.getFullYear());

    const [sites, setSites] = useState([]);
    const [kpiRows, setKpiRows] = useState([]);

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // Fetch sites
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((d) => setSites(d ?? []))
            .catch(() => setError('Gagal memuat daftar site'))
            .finally(() => setLoadingSites(false));
    }, []);

    // Fetch KPI Summary
    const fetchData = useCallback(() => {
        setError(null);
        setLoadingData(true);
        const params = {
            ...(siteId ? { site_id: siteId } : {}),
            period_year: year,
            period_month: month,
        };
        getKpiSummary(params)
            .then((d) => setKpiRows(d ?? []))
            .catch(() => { setKpiRows([]); setError('Gagal memuat data Lead Time Supply'); })
            .finally(() => setLoadingData(false));
    }, [siteId, month, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Derived
    const avgActual = safeAvg(kpiRows.map((r) => r.leadtime_actual));
    const avgTarget = safeAvg(kpiRows.map((r) => r.leadtime_target));

    const ltTrendData = buildLtTrend(kpiRows);
    const ltPerSiteData = buildLtPerSite(kpiRows);

    // Hitung berapa site yang memenuhi target
    const siteMeetTarget = kpiRows.filter(
        (r) => r.leadtime_actual !== null && r.leadtime_target !== null && r.leadtime_actual >= r.leadtime_target
    ).length;
    const totalSiteWithData = kpiRows.filter((r) => r.leadtime_actual !== null).length;

    // Kolom tabel
    const columns = [
        { key: 'site_code', label: 'Site', align: 'left' },
        {
            key: 'period_month',
            label: 'Bulan',
            align: 'center',
            render: (r) => MONTHS.find((m) => m.value === Number(r.period_month))?.label ?? r.period_month,
        },
        { key: 'period_year', label: 'Tahun', align: 'center' },
        {
            key: 'leadtime_actual',
            label: 'Aktual',
            align: 'center',
            render: (row) => {
                const v = row.leadtime_actual;
                const t = row.leadtime_target;
                if (v === null || v === undefined) return <span className="text-muted">-</span>;
                const meetsTarget = t !== null && v >= t;
                const pct = (v * 100).toFixed(1);
                const color = meetsTarget ? '#16a34a' : v >= (t ?? 0) * 0.95 ? '#d97706' : '#dc2626';
                return (
                    <span className="badge rounded-pill" style={{ backgroundColor: `${color}1A`, color }}>
                        {pct}%
                    </span>
                );
            },
        },
        {
            key: 'leadtime_target',
            label: 'Target',
            align: 'center',
            render: (r) => formatPercent(r.leadtime_target),
        },
        {
            key: 'gap',
            label: 'Gap',
            align: 'center',
            render: (row) => {
                if (row.leadtime_actual === null || row.leadtime_target === null) {
                    return <span className="text-muted">-</span>;
                }
                const gap = ((row.leadtime_actual - row.leadtime_target) * 100).toFixed(1);
                const isPositive = Number(gap) >= 0;
                return (
                    <span style={{ color: isPositive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {isPositive ? '+' : ''}{gap}%
                    </span>
                );
            },
        },
    ];

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                        Detail Lead Time Supply
                    </h4>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                        Analisis ketepatan waktu lead time supply — aktual vs target per site dan periode.
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
                        icon="bi-clock-history"
                        label="LT Supply Aktual"
                        value={loadingData ? null : formatPercent(avgActual)}
                        loading={loadingData}
                        variant={avgActual !== null && avgTarget !== null && avgActual >= avgTarget ? 'success' : 'danger'}
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-bullseye"
                        label="Target LT Supply"
                        value={loadingData ? null : formatPercent(avgTarget)}
                        loading={loadingData}
                        variant="primary"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-check-circle"
                        label="Site Memenuhi Target"
                        value={loadingData ? null : siteMeetTarget}
                        suffix={`/ ${totalSiteWithData}`}
                        loading={loadingData}
                        variant="success"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-x-circle"
                        label="Site Belum Memenuhi"
                        value={loadingData ? null : totalSiteWithData - siteMeetTarget}
                        suffix={`/ ${totalSiteWithData}`}
                        loading={loadingData}
                        variant="warning"
                    />
                </div>
            </div>

            {/* ── Gauge ────────────────────────────────────────────────── */}
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
                            { key: 'Aktual (%)', label: 'Aktual', color: '#1a56db' },
                            { key: 'Target (%)', label: 'Target', color: '#16a34a' },
                        ]}
                        loading={loadingData}
                        height={200}
                    />
                </div>
            </div>

            {/* ── Tren LT Supply ───────────────────────────────────────── */}
            <div className="mb-3">
                <ChartCard
                    title="Tren Lead Time Supply per Bulan (%)"
                    type="line"
                    data={ltTrendData}
                    xKey="month"
                    series={[
                        { key: 'Aktual (%)', label: 'Aktual', color: '#1a56db' },
                        { key: 'Target (%)', label: 'Target', color: '#16a34a' },
                    ]}
                    loading={loadingData}
                    height={260}
                />
            </div>

            {/* ── Tabel Detail ─────────────────────────────────────────── */}
            <DataTable
                title="Detail Data Lead Time Supply"
                columns={columns}
                data={kpiRows}
                loading={loadingData}
                emptyMessage="Tidak ada data lead time supply untuk filter yang dipilih"
                rowKey="id"
            />
        </div>
    );
}

export default DetailLTSupply;