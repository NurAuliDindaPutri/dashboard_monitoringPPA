import { useCallback, useEffect, useMemo, useState } from 'react';

import KpiCard from '../../components/common/KpiCard';
import FilterBar from '../../components/common/FilterBar';

import axiosClient from '../../api/axiosClient';
import { getSites } from '../../api/site.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

const EMPTY_FORM = {
    site_id: '',
    parts_number: '',
    description: '',
    qty: '',
    no_po: '',
    eta: '',
    remarks: '',
};

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

function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function PendingSupply() {
    const [sites, setSites] = useState([]);
    const [siteId, setSiteId] = useState('');

    const [pendingRows, setPendingRows] = useState([]);

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingPending, setLoadingPending] = useState(true);
    const [errorPending, setErrorPending] = useState(null);
    const [message, setMessage] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    useEffect(() => {
        if (!message) return undefined;

        const timer = setTimeout(() => {
            setMessage(null);
        }, 4000);

        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        if (!errorPending) return undefined;

        const timer = setTimeout(() => {
            setErrorPending(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [errorPending]);

    useEffect(() => {
        (async () => {
            try {
                setLoadingSites(true);

                const response = await getSites();
                setSites(extractRows(response));
            } catch (err) {
                console.error('Gagal memuat daftar site', err);
                setSites([]);
                setErrorPending('Gagal memuat daftar site.');
            } finally {
                setLoadingSites(false);
            }
        })();
    }, []);

    const fetchPendingSupply = useCallback(async () => {
        try {
            setLoadingPending(true);
            setErrorPending(null);

            const params = siteId
                ? { site_id: siteId }
                : {};

            const response = await getPendingSupply(params);
            const rows = extractRows(response);

            const sortedRows = [...rows].sort((a, b) => {
                const updatedA = new Date(
                    a.updated_at || a.created_at || 0
                ).getTime();

                const updatedB = new Date(
                    b.updated_at || b.created_at || 0
                ).getTime();

                if (updatedB !== updatedA) {
                    return updatedB - updatedA;
                }

                return Number(b.id) - Number(a.id);
            });

            setPendingRows(sortedRows);
        } catch (err) {
            console.error(
                'Gagal memuat data pending supply',
                err
            );

            setErrorPending(
                err.response?.data?.message ||
                'Gagal memuat data dari server. Silakan coba lagi.'
            );

            setPendingRows([]);
        } finally {
            setLoadingPending(false);
        }
    }, [siteId]);

    useEffect(() => {
        setCurrentPage(1);
        fetchPendingSupply();
    }, [fetchPendingSupply]);

    const totalQty = useMemo(
        () =>
            pendingRows.reduce(
                (sum, row) =>
                    sum + (Number(row.qty) || 0),
                0
            ),
        [pendingRows]
    );

    const totalPages = Math.max(
        1,
        Math.ceil(pendingRows.length / rowsPerPage)
    );

    const startIndex =
        (currentPage - 1) * rowsPerPage;

    const endIndex = startIndex + rowsPerPage;

    const paginatedRows = pendingRows.slice(
        startIndex,
        endIndex
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    function resetForm() {
        setForm({ ...EMPTY_FORM });
        setEditingId(null);
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleEdit(row) {
        setEditingId(row.id);

        setForm({
            site_id: String(row.site_id ?? ''),
            parts_number: row.parts_number ?? '',
            description: row.description ?? '',
            qty: row.qty ?? '',
            no_po: row.no_po ?? '',
            eta: row.eta
                ? String(row.eta).slice(0, 10)
                : '',
            remarks: row.remarks ?? '',
        });

        setMessage(null);
        setErrorPending(null);

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    function handleCancelEdit() {
        resetForm();
        setMessage(null);
        setErrorPending(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.site_id) {
            setErrorPending('Site wajib dipilih.');
            return;
        }

        if (!form.parts_number.trim()) {
            setErrorPending('Parts Number wajib diisi.');
            return;
        }

        if (
            form.qty !== '' &&
            (
                !Number.isFinite(Number(form.qty)) ||
                Number(form.qty) < 0
            )
        ) {
            setErrorPending(
                'Qty harus berupa angka 0 atau lebih.'
            );
            return;
        }

        const payload = {
            site_id: Number(form.site_id),
            parts_number: form.parts_number.trim(),
            description:
                form.description.trim() || null,
            qty:
                form.qty !== ''
                    ? Number(form.qty)
                    : 0,
            no_po: form.no_po.trim() || null,
            eta: form.eta || null,
            remarks: form.remarks.trim() || null,
        };

        const selectedSite = sites.find(
            (site) =>
                String(site.id) ===
                String(form.site_id)
        );

        const siteLabel =
            selectedSite?.site_code ?? '-';

        try {
            setSaving(true);
            setMessage(null);
            setErrorPending(null);

            if (editingId) {
                await axiosClient.put(
                    `/pending-supply/${editingId}`,
                    payload
                );

                setMessage(
                    `Pending Supply ${payload.parts_number} site ${siteLabel} berhasil diperbarui.`
                );
            } else {
                await axiosClient.post(
                    '/pending-supply',
                    payload
                );

                setMessage(
                    `Pending Supply ${payload.parts_number} site ${siteLabel} berhasil disimpan.`
                );
            }

            resetForm();
            await fetchPendingSupply();
        } catch (err) {
            console.error(
                'Gagal menyimpan Pending Supply:',
                err
            );

            setErrorPending(
                err.response?.data?.message ||
                (
                    editingId
                        ? 'Gagal memperbarui Pending Supply.'
                        : 'Gagal menyimpan Pending Supply.'
                )
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(row) {
        const confirmed = window.confirm(
            `Yakin ingin menghapus Pending Supply part ${row.parts_number} site ${row.site_code ?? '-'}?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(row.id);
            setMessage(null);
            setErrorPending(null);

            await axiosClient.delete(
                `/pending-supply/${row.id}`
            );

            if (editingId === row.id) {
                resetForm();
            }

            setMessage(
                `Pending Supply ${row.parts_number} site ${row.site_code ?? '-'} berhasil dihapus.`
            );

            await fetchPendingSupply();
        } catch (err) {
            console.error(
                'Gagal menghapus Pending Supply:',
                err
            );

            setErrorPending(
                err.response?.data?.message ||
                'Gagal menghapus Pending Supply.'
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div>
            <div className="mb-3">
                <h4 className="fw-semibold mb-1">
                    Pending Supply
                </h4>

                <p className="text-secondary mb-0">
                    Daftar part yang masih menunggu
                    kedatangan/pengiriman.
                </p>
            </div>

            {message && (
                <div
                    className="alert alert-success d-flex align-items-center gap-2 py-2"
                    role="alert"
                >
                    <i className="bi bi-check-circle" />
                    <span>{message}</span>
                </div>
            )}

            {errorPending && (
                <div
                    className="alert alert-danger d-flex align-items-center gap-2 py-2"
                    role="alert"
                >
                    <i className="bi bi-exclamation-triangle" />
                    <span>{errorPending}</span>
                </div>
            )}

            <div className="app-card p-4 mb-3">
                <div
                    className="fw-semibold mb-3 d-flex align-items-center gap-2"
                    style={{
                        color: 'var(--text-primary)',
                    }}
                >
                    <i className="bi bi-hourglass-split text-primary-custom" />

                    {editingId
                        ? 'Edit Pending Supply'
                        : 'Tambah Pending Supply'}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Site
                            </label>

                            <select
                                className="form-select"
                                name="site_id"
                                value={form.site_id}
                                onChange={handleChange}
                                required
                                disabled={
                                    saving || loadingSites
                                }
                            >
                                <option value="">
                                    Pilih site
                                </option>

                                {sites.map((site) => (
                                    <option
                                        key={site.id}
                                        value={site.id}
                                    >
                                        {site.site_code}
                                        {site.site_name
                                            ? ` — ${site.site_name}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Parts Number
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="parts_number"
                                value={form.parts_number}
                                onChange={handleChange}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Deskripsi
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label">
                                Qty
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                className="form-control"
                                name="qty"
                                value={form.qty}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="col-6 col-md-3">
                            <label className="form-label">
                                No. PO
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="no_po"
                                value={form.no_po}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="col-6 col-md-3">
                            <label className="form-label">
                                ETA
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="eta"
                                value={form.eta}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Keterangan
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="remarks"
                                value={form.remarks}
                                onChange={handleChange}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                <i className="bi bi-x-circle" />
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

                            {editingId
                                ? 'Simpan Perubahan'
                                : 'Simpan Pending Supply'}
                        </button>
                    </div>
                </form>
            </div>

            <FilterBar
                sites={sites}
                siteId={siteId}
                onSiteChange={setSiteId}
                showMonthFilter={false}
                showYearFilter={false}
            />

            <div className="row g-3 mb-3">
                <div className="col-6 col-md-3">
                    <KpiCard
                        icon="bi-box-seam"
                        label="Total Item Pending"
                        value={
                            loadingPending
                                ? ''
                                : pendingRows.length
                        }
                        loading={
                            loadingPending ||
                            loadingSites
                        }
                        variant="warning"
                    />
                </div>

                <div className="col-6 col-md-3">
                    <KpiCard
                        icon="bi-boxes"
                        label="Total Qty Pending"
                        value={
                            loadingPending
                                ? ''
                                : totalQty
                        }
                        loading={
                            loadingPending ||
                            loadingSites
                        }
                        variant="primary"
                    />
                </div>
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
                            Daftar Pending Supply
                        </div>

                        <div className="small text-secondary mt-1">
                            Menampilkan{' '}
                            {pendingRows.length === 0
                                ? 0
                                : startIndex + 1}
                            {' - '}
                            {Math.min(
                                endIndex,
                                pendingRows.length
                            )}
                            {' dari '}
                            {pendingRows.length} data
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={fetchPendingSupply}
                        disabled={loadingPending}
                    >
                        {loadingPending ? (
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
                                <th>Parts Number</th>
                                <th>Deskripsi</th>
                                <th className="text-end">
                                    Qty
                                </th>
                                <th>No. PO</th>
                                <th>ETA</th>
                                <th>Keterangan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingPending ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center py-4"
                                    >
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : pendingRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center text-muted py-4"
                                    >
                                        Belum ada data pending supply
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {row.site_code ?? '-'}
                                        </td>

                                        <td className="fw-semibold">
                                            {row.parts_number ?? '-'}
                                        </td>

                                        <td>
                                            {row.description ?? '-'}
                                        </td>

                                        <td className="text-end">
                                            {row.qty ?? 0}
                                        </td>

                                        <td>
                                            {row.no_po ?? '-'}
                                        </td>

                                        <td>
                                            {formatDate(row.eta)}
                                        </td>

                                        <td>
                                            {row.remarks ?? '-'}
                                        </td>

                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                    onClick={() =>
                                                        handleEdit(row)
                                                    }
                                                    disabled={
                                                        saving ||
                                                        deletingId ===
                                                        row.id
                                                    }
                                                >
                                                    <i className="bi bi-pencil" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                    onClick={() =>
                                                        handleDelete(row)
                                                    }
                                                    disabled={
                                                        saving ||
                                                        deletingId ===
                                                        row.id
                                                    }
                                                >
                                                    {deletingId ===
                                                        row.id ? (
                                                        <span className="spinner-border spinner-border-sm" />
                                                    ) : (
                                                        <i className="bi bi-trash" />
                                                    )}

                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!loadingPending &&
                        pendingRows.length > 0 && (
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                                <small className="text-secondary">
                                    Halaman {currentPage} dari{' '}
                                    {totalPages}
                                </small>

                                <nav aria-label="Pagination Pending Supply">
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
                                                    setCurrentPage(
                                                        (page) =>
                                                            Math.max(
                                                                1,
                                                                page - 1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage === 1
                                                }
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <i className="bi bi-chevron-left" />
                                            </button>
                                        </li>

                                        {Array.from(
                                            {
                                                length: totalPages,
                                            },
                                            (_, index) =>
                                                index + 1
                                        ).map(
                                            (pageNumber) => (
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
                                                        (page) =>
                                                            Math.min(
                                                                totalPages,
                                                                page + 1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    totalPages
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
        </div>
    );
}

export default PendingSupply;
