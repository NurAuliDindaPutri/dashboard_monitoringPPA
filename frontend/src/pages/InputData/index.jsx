import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { getSites } from '../../api/site.api';
import { MONTHS, YEARS } from '../../utils/constants';

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = NOW.getMonth() + 1;

// ── Sub-form: Input KPI Summary ─────────────────────────────────────────────
function KpiSummaryForm({ sites }) {
    const [form, setForm] = useState({
        site_id: '',
        period_year: DEFAULT_YEAR,
        period_month: DEFAULT_MONTH,
        readyness_actual: '',
        readyness_target: '',
        availability_actual: '',
        availability_target: '',
        leadtime_actual: '',
        leadtime_target: '',
    });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', message }

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.site_id) { setResult({ type: 'error', message: 'Site wajib dipilih' }); return; }

        const payload = {
            site_id: Number(form.site_id),
            period_year: Number(form.period_year),
            period_month: Number(form.period_month),
            readyness_actual: form.readyness_actual !== '' ? Number(form.readyness_actual) / 100 : null,
            readyness_target: form.readyness_target !== '' ? Number(form.readyness_target) / 100 : null,
            availability_actual: form.availability_actual !== '' ? Number(form.availability_actual) / 100 : null,
            availability_target: form.availability_target !== '' ? Number(form.availability_target) / 100 : null,
            leadtime_actual: form.leadtime_actual !== '' ? Number(form.leadtime_actual) / 100 : null,
            leadtime_target: form.leadtime_target !== '' ? Number(form.leadtime_target) / 100 : null,
        };

        setSaving(true);
        try {
            await axiosClient.post('/kpi-summary', payload);
            setResult({ type: 'success', message: 'Data KPI Summary berhasil disimpan!' });
            setForm((prev) => ({
                ...prev,
                readyness_actual: '', readyness_target: '',
                availability_actual: '', availability_target: '',
                leadtime_actual: '', leadtime_target: '',
            }));
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Gagal menyimpan data KPI Summary';
            setResult({ type: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-card p-4">
            <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-graph-up-arrow text-primary-custom" />
                Input KPI Summary Bulanan
            </div>

            {result && (
                <div className={`alert alert-${result.type === 'success' ? 'success' : 'danger'} py-2 mb-3`} role="alert">
                    <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`} />
                    {result.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Site & Periode */}
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Site <span className="text-danger">*</span></label>
                        <select className="form-select" name="site_id" value={form.site_id} onChange={handleChange} required>
                            <option value="">Pilih Site</option>
                            {sites.map((s) => (
                                <option key={s.id} value={s.id}>{s.site_code}{s.site_name ? ` - ${s.site_name}` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-6 col-md-4">
                        <label className="form-label small text-secondary">Bulan <span className="text-danger">*</span></label>
                        <select className="form-select" name="period_month" value={form.period_month} onChange={handleChange}>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="col-6 col-md-4">
                        <label className="form-label small text-secondary">Tahun <span className="text-danger">*</span></label>
                        <select className="form-select" name="period_year" value={form.period_year} onChange={handleChange}>
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    {/* Readiness */}
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">Readiness (%)</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Aktual</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="readyness_actual"
                                value={form.readyness_actual} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 92.5" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Target</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="readyness_target"
                                value={form.readyness_target} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 90" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">Availability VHS (%)</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Aktual</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="availability_actual"
                                value={form.availability_actual} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 97.8" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Target</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="availability_target"
                                value={form.availability_target} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 98" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>

                    {/* Lead Time Supply */}
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">Lead Time Supply (%)</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Aktual</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="leadtime_actual"
                                value={form.leadtime_actual} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 94.2" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Target</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="leadtime_target"
                                value={form.leadtime_target} onChange={handleChange}
                                min="0" max="100" step="0.1" placeholder="mis. 93" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={saving}>
                        {saving && <span className="spinner-border spinner-border-sm" />}
                        <i className="bi bi-save" />
                        Simpan KPI Summary
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Sub-form: Input Unit Performance ────────────────────────────────────────
function UnitPerformanceForm({ sites }) {
    const [unitModels, setUnitModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const [form, setForm] = useState({
        site_id: '',
        unit_model_id: '',
        period_year: DEFAULT_YEAR,
        period_month: DEFAULT_MONTH,
        physical_availability: '',
        unit_availability: '',
        mtbf: '',
        mttr: '',
        productivity: '',
        fuel_consumption: '',
    });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    // Fetch unit models ketika site berubah
    useEffect(() => {
        if (!form.site_id) { setUnitModels([]); return; }
        setLoadingModels(true);
        axiosClient.get('/unit-models', { params: { site_id: form.site_id } })
            .then((r) => setUnitModels(r.data.data ?? []))
            .catch(() => setUnitModels([]))
            .finally(() => setLoadingModels(false));
    }, [form.site_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'site_id' ? { unit_model_id: '' } : {}),
        }));
        setResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.unit_model_id) { setResult({ type: 'error', message: 'Model unit wajib dipilih' }); return; }

        const payload = {
            unit_model_id: Number(form.unit_model_id),
            period_year: Number(form.period_year),
            period_month: Number(form.period_month),
            physical_availability: form.physical_availability !== '' ? Number(form.physical_availability) / 100 : null,
            unit_availability: form.unit_availability !== '' ? Number(form.unit_availability) / 100 : null,
            mtbf: form.mtbf !== '' ? Number(form.mtbf) : null,
            mttr: form.mttr !== '' ? Number(form.mttr) : null,
            productivity: form.productivity !== '' ? Number(form.productivity) : null,
            fuel_consumption: form.fuel_consumption !== '' ? Number(form.fuel_consumption) : null,
        };

        setSaving(true);
        try {
            await axiosClient.post('/unit-performance', payload);
            setResult({ type: 'success', message: 'Data Unit Performance berhasil disimpan!' });
            setForm((prev) => ({
                ...prev,
                physical_availability: '', unit_availability: '',
                mtbf: '', mttr: '', productivity: '', fuel_consumption: '',
            }));
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Gagal menyimpan data Unit Performance';
            setResult({ type: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-card p-4">
            <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-truck text-primary-custom" />
                Input Data Performa Unit Bulanan
            </div>

            {result && (
                <div className={`alert alert-${result.type === 'success' ? 'success' : 'danger'} py-2 mb-3`} role="alert">
                    <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`} />
                    {result.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Site, Unit Model & Periode */}
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Site <span className="text-danger">*</span></label>
                        <select className="form-select" name="site_id" value={form.site_id} onChange={handleChange} required>
                            <option value="">Pilih Site</option>
                            {sites.map((s) => (
                                <option key={s.id} value={s.id}>{s.site_code}{s.site_name ? ` - ${s.site_name}` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Model Unit <span className="text-danger">*</span></label>
                        <select
                            className="form-select"
                            name="unit_model_id"
                            value={form.unit_model_id}
                            onChange={handleChange}
                            disabled={!form.site_id || loadingModels}
                            required
                        >
                            <option value="">
                                {!form.site_id ? 'Pilih site dahulu' : loadingModels ? 'Memuat…' : 'Pilih Model Unit'}
                            </option>
                            {unitModels.map((u) => (
                                <option key={u.id} value={u.id}>{u.model_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-6 col-md-2">
                        <label className="form-label small text-secondary">Bulan <span className="text-danger">*</span></label>
                        <select className="form-select" name="period_month" value={form.period_month} onChange={handleChange}>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="col-6 col-md-2">
                        <label className="form-label small text-secondary">Tahun <span className="text-danger">*</span></label>
                        <select className="form-select" name="period_year" value={form.period_year} onChange={handleChange}>
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Availability */}
                <div className="row g-3 mb-3">
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">Availability (%)</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Physical Availability</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="physical_availability"
                                value={form.physical_availability} onChange={handleChange}
                                min="0" max="100" step="0.01" placeholder="mis. 97.5" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Unit Availability</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="unit_availability"
                                value={form.unit_availability} onChange={handleChange}
                                min="0" max="100" step="0.01" placeholder="mis. 96.8" />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>

                    {/* MTBF & MTTR */}
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">MTBF & MTTR (jam)</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">MTBF</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="mtbf"
                                value={form.mtbf} onChange={handleChange}
                                min="0" step="0.1" placeholder="mis. 250" />
                            <span className="input-group-text">jam</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">MTTR</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="mttr"
                                value={form.mttr} onChange={handleChange}
                                min="0" step="0.1" placeholder="mis. 4.5" />
                            <span className="input-group-text">jam</span>
                        </div>
                    </div>

                    {/* Produktivitas & Fuel */}
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">Produktivitas & Fuel</div>
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Produktivitas</label>
                        <input type="number" className="form-control form-control-sm" name="productivity"
                            value={form.productivity} onChange={handleChange}
                            min="0" step="0.01" placeholder="mis. 85.3" />
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">Fuel Consumption</label>
                        <div className="input-group input-group-sm">
                            <input type="number" className="form-control" name="fuel_consumption"
                                value={form.fuel_consumption} onChange={handleChange}
                                min="0" step="1" placeholder="mis. 12500" />
                            <span className="input-group-text">L</span>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={saving}>
                        {saving && <span className="spinner-border spinner-border-sm" />}
                        <i className="bi bi-save" />
                        Simpan Data Unit
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Sub-form: Input Pending Supply ──────────────────────────────────────────
function PendingSupplyForm({ sites }) {
    const [form, setForm] = useState({
        site_id: '',
        parts_number: '',
        description: '',
        qty: '',
        no_po: '',
        eta: '',
        remarks: '',
    });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.site_id) { setResult({ type: 'error', message: 'Site wajib dipilih' }); return; }
        if (!form.parts_number.trim()) { setResult({ type: 'error', message: 'Part number wajib diisi' }); return; }

        const payload = {
            site_id: Number(form.site_id),
            parts_number: form.parts_number.trim(),
            description: form.description.trim() || null,
            qty: form.qty !== '' ? Number(form.qty) : 0,
            no_po: form.no_po.trim() || null,
            eta: form.eta || null,
            remarks: form.remarks.trim() || null,
        };

        setSaving(true);
        try {
            await axiosClient.post('/pending-supply', payload);
            setResult({ type: 'success', message: 'Data Pending Supply berhasil disimpan!' });
            setForm({ site_id: form.site_id, parts_number: '', description: '', qty: '', no_po: '', eta: '', remarks: '' });
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Gagal menyimpan data Pending Supply';
            setResult({ type: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-card p-4">
            <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-hourglass-split text-primary-custom" />
                Input Pending Supply
            </div>

            {result && (
                <div className={`alert alert-${result.type === 'success' ? 'success' : 'danger'} py-2 mb-3`} role="alert">
                    <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`} />
                    {result.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Site <span className="text-danger">*</span></label>
                        <select className="form-select" name="site_id" value={form.site_id} onChange={handleChange} required>
                            <option value="">Pilih Site</option>
                            {sites.map((s) => (
                                <option key={s.id} value={s.id}>{s.site_code}{s.site_name ? ` - ${s.site_name}` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Part Number <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" name="parts_number"
                            value={form.parts_number} onChange={handleChange}
                            placeholder="mis. ABC-123456" required />
                    </div>
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Deskripsi</label>
                        <input type="text" className="form-control" name="description"
                            value={form.description} onChange={handleChange}
                            placeholder="Nama atau deskripsi part" />
                    </div>
                    <div className="col-6 col-md-2">
                        <label className="form-label small text-secondary">Qty</label>
                        <input type="number" className="form-control" name="qty"
                            value={form.qty} onChange={handleChange}
                            min="0" step="1" placeholder="0" />
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">No. PO</label>
                        <input type="text" className="form-control" name="no_po"
                            value={form.no_po} onChange={handleChange}
                            placeholder="Nomor Purchase Order" />
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">ETA</label>
                        <input type="date" className="form-control" name="eta"
                            value={form.eta} onChange={handleChange} />
                    </div>
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">Keterangan</label>
                        <input type="text" className="form-control" name="remarks"
                            value={form.remarks} onChange={handleChange}
                            placeholder="Catatan tambahan (opsional)" />
                    </div>
                </div>

                <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={saving}>
                        {saving && <span className="spinner-border spinner-border-sm" />}
                        <i className="bi bi-save" />
                        Simpan Pending Supply
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Halaman Utama ─────────────────────────────────────────────────────────────
function InputData() {
    const [sites, setSites] = useState([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'unit' | 'supply'

    useEffect(() => {
        setLoadingSites(true);
        getSites()
            .then((d) => setSites(d ?? []))
            .finally(() => setLoadingSites(false));
    }, []);

    const tabs = [
        { key: 'kpi', label: 'KPI Summary', icon: 'bi-graph-up-arrow' },
        { key: 'unit', label: 'Performa Unit', icon: 'bi-truck' },
        { key: 'supply', label: 'Pending Supply', icon: 'bi-hourglass-split' },
    ];

    return (
        <div>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="mb-3">
                <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    Input Data
                </h4>
                <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
                    Tambahkan data KPI, performa unit, atau pending supply ke sistem.
                </p>
            </div>

            {/* ── Info banner jika sites belum tersedia ─────────────── */}
            {loadingSites && (
                <div className="alert alert-info py-2 mb-3 d-flex align-items-center gap-2">
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span>Memuat daftar site…</span>
                </div>
            )}

            {/* ── Tab Navigation ───────────────────────────────────────── */}
            <div className="app-card p-2 mb-3">
                <div className="d-flex gap-1 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={`bi ${tab.icon}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Form aktif ───────────────────────────────────────────── */}
            {activeTab === 'kpi' && <KpiSummaryForm sites={sites} />}
            {activeTab === 'unit' && <UnitPerformanceForm sites={sites} />}
            {activeTab === 'supply' && <PendingSupplyForm sites={sites} />}
        </div>
    );
}

export default InputData;