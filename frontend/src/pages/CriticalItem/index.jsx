import { useCallback, useEffect, useState } from 'react';

import { addNotification } from '../../utils/notification';
import { getSites } from '../../api/site.api';
import {
    getCriticalItems,
    createCriticalItem,
    updateCriticalItem,
    deleteCriticalItem,
} from '../../api/criticalItem.api';


const EMPTY_FORM = {
    site_id: '',
    parts_number: '',
    description: '',
    qty: 0,
    no_po: '',
    estimasi: '',
};


function createActivityNotification(notification) {
    try {
        addNotification(notification);
    } catch (notificationError) {
        console.error(
            'Gagal membuat notifikasi aktivitas:',
            notificationError
        );
    }
}

function CriticalItem() {
    const [sites, setSites] = useState([]);
    const [items, setItems] = useState([]);
    const [siteFilter, setSiteFilter] = useState('');

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 20;

    useEffect(() => {
        getSites()
            .then((data) => setSites(data ?? []))
            .catch(() => setError('Gagal memuat daftar site'));
    }, []);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = siteFilter
                ? { site_id: siteFilter }
                : {};

            const data = await getCriticalItems(params);
            setItems(data ?? []);
        } catch (err) {
            console.error(err);
            setItems([]);
            setError('Gagal memuat data critical item');
        } finally {
            setLoading(false);
        }
    }, [siteFilter]);

    useEffect(() => {
        setCurrentPage(1);
        fetchItems();
    }, [fetchItems]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: name === 'qty' ? Number(value) : value,
        }));
    }

    function resetForm() {
        setForm(EMPTY_FORM);
        setEditingId(null);
    }

    function handleEdit(item) {
        setEditingId(item.id);

        setForm({
            site_id: String(item.site_id ?? ''),
            parts_number: item.parts_number ?? '',
            description: item.description ?? '',
            qty: Number(item.qty ?? 0),
            no_po: item.no_po ?? '',
            estimasi: item.estimasi
                ? String(item.estimasi).slice(0, 10)
                : '',
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.site_id || !form.parts_number.trim()) {
            setError('Site dan parts number wajib diisi');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        const payload = {
            site_id: Number(form.site_id),
            parts_number: form.parts_number.trim(),
            description: form.description.trim() || null,
            qty: Number(form.qty || 0),
            no_po: form.no_po.trim() || null,
            estimasi: form.estimasi || null,
        };

        try {
            if (editingId) {
                await updateCriticalItem(editingId, payload);

                createActivityNotification({
                    title: 'Critical Item Diperbarui',
                    message: `${payload.parts_number} berhasil diperbarui`,
                    type: 'warning',
                    link: '/critical-items',
                });

                setMessage('Critical item berhasil diperbarui');
            } else {
                await createCriticalItem(payload);

                createActivityNotification({
                    title: 'Critical Item Ditambahkan',
                    message: `${payload.parts_number} berhasil ditambahkan`,
                    type: 'danger',
                    link: '/critical-items',
                });

                setMessage('Critical item berhasil ditambahkan');
            }

            resetForm();

            // Ambil ulang data agar tabel langsung berubah tanpa refresh browser.
            await fetchItems();

            // Perbarui ringkasan operasional pada Navbar.
            window.dispatchEvent(
                new CustomEvent('dashboard-data-changed')
            );
        } catch (err) {
            console.error(
                'Gagal menyimpan critical item:',
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                'Data critical item gagal disimpan'
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(item) {
        const confirmed = window.confirm(
            `Hapus critical item ${item.parts_number}?`
        );

        if (!confirmed) return;

        setError(null);
        setMessage(null);
        setDeletingId(item.id);

        try {
            await deleteCriticalItem(item.id);

            createActivityNotification({
                title: 'Critical Item Dihapus',
                message: `${item.parts_number} berhasil dihapus`,
                type: 'info',
                link: '/critical-items',
            });

            setMessage('Critical item berhasil dihapus');

            // Ambil ulang data agar tabel langsung berubah tanpa refresh browser.
            await fetchItems();

            // Perbarui ringkasan operasional pada Navbar.
            window.dispatchEvent(
                new CustomEvent('dashboard-data-changed')
            );
        } catch (err) {
            console.error(
                'Gagal menghapus critical item:',
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                'Critical item gagal dihapus'
            );
        } finally {
            setDeletingId(null);
        }
    }

    function formatEstimasi(value) {
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

    const totalPages = Math.max(
        1,
        Math.ceil(items.length / rowsPerPage)
    );

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const paginatedItems = items.slice(startIndex, endIndex);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div>
            <div className="mb-3">
                <h4
                    className="fw-bold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Critical Item
                </h4>

                <p className="text-secondary mb-0">
                    Kelola spare part kritis untuk setiap site.
                </p>
            </div>

            {message && (
                <div className="alert alert-success py-2">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-danger py-2">
                    {error}
                </div>
            )}

            <div className="app-card p-3 mb-4">
                <h6
                    className="fw-semibold mb-3"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {editingId
                        ? 'Edit Critical Item'
                        : 'Tambah Critical Item'}
                </h6>

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
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Qty
                            </label>

                            <input
                                type="number"
                                min="0"
                                className="form-control"
                                name="qty"
                                value={form.qty}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="form-label">
                                Deskripsi
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-12 col-md-3">
                            <label className="form-label">
                                No. PO
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="no_po"
                                value={form.no_po}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-12 col-md-3">
                            <label className="form-label">
                                Estimasi
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="estimasi"
                                value={form.estimasi}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="d-flex gap-2 mt-3">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? 'Menyimpan...'
                                : editingId
                                    ? 'Simpan Perubahan'
                                    : 'Tambah Data'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="app-card p-3">
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
                    <h6
                        className="fw-semibold mb-0"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Daftar Critical Item
                    </h6>

                    <select
                        className="form-select"
                        style={{ maxWidth: 230 }}
                        value={siteFilter}
                        onChange={(event) =>
                            setSiteFilter(event.target.value)
                        }
                    >
                        <option value="">Semua Site</option>

                        {sites.map((site) => (
                            <option
                                key={site.id}
                                value={site.id}
                            >
                                {site.site_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="table-responsive">
                    <table className="table align-middle">
                        <thead>
                            <tr>
                                <th>Site</th>
                                <th>Parts Number</th>
                                <th>Deskripsi</th>
                                <th className="text-center">
                                    Qty
                                </th>
                                <th>No. PO</th>
                                <th>Estimasi</th>
                                <th className="text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center py-4"
                                    >
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center text-muted py-4"
                                    >
                                        Belum ada data critical item
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            {item.site_code ?? '-'}
                                        </td>

                                        <td className="fw-semibold">
                                            {item.parts_number}
                                        </td>

                                        <td>
                                            {item.description ?? '-'}
                                        </td>

                                        <td className="text-center">
                                            {item.qty ?? 0}
                                        </td>

                                        <td>
                                            {item.no_po ?? '-'}
                                        </td>

                                        <td>
                                            {formatEstimasi(
                                                item.estimasi
                                            )}
                                        </td>

                                        <td className="text-center">
                                            <div className="d-inline-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                    onClick={() =>
                                                        handleEdit(item)
                                                    }
                                                    disabled={
                                                        saving ||
                                                        deletingId === item.id
                                                    }
                                                >
                                                    <i className="bi bi-pencil" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                    onClick={() =>
                                                        handleDelete(item)
                                                    }
                                                    disabled={
                                                        saving ||
                                                        deletingId === item.id
                                                    }
                                                >
                                                    {deletingId === item.id ? (
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

                    {!loading && items.length > 0 && (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                            <small className="text-secondary">
                                Menampilkan{' '}
                                {items.length === 0
                                    ? 0
                                    : startIndex + 1}
                                {' - '}
                                {Math.min(endIndex, items.length)}
                                {' dari '}
                                {items.length} data
                            </small>

                            <nav aria-label="Pagination Critical Item">
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
        </div>
    );
}

export default CriticalItem;