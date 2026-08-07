import { useEffect, useState, useCallback } from 'react';

import { getSites } from '../../api/site.api';
import { getUnitModels } from '../../api/unitModel.api';
import { getKpiSummary } from '../../api/kpiSummary.api';
import { getUnitPerformances } from '../../api/unitPerformance.api';
import { getPendingSupply } from '../../api/pendingSupply.api';
import { getCriticalItems } from '../../api/criticalItem.api';

import FilterBar from '../../components/common/FilterBar';
import BigStatCard from '../../components/common/BigStatCard';
import KpiCard from '../../components/common/KpiCard';
import GaugeCard from '../../components/common/GaugeCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

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
    groupRowsByUnit,
    filterRowsByUnitGroup,
    getUnitGroupOrder,
} from '../../utils/unitFilter';

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

function formatDateID(value) {
    return value
        ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
}

function DashboardPerSite() {
    // ── Filter state — siteId WAJIB dipilih untuk halaman ini ────────────
    const [siteId, setSiteId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [month, setMonth] = useState(DEFAULT_MONTH);
    const [year, setYear] = useState(DEFAULT_YEAR);

    // ── Data state ───────────────────────────────────────────────────────
    const [sites, setSites] = useState([]);
    const [units, setUnits] = useState([]);
    const [kpiRows, setKpiRows] = useState([]);
    const [perfRows, setPerfRows] = useState([]);
    const [supplyRows, setSupplyRows] = useState([]);
    const [criticalRows, setCriticalRows] = useState([]);

    // ── Loading state ────────────────────────────────────────────────────
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [loadingKpi, setLoadingKpi] = useState(false);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [loadingSupply, setLoadingSupply] = useState(false);
    const [loadingCritical, setLoadingCritical] = useState(false);

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

    // ── Fetch daftar unit setiap kali site berubah ────────────────────────
    useEffect(() => {
        setUnitId(''); // reset pilihan unit setiap ganti site

        if (!siteId) {
            setUnits([]);
            return;
        }

        setLoadingUnits(true);
        getUnitModels({ site_id: siteId })
            .then((response) => {
                setUnits(extractRows(response));
            })
            .catch(() => {
                setUnits([]);
            })
            .finally(() => setLoadingUnits(false));
    }, [siteId]);

    // ── Fetch data dashboard (hanya jika site sudah dipilih) ─────────────
    const fetchData = useCallback(() => {
        if (!siteId) return;

        // Data untuk bulan yang sedang dipilih.
        // Catatan: unit_model_id SENGAJA tidak dikirim ke backend di sini.
        // Backend hanya mendukung filter 1 unit_model_id (integer tunggal),
        // sedangkan pilihan Unit di dropdown sekarang mewakili GRUP (bisa >1
        // unit_model_id sekaligus, mis. grup "PC1250" = gabungan varian
        // PC1250-8, PC1250-8R, PC1250SP-8, dst). Jadi kita selalu ambil semua
        // data performa unit utk site ini, lalu grouping & filter grup
        // dilakukan di frontend (lihat unitFilter.js).
        const periodParams = {
            site_id: siteId,
            period_year: year,
            period_month: month,
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

        setLoadingCritical(true);
        getCriticalItems({
            site_id: siteId,
        })
            .then((response) => {
                setCriticalRows(extractRows(response));
            })
            .catch((err) => {
                console.error('Gagal memuat critical item:', err);
                setCriticalRows([]);
                setError('Gagal memuat data critical item');
            })
            .finally(() => {
                setLoadingCritical(false);
            });
    }, [siteId, unitId, month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derived ──────────────────────────────────────────────────────────
    const safeKpiRows = Array.isArray(kpiRows) ? kpiRows : [];
    const rawPerfRows = Array.isArray(perfRows) ? perfRows : [];
    const safeSupplyRows = Array.isArray(supplyRows) ? supplyRows : [];
    const safeCriticalRows = Array.isArray(criticalRows) ? criticalRows : [];

    const kpiSummary = aggregateKpiSummary(safeKpiRows);

    // Info site & unit terpilih.
    const selectedSite = sites.find((s) => String(s.id) === String(siteId));
    // `unitId` sekarang menyimpan KEY GRUP unit (mis. "PC1250"), bukan
    // unit_model_id asli — karena satu grup bisa mewakili beberapa varian
    // (id) sekaligus. Lihat unitFilter.js untuk detail.
    const selectedUnit = unitId ? { id: unitId, label: unitId } : null;

    // Opsi dropdown Unit — SATU opsi per grup unit (PC2000/PC1250/HD785,
    // ditambah PC3400 khusus site BIB). Semua varian nama untuk grup yang
    // sama (mis. "PC1250-8", "PC1250-8R", "PC1250SP-8", "PC1250SP-11R")
    // digabung jadi 1 opsi saja, tidak muncul dobel.
    const unitOptions = buildUnitOptions(units, selectedSite?.site_code);

    // Baris performa unit yang sudah disaring ke grup yang diizinkan untuk
    // site ini, dan — kalau user memilih 1 unit di dropdown — disaring lagi
    // ke grup terpilih saja. Filter ini murni berdasarkan hasil normalisasi
    // model_name (lihat groupRowsByUnit/filterRowsByUnitGroup di
    // unitFilter.js), BUKAN dari backend, karena satu grup bisa terdiri
    // dari banyak unit_model_id berbeda yang tidak bisa difilter backend
    // sekaligus.
    const safePerfRows = filterRowsByUnitGroup(rawPerfRows, selectedSite?.site_code, unitId);

    const totalUnits = countUnits(safePerfRows);

    const totalPendingSupply = countPendingSupply(safeSupplyRows);
    const totalPendingQty = sumPendingQty(safeSupplyRows);
    const totalCriticalItems = countPendingSupply(safeCriticalRows);
    const totalCriticalQty = sumPendingQty(safeCriticalRows);
    const totalCombinedItems = totalPendingSupply + totalCriticalItems;
    const totalCombinedQty = totalPendingQty + totalCriticalQty;

    // ── Ringkasan PA / UA / MTBF / MTTR (mengikuti filter site+unit+periode) ──
    const overallPerf = {
        physical_availability: safeAvg(safePerfRows.map((r) => r.physical_availability)),
        unit_availability: safeAvg(safePerfRows.map((r) => r.unit_availability)),
        mtbf: safeAvg(safePerfRows.map((r) => r.mtbf)),
        mttr: safeAvg(safePerfRows.map((r) => r.mttr)),
    };
    const overallProductivity = safeAvg(safePerfRows.map((r) => r.productivity));
    const overallFuelConsumption = safeAvg(safePerfRows.map((r) => r.fuel_consumption));

    const perfSummaryItems = [
        {
            label: 'PA (Physical Availability)',
            value: formatPercent(overallPerf.physical_availability),
            icon: 'bi-shield-check',
            color: '#1a56db',
        },
        {
            label: 'UA (Unit Availability)',
            value: formatPercent(overallPerf.unit_availability),
            icon: 'bi-truck',
            color: '#16a34a',
        },
        {
            label: 'MTBF',
            value: formatNumber(overallPerf.mtbf),
            suffix: 'jam',
            icon: 'bi-arrow-repeat',
            color: '#d97706',
        },
        {
            label: 'MTTR',
            value: formatNumber(overallPerf.mttr),
            suffix: 'jam',
            icon: 'bi-tools',
            color: '#dc2626',
        },
    ];

    // Performa unit per model (site ini saja) - relokasi dari Dashboard All Site,
    // di sini sumbu X adalah nama GRUP unit karena konteksnya sudah 1 site.
    //
    // Seluruh varian nama unit (mis. "PC2000-8" & "PC2000-11R" di site IPT)
    // DIGABUNG jadi satu grup ("PC2000") SEBELUM dihitung rata-ratanya, jadi
    // hasilnya adalah agregat dari semua baris mentah anggota grup itu — bukan
    // rata-rata dari rata-rata masing-masing varian. Ini yang membuat chart
    // menampilkan satu bar per grup, bukan satu bar per varian/id.
    const perfGroups = groupRowsByUnit(safePerfRows, selectedSite?.site_code);
    const unitByModel = getUnitGroupOrder(selectedSite?.site_code)
        .filter((groupLabel) => perfGroups.has(groupLabel))
        .map((groupLabel) => {
            const rows = perfGroups.get(groupLabel);

            const mtbf = safeAvg(rows.map((r) => r.mtbf));
            const mttr = safeAvg(rows.map((r) => r.mttr));
            const productivity = safeAvg(rows.map((r) => r.productivity));
            const fuel_consumption = safeAvg(rows.map((r) => r.fuel_consumption));

            return {
                model_name: groupLabel,

                physical_availability: toPct(safeAvg(rows.map((r) => r.physical_availability))),
                unit_availability: toPct(safeAvg(rows.map((r) => r.unit_availability))),

                mtbf: mtbf !== null && mtbf !== undefined ? Number(Number(mtbf).toFixed(1)) : null,
                mttr: mttr !== null && mttr !== undefined ? Number(Number(mttr).toFixed(1)) : null,

                productivity:
                    productivity !== null && productivity !== undefined
                        ? Number(Number(productivity).toFixed(1))
                        : null,

                fuel_consumption:
                    fuel_consumption !== null && fuel_consumption !== undefined
                        ? Number(Number(fuel_consumption).toFixed(1))
                        : null,
            };
        });

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

    // ── Gabungan Pending Supply + Critical Item ────────────────────────────
    const combinedItems = [
        ...safeSupplyRows.map((r) => ({
            id: `ps-${r.id}`,
            category: 'Pending Supply',
            parts_number: r.parts_number,
            description: r.description,
            qty: r.qty,
            no_po: r.no_po,
            date: r.eta,
            remarks: r.remarks,
        })),
        ...safeCriticalRows.map((r) => ({
            id: `ci-${r.id}`,
            category: 'Critical Item',
            parts_number: r.parts_number,
            description: r.description,
            qty: r.qty,
            no_po: r.no_po,
            date: r.estimasi,
            remarks: null,
        })),
    ];

    const combinedColumns = [
        {
            key: 'category',
            label: 'Kategori',
            align: 'left',
            render: (row) => {
                const isCritical = row.category === 'Critical Item';
                const color = isCritical ? '#dc2626' : '#1a56db';
                return (
                    <span className="badge rounded-pill" style={{ backgroundColor: `${color}1A`, color }}>
                        {row.category}
                    </span>
                );
            },
        },
        { key: 'parts_number', label: 'Part No.', align: 'left' },
        { key: 'description', label: 'Deskripsi', align: 'left' },
        { key: 'qty', label: 'Qty', align: 'center' },
        { key: 'no_po', label: 'No. PO', align: 'left' },
        {
            key: 'date',
            label: 'ETA / Estimasi',
            align: 'center',
            render: (row) => formatDateID(row.date),
        },
        {
            key: 'remarks',
            label: 'Keterangan',
            align: 'left',
            render: (row) => row.remarks || '-',
        },
    ];

    const isLoading =
        loadingKpi ||
        loadingPerf ||
        loadingSupply ||
        loadingCritical;

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                        Dashboard Per Site{selectedSite ? ` — ${selectedSite.site_code}` : ''}
                    </h4>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                        {selectedSite
                            ? `${selectedSite.site_name ? selectedSite.site_name : ''}${selectedUnit ? (selectedSite.site_name ? ' — ' : '') + selectedUnit.label : ''}`
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
                units={loadingUnits ? [] : unitOptions}
                unitId={unitId}
                month={month}
                year={year}
                onSiteChange={setSiteId}
                onUnitChange={setUnitId}
                onMonthChange={setMonth}
                onYearChange={setYear}
                showSiteFilter={true}
                showUnitFilter={true}
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
                    {/* ── Card Besar: Ringkasan PA / UA / MTBF / MTTR ───── */}
                    <div className="row g-3 mb-3">
                        <div className="col-12">
                            <BigStatCard
                                title={`Ringkasan Performa Unit${selectedUnit ? ' — ' + selectedUnit.label : ''}`}
                                items={perfSummaryItems}
                                loading={loadingPerf}
                            />
                        </div>
                    </div>

                    {/* ── Fuel Consumption & Productivity ──────────────── */}
                    <div className="row g-3 mb-3">
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-speedometer2"
                                label="Productivity"
                                value={loadingPerf ? null : formatNumber(overallProductivity)}
                                loading={loadingPerf}
                                variant="secondary"
                            />
                        </div>
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-fuel-pump"
                                label="Fuel Consumption"
                                value={loadingPerf ? null : formatNumber(overallFuelConsumption, 0)}
                                suffix="L"
                                loading={loadingPerf}
                                variant="primary"
                            />
                        </div>
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-truck"
                                label="Total Unit"
                                value={loadingPerf ? null : totalUnits}
                                loading={loadingPerf}
                                variant="success"
                            />
                        </div>
                        <div className="col-6 col-lg-3">
                            <KpiCard
                                icon="bi-hourglass-split"
                                label="Pending Supply & Critical Item"
                                value={loadingSupply || loadingCritical ? null : totalCombinedItems}
                                suffix="item"
                                loading={loadingSupply || loadingCritical}
                                variant="warning"
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

                    {/* ── Card Besar: Performa Unit per Model (PA/UA/MTBF/MTTR) ── */}
                    <div className="app-card p-3 mb-3">
                        <div className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            Performa Unit per Model
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-lg-6 col-xl-3">
                                <ChartCard
                                    title="Physical Availability (%)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[{ key: 'physical_availability', label: 'PA (%)', color: '#1a56db' }]}
                                    loading={loadingPerf}
                                    height={220}
                                />
                            </div>
                            <div className="col-12 col-lg-6 col-xl-3">
                                <ChartCard
                                    title="Unit Availability (%)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[{ key: 'unit_availability', label: 'UA (%)', color: '#16a34a' }]}
                                    loading={loadingPerf}
                                    height={220}
                                />
                            </div>
                            <div className="col-12 col-lg-6 col-xl-3">
                                <ChartCard
                                    title="MTBF (jam)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[{ key: 'mtbf', label: 'MTBF', color: '#d97706' }]}
                                    loading={loadingPerf}
                                    height={220}
                                />
                            </div>
                            <div className="col-12 col-lg-6 col-xl-3">
                                <ChartCard
                                    title="MTTR (jam)"
                                    type="bar"
                                    data={unitByModel}
                                    xKey="model_name"
                                    series={[{ key: 'mttr', label: 'MTTR', color: '#dc2626' }]}
                                    loading={loadingPerf}
                                    height={220}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Productivity & Fuel Consumption per Model ────── */}
                    <div className="mb-3">
                        <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Productivity & Fuel Consumption per Model
                        </h6>
                        <div className="row g-3">
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

                    {/* ── Tabel Gabungan Pending Supply + Critical Item ─── */}
                    <div className="mb-3">
                        <DataTable
                            title={`Pending Supply & Critical Item — ${totalCombinedItems} item (${totalCombinedQty} pcs)`}
                            columns={combinedColumns}
                            data={combinedItems}
                            loading={loadingSupply || loadingCritical}
                            emptyMessage="Tidak ada pending supply maupun critical item untuk site ini"
                            rowKey="id"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardPerSite;