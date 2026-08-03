import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { getSites } from '../../api/site.api';
import { MONTHS, YEARS } from '../../utils/constants';

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = NOW.getMonth() + 1;

// ── Sub-form: Input KPI Summary ─────────────────────────────────────────────
const EMPTY_KPI_FORM = {
    site_id: '',
    period_year: DEFAULT_YEAR,
    period_month: DEFAULT_MONTH,
    readyness_actual: '',
    readyness_target: '',
    availability_actual: '',
    availability_target: '',
    leadtime_actual: '',
    leadtime_target: '',
};

// Konversi nilai desimal database (0-1) menjadi teks persen untuk tabel.
// 0.928 -> "92.8%", 0.98 -> "98%", null -> "-"
function formatKpiPercent(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value) * 100;
    if (!Number.isFinite(num)) return '-';
    const rounded = Math.round(num * 100) / 100;
    return `${rounded}%`;
}

// Konversi nilai desimal database (0-1) menjadi angka persen untuk form edit.
// 0.928 -> "92.8", null -> ""
function decimalToPercentInput(value) {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value) * 100;
    if (!Number.isFinite(num)) return '';
    return String(Math.round(num * 100) / 100);
}

function getMonthLabel(monthValue) {
    const found = MONTHS.find((m) => m.value === Number(monthValue));
    return found ? found.label : monthValue;
}

function KpiSummaryForm({ sites }) {
    const [form, setForm] = useState({ ...EMPTY_KPI_FORM });
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', message }
    const [editingId, setEditingId] = useState(null);

    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Notifikasi otomatis hilang setelah beberapa detik
    useEffect(() => {
        if (!result) return undefined;
        const timer = setTimeout(() => setResult(null), 4000);
        return () => clearTimeout(timer);
    }, [result]);

    const fetchList = async () => {
        setLoadingList(true);
        try {
            const res = await axiosClient.get('/kpi-summary');
            const data = res.data?.data ?? [];
            const sorted = [...data].sort((a, b) => {
                if (b.period_year !== a.period_year) return b.period_year - a.period_year;
                if (b.period_month !== a.period_month) return b.period_month - a.period_month;
                return b.id - a.id;
            });
            setList(sorted.slice(0, 20));
        } catch (err) {
            setResult({ type: 'error', message: 'Gagal memuat data KPI Summary' });
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setResult(null);
    };

    const resetForm = () => {
        setForm({ ...EMPTY_KPI_FORM });
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        resetForm();
        setResult(null);
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setForm({
            site_id: String(row.site_id),
            period_year: row.period_year,
            period_month: row.period_month,
            readyness_actual: decimalToPercentInput(row.readyness_actual),
            readyness_target: decimalToPercentInput(row.readyness_target),
            availability_actual: decimalToPercentInput(row.availability_actual),
            availability_target: decimalToPercentInput(row.availability_target),
            leadtime_actual: decimalToPercentInput(row.leadtime_actual),
            leadtime_target: decimalToPercentInput(row.leadtime_target),
        });
        setResult(null);
    };

    const handleDelete = async (row) => {
        const monthLabel = getMonthLabel(row.period_month);
        const confirmed = window.confirm(
            `Yakin ingin menghapus data KPI ${row.site_code} periode ${monthLabel} ${row.period_year}?`
        );
        if (!confirmed) return;

        setDeletingId(row.id);
        try {
            await axiosClient.delete(`/kpi-summary/${row.id}`);
            setResult({
                type: 'success',
                message: `Data KPI ${row.site_code} periode ${monthLabel} ${row.period_year} berhasil dihapus.`,
            });
            if (editingId === row.id) resetForm();
            await fetchList();
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Gagal menghapus data KPI Summary';
            setResult({ type: 'error', message: msg });
        } finally {
            setDeletingId(null);
        }
    };

    const PERCENT_FIELDS = [
        'readyness_actual', 'readyness_target',
        'availability_actual', 'availability_target',
        'leadtime_actual', 'leadtime_target',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.site_id) { setResult({ type: 'error', message: 'Site wajib dipilih' }); return; }
        if (!form.period_month) { setResult({ type: 'error', message: 'Bulan wajib dipilih' }); return; }
        if (!form.period_year) { setResult({ type: 'error', message: 'Tahun wajib dipilih' }); return; }

        for (const field of PERCENT_FIELDS) {
            const raw = form[field];
            if (raw === '' || raw === null || raw === undefined) continue;
            const num = Number(raw);
            if (!Number.isFinite(num) || num < 0 || num > 100) {
                setResult({ type: 'error', message: 'Nilai persen harus berada di antara 0 sampai 100' });
                return;
            }
        }

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

        const siteLabel = sites.find((s) => String(s.id) === String(form.site_id))?.site_code ?? '';
        const monthLabel = getMonthLabel(form.period_month);

        setSaving(true);
        try {
            if (editingId) {
                await axiosClient.put(`/kpi-summary/${editingId}`, payload);
                setResult({
                    type: 'success',
                    message: `Data KPI ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil diperbarui.`,
                });
            } else {
                await axiosClient.post('/kpi-summary', payload);
                setResult({
                    type: 'success',
                    message: `Data KPI ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil disimpan.`,
                });
            }
            resetForm();
            await fetchList();
        } catch (err) {
            const fallback = editingId
                ? 'Gagal memperbarui data KPI Summary'
                : 'Gagal menyimpan data KPI Summary';
            const msg = err.response?.data?.message ?? fallback;
            setResult({ type: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="app-card p-4">
                <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-graph-up-arrow text-primary-custom" />
                    {editingId ? 'Edit KPI Summary Bulanan' : 'Input KPI Summary Bulanan'}
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
                            <select className="form-select" name="site_id" value={form.site_id} onChange={handleChange} required disabled={saving}>
                                <option value="">Pilih Site</option>
                                {sites.map((s) => (
                                    <option key={s.id} value={s.id}>{s.site_code}{s.site_name ? ` - ${s.site_name}` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-md-4">
                            <label className="form-label small text-secondary">Bulan <span className="text-danger">*</span></label>
                            <select className="form-select" name="period_month" value={form.period_month} onChange={handleChange} disabled={saving}>
                                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="col-6 col-md-4">
                            <label className="form-label small text-secondary">Tahun <span className="text-danger">*</span></label>
                            <select className="form-select" name="period_year" value={form.period_year} onChange={handleChange} disabled={saving}>
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
                                    min="0" max="100" step="0.1" placeholder="mis. 92.5" disabled={saving} />
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className="form-label small text-secondary">Target</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control" name="readyness_target"
                                    value={form.readyness_target} onChange={handleChange}
                                    min="0" max="100" step="0.1" placeholder="mis. 90" disabled={saving} />
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
                                    min="0" max="100" step="0.1" placeholder="mis. 97.8" disabled={saving} />
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className="form-label small text-secondary">Target</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control" name="availability_target"
                                    value={form.availability_target} onChange={handleChange}
                                    min="0" max="100" step="0.1" placeholder="mis. 98" disabled={saving} />
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
                                    min="0" max="100" step="0.1" placeholder="mis. 94.2" disabled={saving} />
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className="form-label small text-secondary">Target</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control" name="leadtime_target"
                                    value={form.leadtime_target} onChange={handleChange}
                                    min="0" max="100" step="0.1" placeholder="mis. 93" disabled={saving} />
                                <span className="input-group-text">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        {editingId && (
                            <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                                onClick={handleCancelEdit} disabled={saving}>
                                <i className="bi bi-x-circle" />
                                Batal Edit
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={saving}>
                            {saving && <span className="spinner-border spinner-border-sm" />}
                            <i className="bi bi-save" />
                            {editingId ? 'Simpan Perubahan' : 'Simpan KPI Summary'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Tabel Data KPI Summary ─────────────────────────────────────── */}
            <div className="app-card p-4 mt-3">
                <div className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-table text-primary-custom" />
                    Data KPI Summary Terbaru
                </div>

                {loadingList ? (
                    <div className="d-flex align-items-center gap-2 text-secondary py-3">
                        <span className="spinner-border spinner-border-sm" role="status" />
                        <span>Memuat data KPI Summary…</span>
                    </div>
                ) : list.length === 0 ? (
                    <div className="text-secondary text-center py-3">Belum ada data KPI Summary.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead>
                                <tr className="text-secondary" style={{ fontSize: '0.8rem' }}>
                                    <th>Site</th>
                                    <th>Bulan</th>
                                    <th>Tahun</th>
                                    <th>Readiness Actual</th>
                                    <th>Readiness Target</th>
                                    <th>Availability Actual</th>
                                    <th>Availability Target</th>
                                    <th>Lead Time Actual</th>
                                    <th>Lead Time Target</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.site_code}{row.site_name ? ` - ${row.site_name}` : ''}</td>
                                        <td>{getMonthLabel(row.period_month)}</td>
                                        <td>{row.period_year}</td>
                                        <td>{formatKpiPercent(row.readyness_actual)}</td>
                                        <td>{formatKpiPercent(row.readyness_target)}</td>
                                        <td>{formatKpiPercent(row.availability_actual)}</td>
                                        <td>{formatKpiPercent(row.availability_target)}</td>
                                        <td>{formatKpiPercent(row.leadtime_actual)}</td>
                                        <td>{formatKpiPercent(row.leadtime_target)}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                    onClick={() => handleEdit(row)}
                                                    disabled={saving || deletingId === row.id}
                                                >
                                                    <i className="bi bi-pencil" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                    onClick={() => handleDelete(row)}
                                                    disabled={saving || deletingId === row.id}
                                                >
                                                    {deletingId === row.id
                                                        ? <span className="spinner-border spinner-border-sm" />
                                                        : <i className="bi bi-trash" />}
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

// ── Sub-form: Input Unit Performance ────────────────────────────────────────
function UnitPerformanceForm({ sites }) {
    const [unitModels, setUnitModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const [unitPerformances, setUnitPerformances] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [dataError, setDataError] = useState('');

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
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchUnitPerformances = async () => {
        try {
            setLoadingData(true);
            setDataError('');

            const response = await axiosClient.get(
                '/monthly-unit-performance'
            );

            setUnitPerformances(
                Array.isArray(response.data?.data)
                    ? response.data.data
                    : []
            );
        } catch (err) {
            console.error(
                'Gagal mengambil data performa unit:',
                err
            );

            setUnitPerformances([]);
            setDataError(
                err.response?.data?.message ??
                'Gagal mengambil data performa unit'
            );
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchUnitPerformances();
    }, []);

    useEffect(() => {
        if (!form.site_id) {
            setUnitModels([]);
            return;
        }

        setLoadingModels(true);

        axiosClient
            .get('/unit-models', {
                params: { site_id: form.site_id },
            })
            .then((response) => {
                setUnitModels(
                    Array.isArray(response.data?.data)
                        ? response.data.data
                        : []
                );
            })
            .catch(() => setUnitModels([]))
            .finally(() => setLoadingModels(false));
    }, [form.site_id]);

    const resetForm = () => {
        setForm({
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
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'site_id'
                ? { unit_model_id: '' }
                : {}),
        }));

        setResult(null);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);

        setForm({
            site_id: String(item.site_id ?? ''),
            unit_model_id: String(item.unit_model_id ?? ''),
            period_year: Number(item.period_year),
            period_month: Number(item.period_month),
            physical_availability:
                item.physical_availability !== null &&
                    item.physical_availability !== undefined
                    ? Number(item.physical_availability) * 100
                    : '',
            unit_availability:
                item.unit_availability !== null &&
                    item.unit_availability !== undefined
                    ? Number(item.unit_availability) * 100
                    : '',
            mtbf: item.mtbf ?? '',
            mttr: item.mttr ?? '',
            productivity: item.productivity ?? '',
            fuel_consumption: item.fuel_consumption ?? '',
        });

        setResult({
            type: 'success',
            message: `Mode edit aktif untuk ${item.model_name ?? 'unit'} periode ${item.period_month}/${item.period_year}`,
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const handleCancelEdit = () => {
        resetForm();
        setResult(null);
    };

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus data ${item.model_name ?? 'unit'} periode ${item.period_month}/${item.period_year}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(item.id);

            await axiosClient.delete(
                `/monthly-unit-performance/${item.id}`
            );

            if (editingId === item.id) {
                resetForm();
            }

            setResult({
                type: 'success',
                message: `Data ${item.model_name ?? 'unit'} berhasil dihapus.`,
            });

            await fetchUnitPerformances();
        } catch (err) {
            setResult({
                type: 'error',
                message:
                    err.response?.data?.message ??
                    'Gagal menghapus data performa unit',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.site_id) {
            setResult({
                type: 'error',
                message: 'Site wajib dipilih',
            });
            return;
        }

        if (!form.unit_model_id) {
            setResult({
                type: 'error',
                message: 'Model unit wajib dipilih',
            });
            return;
        }

        const payload = {
            unit_model_id: Number(form.unit_model_id),
            period_year: Number(form.period_year),
            period_month: Number(form.period_month),
            physical_availability:
                form.physical_availability !== ''
                    ? Number(form.physical_availability) / 100
                    : null,
            unit_availability:
                form.unit_availability !== ''
                    ? Number(form.unit_availability) / 100
                    : null,
            mtbf:
                form.mtbf !== ''
                    ? Number(form.mtbf)
                    : null,
            mttr:
                form.mttr !== ''
                    ? Number(form.mttr)
                    : null,
            productivity:
                form.productivity !== ''
                    ? Number(form.productivity)
                    : null,
            fuel_consumption:
                form.fuel_consumption !== ''
                    ? Number(form.fuel_consumption)
                    : null,
        };

        setSaving(true);

        try {
            if (editingId) {
                await axiosClient.put(
                    `/monthly-unit-performance/${editingId}`,
                    payload
                );
            } else {
                await axiosClient.post(
                    '/monthly-unit-performance',
                    payload
                );
            }

            setResult({
                type: 'success',
                message: editingId
                    ? 'Data Unit Performance berhasil diperbarui!'
                    : 'Data Unit Performance berhasil disimpan!',
            });

            resetForm();
            await fetchUnitPerformances();
        } catch (err) {
            setResult({
                type: 'error',
                message:
                    err.response?.data?.message ??
                    (editingId
                        ? 'Gagal memperbarui data Unit Performance'
                        : 'Gagal menyimpan data Unit Performance'),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-card p-4">
            <div
                className="fw-semibold mb-3 d-flex align-items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
            >
                <i className="bi bi-truck text-primary-custom" />
                Input Data Performa Unit Bulanan
            </div>

            {result && (
                <div
                    className={`alert alert-${result.type === 'success' ? 'success' : 'danger'} py-2 mb-3`}
                    role="alert"
                >
                    <i
                        className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}
                    />
                    {result.message}
                </div>
            )}

            {editingId && (
                <div className="alert alert-warning py-2 mb-3">
                    <i className="bi bi-pencil-square me-2" />
                    Kamu sedang mengedit data ID {editingId}.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">
                            Site <span className="text-danger">*</span>
                        </label>

                        <select
                            className="form-select"
                            name="site_id"
                            value={form.site_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Pilih Site</option>

                            {sites.map((site) => (
                                <option
                                    key={site.id}
                                    value={site.id}
                                >
                                    {site.site_code}
                                    {site.site_name
                                        ? ` - ${site.site_name}`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-4">
                        <label className="form-label small text-secondary">
                            Model Unit <span className="text-danger">*</span>
                        </label>

                        <select
                            className="form-select"
                            name="unit_model_id"
                            value={form.unit_model_id}
                            onChange={handleChange}
                            disabled={
                                !form.site_id ||
                                loadingModels
                            }
                            required
                        >
                            <option value="">
                                {!form.site_id
                                    ? 'Pilih site dahulu'
                                    : loadingModels
                                        ? 'Memuat…'
                                        : 'Pilih Model Unit'}
                            </option>

                            {unitModels.map((unit) => (
                                <option
                                    key={unit.id}
                                    value={unit.id}
                                >
                                    {unit.model_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label small text-secondary">
                            Bulan <span className="text-danger">*</span>
                        </label>

                        <select
                            className="form-select"
                            name="period_month"
                            value={form.period_month}
                            onChange={handleChange}
                        >
                            {MONTHS.map((monthItem) => (
                                <option
                                    key={monthItem.value}
                                    value={monthItem.value}
                                >
                                    {monthItem.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-md-2">
                        <label className="form-label small text-secondary">
                            Tahun <span className="text-danger">*</span>
                        </label>

                        <select
                            className="form-select"
                            name="period_year"
                            value={form.period_year}
                            onChange={handleChange}
                        >
                            {YEARS.map((yearItem) => (
                                <option
                                    key={yearItem}
                                    value={yearItem}
                                >
                                    {yearItem}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">
                            Availability (%)
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            Physical Availability
                        </label>

                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                name="physical_availability"
                                value={form.physical_availability}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="mis. 97.5"
                            />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            Unit Availability
                        </label>

                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                name="unit_availability"
                                value={form.unit_availability}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="mis. 96.8"
                            />
                            <span className="input-group-text">%</span>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">
                            MTBF & MTTR (jam)
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            MTBF
                        </label>

                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                name="mtbf"
                                value={form.mtbf}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                placeholder="mis. 250"
                            />
                            <span className="input-group-text">jam</span>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            MTTR
                        </label>

                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                name="mttr"
                                value={form.mttr}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                placeholder="mis. 4.5"
                            />
                            <span className="input-group-text">jam</span>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="small text-secondary fw-semibold mb-2">
                            Produktivitas & Fuel
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            Produktivitas
                        </label>

                        <input
                            type="number"
                            className="form-control form-control-sm"
                            name="productivity"
                            value={form.productivity}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            placeholder="mis. 85.3"
                        />
                    </div>

                    <div className="col-6 col-md-3">
                        <label className="form-label small text-secondary">
                            Fuel Consumption
                        </label>

                        <div className="input-group input-group-sm">
                            <input
                                type="number"
                                className="form-control"
                                name="fuel_consumption"
                                value={form.fuel_consumption}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                placeholder="mis. 12500"
                            />
                            <span className="input-group-text">L</span>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    {editingId && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleCancelEdit}
                            disabled={saving}
                        >
                            <i className="bi bi-x-circle me-1" />
                            Batal Edit
                        </button>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                        disabled={saving}
                    >
                        {saving && (
                            <span className="spinner-border spinner-border-sm" />
                        )}

                        <i className="bi bi-save" />

                        {saving
                            ? 'Menyimpan...'
                            : editingId
                                ? 'Simpan Perubahan'
                                : 'Simpan Data Unit'}
                    </button>
                </div>
            </form>

            <hr className="my-4" />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <div
                        className="fw-semibold"
                        style={{
                            color: 'var(--text-primary)',
                        }}
                    >
                        Data Performa Unit
                    </div>

                    <div className="small text-secondary">
                        Menampilkan 20 data terbaru
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={fetchUnitPerformances}
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

            {dataError && (
                <div className="alert alert-danger py-2">
                    <i className="bi bi-exclamation-triangle me-2" />
                    {dataError}
                </div>
            )}

            {loadingData ? (
                <div className="text-center py-4">
                    <span className="spinner-border spinner-border-sm me-2" />
                    Memuat data performa unit...
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th>Model Unit</th>
                                <th>Periode</th>
                                <th>PA</th>
                                <th>UA</th>
                                <th>MTBF</th>
                                <th>MTTR</th>
                                <th>Produktivitas</th>
                                <th>Fuel</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {unitPerformances
                                .slice(0, 20)
                                .map((item) => {
                                    const monthLabel =
                                        MONTHS.find(
                                            (monthItem) =>
                                                Number(monthItem.value) ===
                                                Number(item.period_month)
                                        )?.label ??
                                        item.period_month;

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                {item.site_code ?? '-'}
                                            </td>

                                            <td>
                                                {item.model_name ?? '-'}
                                            </td>

                                            <td>
                                                {monthLabel}{' '}
                                                {item.period_year}
                                            </td>

                                            <td>
                                                {item.physical_availability !== null &&
                                                    item.physical_availability !== undefined
                                                    ? `${(
                                                        Number(
                                                            item.physical_availability
                                                        ) * 100
                                                    ).toFixed(2)}%`
                                                    : '-'}
                                            </td>

                                            <td>
                                                {item.unit_availability !== null &&
                                                    item.unit_availability !== undefined
                                                    ? `${(
                                                        Number(
                                                            item.unit_availability
                                                        ) * 100
                                                    ).toFixed(2)}%`
                                                    : '-'}
                                            </td>

                                            <td>{item.mtbf ?? '-'}</td>
                                            <td>{item.mttr ?? '-'}</td>
                                            <td>{item.productivity ?? '-'}</td>
                                            <td>{item.fuel_consumption ?? '-'}</td>

                                            <td>
                                                <div className="d-flex gap-1">
                                                    <button
                                                        type="button"
                                                        className="btn btn-warning btn-sm"
                                                        title="Edit"
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            item.id
                                                        }
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        title="Hapus"
                                                        onClick={() =>
                                                            handleDelete(item)
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            item.id
                                                        }
                                                    >
                                                        {deletingId === item.id ? (
                                                            <span className="spinner-border spinner-border-sm" />
                                                        ) : (
                                                            <i className="bi bi-trash" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                            {unitPerformances.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="text-center text-secondary py-4"
                                    >
                                        Belum ada data performa unit.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
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