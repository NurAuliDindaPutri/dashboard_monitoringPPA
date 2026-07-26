import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getKpiSummary } from '../../api/kpiSummary.api';
import { getUnitPerformance } from '../../api/unitPerformance.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

import {
    aggregateKpiSummary,
    aggregatePerfByMonth,
    countUnits,
    countPendingSupply,
    sumPendingQty,
} from '../../utils/aggregate';
import { formatPercent, formatNumber } from '../../utils/kpiStatus';

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = NOW.getMonth() + 1;

// ── helper: konversi nilai 0-1 ke persen string untuk chart ─────────────────
function toPct(val) {
    if (val === null || val === undefined) return null;
    return parseFloat((val * 100).toFixed(1));
}

function DashboardPerSite() {
    // ── Filter state — siteId WAJIB dipilih untuk halaman ini ────────────
    const [siteId, setSiteId] = useState('');
    const [month, setMonth] = useState(DEFAULT_MONTH);
    const [year, setYear] = useState(DEFAULT_YEAR);

    // ── Data state ───────────────────────────────────────────────────────
    const [sites, setSites] = useState([]);
    const [kpiRows, setKpiRows] = useState([]);
    const [perfRows, setPerfRows] = useState([]);
    const [supplyRows, setSupplyRows] = useState([]);

    // ── Loading state ────────────────────────────────────────────────────
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingKpi, setLoadingKpi] = useState(false);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [loadingSupply, setLoadingSupply] = useState(false);

    const [error, setError] = useState(null);

    // ── Fetch daftar site ────────────────────────────────────────────────
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((data) => {
                const list = data ?? [];
                setSites(list);
                // Default ke site pertama jika ada
                if (list.length > 0 && !siteId) {
                    setSiteId(String(list[0].id));
                }
            })
            .catch(() => setError('Gagal memuat daftar site'))
            .finally(() => setLoadingSites(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fetch data dashboard (hanya jika site sudah dipilih) ─────────────
    const fetchData = useCallback(() => {
        if (!siteId) return;

        const params = { site_id: siteId, period_year: year, period_month: month };

        setLoadingKpi(true);
        getKpiSummary(params)
            .then((d) => setKpiRows(d ?? []))
            .catch(() => setKpiRows([]))
            .finally(() => setLoadingKpi(false));

        setLoadingPerf(true);
        getUnitPerformance(params)
            .then((d) => setPerfRows(d ?? []))
            .catch(() => setPerfRows([]))
            .finally(() => setLoadingPerf(false));

        setLoadingSupply(true);
        getPendingSupply({ site_id: siteId })
            .then((d) => setSupplyRows(d ?? []))
            .catch(() => setSupplyRows([]))
            .finally(() => setLoadingSupply(false));
    }, [siteId, month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derived ──────────────────────────────────────────────────────────
    const kpiSummary = aggregateKpiSummary(kpiRows);
    const totalUnits = countUnits(perfRows);
    const totalPending = countPendingSupply(supplyRows);
    const totalPendingQty = sumPendingQty(supplyRows);

    // Tren availability per bulan (ambil semua bulan dalam tahun ini, tanpa filter bulan)
    const trendData = aggregatePerfByMonth(perfRows).map((p) => ({
        month: p.month,
        'PA (%)': toPct(p.physical_availability),
        'UA (%)': toPct(p.unit_availability),
    }));

    // MTBF & MTTR bar chart
    const mtbfMttrData = aggregatePerfByMonth(perfRows).map((p) => ({
        month: p.month,
        MTBF: p.mtbf !== null ? parseFloat(p.mtbf.toFixed(1)) : null,
        MTTR: p.mttr !== null ? parseFloat(p.mttr.toFixed(1)) : null,
    }));

    // Info site terpilih
    const selectedSite = sites.find((s) => String(s.id) === String(siteId));

    // ── Kolom tabel unit performance ─────────────────────────────────────
    const perfColumns = [
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
    ];

    // ── Kolom tabel pending supply ────────────────────────────────────────
    const supplyColumns = [
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
                    ? new Date(row.eta).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-',
        },
        { key: 'remarks', label: 'Keterangan', align: 'left' },
    ];

    const isLoading = loadingKpi || loadingPerf || loadingSupply;

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--color-text-primary)' }}>
                        Dashboard Per Site
                    </h4>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                        {selectedSite
                            ? `${selectedSite.site_code}${selectedSite.site_name ? ' — ' + selectedSite.site_name : ''}`
                            : 'Pilih site untuk melihat detail performa'}
                    </p>
                </div>
                {isLoading && (
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
                    <button
                        className="btn btn-sm btn-outline-danger ms-auto"
                        onClick={() => { setError(null); fetchData(); }}
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            {/* ── Filter Bar ───────────────────────────────────────────── */}
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

            {/* ── Prompt jika belum pilih site ─────────────────────────── */}
            {!siteId && !loadingSites && (
                <div className="app-card p-5 text-center mb-3">
                    <i className="bi bi-building fs-1 text-muted" />
                    <p className="text-muted mt-3 mb-0">Pilih site di filter atas untuk menampilkan data performa.</p>
                </div>
            )}

            {siteId && (
                <>
                    {/* ── KPI Cards ────────────────────────────────────── */}
                    <div className="row g-3 mb-3">
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-truck"
                                label="Total Unit"
                                value={loadingPerf ? null : totalUnits}
                                loading={loadingPerf}
                                variant="primary"
                            />
                        </div>
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-activity"
                                label="Readiness Aktual"
                                value={loadingKpi ? null : formatPercent(kpiSummary.readyness_actual)}
                                loading={loadingKpi}
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

                    {/* ── Gauge KPI ────────────────────────────────────── */}
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-4">
                            <GaugeCard
                                title="Readiness"
                                value={kpiSummary.readyness_actual}
                                target={kpiSummary.readyness_target}
                                loading={loadingKpi}
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <GaugeCard
                                title="Availability VHS"
                                value={kpiSummary.availability_actual}
                                target={kpiSummary.availability_target}
                                loading={loadingKpi}
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <GaugeCard
                                title="Lead Time Supply"
                                value={kpiSummary.leadtime_actual}
                                target={kpiSummary.leadtime_target}
                                loading={loadingKpi}
                            />
                        </div>
                    </div>

                    {/* ── Ringkasan KPI teks ───────────────────────────── */}
                    {!loadingKpi && (
                        <div className="app-card p-3 mb-3">
                            <div className="fw-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Ringkasan KPI — Periode ini
                            </div>
                            <div className="row g-2">
                                {[
                                    { label: 'Readiness', actual: kpiSummary.readyness_actual, target: kpiSummary.readyness_target },
                                    { label: 'Availability VHS', actual: kpiSummary.availability_actual, target: kpiSummary.availability_target },
                                    { label: 'Lead Time Supply', actual: kpiSummary.leadtime_actual, target: kpiSummary.leadtime_target },
                                ].map((item) => (
                                    <div key={item.label} className="col-12 col-md-4">
                                        <div
                                            className="rounded p-2 d-flex justify-content-between align-items-center"
                                            style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                                        >
                                            <span className="text-secondary small">{item.label}</span>
                                            <div className="text-end">
                                                <div className="fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                    {formatPercent(item.actual)}
                                                </div>
                                                <small className="text-muted">Target: {formatPercent(item.target)}</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Charts ──────────────────────────────────────── */}
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-lg-6">
                            <ChartCard
                                title="Tren Physical & Unit Availability (%)"
                                type="line"
                                data={trendData}
                                xKey="month"
                                series={[
                                    { key: 'PA (%)', label: 'Physical Availability', color: '#1a56db' },
                                    { key: 'UA (%)', label: 'Unit Availability', color: '#16a34a' },
                                ]}
                                loading={loadingPerf}
                                height={260}
                            />
                        </div>
                        <div className="col-12 col-lg-6">
                            <ChartCard
                                title="MTBF vs MTTR (jam)"
                                type="bar"
                                data={mtbfMttrData}
                                xKey="month"
                                series={[
                                    { key: 'MTBF', label: 'MTBF', color: '#1a56db' },
                                    { key: 'MTTR', label: 'MTTR', color: '#dc2626' },
                                ]}
                                loading={loadingPerf}
                                height={260}
                            />
                        </div>
                    </div>

                    {/* ── Tabel Unit Performance ───────────────────────── */}
                    <div className="mb-3">
                        <DataTable
                            title={`Performa Unit — ${totalUnits} unit`}
                            columns={perfColumns}
                            data={perfRows}
                            loading={loadingPerf}
                            emptyMessage="Tidak ada data performa unit untuk periode yang dipilih"
                            rowKey="id"
                        />
                    </div>

                    {/* ── Tabel Pending Supply ─────────────────────────── */}
                    <div className="mb-3">
                        <DataTable
                            title={`Pending Supply — ${totalPending} item (${totalPendingQty} pcs)`}
                            columns={supplyColumns}
                            data={supplyRows}
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