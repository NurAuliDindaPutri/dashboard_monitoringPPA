import { useEffect, useState, useCallback } from 'react';

// ── API layer ───────────────────────────────────────────────────────────────
import { getSites } from '../../api/site.api';
import { getKpiSummary } from '../../api/kpiSummary.api';
import { getUnitPerformance } from '../../api/unitPerformance.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

// ── Komponen reusable ───────────────────────────────────────────────────────
import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

// ── Utils ───────────────────────────────────────────────────────────────────
import {
    aggregateKpiSummary,
    aggregatePerfByUnit,
    countUnits,
    countPendingSupply,
    sumPendingQty,
    buildKpiSummaryPerSite,
    buildUnitPerformanceByModel,
} from '../../utils/aggregate';
import { formatNumber } from '../../utils/kpiStatus';

// ── Inisialisasi filter default ─────────────────────────────────────────────
const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = NOW.getMonth() + 1; // 1-12

/**
 * Komponen Ring/Donut sederhana untuk visualisasi Ringkasan KPI per Site
 */
function DonutRing({ label, actual, target, isGood }) {
    const hasData = actual !== null && actual !== undefined;
    const pct = hasData ? Math.round(actual * 100) : 0;
    const targetPct = target !== null && target !== undefined ? Math.round(target * 100) : null;

    // Warna: Hijau jika memenuhi target, Oranye/Merah jika belum
    const color = !hasData ? '#cbd5e1' : isGood ? '#16a34a' : '#dc2626';
    const bgStroke = 'var(--color-border, #e2e8f0)';

    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(Math.max(pct, 0), 100) / 100) * circumference;

    return (
        <div
            className="d-flex flex-column align-items-center text-center p-2 rounded flex-fill"
            style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                minWidth: 120,
            }}
        >
            <div
                className="position-relative d-inline-flex align-items-center justify-content-center mb-1"
                style={{ width: 72, height: 72 }}
            >
                <svg width="72" height="72" viewBox="0 0 76 76">
                    <circle cx="38" cy="38" r={radius} fill="transparent" stroke={bgStroke} strokeWidth="7" />
                    {hasData && (
                        <circle
                            cx="38"
                            cy="38"
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth="7"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 38 38)"
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                    )}
                </svg>
                <div className="position-absolute text-center">
                    <span className="fw-bold" style={{ fontSize: '0.85rem', color: hasData ? color : 'var(--color-text-muted)' }}>
                        {hasData ? `${(actual * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                </div>
            </div>
            <span className="fw-semibold small mb-0 text-truncate w-100" style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)' }}>
                {label}
            </span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                {targetPct !== null ? `Target: ${targetPct}%` : '-'}
            </span>
            <span
                className="badge rounded-pill mt-1"
                style={{
                    fontSize: '0.65rem',
                    backgroundColor: `${color}1A`,
                    color,
                }}
            >
                {isGood ? 'Memenuhi' : 'Belum Target'}
            </span>
        </div>
    );
}

// ===========================================================================
// Komponen utama DashboardAllSite
// ===========================================================================
function DashboardAllSite() {
    // ── State filter ──────────────────────────────────────────────────────
    const [siteId, setSiteId] = useState('');         // '' = semua site
    const [month, setMonth] = useState(DEFAULT_MONTH);
    const [year, setYear] = useState(DEFAULT_YEAR);
    const [selectedModelFilter, setSelectedModelFilter] = useState('ALL');

    // ── State data ────────────────────────────────────────────────────────
    const [sites, setSites] = useState([]);
    const [kpiRows, setKpiRows] = useState([]);
    const [perfRows, setPerfRows] = useState([]);
    const [supplyRows, setSupplyRows] = useState([]);

    // ── State loading per endpoint ────────────────────────────────────────
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingKpi, setLoadingKpi] = useState(true);
    const [loadingPerf, setLoadingPerf] = useState(true);
    const [loadingSupply, setLoadingSupply] = useState(true);

    // ── State error ───────────────────────────────────────────────────────
    const [error, setError] = useState(null);

    // ── Fetch sites sekali saat mount ─────────────────────────────────────
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((data) => setSites(data ?? []))
            .catch(() => setError('Gagal memuat daftar site'))
            .finally(() => setLoadingSites(false));
    }, []);

    // ── Fetch data yang tergantung filter ─────────────────────────────────
    const fetchDashboardData = useCallback(() => {
        const params = {
            ...(siteId ? { site_id: siteId } : {}),
            period_year: year,
            period_month: month,
        };

        // KPI Summary
        setLoadingKpi(true);
        getKpiSummary(params)
            .then((data) => setKpiRows(data ?? []))
            .catch(() => setKpiRows([]))
            .finally(() => setLoadingKpi(false));

        // Unit Performance
        setLoadingPerf(true);
        getUnitPerformance(params)
            .then((data) => setPerfRows(data ?? []))
            .catch(() => setPerfRows([]))
            .finally(() => setLoadingPerf(false));

        // Pending Supply
        setLoadingSupply(true);
        getPendingSupply(siteId ? { site_id: siteId } : {})
            .then((data) => setSupplyRows(data ?? []))
            .catch(() => setSupplyRows([]))
            .finally(() => setLoadingSupply(false));
    }, [siteId, month, year]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ── Derived data ──────────────────────────────────────────────────────
    const kpiSummary = aggregateKpiSummary(kpiRows);
    const siteKpiSummaryList = buildKpiSummaryPerSite(kpiRows);
    const unitPerfByModel = buildUnitPerformanceByModel(perfRows);

    const unitRows = aggregatePerfByUnit(perfRows);
    const totalUnits = countUnits(perfRows);
    const totalPending = countPendingSupply(supplyRows);
    const totalPendingQty = sumPendingQty(supplyRows);

    const availableModels = ['ALL', ...unitPerfByModel.map((m) => m.model_name)];
    const filteredModels = selectedModelFilter === 'ALL'
        ? unitPerfByModel
        : unitPerfByModel.filter((m) => m.model_name === selectedModelFilter);

    // ── Definisi kolom tabel unit performance ─────────────────────────────
    const unitColumns = [
        { key: 'site_code', label: 'Site', align: 'left' },
        { key: 'model_name', label: 'Model Unit', align: 'left' },
        {
            key: 'physical_availability',
            label: 'PA (%)',
            align: 'center',
            render: (row) => {
                const val = row.physical_availability;
                if (val === null || val === undefined) return <span className="text-muted">-</span>;
                const pct = (val * 100).toFixed(1);
                const color = val >= 0.98 ? '#16a34a' : val >= 0.95 ? '#d97706' : '#dc2626';
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
                const val = row.unit_availability;
                if (val === null || val === undefined) return <span className="text-muted">-</span>;
                const pct = (val * 100).toFixed(1);
                const color = val >= 0.98 ? '#16a34a' : val >= 0.95 ? '#d97706' : '#dc2626';
                return (
                    <span className="badge rounded-pill" style={{ backgroundColor: `${color}1A`, color }}>
                        {pct}%
                    </span>
                );
            },
        },
        {
            key: 'mtbf',
            label: 'MTBF (jam)',
            align: 'right',
            render: (row) => formatNumber(row.mtbf),
        },
        {
            key: 'mttr',
            label: 'MTTR (jam)',
            align: 'right',
            render: (row) => formatNumber(row.mttr),
        },
        {
            key: 'productivity',
            label: 'Produktivitas',
            align: 'right',
            render: (row) => formatNumber(row.productivity),
        },
        {
            key: 'fuel_consumption',
            label: 'Fuel (L)',
            align: 'right',
            render: (row) => formatNumber(row.fuel_consumption, 0),
        },
    ];

    // ── Definisi kolom tabel pending supply ───────────────────────────────
    const supplyColumns = [
        { key: 'site_code', label: 'Site', align: 'left' },
        { key: 'parts_number', label: 'Part No.', align: 'left' },
        { key: 'description', label: 'Deskripsi', align: 'left' },
        { key: 'qty', label: 'Qty', align: 'center' },
        { key: 'no_po', label: 'No. PO', align: 'left' },
        {
            key: 'eta',
            label: 'ETA',
            align: 'center',
            render: (row) =>
                row.eta
                    ? new Date(row.eta).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                    : '-',
        },
        { key: 'remarks', label: 'Keterangan', align: 'left' },
    ];

    const isLoadingAll = loadingKpi || loadingPerf || loadingSupply;

    return (
        <div>
            {/* ── 1. Bagian Atas: Judul & Filter ───────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--color-text-primary)' }}>
                        Dashboard All Site
                    </h4>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                        Monitoring performa site, ringkasan KPI, dan ketersediaan unit per model.
                    </p>
                </div>
                {isLoadingAll && (
                    <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.8rem' }}>
                        <div className="spinner-border spinner-border-sm text-primary-custom" role="status" />
                        <span>Memuat data…</span>
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span>{error}</span>
                    <button
                        className="btn btn-sm btn-outline-danger ms-auto"
                        onClick={() => { setError(null); fetchDashboardData(); }}
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Filter Bar (Site, Month, Year) */}
            <FilterBar
                sites={loadingSites ? [] : sites}
                siteId={siteId}
                month={month}
                year={year}
                onSiteChange={setSiteId}
                onMonthChange={setMonth}
                onYearChange={setYear}
                showSiteFilter={true}
                showMonthFilter={true}
                showYearFilter={true}
            />

            {/* ── 2. KPI Utama: Gauges ───────────────────────────────────── */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <GaugeCard
                        title="Readiness All Site"
                        value={kpiSummary.readyness_actual}
                        target={kpiSummary.readyness_target}
                        loading={loadingKpi}
                    />
                </div>
                <div className="col-12 col-md-4">
                    <GaugeCard
                        title="Availability VHS All Site"
                        value={kpiSummary.availability_actual}
                        target={kpiSummary.availability_target}
                        loading={loadingKpi}
                    />
                </div>
                <div className="col-12 col-md-4">
                    <GaugeCard
                        title="Lead Time Supply All Site"
                        value={kpiSummary.leadtime_actual}
                        target={kpiSummary.leadtime_target}
                        loading={loadingKpi}
                    />
                </div>
            </div>

            {/* ── 3. Ringkasan KPI Per Site ──────────────────────────────── */}
            <div className="app-card p-3 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h6 className="fw-semibold mb-0" style={{ color: 'var(--color-text-primary)' }}>
                            Ringkasan KPI Per Site
                        </h6>
                        <small className="text-secondary">
                            Status pencapaian Readiness, Availability VHS &amp; Lead Time Supply per site pada periode terpilih
                        </small>
                    </div>
                </div>

                {loadingKpi ? (
                    <div className="placeholder-glow row g-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="col-12 col-md-4">
                                <span className="placeholder w-100 rounded" style={{ height: 160 }} />
                            </div>
                        ))}
                    </div>
                ) : siteKpiSummaryList.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-slash-circle fs-3" />
                        <p className="mb-0 mt-2">Tidak ada data KPI per site untuk periode terpilih</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {siteKpiSummaryList.map((siteItem) => (
                            <div key={siteItem.site_id} className="col-12 col-md-6 col-xl-4">
                                <div className="p-3 border rounded h-100" style={{ backgroundColor: 'var(--color-surface, #fff)' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                                            {siteItem.site_code}
                                        </span>
                                        <small className="text-muted text-truncate ms-2" style={{ maxWidth: 140 }}>
                                            {siteItem.site_name}
                                        </small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <DonutRing
                                            label="Readiness"
                                            actual={siteItem.readyness_actual}
                                            target={siteItem.readyness_target}
                                            isGood={siteItem.readyness_is_good}
                                        />
                                        <DonutRing
                                            label="Availability"
                                            actual={siteItem.availability_actual}
                                            target={siteItem.availability_target}
                                            isGood={siteItem.availability_is_good}
                                        />
                                        <DonutRing
                                            label="Lead Time"
                                            actual={siteItem.leadtime_actual}
                                            target={siteItem.leadtime_target}
                                            isGood={siteItem.leadtime_is_good}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 4. Bagian Performa Unit Berdasarkan Model Unit ─────────── */}
            <div className="app-card p-3 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                        <h6 className="fw-semibold mb-0" style={{ color: 'var(--color-text-primary)' }}>
                            Performa Unit Per Model
                        </h6>
                        <small className="text-secondary">
                            Metric Physical Availability, MTBF, MTTR, Unit Availability, Productivity &amp; Fuel per model unit (Site = Sumbu X)
                        </small>
                    </div>

                    {/* Filter Tab Model Unit */}
                    {availableModels.length > 1 && (
                        <div className="btn-group btn-group-sm flex-wrap" role="group">
                            {availableModels.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`btn ${selectedModelFilter === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setSelectedModelFilter(m)}
                                >
                                    {m === 'ALL' ? 'Semua Model' : m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loadingPerf ? (
                    <div className="placeholder-glow row g-3">
                        <div className="col-12"><span className="placeholder w-100 rounded" style={{ height: 260 }} /></div>
                    </div>
                ) : filteredModels.length === 0 ? (
                    <div className="text-center py-5 text-muted border rounded">
                        <i className="bi bi-truck fs-1 text-muted" />
                        <p className="mb-0 mt-2">Tidak ada data performa unit untuk periode dan filter terpilih</p>
                    </div>
                ) : (
                    filteredModels.map((modelGroup) => (
                        <div key={modelGroup.model_name} className="mb-4 p-3 border rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <span className="fw-bold fs-6" style={{ color: 'var(--color-text-primary)' }}>
                                    <i className="bi bi-gear-wide-connected me-2 text-primary" />
                                    Model Unit: {modelGroup.model_name}
                                </span>
                                <span className="badge bg-secondary">
                                    {modelGroup.chartData.length} Site Dipantau
                                </span>
                            </div>

                            {/* 6 Metric Charts dalam Grid 2x3 atau Responsive Row */}
                            <div className="row g-3">
                                {/* 1. Physical Availability */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    <ChartCard
                                        title={`Physical Availability (%) — ${modelGroup.model_name}`}
                                        type="bar"
                                        data={modelGroup.chartData}
                                        xKey="site_code"
                                        series={[{ key: 'physical_availability', label: 'PA (%)', color: '#1a56db' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                </div>

                                {/* 2. Unit Availability */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    <ChartCard
                                        title={`Unit Availability (%) — ${modelGroup.model_name}`}
                                        type="bar"
                                        data={modelGroup.chartData}
                                        xKey="site_code"
                                        series={[{ key: 'unit_availability', label: 'UA (%)', color: '#16a34a' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                </div>

                                {/* 3. MTBF */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    <ChartCard
                                        title={`MTBF (jam) — ${modelGroup.model_name}`}
                                        type="bar"
                                        data={modelGroup.chartData}
                                        xKey="site_code"
                                        series={[{ key: 'mtbf', label: 'MTBF (jam)', color: '#d97706' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                </div>

                                {/* 4. MTTR */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    <ChartCard
                                        title={`MTTR (jam) — ${modelGroup.model_name}`}
                                        type="bar"
                                        data={modelGroup.chartData}
                                        xKey="site_code"
                                        series={[{ key: 'mttr', label: 'MTTR (jam)', color: '#dc2626' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                </div>

                                {/* 5. Productivity (Empty State jika NULL) */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    {modelGroup.hasProductivity ? (
                                        <ChartCard
                                            title={`Productivity — ${modelGroup.model_name}`}
                                            type="bar"
                                            data={modelGroup.chartData}
                                            xKey="site_code"
                                            series={[{ key: 'productivity', label: 'Productivity', color: '#0284c7' }]}
                                            loading={loadingPerf}
                                            height={220}
                                        />
                                    ) : (
                                        <div className="app-card p-3 h-100 d-flex flex-column justify-content-between">
                                            <span className="fw-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                                Productivity — {modelGroup.model_name}
                                            </span>
                                            <div className="d-flex flex-column align-items-center justify-content-center text-center my-auto py-3">
                                                <i className="bi bi-inbox fs-2 text-muted mb-1" />
                                                <span className="fw-semibold text-secondary small">Data belum tersedia</span>
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    Productivity bernilai NULL pada periode terpilih
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 6. Fuel Consumption (Empty State jika NULL) */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    {modelGroup.hasFuelConsumption ? (
                                        <ChartCard
                                            title={`Fuel Consumption (L) — ${modelGroup.model_name}`}
                                            type="bar"
                                            data={modelGroup.chartData}
                                            xKey="site_code"
                                            series={[{ key: 'fuel_consumption', label: 'Fuel (L)', color: '#8b5cf6' }]}
                                            loading={loadingPerf}
                                            height={220}
                                        />
                                    ) : (
                                        <div className="app-card p-3 h-100 d-flex flex-column justify-content-between">
                                            <span className="fw-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                                Fuel Consumption — {modelGroup.model_name}
                                            </span>
                                            <div className="d-flex flex-column align-items-center justify-content-center text-center my-auto py-3">
                                                <i className="bi bi-fuel-pump fs-2 text-muted mb-1" />
                                                <span className="fw-semibold text-secondary small">Data belum tersedia</span>
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    Fuel Consumption bernilai NULL pada periode terpilih
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── 5. Ringkasan Tambahan (KPI Cards Operational & Pending Supply) ── */}
            <div className="mb-4">
                <h6 className="fw-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Ringkasan Tambahan Operasional
                </h6>
                <div className="row g-3">
                    <div className="col-6 col-lg-3">
                        <KpiCard
                            icon="bi-building-check"
                            label="Total Site"
                            value={loadingSites ? null : sites.length}
                            loading={loadingSites}
                            variant="primary"
                        />
                    </div>
                    <div className="col-6 col-lg-3">
                        <KpiCard
                            icon="bi-truck"
                            label="Total Unit Dipantau"
                            value={loadingPerf ? null : totalUnits}
                            loading={loadingPerf}
                            variant="success"
                        />
                    </div>
                    <div className="col-6 col-lg-3">
                        <KpiCard
                            icon="bi-hourglass-split"
                            label="Pending Supply"
                            value={loadingSupply ? null : totalPending}
                            suffix="item"
                            loading={loadingSupply}
                            variant="warning"
                        />
                    </div>
                    <div className="col-6 col-lg-3">
                        <KpiCard
                            icon="bi-boxes"
                            label="Total Qty Pending"
                            value={loadingSupply ? null : totalPendingQty}
                            suffix="pcs"
                            loading={loadingSupply}
                            variant="danger"
                        />
                    </div>
                </div>
            </div>

            {/* ── 6. Tabel Detail Performa Unit & Pending Supply ─────────── */}
            <div className="mb-3">
                <DataTable
                    title={`Performa Unit Detail — ${totalUnits} unit terpantau`}
                    columns={unitColumns}
                    data={unitRows}
                    loading={loadingPerf}
                    emptyMessage="Tidak ada data performa unit untuk filter yang dipilih"
                    rowKey="unit_model_id"
                />
            </div>

            <div className="mb-3">
                <DataTable
                    title={`Pending Supply Detail — ${totalPending} item (${totalPendingQty} pcs)`}
                    columns={supplyColumns}
                    data={supplyRows}
                    loading={loadingSupply}
                    emptyMessage="Tidak ada pending supply untuk site yang dipilih"
                    rowKey="id"
                />
            </div>
        </div>
    );
}

export default DashboardAllSite;