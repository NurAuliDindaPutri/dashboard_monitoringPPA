import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import KpiCard from '../../components/common/KpiCard';
import FilterBar from '../../components/common/FilterBar';
import ChartCard from '../../components/common/ChartCard';

import axiosClient from '../../api/axiosClient';
import { getSites } from '../../api/site.api';
import { getPendingSupply } from '../../api/pendingSupply.api';

import {
    addNotification,
} from '../../utils/notification';

import {
    dummySites,
    dummyPendingSupply,
} from '../../data/dummyData';

const EMPTY_EDIT_FORM = {
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

    const dateOnly = String(value).slice(0, 10);
    const [year, month, day] =
        dateOnly.split('-').map(Number);

    if (!year || !month || !day) {
        return '-';
    }

    const date = new Date(
        year,
        month - 1,
        day
    );

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function getEtaStatus(etaValue) {
    if (!etaValue) {
        return 'Tanpa ETA';
    }

    const eta = new Date(
        `${String(etaValue).slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(eta.getTime())) {
        return 'Tanpa ETA';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const soonLimit = new Date(today);
    soonLimit.setDate(soonLimit.getDate() + 7);

    if (eta < today) {
        return 'Terlambat';
    }

    if (eta <= soonLimit) {
        return 'Jatuh Tempo ≤ 7 Hari';
    }

    return 'Masih Aman';
}

function PendingSupply() {
    const [sites, setSites] = useState([]);
    const [siteId, setSiteId] = useState('');

    const [pendingRows, setPendingRows] =
        useState([]);

    const [loadingSites, setLoadingSites] =
        useState(true);

    const [loadingPending, setLoadingPending] =
        useState(true);

    const [errorPending, setErrorPending] =
        useState(null);

    const [dataSource, setDataSource] =
        useState('database');

    const [message, setMessage] =
        useState(null);

    const [editingRow, setEditingRow] =
        useState(null);

    const [form, setForm] = useState({
        ...EMPTY_EDIT_FORM,
    });

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState(null);

    const [currentPage, setCurrentPage] =
        useState(1);

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
        let active = true;

        async function fetchSites() {
            try {
                setLoadingSites(true);

                const response =
                    await getSites();

                if (active) {
                    setSites(
                        extractRows(response)
                    );
                }
            } catch (error) {
                console.error(
                    'Gagal memuat daftar site:',
                    error
                );

                if (active) {
                    setSites(dummySites);
                }
            } finally {
                if (active) {
                    setLoadingSites(false);
                }
            }
        }

        fetchSites();

        return () => {
            active = false;
        };
    }, []);

    const fetchPendingSupply =
        useCallback(async () => {
            try {
                setLoadingPending(true);
                setErrorPending(null);

                const params = siteId
                    ? { site_id: siteId }
                    : {};

                const response =
                    await getPendingSupply(
                        params
                    );

                const rows =
                    extractRows(response);

                const sortedRows =
                    [...rows].sort((a, b) => {
                        const updatedA =
                            new Date(
                                a.updated_at ||
                                a.created_at ||
                                0
                            ).getTime();

                        const updatedB =
                            new Date(
                                b.updated_at ||
                                b.created_at ||
                                0
                            ).getTime();

                        if (
                            updatedB !==
                            updatedA
                        ) {
                            return (
                                updatedB -
                                updatedA
                            );
                        }

                        return (
                            Number(b.id) -
                            Number(a.id)
                        );
                    });

                setPendingRows(
                    sortedRows
                );

                setDataSource('database');
            } catch (error) {
                console.warn(
                    'Backend tidak aktif. Menggunakan data dummy Pending Supply:',
                    error
                );

                const filteredDummy =
                    dummyPendingSupply.filter(
                        (row) =>
                            !siteId ||
                            String(row.site_id) ===
                            String(siteId)
                    );

                const sortedDummy =
                    [...filteredDummy].sort(
                        (a, b) =>
                            new Date(
                                b.updated_at ||
                                b.created_at ||
                                0
                            ).getTime() -
                            new Date(
                                a.updated_at ||
                                a.created_at ||
                                0
                            ).getTime()
                    );

                setPendingRows(sortedDummy);
                setDataSource('dummy');
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
                (total, row) =>
                    total +
                    (Number(row.qty) ||
                        0),
                0
            ),
        [pendingRows]
    );

    const lateRows = useMemo(
        () =>
            pendingRows.filter(
                (row) =>
                    getEtaStatus(
                        row.eta
                    ) === 'Terlambat'
            ),
        [pendingRows]
    );

    const dueSoonRows = useMemo(
        () =>
            pendingRows.filter(
                (row) =>
                    getEtaStatus(
                        row.eta
                    ) ===
                    'Jatuh Tempo ≤ 7 Hari'
            ),
        [pendingRows]
    );

    const chartBySite = useMemo(() => {
        const grouped = new Map();

        pendingRows.forEach((row) => {
            const site =
                row.site_code ||
                `Site ${row.site_id}`;

            const current =
                grouped.get(site) || {
                    site,
                    'Jumlah Item': 0,
                    'Total Qty': 0,
                };

            current['Jumlah Item'] += 1;
            current['Total Qty'] +=
                Number(row.qty) || 0;

            grouped.set(site, current);
        });

        return Array.from(
            grouped.values()
        ).sort(
            (a, b) =>
                b['Total Qty'] -
                a['Total Qty']
        );
    }, [pendingRows]);

    const chartByEtaStatus = useMemo(() => {
        const statusMap = {
            Terlambat: 0,
            'Jatuh Tempo ≤ 7 Hari': 0,
            'Masih Aman': 0,
            'Tanpa ETA': 0,
        };

        pendingRows.forEach((row) => {
            const status = getEtaStatus(
                row.eta
            );

            statusMap[status] += 1;
        });

        return Object.entries(
            statusMap
        ).map(([status, count]) => ({
            status,
            'Jumlah Item': count,
        }));
    }, [pendingRows]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            pendingRows.length /
            rowsPerPage
        )
    );

    const startIndex =
        (currentPage - 1) *
        rowsPerPage;

    const endIndex =
        startIndex + rowsPerPage;

    const paginatedRows =
        pendingRows.slice(
            startIndex,
            endIndex
        );

    useEffect(() => {
        if (
            currentPage >
            totalPages
        ) {
            setCurrentPage(
                totalPages
            );
        }
    }, [currentPage, totalPages]);

    function openEditModal(row) {
        if (dataSource === 'dummy') {
            setErrorPending(
                'Data dummy hanya untuk tampilan. Edit tersedia saat backend/database aktif.'
            );
            return;
        }

        setEditingRow(row);

        setForm({
            site_id: String(
                row.site_id ?? ''
            ),
            parts_number:
                row.parts_number ?? '',
            description:
                row.description ?? '',
            qty:
                row.qty !== null &&
                    row.qty !== undefined
                    ? String(row.qty)
                    : '',
            no_po: row.no_po ?? '',
            eta: row.eta
                ? String(
                    row.eta
                ).slice(0, 10)
                : '',
            remarks:
                row.remarks ?? '',
        });

        setMessage(null);
        setErrorPending(null);
    }

    function closeEditModal() {
        if (saving) return;

        setEditingRow(null);
        setForm({
            ...EMPTY_EDIT_FORM,
        });
    }

    function handleFormChange(
        event
    ) {
        const { name, value } =
            event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleUpdate(
        event
    ) {
        event.preventDefault();

        if (!editingRow) return;

        if (dataSource === 'dummy') {
            setErrorPending(
                'Data dummy tidak dapat disimpan ke database.'
            );
            return;
        }

        if (!form.site_id) {
            setErrorPending(
                'Site wajib dipilih.'
            );
            return;
        }

        if (
            !form.parts_number.trim()
        ) {
            setErrorPending(
                'Parts Number wajib diisi.'
            );
            return;
        }

        if (
            form.qty !== '' &&
            (!Number.isFinite(
                Number(form.qty)
            ) ||
                Number(form.qty) < 0)
        ) {
            setErrorPending(
                'Qty harus berupa angka 0 atau lebih.'
            );
            return;
        }

        const payload = {
            site_id: Number(
                form.site_id
            ),
            parts_number:
                form.parts_number.trim(),
            description:
                form.description.trim() ||
                null,
            qty:
                form.qty !== ''
                    ? Number(form.qty)
                    : 0,
            no_po:
                form.no_po.trim() ||
                null,
            eta: form.eta || null,
            remarks:
                form.remarks.trim() ||
                null,
        };

        const selectedSite =
            sites.find(
                (site) =>
                    String(site.id) ===
                    String(
                        form.site_id
                    )
            );

        const siteLabel =
            selectedSite?.site_code ??
            '-';

        try {
            setSaving(true);
            setErrorPending(null);

            await axiosClient.put(
                `/pending-supply/${editingRow.id}`,
                payload
            );

            addNotification({
                title:
                    'Pending Supply diperbarui',
                message: `Part ${payload.parts_number} site ${siteLabel} berhasil diperbarui.`,
                type: 'warning',
                link: '/pending-supply',
            });

            window.dispatchEvent(
                new CustomEvent(
                    'dashboard-data-changed'
                )
            );

            setMessage(
                `Pending Supply ${payload.parts_number} berhasil diperbarui.`
            );

            closeEditModal();
            await fetchPendingSupply();
        } catch (error) {
            console.error(
                'Gagal memperbarui Pending Supply:',
                error
            );

            setErrorPending(
                error.response?.data
                    ?.message ||
                'Gagal memperbarui Pending Supply.'
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(row) {
        if (dataSource === 'dummy') {
            setErrorPending(
                'Data dummy hanya untuk tampilan dan tidak dapat dihapus.'
            );
            return;
        }

        const confirmed =
            window.confirm(
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

            addNotification({
                title:
                    'Pending Supply dihapus',
                message: `Part ${row.parts_number} site ${row.site_code ?? '-'} berhasil dihapus.`,
                type: 'danger',
                link: '/pending-supply',
            });

            window.dispatchEvent(
                new CustomEvent(
                    'dashboard-data-changed'
                )
            );

            setMessage(
                `Pending Supply ${row.parts_number} berhasil dihapus.`
            );

            await fetchPendingSupply();
        } catch (error) {
            console.error(
                'Gagal menghapus Pending Supply:',
                error
            );

            setErrorPending(
                error.response?.data
                    ?.message ||
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
                    Monitoring part yang masih
                    menunggu kedatangan atau
                    pengiriman.
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
                    <span>
                        {errorPending}
                    </span>
                </div>
            )}

            {dataSource === 'dummy' && (
                <div
                    className="alert alert-warning d-flex align-items-center gap-2 py-2"
                    role="alert"
                >
                    <i className="bi bi-database-exclamation" />
                    <span>
                        Backend atau database tidak terhubung. Halaman sedang menampilkan data dummy. Fitur edit dan hapus dinonaktifkan.
                    </span>
                </div>
            )}

            <FilterBar
                sites={sites}
                siteId={siteId}
                onSiteChange={setSiteId}
                showMonthFilter={false}
                showYearFilter={false}
            />

            <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3">
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

                <div className="col-6 col-lg-3">
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

                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-exclamation-triangle"
                        label="Melewati ETA"
                        value={
                            loadingPending
                                ? ''
                                : lateRows.length
                        }
                        loading={loadingPending}
                        variant="danger"
                    />
                </div>

                <div className="col-6 col-lg-3">
                    <KpiCard
                        icon="bi-clock-history"
                        label="Jatuh Tempo ≤ 7 Hari"
                        value={
                            loadingPending
                                ? ''
                                : dueSoonRows.length
                        }
                        loading={loadingPending}
                        variant="warning"
                    />
                </div>
            </div>

            <div className="row g-3 mb-3">
                <div className="col-12 col-lg-7">
                    <ChartCard
                        title="Distribusi Pending Supply per Site"
                        type="bar"
                        data={chartBySite}
                        xKey="site"
                        series={[
                            {
                                key: 'Jumlah Item',
                                label:
                                    'Jumlah Item',
                            },
                            {
                                key: 'Total Qty',
                                label:
                                    'Total Qty',
                            },
                        ]}
                        loading={
                            loadingPending
                        }
                        height={260}
                    />
                </div>

                <div className="col-12 col-lg-5">
                    <ChartCard
                        title="Status ETA Pending Supply"
                        type="bar"
                        data={chartByEtaStatus}
                        xKey="status"
                        series={[
                            {
                                key: 'Jumlah Item',
                                label:
                                    'Jumlah Item',
                            },
                        ]}
                        loading={
                            loadingPending
                        }
                        height={260}
                    />
                </div>
            </div>

            <div className="app-card p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <div
                            className="fw-semibold d-flex align-items-center gap-2"
                            style={{
                                color:
                                    'var(--text-primary)',
                            }}
                        >
                            <i className="bi bi-table text-primary-custom" />
                            Daftar Pending Supply
                        </div>

                        <div className="small text-secondary mt-1">
                            Menampilkan{' '}
                            {pendingRows.length ===
                                0
                                ? 0
                                : startIndex +
                                1}
                            {' - '}
                            {Math.min(
                                endIndex,
                                pendingRows.length
                            )}
                            {' dari '}
                            {
                                pendingRows.length
                            }{' '}
                            data
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={
                            fetchPendingSupply
                        }
                        disabled={
                            loadingPending
                        }
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
                                    fontSize:
                                        '0.8rem',
                                }}
                            >
                                <th>Site</th>
                                <th>
                                    Parts Number
                                </th>
                                <th>
                                    Deskripsi
                                </th>
                                <th className="text-end">
                                    Qty
                                </th>
                                <th>
                                    No. PO
                                </th>
                                <th>ETA</th>
                                <th>
                                    Status ETA
                                </th>
                                <th>
                                    Keterangan
                                </th>
                                <th>Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingPending ? (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="text-center py-4"
                                    >
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : pendingRows.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="text-center text-muted py-4"
                                    >
                                        Belum ada data
                                        pending supply
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map(
                                    (row) => {
                                        const etaStatus =
                                            getEtaStatus(
                                                row.eta
                                            );

                                        const badgeClass =
                                            etaStatus ===
                                                'Terlambat'
                                                ? 'text-bg-danger'
                                                : etaStatus ===
                                                    'Jatuh Tempo ≤ 7 Hari'
                                                    ? 'text-bg-warning'
                                                    : etaStatus ===
                                                        'Masih Aman'
                                                        ? 'text-bg-success'
                                                        : 'text-bg-secondary';

                                        return (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                <td>
                                                    {row.site_code ??
                                                        '-'}
                                                </td>

                                                <td className="fw-semibold">
                                                    {row.parts_number ??
                                                        '-'}
                                                </td>

                                                <td>
                                                    {row.description ??
                                                        '-'}
                                                </td>

                                                <td className="text-end">
                                                    {row.qty ??
                                                        0}
                                                </td>

                                                <td>
                                                    {row.no_po ??
                                                        '-'}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        row.eta
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`badge ${badgeClass}`}
                                                    >
                                                        {
                                                            etaStatus
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {row.remarks ??
                                                        '-'}
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    row
                                                                )
                                                            }
                                                            disabled={
                                                                dataSource ===
                                                                'dummy' ||
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
                                                                handleDelete(
                                                                    row
                                                                )
                                                            }
                                                            disabled={
                                                                dataSource ===
                                                                'dummy' ||
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
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>

                    {!loadingPending &&
                        pendingRows.length >
                        0 && (
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-3">
                                <small className="text-secondary">
                                    Halaman{' '}
                                    {
                                        currentPage
                                    }{' '}
                                    dari{' '}
                                    {totalPages}
                                </small>

                                <nav aria-label="Pagination Pending Supply">
                                    <ul className="pagination pagination-sm mb-0">
                                        <li
                                            className={`page-item ${currentPage ===
                                                1
                                                ? 'disabled'
                                                : ''
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                className="page-link"
                                                onClick={() =>
                                                    setCurrentPage(
                                                        (
                                                            page
                                                        ) =>
                                                            Math.max(
                                                                1,
                                                                page -
                                                                1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    1
                                                }
                                            >
                                                <i className="bi bi-chevron-left" />
                                            </button>
                                        </li>

                                        {Array.from(
                                            {
                                                length:
                                                    totalPages,
                                            },
                                            (
                                                _,
                                                index
                                            ) =>
                                                index +
                                                1
                                        ).map(
                                            (
                                                pageNumber
                                            ) => (
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
                                                        (
                                                            page
                                                        ) =>
                                                            Math.min(
                                                                totalPages,
                                                                page +
                                                                1
                                                            )
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    totalPages
                                                }
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

            {editingRow && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div>
                                        <h5 className="modal-title">
                                            Edit Pending
                                            Supply
                                        </h5>

                                        <small className="text-secondary">
                                            Perbarui data
                                            part tanpa
                                            menambah data
                                            baru.
                                        </small>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={
                                            closeEditModal
                                        }
                                        disabled={
                                            saving
                                        }
                                        aria-label="Tutup"
                                    />
                                </div>

                                <form
                                    onSubmit={
                                        handleUpdate
                                    }
                                >
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label">
                                                    Site
                                                </label>

                                                <select
                                                    className="form-select"
                                                    name="site_id"
                                                    value={
                                                        form.site_id
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving ||
                                                        loadingSites
                                                    }
                                                    required
                                                >
                                                    <option value="">
                                                        Pilih site
                                                    </option>

                                                    {sites.map(
                                                        (
                                                            site
                                                        ) => (
                                                            <option
                                                                key={
                                                                    site.id
                                                                }
                                                                value={
                                                                    site.id
                                                                }
                                                            >
                                                                {
                                                                    site.site_code
                                                                }
                                                                {site.site_name
                                                                    ? ` — ${site.site_name}`
                                                                    : ''}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label className="form-label">
                                                    Parts
                                                    Number
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="parts_number"
                                                    value={
                                                        form.parts_number
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    required
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
                                                    value={
                                                        form.description
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />
                                            </div>

                                            <div className="col-6 col-md-3">
                                                <label className="form-label">
                                                    Qty
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="form-control"
                                                    name="qty"
                                                    value={
                                                        form.qty
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
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
                                                    value={
                                                        form.no_po
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />
                                            </div>

                                            <div className="col-6 col-md-4">
                                                <label className="form-label">
                                                    ETA
                                                </label>

                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="eta"
                                                    value={
                                                        form.eta
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />
                                            </div>

                                            <div className="col-12 col-md-8">
                                                <label className="form-label">
                                                    Keterangan
                                                </label>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="remarks"
                                                    value={
                                                        form.remarks
                                                    }
                                                    onChange={
                                                        handleFormChange
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={
                                                closeEditModal
                                            }
                                            disabled={
                                                saving
                                            }
                                        >
                                            Batal
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                saving
                                            }
                                        >
                                            {saving && (
                                                <span className="spinner-border spinner-border-sm me-2" />
                                            )}

                                            <i className="bi bi-save me-2" />
                                            Simpan
                                            Perubahan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" />
                </>
            )}
        </div>
    );
}

export default PendingSupply;