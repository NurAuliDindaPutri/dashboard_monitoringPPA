import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getKpiSummary } from '../../api/kpiSummary.api';
import { getUnitPerformances } from '../../api/unitPerformance.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

import {
    aggregateKpiSummary,
    aggregatePerfByMonth,
    aggregatePerfByUnit,
    countUnits,
    countPendingSupply,
    sumPendingQty,
} from '../../utils/aggregate';
import {
    formatPercent,
    formatNumber,
    normalizePercentage,
} from '../../utils/kpiStatus';

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = NOW.getMonth() + 1;

function extractRows(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    return [];
}

// ── helper: konversi nilai 0-1 ke persen string untuk chart ─────────────────
function toPct(value) {
    const percentage = normalizePercentage(value);

    return percentage === null
        ? null
        : Number(percentage.toFixed(1));
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

    // Khusus grafik tren Januari–Desember
    const [perfYearRows, setPerfYearRows] = useState([]);
    const [supplyRows, setSupplyRows] = useState([]);

    // ── Loading state ────────────────────────────────────────────────────
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingKpi, setLoadingKpi] = useState(false);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [loadingPerfYear, setLoadingPerfYear] = useState(false);
    const [loadingSupply, setLoadingSupply] = useState(false);

    const [error, setError] = useState(null);

    // ── Fetch daftar site ────────────────────────────────────────────────
    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((response) => {
                const list = extractRows(response);
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

        // Data untuk bulan yang sedang dipilih
        const periodParams = {
            site_id: siteId,
            period_year: year,
            period_month: month,
        };

        // Data satu tahun penuh untuk grafik tren
        const yearParams = {
            site_id: siteId,
            period_year: year,
        };

        setError(null);

        setLoadingKpi(true);
        getKpiSummary(periodParams)
            .then((response) => {
                setKpiRows(extractRows(response));
            })
            .catch((err) => {
                console.error('Gagal memuat KPI:', err);
                setKpiRows([]);
                setError('Gagal memuat data KPI');
            })
            .finally(() => {
                setLoadingKpi(false);
            });

        // Data detail pada bulan terpilih
        setLoadingPerf(true);
        getUnitPerformances(periodParams)
            .then((response) => {
                setPerfRows(extractRows(response));
            })
            .catch((err) => {
                console.error('Gagal memuat performa unit:', err);
                setPerfRows([]);
                setError('Gagal memuat data performa unit');
            })
            .finally(() => {
                setLoadingPerf(false);
            });

        // Data satu tahun untuk grafik tren
        setLoadingPerfYear(true);
        getUnitPerformances(yearParams)
            .then((response) => {
                setPerfYearRows(extractRows(response));
            })
            .catch((err) => {
                console.error('Gagal memuat tren performa:', err);
                setPerfYearRows([]);
                setError('Gagal memuat tren performa unit');
            })
            .finally(() => {
                setLoadingPerfYear(false);
            });

        setLoadingSupply(true);
        getPendingSupply({
            site_id: siteId,
        })
            .then((response) => {
                setSupplyRows(extractRows(response));
            })
            .catch((err) => {
                console.error('Gagal memuat pending supply:', err);
                setSupplyRows([]);
                setError('Gagal memuat data pending supply');
            })
            .finally(() => {
                setLoadingSupply(false);
            });
    }, [siteId, month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derived ──────────────────────────────────────────────────────────
    const safeKpiRows = Array.isArray(kpiRows) ? kpiRows : [];
    const safePerfRows = Array.isArray(perfRows) ? perfRows : [];
    const safePerfYearRows = Array.isArray(perfYearRows) ? perfYearRows : [];
    const safeSupplyRows = Array.isArray(supplyRows) ? supplyRows : [];

    const kpiSummary = aggregateKpiSummary(safeKpiRows);
    const totalUnits = countUnits(safePerfRows);
    const totalPending = countPendingSupply(safeSupplyRows);
    const totalPendingQty = sumPendingQty(safeSupplyRows);

    const trendData = aggregatePerfByMonth(safePerfYearRows).map((p) => ({
        month: p.month,
        'PA (%)': toPct(p.physical_availability),
        'UA (%)': toPct(p.unit_availability),
    }));

    // MTBF & MTTR bar chart
    const mtbfMttrData = aggregatePerfByMonth(safePerfYearRows).map((p) => ({
        month: p.month,
        MTBF: p.mtbf !== null ? parseFloat(p.mtbf.toFixed(1)) : null,
        MTTR: p.mttr !== null ? parseFloat(p.mttr.toFixed(1)) : null,
    }));

    // Performa unit per model (site ini saja) - relokasi dari Dashboard All Site,
    // di sini sumbu X adalah model_name karena konteksnya sudah 1 site.
    const unitByModel = aggregatePerfByUnit(safePerfRows).map((u) => ({
        model_name: u.model_name,

        physical_availability: toPct(u.physical_availability),
        unit_availability: toPct(u.unit_availability),

        mtbf:
            u.mtbf !== null && u.mtbf !== undefined
                ? Number(Number(u.mtbf).toFixed(1))
                : null,

        mttr:
            u.mttr !== null && u.mttr !== undefined
                ? Number(Number(u.mttr).toFixed(1))
                : null,

        productivity:
            u.productivity !== null && u.productivity !== undefined
                ? Number(Number(u.productivity).toFixed(1))
                : null,

        fuel_consumption:
            u.fuel_consumption !== null && u.fuel_consumption !== undefined
                ? Number(Number(u.fuel_consumption).toFixed(1))
                : null,
    }));

    const hasProductivity = unitByModel.some(
        (item) =>
            item.productivity !== null &&
            item.productivity !== undefined
    );

    const hasFuelConsumption = unitByModel.some(
        (item) =>
            item.fuel_consumption !== null &&
            item.fuel_consumption !== undefined
    );

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
                const value = Number(row.physical_availability);

                if (!Number.isFinite(value)) {
                    return <span className="text-muted">-</span>;
                }

                const percentage = normalizePercentage(value);

                const normalizedValue =
                    percentage !== null
                        ? percentage / 100
                        : 0;

                const color =
                    normalizedValue >= 0.98
                        ? '#16a34a'
                        : normalizedValue >= 0.95
                            ? '#d97706'
                            : '#dc2626';

                return (
                    <span
                        className="badge rounded-pill"
                        style={{
                            backgroundColor: `${color}1A`,
                            color,
                        }}
                    >
                        {percentage !== null
                            ? `${percentage.toFixed(1)}%`
                            : '-'}
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

    const isLoading =
        loadingKpi ||
        loadingPerf ||
        loadingPerfYear ||
        loadingSupply;

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
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
                            <div className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
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
                                            style={{
                                                backgroundColor: 'var(--navy-800)',
                                                border: '1px solid var(--border-color)',
                                            }}
                                        >
                                            <span className="text-secondary small">{item.label}</span>
                                            <div className="text-end">
                                                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>
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
                                loading={loadingPerfYear}
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
                                loading={loadingPerfYear}
                                height={260}
                            />
                        </div>
                    </div>

                    {/* ── Performa Unit per Model (relokasi dari Dashboard All Site) ── */}
                    <div className="mb-3">
                        <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Performa Unit per Model
                        </h6>
                        <div className="row g-3">
                            <div className="col-12 col-lg-6">
                                <ChartCard
                                    title="Physical & Unit Availability per Model (%)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[
                                        { key: 'physical_availability', label: 'PA (%)', color: '#1a56db' },
                                        { key: 'unit_availability', label: 'UA (%)', color: '#16a34a' },
                                    ]}
                                    loading={loadingPerf}
                                    height={240}
                                />
                            </div>
                            <div className="col-12 col-lg-6">
                                <ChartCard
                                    title="MTBF & MTTR per Model (jam)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[
                                        { key: 'mtbf', label: 'MTBF', color: '#d97706' },
                                        { key: 'mttr', label: 'MTTR', color: '#dc2626' },
                                    ]}
                                    loading={loadingPerf}
                                    height={240}
                                />
                            </div>
                            <div className="col-12 col-lg-6">
                                {hasProductivity ? (
                                    <ChartCard
                                        title="Productivity per Model"
                                        type="bar"
                                        data={unitByModel}
                                        xKey="model_name"
                                        series={[{ key: 'productivity', label: 'Productivity', color: '#0284c7' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                ) : (
                                    <div className="app-card p-3 h-100 d-flex flex-column justify-content-between">
                                        <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Productivity per Model
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
                            <div className="col-12 col-lg-6">
                                {hasFuelConsumption ? (
                                    <ChartCard
                                        title="Fuel Consumption per Model (L)"
                                        type="bar"
                                        data={unitByModel}
                                        xKey="model_name"
                                        series={[{ key: 'fuel_consumption', label: 'Fuel (L)', color: '#8b5cf6' }]}
                                        loading={loadingPerf}
                                        height={220}
                                    />
                                ) : (
                                    <div className="app-card p-3 h-100 d-flex flex-column justify-content-between">
                                        <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Fuel Consumption per Model
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

                    {/* ── Tabel Unit Performance ───────────────────────── */}
                    <div className="mb-3">
                        <DataTable
                            title={`Performa Unit — ${totalUnits} unit`}
                            columns={perfColumns}
                            data={safePerfRows}
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
                            data={safeSupplyRows}
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