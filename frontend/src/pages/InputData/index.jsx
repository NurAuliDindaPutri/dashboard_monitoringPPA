import {
    useEffect,
    useState,
} from 'react';

import axiosClient from '../../api/axiosClient';
import { getSites } from '../../api/site.api';
import {
    MONTHS,
    YEARS,
} from '../../utils/constants';

import {
    addNotification,
} from '../../utils/notification';

import {
    normalizeDashboardSites as normalizeInputSites,
} from '../../utils/siteNormalization';

import {
    getUnitGroupKey,
} from '../../utils/unitFilter';

const NOW = new Date();

const DEFAULT_YEAR =
    NOW.getFullYear();

const DEFAULT_MONTH =
    NOW.getMonth() + 1;

// ============================================================================
// FILTER MODEL UNIT SESUAI REVISI
// ============================================================================
//
// Semua site:
// - PC2000
// - PC1250 (termasuk PC1250SP dan varian lain)
// - HD785
//
// Khusus site BIB:
// - PC2000
// - PC1250
// - HD785
// - PC3400
//
function isAllowedUnitModel(modelName, siteCode) {
    return Boolean(
        getUnitGroupKey(
            modelName,
            siteCode
        )
    );
}

// ============================================================================
// CONFIRM MODAL
// ============================================================================

function ConfirmModal({
    show,
    title = 'Konfirmasi',
    message = '',
    confirmText = 'Hapus',
    cancelText = 'Batal',
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!show) {
        return null;
    }

    return (
        <div
            className="confirm-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="confirm-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                <button
                    type="button"
                    className="confirm-modal-close"
                    onClick={onCancel}
                    disabled={loading}
                    aria-label="Tutup"
                >
                    <i className="bi bi-x-lg" />
                </button>

                <div className="confirm-modal-icon confirm-modal-icon-danger">
                    <i className="bi bi-trash3" />
                </div>

                <div className="confirm-modal-content">
                    <h5
                        id="confirm-modal-title"
                        className="confirm-modal-title"
                    >
                        {title}
                    </h5>

                    <p className="confirm-modal-message">
                        {message}
                    </p>
                </div>

                <div className="confirm-modal-actions">
                    <button
                        type="button"
                        className="btn btn-light confirm-modal-btn"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger confirm-modal-btn"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Menghapus...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash3 me-2" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// HELPER
// ============================================================================

function getMonthLabel(
    monthValue
) {
    const found =
        MONTHS.find(
            (month) =>
                Number(
                    month.value
                ) ===
                Number(
                    monthValue
                )
        );

    return found
        ? found.label
        : monthValue;
}

function formatKpiPercent(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '-';
    }

    const number =
        Number(value) * 100;

    if (
        !Number.isFinite(
            number
        )
    ) {
        return '-';
    }

    const rounded =
        Math.round(
            number * 100
        ) / 100;

    return `${rounded}%`;
}

function decimalToPercentInput(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '';
    }

    const number =
        Number(value) * 100;

    if (
        !Number.isFinite(
            number
        )
    ) {
        return '';
    }

    return String(
        Math.round(
            number * 100
        ) / 100
    );
}

function displayOrDash(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '-';
    }

    return value;
}

const ID_MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

function formatEtaIndonesia(
    value
) {
    if (!value) {
        return '-';
    }

    const dateOnly =
        String(value).slice(
            0,
            10
        );

    const parts =
        dateOnly
            .split('-')
            .map(Number);

    const [
        year,
        month,
        day,
    ] = parts;

    if (
        !year ||
        !month ||
        !day ||
        !ID_MONTH_NAMES[
        month - 1
        ]
    ) {
        return '-';
    }

    return `${day} ${ID_MONTH_NAMES[
        month - 1
    ]
        } ${year}`;
}

// ============================================================================
// PAGINATION
// ============================================================================

function Pagination({
    currentPage,
    totalPages,
    onChange,
}) {
    if (
        totalPages <= 1
    ) {
        return null;
    }

    return (
        <nav aria-label="Pagination">
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
                            onChange(
                                Math.max(
                                    1,
                                    currentPage -
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
                        index + 1
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
                                    onChange(
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
                            onChange(
                                Math.min(
                                    totalPages,
                                    currentPage +
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
    );
}

// ============================================================================
// KPI SUMMARY
// ============================================================================

const EMPTY_KPI_FORM = {
    site_id: '',
    period_year:
        DEFAULT_YEAR,
    period_month:
        DEFAULT_MONTH,

    readyness_actual: '',
    readyness_target: '',

    availability_actual:
        '',
    availability_target:
        '',

    leadtime_actual: '',
    leadtime_target: '',
};

function KpiSummaryForm({
    sites,
}) {
    const [
        form,
        setForm,
    ] = useState({
        ...EMPTY_KPI_FORM,
    });

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        result,
        setResult,
    ] = useState(null);

    const [
        editingId,
        setEditingId,
    ] = useState(null);

    const [
        list,
        setList,
    ] = useState([]);

    const [
        loadingList,
        setLoadingList,
    ] = useState(false);

    const [
        deletingId,
        setDeletingId,
    ] = useState(null);

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState(null);

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const rowsPerPage = 20;

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [selectMode, setSelectMode] = useState(false);

    const handleToggleSelectMode = () => {
        setSelectMode((previous) => {
            if (previous) {
                setSelectedIds(new Set());
            }

            return !previous;
        });
    };

    useEffect(() => {
        if (!result) {
            return undefined;
        }

        const timer =
            setTimeout(() => {
                setResult(
                    null
                );
            }, 4000);

        return () =>
            clearTimeout(
                timer
            );
    }, [result]);

    const fetchList =
        async () => {
            setLoadingList(
                true
            );

            try {
                const response =
                    await axiosClient.get(
                        '/kpi-summary'
                    );

                const data =
                    response.data
                        ?.data ??
                    [];

                const sorted =
                    [...data].sort(
                        (
                            a,
                            b
                        ) => {
                            if (
                                Number(
                                    b.period_year
                                ) !==
                                Number(
                                    a.period_year
                                )
                            ) {
                                return (
                                    Number(
                                        b.period_year
                                    ) -
                                    Number(
                                        a.period_year
                                    )
                                );
                            }

                            if (
                                Number(
                                    b.period_month
                                ) !==
                                Number(
                                    a.period_month
                                )
                            ) {
                                return (
                                    Number(
                                        b.period_month
                                    ) -
                                    Number(
                                        a.period_month
                                    )
                                );
                            }

                            return (
                                Number(
                                    b.id
                                ) -
                                Number(
                                    a.id
                                )
                            );
                        }
                    );

                setList(
                    sorted
                );
            } catch {
                setResult({
                    type: 'error',
                    message:
                        'Gagal memuat data KPI Summary',
                });
            } finally {
                setLoadingList(
                    false
                );
            }
        };

    useEffect(() => {
        fetchList();
    }, []);

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (
                previous
            ) => ({
                ...previous,
                [name]:
                    value,
            })
        );

        setResult(null);
    };

    const resetForm =
        () => {
            setForm({
                ...EMPTY_KPI_FORM,
            });

            setEditingId(
                null
            );
        };

    const handleCancelEdit =
        () => {
            resetForm();
            setResult(null);
        };

    const handleEdit = (
        row
    ) => {
        setEditingId(
            row.id
        );

        setForm({
            site_id:
                String(
                    row.site_id ??
                    ''
                ),

            period_year:
                row.period_year,

            period_month:
                row.period_month,

            readyness_actual:
                decimalToPercentInput(
                    row.readyness_actual
                ),

            readyness_target:
                decimalToPercentInput(
                    row.readyness_target
                ),

            availability_actual:
                decimalToPercentInput(
                    row.availability_actual
                ),

            availability_target:
                decimalToPercentInput(
                    row.availability_target
                ),

            leadtime_actual:
                decimalToPercentInput(
                    row.leadtime_actual
                ),

            leadtime_target:
                decimalToPercentInput(
                    row.leadtime_target
                ),
        });

        setResult(null);

        window.scrollTo({
            top: 0,
            behavior:
                'smooth',
        });
    };

    // ============================================================
    // BUKA MODAL DELETE KPI
    // ============================================================

    const handleDelete = (
        row
    ) => {
        const monthLabel =
            getMonthLabel(
                row.period_month
            );

        setDeleteTarget({
            ...row,

            deleteMessage:
                `Data KPI site ${row.site_code ?? '-'} periode ${monthLabel} ${row.period_year} akan dihapus permanen.`,
        });
    };

    // ============================================================
    // KONFIRMASI DELETE KPI
    // ============================================================

    const handleConfirmDelete =
        async () => {
            if (
                !deleteTarget
            ) {
                return;
            }

            const row =
                deleteTarget;

            const monthLabel =
                getMonthLabel(
                    row.period_month
                );

            setDeletingId(
                row.id
            );

            try {
                await axiosClient.delete(
                    `/kpi-summary/${row.id}`
                );

                setResult({
                    type: 'success',

                    message:
                        `Data KPI ${row.site_code} periode ${monthLabel} ${row.period_year} berhasil dihapus.`,
                });

                addNotification({
                    title:
                        'KPI Summary dihapus',

                    message:
                        `Data KPI site ${row.site_code} periode ${monthLabel} ${row.period_year} berhasil dihapus.`,

                    type:
                        'danger',

                    link:
                        '/input-data',
                });

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                if (
                    editingId ===
                    row.id
                ) {
                    resetForm();
                }

                setDeleteTarget(
                    null
                );

                setSelectedIds((previous) => {
                    const next = new Set(previous);
                    next.delete(row.id);
                    return next;
                });

                await fetchList();
            } catch (
            error
            ) {
                const message =
                    error.response
                        ?.data
                        ?.message ??
                    'Gagal menghapus data KPI Summary';

                setResult({
                    type: 'error',
                    message,
                });
            } finally {
                setDeletingId(
                    null
                );
            }
        };

    // ============================================================
    // SELEKSI & HAPUS MASSAL KPI
    // ============================================================

    const toggleSelectRow = (id) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) {
            return;
        }

        setShowBulkDeleteConfirm(true);
    };

    const handleConfirmBulkDelete = async () => {
        const ids = Array.from(selectedIds);

        if (ids.length === 0) {
            setShowBulkDeleteConfirm(false);
            return;
        }

        setBulkDeleting(true);

        try {
            const results = await Promise.allSettled(
                ids.map((id) =>
                    axiosClient.delete(`/kpi-summary/${id}`)
                )
            );

            const failedCount = results.filter(
                (item) => item.status === 'rejected'
            ).length;

            const successCount = ids.length - failedCount;

            if (successCount > 0) {
                setResult({
                    type: failedCount > 0 ? 'error' : 'success',

                    message:
                        failedCount > 0
                            ? `${successCount} data berhasil dihapus, ${failedCount} data gagal dihapus.`
                            : `${successCount} data KPI Summary berhasil dihapus.`,
                });

                addNotification({
                    title: 'KPI Summary dihapus',

                    message: `${successCount} data KPI Summary berhasil dihapus.`,

                    type: 'danger',

                    link: '/input-data',
                });

                window.dispatchEvent(
                    new CustomEvent('dashboard-data-changed')
                );
            } else {
                setResult({
                    type: 'error',
                    message: 'Gagal menghapus data yang dipilih.',
                });
            }

            if (editingId && ids.includes(editingId)) {
                resetForm();
            }

            setSelectedIds(new Set());
            setShowBulkDeleteConfirm(false);

            await fetchList();
        } catch {
            setResult({
                type: 'error',
                message: 'Gagal menghapus data yang dipilih.',
            });
        } finally {
            setBulkDeleting(false);
        }
    };

    const PERCENT_FIELDS = [
        'readyness_actual',
        'readyness_target',
        'availability_actual',
        'availability_target',
        'leadtime_actual',
        'leadtime_target',
    ];

    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !form.site_id
            ) {
                setResult({
                    type: 'error',
                    message:
                        'Site wajib dipilih',
                });

                return;
            }

            for (
                const field of
                PERCENT_FIELDS
            ) {
                const raw =
                    form[field];

                if (
                    raw === '' ||
                    raw === null ||
                    raw ===
                    undefined
                ) {
                    continue;
                }

                const number =
                    Number(raw);

                if (
                    !Number.isFinite(
                        number
                    ) ||
                    number <
                    0 ||
                    number >
                    100
                ) {
                    setResult({
                        type: 'error',

                        message:
                            'Nilai persen harus berada di antara 0 sampai 100',
                    });

                    return;
                }
            }

            const payload = {
                site_id:
                    Number(
                        form.site_id
                    ),

                period_year:
                    Number(
                        form.period_year
                    ),

                period_month:
                    Number(
                        form.period_month
                    ),

                readyness_actual:
                    form.readyness_actual !==
                        ''
                        ? Number(
                            form.readyness_actual
                        ) /
                        100
                        : null,

                readyness_target:
                    form.readyness_target !==
                        ''
                        ? Number(
                            form.readyness_target
                        ) /
                        100
                        : null,

                availability_actual:
                    form.availability_actual !==
                        ''
                        ? Number(
                            form.availability_actual
                        ) /
                        100
                        : null,

                availability_target:
                    form.availability_target !==
                        ''
                        ? Number(
                            form.availability_target
                        ) /
                        100
                        : null,

                leadtime_actual:
                    form.leadtime_actual !==
                        ''
                        ? Number(
                            form.leadtime_actual
                        ) /
                        100
                        : null,

                leadtime_target:
                    form.leadtime_target !==
                        ''
                        ? Number(
                            form.leadtime_target
                        ) /
                        100
                        : null,
            };

            const selectedSite =
                sites.find(
                    (
                        site
                    ) =>
                        String(
                            site.id
                        ) ===
                        String(
                            form.site_id
                        )
                );

            const siteLabel =
                selectedSite
                    ?.site_code ??
                '';

            const monthLabel =
                getMonthLabel(
                    form.period_month
                );

            setSaving(true);

            try {
                if (
                    editingId
                ) {
                    await axiosClient.put(
                        `/kpi-summary/${editingId}`,
                        payload
                    );

                    setResult({
                        type:
                            'success',

                        message:
                            `Data KPI ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil diperbarui.`,
                    });

                    addNotification({
                        title:
                            'KPI Summary diperbarui',

                        message:
                            `Data KPI site ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil diperbarui.`,

                        type:
                            'warning',

                        link:
                            '/input-data',
                    });
                } else {
                    await axiosClient.post(
                        '/kpi-summary',
                        payload
                    );

                    setResult({
                        type:
                            'success',

                        message:
                            `Data KPI ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil disimpan.`,
                    });

                    addNotification({
                        title:
                            'KPI Summary ditambahkan',

                        message:
                            `Data KPI site ${siteLabel} periode ${monthLabel} ${form.period_year} berhasil disimpan.`,

                        type:
                            'success',

                        link:
                            '/input-data',
                    });
                }

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                resetForm();

                await fetchList();
            } catch (
            error
            ) {
                const fallback =
                    editingId
                        ? 'Gagal memperbarui data KPI Summary'
                        : 'Gagal menyimpan data KPI Summary';

                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        fallback,
                });
            } finally {
                setSaving(false);
            }
        };

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                list.length /
                rowsPerPage
            )
        );

    const startIndex =
        (
            currentPage -
            1
        ) *
        rowsPerPage;

    const endIndex =
        startIndex +
        rowsPerPage;

    const paginatedList =
        list.slice(
            startIndex,
            endIndex
        );

    const isAllPageSelected =
        paginatedList.length > 0 &&
        paginatedList.every((row) => selectedIds.has(row.id));

    const toggleSelectAllPage = () => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (isAllPageSelected) {
                paginatedList.forEach((row) => next.delete(row.id));
            } else {
                paginatedList.forEach((row) => next.add(row.id));
            }

            return next;
        });
    };

    useEffect(() => {
        if (
            currentPage >
            totalPages
        ) {
            setCurrentPage(
                totalPages
            );
        }
    }, [
        currentPage,
        totalPages,
    ]);

    return (
        <>
            <div className="app-card p-4">
                <div
                    className="fw-semibold mb-3 d-flex align-items-center gap-2"
                    style={{
                        color:
                            'var(--text-primary)',
                    }}
                >
                    <i className="bi bi-graph-up-arrow text-primary-custom" />

                    {editingId
                        ? 'Edit KPI Summary Bulanan'
                        : 'Input KPI Summary Bulanan'}
                </div>

                {result && (
                    <div
                        className={`alert alert-${result.type ===
                            'success'
                            ? 'success'
                            : 'danger'
                            } py-2 mb-3`}
                    >
                        <i
                            className={`bi ${result.type ===
                                'success'
                                ? 'bi-check-circle'
                                : 'bi-exclamation-triangle'
                                } me-2`}
                        />

                        {
                            result.message
                        }
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-4">
                            <label className="form-label small text-secondary">
                                Site{' '}
                                <span className="text-danger">
                                    *
                                </span>
                            </label>

                            <select
                                className="form-select"
                                name="site_id"
                                value={
                                    form.site_id
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                disabled={
                                    saving
                                }
                            >
                                <option value="">
                                    Pilih Site
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
                                                ? ` - ${site.site_name}`
                                                : ''}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-6 col-md-4">
                            <label className="form-label small text-secondary">
                                Bulan
                            </label>

                            <select
                                className="form-select"
                                name="period_month"
                                value={
                                    form.period_month
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    saving
                                }
                            >
                                {MONTHS.map(
                                    (
                                        month
                                    ) => (
                                        <option
                                            key={
                                                month.value
                                            }
                                            value={
                                                month.value
                                            }
                                        >
                                            {
                                                month.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-6 col-md-4">
                            <label className="form-label small text-secondary">
                                Tahun
                            </label>

                            <select
                                className="form-select"
                                name="period_year"
                                value={
                                    form.period_year
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    saving
                                }
                            >
                                {YEARS.map(
                                    (
                                        year
                                    ) => (
                                        <option
                                            key={
                                                year
                                            }
                                            value={
                                                year
                                            }
                                        >
                                            {
                                                year
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        {[
                            [
                                'Readiness',
                                'readyness_actual',
                                'readyness_target',
                            ],

                            [
                                'Availability VHS',
                                'availability_actual',
                                'availability_target',
                            ],

                            [
                                'Lead Time Supply',
                                'leadtime_actual',
                                'leadtime_target',
                            ],
                        ].map(
                            ([
                                label,
                                actualName,
                                targetName,
                            ]) => (
                                <div
                                    className="col-12"
                                    key={
                                        label
                                    }
                                >
                                    <div className="small text-secondary fw-semibold mb-2">
                                        {
                                            label
                                        }{' '}
                                        (%)
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6 col-md-3">
                                            <label className="form-label small text-secondary">
                                                Aktual
                                            </label>

                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name={
                                                        actualName
                                                    }
                                                    value={
                                                        form[
                                                        actualName
                                                        ]
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    placeholder="Contoh: 95.5"
                                                    disabled={
                                                        saving
                                                    }
                                                />

                                                <span className="input-group-text">
                                                    %
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-6 col-md-3">
                                            <label className="form-label small text-secondary">
                                                Target
                                            </label>

                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name={
                                                        targetName
                                                    }
                                                    value={
                                                        form[
                                                        targetName
                                                        ]
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    placeholder="Contoh: 98"
                                                    disabled={
                                                        saving
                                                    }
                                                />

                                                <span className="input-group-text">
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={
                                    handleCancelEdit
                                }
                                disabled={
                                    saving
                                }
                            >
                                <i className="bi bi-x-circle me-2" />
                                Batal Edit
                            </button>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={
                                saving
                            }
                        >
                            {saving && (
                                <span className="spinner-border spinner-border-sm me-2" />
                            )}

                            <i className="bi bi-save me-2" />

                            {editingId
                                ? 'Simpan Perubahan'
                                : 'Simpan KPI Summary'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="app-card p-4 mt-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div className="fw-semibold">
                        <i className="bi bi-table text-primary-custom me-2" />
                        Data KPI Summary Terbaru
                    </div>

                    <div className="d-flex gap-2">
                        {selectMode && selectedIds.size > 0 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                            >
                                <i className="bi bi-trash3 me-2" />
                                Hapus Terpilih ({selectedIds.size})
                            </button>
                        )}

                        <button
                            type="button"
                            className={`btn btn-sm ${selectMode
                                ? 'btn-secondary'
                                : 'btn-outline-secondary'
                                }`}
                            onClick={handleToggleSelectMode}
                            disabled={bulkDeleting}
                        >
                            <i
                                className={`bi ${selectMode
                                    ? 'bi-x-lg'
                                    : 'bi-check2-square'
                                    } me-2`}
                            />
                            {selectMode
                                ? 'Batal Pilih'
                                : 'Pilih'}
                        </button>
                    </div>
                </div>

                {loadingList ? (
                    <div className="text-secondary py-3">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Memuat data...
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        {selectMode && (
                                            <th style={{ width: '32px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isAllPageSelected}
                                                    onChange={toggleSelectAllPage}
                                                    aria-label="Pilih semua"
                                                />
                                            </th>
                                        )}

                                        <th>
                                            Site
                                        </th>

                                        <th>
                                            Bulan
                                        </th>

                                        <th>
                                            Tahun
                                        </th>

                                        <th>
                                            Readiness Actual
                                        </th>

                                        <th>
                                            Readiness Target
                                        </th>

                                        <th>
                                            Availability Actual
                                        </th>

                                        <th>
                                            Availability Target
                                        </th>

                                        <th>
                                            Lead Time Actual
                                        </th>

                                        <th>
                                            Lead Time Target
                                        </th>

                                        <th>
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedList.map(
                                        (
                                            row
                                        ) => (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                {selectMode && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedIds.has(row.id)}
                                                            onChange={() => toggleSelectRow(row.id)}
                                                            aria-label={`Pilih baris ${row.id}`}
                                                        />
                                                    </td>
                                                )}

                                                <td>
                                                    {
                                                        row.site_code
                                                    }
                                                </td>

                                                <td>
                                                    {getMonthLabel(
                                                        row.period_month
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        row.period_year
                                                    }
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.readyness_actual
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.readyness_target
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.availability_actual
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.availability_target
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.leadtime_actual
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        row.leadtime_target
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    row
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil me-1" />
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    row
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                row.id
                                                            }
                                                        >
                                                            <i className="bi bi-trash me-1" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <small className="text-secondary">
                                {list.length ===
                                    0
                                    ? 0
                                    : startIndex +
                                    1}{' '}
                                -{' '}
                                {Math.min(
                                    endIndex,
                                    list.length
                                )}{' '}
                                dari{' '}
                                {
                                    list.length
                                }{' '}
                                data
                            </small>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    totalPages
                                }
                                onChange={
                                    setCurrentPage
                                }
                            />
                        </div>
                    </>
                )}
            </div>

            <ConfirmModal
                show={
                    !!deleteTarget
                }
                title="Hapus data KPI?"
                message={
                    deleteTarget
                        ?.deleteMessage
                }
                confirmText="Hapus"
                cancelText="Batal"
                loading={
                    deletingId !==
                    null
                }
                onCancel={() => {
                    if (
                        deletingId ===
                        null
                    ) {
                        setDeleteTarget(
                            null
                        );
                    }
                }}
                onConfirm={
                    handleConfirmDelete
                }
            />

            <ConfirmModal
                show={showBulkDeleteConfirm}
                title="Hapus data terpilih?"
                message={`${selectedIds.size} data KPI Summary yang dipilih akan dihapus permanen.`}
                confirmText="Hapus"
                cancelText="Batal"
                loading={bulkDeleting}
                onCancel={() => {
                    if (!bulkDeleting) {
                        setShowBulkDeleteConfirm(false);
                    }
                }}
                onConfirm={handleConfirmBulkDelete}
            />
        </>
    );
}

// ============================================================================
// UNIT PERFORMANCE
// ============================================================================

function UnitPerformanceForm({
    sites,
}) {
    const [
        unitModels,
        setUnitModels,
    ] = useState([]);

    const [
        loadingModels,
        setLoadingModels,
    ] = useState(false);

    const [
        unitPerformances,
        setUnitPerformances,
    ] = useState([]);

    const [
        loadingData,
        setLoadingData,
    ] = useState(false);

    const [
        dataError,
        setDataError,
    ] = useState('');

    const [
        form,
        setForm,
    ] = useState({
        site_id: '',
        unit_model_id: '',
        period_year:
            DEFAULT_YEAR,
        period_month:
            DEFAULT_MONTH,
        physical_availability:
            '',
        unit_availability:
            '',
        mtbf: '',
        mttr: '',
        productivity: '',
        fuel_consumption:
            '',
    });

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        result,
        setResult,
    ] = useState(null);

    const [
        editingId,
        setEditingId,
    ] = useState(null);

    const [
        deletingId,
        setDeletingId,
    ] = useState(null);

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState(null);

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const rowsPerPage = 20;

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [selectMode, setSelectMode] = useState(false);

    const handleToggleSelectMode = () => {
        setSelectMode((previous) => {
            if (previous) {
                setSelectedIds(new Set());
            }

            return !previous;
        });
    };

    // Site yang sedang dipilih pada form Performa Unit.
    const selectedSite = sites.find(
        (site) =>
            String(site.id) ===
            String(form.site_id)
    );

    // Filter model unit sesuai keputusan:
    // - Semua site: PC2000, PC1250, HD785
    // - BIB: PC2000, PC1250, HD785, PC3400
    const allowedUnitModels = unitModels.filter(
        (unit) =>
            isAllowedUnitModel(
                unit.model_name,
                selectedSite?.site_code
            )
    );

    useEffect(() => {
        if (!result) {
            return undefined;
        }

        const timer =
            setTimeout(
                () =>
                    setResult(
                        null
                    ),
                4000
            );

        return () =>
            clearTimeout(
                timer
            );
    }, [result]);

    const fetchUnitPerformances =
        async () => {
            setLoadingData(
                true
            );

            setDataError('');

            try {
                const response =
                    await axiosClient.get(
                        '/monthly-unit-performance'
                    );

                const rows =
                    Array.isArray(
                        response
                            .data
                            ?.data
                    )
                        ? response
                            .data
                            .data
                        : [];

                const sorted =
                    [...rows].sort(
                        (
                            a,
                            b
                        ) => {
                            if (
                                Number(
                                    b.period_year
                                ) !==
                                Number(
                                    a.period_year
                                )
                            ) {
                                return (
                                    Number(
                                        b.period_year
                                    ) -
                                    Number(
                                        a.period_year
                                    )
                                );
                            }

                            if (
                                Number(
                                    b.period_month
                                ) !==
                                Number(
                                    a.period_month
                                )
                            ) {
                                return (
                                    Number(
                                        b.period_month
                                    ) -
                                    Number(
                                        a.period_month
                                    )
                                );
                            }

                            return (
                                Number(
                                    b.id
                                ) -
                                Number(
                                    a.id
                                )
                            );
                        }
                    );

                setUnitPerformances(
                    sorted
                );
            } catch (
            error
            ) {
                setDataError(
                    error.response
                        ?.data
                        ?.message ??
                    'Gagal mengambil data performa unit'
                );
            } finally {
                setLoadingData(
                    false
                );
            }
        };

    useEffect(() => {
        fetchUnitPerformances();
    }, []);

    useEffect(() => {
        if (
            !form.site_id
        ) {
            setUnitModels([]);
            return;
        }

        setLoadingModels(
            true
        );

        axiosClient
            .get(
                '/unit-models',
                {
                    params: {
                        site_id:
                            form.site_id,
                    },
                }
            )
            .then(
                (
                    response
                ) => {
                    setUnitModels(
                        Array.isArray(
                            response
                                .data
                                ?.data
                        )
                            ? response
                                .data
                                .data
                            : []
                    );
                }
            )
            .catch(() =>
                setUnitModels(
                    []
                )
            )
            .finally(() =>
                setLoadingModels(
                    false
                )
            );
    }, [form.site_id]);

    const resetForm =
        () => {
            setForm({
                site_id: '',
                unit_model_id:
                    '',
                period_year:
                    DEFAULT_YEAR,
                period_month:
                    DEFAULT_MONTH,
                physical_availability:
                    '',
                unit_availability:
                    '',
                mtbf: '',
                mttr: '',
                productivity:
                    '',
                fuel_consumption:
                    '',
            });

            setEditingId(
                null
            );
        };

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (
                previous
            ) => ({
                ...previous,

                [name]:
                    value,

                ...(name ===
                    'site_id'
                    ? {
                        unit_model_id:
                            '',
                    }
                    : {}),
            })
        );

        setResult(null);
    };

    const handleEdit = (
        item
    ) => {
        setEditingId(
            item.id
        );

        setForm({
            site_id:
                String(
                    item.site_id ??
                    ''
                ),

            unit_model_id:
                String(
                    item.unit_model_id ??
                    ''
                ),

            period_year:
                Number(
                    item.period_year
                ),

            period_month:
                Number(
                    item.period_month
                ),

            physical_availability:
                item.physical_availability !==
                    null &&
                    item.physical_availability !==
                    undefined
                    ? String(
                        Math.round(
                            Number(
                                item.physical_availability
                            ) *
                            10000
                        ) / 100
                    )
                    : '',

            unit_availability:
                item.unit_availability !==
                    null &&
                    item.unit_availability !==
                    undefined
                    ? String(
                        Math.round(
                            Number(
                                item.unit_availability
                            ) *
                            10000
                        ) / 100
                    )
                    : '',

            mtbf:
                item.mtbf ??
                '',

            mttr:
                item.mttr ??
                '',

            productivity:
                item.productivity ??
                '',

            fuel_consumption:
                item.fuel_consumption ??
                '',
        });

        window.scrollTo({
            top: 0,
            behavior:
                'smooth',
        });
    };

    // ============================================================
    // BUKA MODAL DELETE UNIT
    // ============================================================

    const handleDelete = (
        item
    ) => {
        const monthLabel =
            getMonthLabel(
                item.period_month
            );

        setDeleteTarget({
            ...item,

            deleteMessage:
                `Data ${item.model_name ?? 'unit'} site ${item.site_code ?? '-'} periode ${monthLabel} ${item.period_year} akan dihapus permanen.`,
        });
    };

    // ============================================================
    // KONFIRMASI DELETE UNIT
    // ============================================================

    const handleConfirmDelete =
        async () => {
            if (
                !deleteTarget
            ) {
                return;
            }

            const item =
                deleteTarget;

            const monthLabel =
                getMonthLabel(
                    item.period_month
                );

            setDeletingId(
                item.id
            );

            try {
                await axiosClient.delete(
                    `/monthly-unit-performance/${item.id}`
                );

                if (
                    editingId ===
                    item.id
                ) {
                    resetForm();
                }

                setResult({
                    type: 'success',

                    message:
                        `Data ${item.model_name ?? 'unit'} periode ${monthLabel} ${item.period_year} berhasil dihapus.`,
                });

                addNotification({
                    title:
                        'Performa Unit dihapus',

                    message:
                        `Data ${item.model_name ?? 'unit'} site ${item.site_code ?? '-'} periode ${monthLabel} ${item.period_year} berhasil dihapus.`,

                    type:
                        'danger',

                    link:
                        '/input-data',
                });

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                setDeleteTarget(
                    null
                );

                setSelectedIds((previous) => {
                    const next = new Set(previous);
                    next.delete(item.id);
                    return next;
                });

                await fetchUnitPerformances();
            } catch (
            error
            ) {
                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        'Gagal menghapus data performa unit',
                });
            } finally {
                setDeletingId(
                    null
                );
            }
        };

    // ============================================================
    // SELEKSI & HAPUS MASSAL PERFORMA UNIT
    // ============================================================

    const toggleSelectRow = (id) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) {
            return;
        }

        setShowBulkDeleteConfirm(true);
    };

    const handleConfirmBulkDelete = async () => {
        const ids = Array.from(selectedIds);

        if (ids.length === 0) {
            setShowBulkDeleteConfirm(false);
            return;
        }

        setBulkDeleting(true);

        try {
            const results = await Promise.allSettled(
                ids.map((id) =>
                    axiosClient.delete(`/monthly-unit-performance/${id}`)
                )
            );

            const failedCount = results.filter(
                (item) => item.status === 'rejected'
            ).length;

            const successCount = ids.length - failedCount;

            if (successCount > 0) {
                setResult({
                    type: failedCount > 0 ? 'error' : 'success',

                    message:
                        failedCount > 0
                            ? `${successCount} data berhasil dihapus, ${failedCount} data gagal dihapus.`
                            : `${successCount} data performa unit berhasil dihapus.`,
                });

                addNotification({
                    title: 'Performa Unit dihapus',

                    message: `${successCount} data performa unit berhasil dihapus.`,

                    type: 'danger',

                    link: '/input-data',
                });

                window.dispatchEvent(
                    new CustomEvent('dashboard-data-changed')
                );
            } else {
                setResult({
                    type: 'error',
                    message: 'Gagal menghapus data yang dipilih.',
                });
            }

            if (editingId && ids.includes(editingId)) {
                resetForm();
            }

            setSelectedIds(new Set());
            setShowBulkDeleteConfirm(false);

            await fetchUnitPerformances();
        } catch {
            setResult({
                type: 'error',
                message: 'Gagal menghapus data yang dipilih.',
            });
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !form.site_id
            ) {
                setResult({
                    type: 'error',
                    message:
                        'Site wajib dipilih',
                });

                return;
            }

            if (
                !form.unit_model_id
            ) {
                setResult({
                    type: 'error',
                    message:
                        'Model unit wajib dipilih',
                });

                return;
            }

            const paValue =
                form.physical_availability;

            const uaValue =
                form.unit_availability;

            const invalidPa =
                paValue !== '' &&
                (
                    !Number.isFinite(Number(paValue)) ||
                    Number(paValue) < 0 ||
                    Number(paValue) > 100
                );

            const invalidUa =
                uaValue !== '' &&
                (
                    !Number.isFinite(Number(uaValue)) ||
                    Number(uaValue) < -100 ||
                    Number(uaValue) > 100
                );

            if (invalidPa || invalidUa) {
                setResult({
                    type: 'error',
                    message:
                        'Physical Availability harus antara 0–100%, sedangkan Unit Availability harus antara -100–100%.',
                });

                return;
            }

            const payload = {
                unit_model_id:
                    Number(
                        form.unit_model_id
                    ),

                period_year:
                    Number(
                        form.period_year
                    ),

                period_month:
                    Number(
                        form.period_month
                    ),

                physical_availability:
                    form.physical_availability !==
                        ''
                        ? Number(
                            form.physical_availability
                        ) /
                        100
                        : null,

                unit_availability:
                    form.unit_availability !==
                        ''
                        ? Number(
                            form.unit_availability
                        ) /
                        100
                        : null,

                mtbf:
                    form.mtbf !==
                        ''
                        ? Number(
                            form.mtbf
                        )
                        : null,

                mttr:
                    form.mttr !==
                        ''
                        ? Number(
                            form.mttr
                        )
                        : null,

                productivity:
                    form.productivity !==
                        ''
                        ? Number(
                            form.productivity
                        )
                        : null,

                fuel_consumption:
                    form.fuel_consumption !==
                        ''
                        ? Number(
                            form.fuel_consumption
                        )
                        : null,
            };

            const selectedModel =
                unitModels.find(
                    (
                        unit
                    ) =>
                        String(
                            unit.id
                        ) ===
                        String(
                            form.unit_model_id
                        )
                );

            const modelLabel =
                selectedModel
                    ?.model_name ??
                'unit';

            const monthLabel =
                getMonthLabel(
                    form.period_month
                );

            setSaving(true);

            try {
                if (
                    editingId
                ) {
                    await axiosClient.put(
                        `/monthly-unit-performance/${editingId}`,
                        payload
                    );

                    setResult({
                        type:
                            'success',

                        message:
                            `Data ${modelLabel} periode ${monthLabel} ${form.period_year} berhasil diperbarui.`,
                    });

                    addNotification({
                        title:
                            'Performa Unit diperbarui',

                        message:
                            `Data ${modelLabel} periode ${monthLabel} ${form.period_year} berhasil diperbarui.`,

                        type:
                            'warning',

                        link:
                            '/input-data',
                    });
                } else {
                    await axiosClient.post(
                        '/monthly-unit-performance',
                        payload
                    );

                    setResult({
                        type:
                            'success',

                        message:
                            `Data ${modelLabel} periode ${monthLabel} ${form.period_year} berhasil disimpan.`,
                    });

                    addNotification({
                        title:
                            'Performa Unit ditambahkan',

                        message:
                            `Data ${modelLabel} periode ${monthLabel} ${form.period_year} berhasil disimpan.`,

                        type:
                            'success',

                        link:
                            '/input-data',
                    });
                }

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                resetForm();

                await fetchUnitPerformances();
            } catch (
            error
            ) {
                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        'Gagal menyimpan data performa unit',
                });
            } finally {
                setSaving(false);
            }
        };

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                unitPerformances.length /
                rowsPerPage
            )
        );

    const startIndex =
        (
            currentPage -
            1
        ) *
        rowsPerPage;

    const endIndex =
        startIndex +
        rowsPerPage;

    const paginatedList =
        unitPerformances.slice(
            startIndex,
            endIndex
        );

    const isAllPageSelected =
        paginatedList.length > 0 &&
        paginatedList.every((item) => selectedIds.has(item.id));

    const toggleSelectAllPage = () => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (isAllPageSelected) {
                paginatedList.forEach((item) => next.delete(item.id));
            } else {
                paginatedList.forEach((item) => next.add(item.id));
            }

            return next;
        });
    };

    return (
        <>
            <div className="app-card p-4">
                <div className="fw-semibold mb-3">
                    <i className="bi bi-truck text-primary-custom me-2" />

                    {editingId
                        ? 'Edit Data Performa Unit Bulanan'
                        : 'Input Data Performa Unit Bulanan'}
                </div>

                {result && (
                    <div
                        className={`alert alert-${result.type ===
                            'success'
                            ? 'success'
                            : 'danger'
                            } py-2`}
                    >
                        {
                            result.message
                        }
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-4">
                            <label className="form-label small text-secondary">
                                Site *
                            </label>

                            <select
                                className="form-select"
                                name="site_id"
                                value={
                                    form.site_id
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >
                                <option value="">
                                    Pilih Site
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
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="form-label small text-secondary">
                                Model Unit *
                            </label>

                            <select
                                className="form-select"
                                name="unit_model_id"
                                value={
                                    form.unit_model_id
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    !form.site_id ||
                                    loadingModels
                                }
                                required
                            >
                                <option value="">
                                    Pilih Model Unit
                                </option>

                                {allowedUnitModels.map(
                                    (
                                        unit
                                    ) => (
                                        <option
                                            key={
                                                unit.id
                                            }
                                            value={
                                                unit.id
                                            }
                                        >
                                            {
                                                unit.model_name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label small text-secondary">
                                Bulan
                            </label>

                            <select
                                className="form-select"
                                name="period_month"
                                value={
                                    form.period_month
                                }
                                onChange={
                                    handleChange
                                }
                            >
                                {MONTHS.map(
                                    (
                                        month
                                    ) => (
                                        <option
                                            key={
                                                month.value
                                            }
                                            value={
                                                month.value
                                            }
                                        >
                                            {
                                                month.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-6 col-md-2">
                            <label className="form-label small text-secondary">
                                Tahun
                            </label>

                            <select
                                className="form-select"
                                name="period_year"
                                value={
                                    form.period_year
                                }
                                onChange={
                                    handleChange
                                }
                            >
                                {YEARS.map(
                                    (
                                        year
                                    ) => (
                                        <option
                                            key={
                                                year
                                            }
                                        >
                                            {
                                                year
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        {[
                            [
                                'physical_availability',
                                'Physical Availability (%)',
                                'Contoh: 97.8',
                            ],

                            [
                                'unit_availability',
                                'Unit Availability (%)',
                                'Contoh: 65.4',
                            ],

                            [
                                'mtbf',
                                'MTBF',
                                'Contoh: 145',
                            ],

                            [
                                'mttr',
                                'MTTR',
                                'Contoh: 2.4',
                            ],

                            [
                                'productivity',
                                'Productivity',
                                'Contoh: 68.5',
                            ],

                            [
                                'fuel_consumption',
                                'Fuel Consumption',
                                'Contoh: 42.7',
                            ],
                        ].map(
                            ([
                                name,
                                label,
                                placeholder,
                            ]) => (
                                <div
                                    key={name}
                                    className="col-6 col-md-4"
                                >
                                    <label className="form-label small text-secondary">
                                        {label}
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        min={
                                            name === 'unit_availability'
                                                ? -100
                                                : 0
                                        }
                                        max={
                                            name === 'physical_availability' ||
                                                name === 'unit_availability'
                                                ? 100
                                                : undefined
                                        }
                                        step="0.01"
                                        placeholder={placeholder}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={
                                    resetForm
                                }
                            >
                                Batal Edit
                            </button>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={
                                saving
                            }
                        >
                            {saving && (
                                <span className="spinner-border spinner-border-sm me-2" />
                            )}

                            <i className="bi bi-save me-2" />

                            {editingId
                                ? 'Simpan Perubahan'
                                : 'Simpan Data Unit'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="app-card p-4 mt-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div className="fw-semibold">
                        Data Performa Unit
                    </div>

                    <div className="d-flex gap-2">
                        {selectMode && selectedIds.size > 0 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                            >
                                <i className="bi bi-trash3 me-2" />
                                Hapus Terpilih ({selectedIds.size})
                            </button>
                        )}

                        <button
                            type="button"
                            className={`btn btn-sm ${selectMode
                                ? 'btn-secondary'
                                : 'btn-outline-secondary'
                                }`}
                            onClick={handleToggleSelectMode}
                            disabled={bulkDeleting}
                        >
                            <i
                                className={`bi ${selectMode
                                    ? 'bi-x-lg'
                                    : 'bi-check2-square'
                                    } me-2`}
                            />
                            {selectMode
                                ? 'Batal Pilih'
                                : 'Pilih'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={
                                fetchUnitPerformances
                            }
                        >
                            <i className="bi bi-arrow-clockwise me-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {dataError && (
                    <div className="alert alert-danger">
                        {
                            dataError
                        }
                    </div>
                )}

                {loadingData ? (
                    <div className="text-secondary">
                        Memuat data...
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle">
                                <thead>
                                    <tr>
                                        {selectMode && (
                                            <th style={{ width: '32px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isAllPageSelected}
                                                    onChange={toggleSelectAllPage}
                                                    aria-label="Pilih semua"
                                                />
                                            </th>
                                        )}

                                        <th>
                                            Site
                                        </th>

                                        <th>
                                            Model
                                        </th>

                                        <th>
                                            Periode
                                        </th>

                                        <th>
                                            PA
                                        </th>

                                        <th>
                                            UA
                                        </th>

                                        <th>
                                            MTBF
                                        </th>

                                        <th>
                                            MTTR
                                        </th>

                                        <th>
                                            Productivity
                                        </th>

                                        <th>
                                            Fuel
                                        </th>

                                        <th>
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedList.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >
                                                {selectMode && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedIds.has(item.id)}
                                                            onChange={() => toggleSelectRow(item.id)}
                                                            aria-label={`Pilih baris ${item.id}`}
                                                        />
                                                    </td>
                                                )}

                                                <td>
                                                    {
                                                        item.site_code
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.model_name
                                                    }
                                                </td>

                                                <td>
                                                    {getMonthLabel(
                                                        item.period_month
                                                    )}{' '}
                                                    {
                                                        item.period_year
                                                    }
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        item.physical_availability
                                                    )}
                                                </td>

                                                <td>
                                                    {formatKpiPercent(
                                                        item.unit_availability
                                                    )}
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        item.mtbf
                                                    )}
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        item.mttr
                                                    )}
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        item.productivity
                                                    )}
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        item.fuel_consumption
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil me-1" />
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                item.id
                                                            }
                                                        >
                                                            <i className="bi bi-trash me-1" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between mt-3">
                            <small className="text-secondary">
                                {unitPerformances.length}{' '}
                                data
                            </small>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    totalPages
                                }
                                onChange={
                                    setCurrentPage
                                }
                            />
                        </div>
                    </>
                )}
            </div>

            <ConfirmModal
                show={
                    !!deleteTarget
                }
                title="Hapus data performa unit?"
                message={
                    deleteTarget
                        ?.deleteMessage
                }
                loading={
                    deletingId !==
                    null
                }
                onCancel={() => {
                    if (
                        deletingId ===
                        null
                    ) {
                        setDeleteTarget(
                            null
                        );
                    }
                }}
                onConfirm={
                    handleConfirmDelete
                }
            />

            <ConfirmModal
                show={showBulkDeleteConfirm}
                title="Hapus data terpilih?"
                message={`${selectedIds.size} data performa unit yang dipilih akan dihapus permanen.`}
                loading={bulkDeleting}
                onCancel={() => {
                    if (!bulkDeleting) {
                        setShowBulkDeleteConfirm(false);
                    }
                }}
                onConfirm={handleConfirmBulkDelete}
            />
        </>
    );
}

// ============================================================================
// PENDING SUPPLY
// ============================================================================

const EMPTY_SUPPLY_FORM = {
    site_id: '',
    parts_number: '',
    description: '',
    qty: '',
    no_po: '',
    eta: '',
    remarks: '',
};

function PendingSupplyForm({
    sites,
}) {
    const [
        form,
        setForm,
    ] = useState({
        ...EMPTY_SUPPLY_FORM,
    });

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        result,
        setResult,
    ] = useState(null);

    const [
        editingId,
        setEditingId,
    ] = useState(null);

    const [
        list,
        setList,
    ] = useState([]);

    const [
        loadingList,
        setLoadingList,
    ] = useState(false);

    const [
        deletingId,
        setDeletingId,
    ] = useState(null);

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState(null);

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const rowsPerPage = 20;

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [selectMode, setSelectMode] = useState(false);

    const handleToggleSelectMode = () => {
        setSelectMode((previous) => {
            if (previous) {
                setSelectedIds(new Set());
            }

            return !previous;
        });
    };

    const fetchList =
        async () => {
            setLoadingList(
                true
            );

            try {
                const response =
                    await axiosClient.get(
                        '/pending-supply'
                    );

                const data =
                    response.data
                        ?.data ??
                    [];

                setList(
                    [...data].sort(
                        (
                            a,
                            b
                        ) =>
                            Number(
                                b.id
                            ) -
                            Number(
                                a.id
                            )
                    )
                );
            } catch (
            error
            ) {
                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        'Gagal mengambil data Pending Supply',
                });
            } finally {
                setLoadingList(
                    false
                );
            }
        };

    useEffect(() => {
        fetchList();
    }, []);

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (
                previous
            ) => ({
                ...previous,
                [name]:
                    value,
            })
        );
    };

    const resetForm =
        () => {
            setForm({
                ...EMPTY_SUPPLY_FORM,
            });

            setEditingId(
                null
            );
        };

    const handleEdit = (
        row
    ) => {
        setEditingId(
            row.id
        );

        setForm({
            site_id:
                String(
                    row.site_id ??
                    ''
                ),

            parts_number:
                row.parts_number ??
                '',

            description:
                row.description ??
                '',

            qty:
                row.qty ??
                '',

            no_po:
                row.no_po ??
                '',

            eta:
                row.eta
                    ? String(
                        row.eta
                    ).slice(
                        0,
                        10
                    )
                    : '',

            remarks:
                row.remarks ??
                '',
        });
    };

    // ============================================================
    // BUKA MODAL DELETE PENDING
    // ============================================================

    const handleDelete = (
        row
    ) => {
        setDeleteTarget({
            ...row,

            deleteMessage:
                `Pending Supply part ${row.parts_number ?? '-'} site ${row.site_code ?? '-'} akan dihapus permanen.`,
        });
    };

    // ============================================================
    // KONFIRMASI DELETE PENDING
    // ============================================================

    const handleConfirmDelete =
        async () => {
            if (
                !deleteTarget
            ) {
                return;
            }

            const row =
                deleteTarget;

            setDeletingId(
                row.id
            );

            try {
                await axiosClient.delete(
                    `/pending-supply/${row.id}`
                );

                setResult({
                    type: 'success',

                    message:
                        `Data Pending Supply part ${row.parts_number} site ${row.site_code} berhasil dihapus.`,
                });

                addNotification({
                    title:
                        'Pending Supply dihapus',

                    message:
                        `Part ${row.parts_number} site ${row.site_code ?? '-'} berhasil dihapus.`,

                    type:
                        'danger',

                    link:
                        '/pending-supply',
                });

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                if (
                    editingId ===
                    row.id
                ) {
                    resetForm();
                }

                setDeleteTarget(
                    null
                );

                setSelectedIds((previous) => {
                    const next = new Set(previous);
                    next.delete(row.id);
                    return next;
                });

                await fetchList();
            } catch (
            error
            ) {
                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        'Gagal menghapus data Pending Supply',
                });
            } finally {
                setDeletingId(
                    null
                );
            }
        };

    // ============================================================
    // SELEKSI & HAPUS MASSAL PENDING SUPPLY
    // ============================================================

    const toggleSelectRow = (id) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) {
            return;
        }

        setShowBulkDeleteConfirm(true);
    };

    const handleConfirmBulkDelete = async () => {
        const ids = Array.from(selectedIds);

        if (ids.length === 0) {
            setShowBulkDeleteConfirm(false);
            return;
        }

        setBulkDeleting(true);

        try {
            const results = await Promise.allSettled(
                ids.map((id) =>
                    axiosClient.delete(`/pending-supply/${id}`)
                )
            );

            const failedCount = results.filter(
                (item) => item.status === 'rejected'
            ).length;

            const successCount = ids.length - failedCount;

            if (successCount > 0) {
                setResult({
                    type: failedCount > 0 ? 'error' : 'success',

                    message:
                        failedCount > 0
                            ? `${successCount} data berhasil dihapus, ${failedCount} data gagal dihapus.`
                            : `${successCount} data Pending Supply berhasil dihapus.`,
                });

                addNotification({
                    title: 'Pending Supply dihapus',

                    message: `${successCount} data Pending Supply berhasil dihapus.`,

                    type: 'danger',

                    link: '/pending-supply',
                });

                window.dispatchEvent(
                    new CustomEvent('dashboard-data-changed')
                );
            } else {
                setResult({
                    type: 'error',
                    message: 'Gagal menghapus data yang dipilih.',
                });
            }

            if (editingId && ids.includes(editingId)) {
                resetForm();
            }

            setSelectedIds(new Set());
            setShowBulkDeleteConfirm(false);

            await fetchList();
        } catch {
            setResult({
                type: 'error',
                message: 'Gagal menghapus data yang dipilih.',
            });
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !form.site_id
            ) {
                setResult({
                    type: 'error',
                    message:
                        'Site wajib dipilih',
                });

                return;
            }

            if (
                !form.parts_number.trim()
            ) {
                setResult({
                    type: 'error',

                    message:
                        'Part number wajib diisi',
                });

                return;
            }

            const payload = {
                site_id:
                    Number(
                        form.site_id
                    ),

                parts_number:
                    form.parts_number.trim(),

                description:
                    form.description.trim() ||
                    null,

                qty:
                    form.qty !==
                        ''
                        ? Number(
                            form.qty
                        )
                        : 0,

                no_po:
                    form.no_po.trim() ||
                    null,

                eta:
                    form.eta ||
                    null,

                remarks:
                    form.remarks.trim() ||
                    null,
            };

            const selectedSite =
                sites.find(
                    (
                        site
                    ) =>
                        String(
                            site.id
                        ) ===
                        String(
                            form.site_id
                        )
                );

            const siteLabel =
                selectedSite
                    ?.site_code ??
                '-';

            setSaving(true);

            try {
                if (
                    editingId
                ) {
                    await axiosClient.put(
                        `/pending-supply/${editingId}`,
                        payload
                    );
                } else {
                    await axiosClient.post(
                        '/pending-supply',
                        payload
                    );
                }

                setResult({
                    type: 'success',

                    message:
                        `Pending Supply ${payload.parts_number} site ${siteLabel} berhasil ${editingId
                            ? 'diperbarui'
                            : 'disimpan'
                        }.`,
                });

                addNotification({
                    title:
                        editingId
                            ? 'Pending Supply diperbarui'
                            : 'Pending Supply ditambahkan',

                    message:
                        `Part ${payload.parts_number} site ${siteLabel} berhasil ${editingId
                            ? 'diperbarui'
                            : 'ditambahkan'
                        }.`,

                    type:
                        editingId
                            ? 'warning'
                            : 'success',

                    link:
                        '/pending-supply',
                });

                window.dispatchEvent(
                    new CustomEvent(
                        'dashboard-data-changed'
                    )
                );

                resetForm();

                await fetchList();
            } catch (
            error
            ) {
                setResult({
                    type: 'error',

                    message:
                        error.response
                            ?.data
                            ?.message ??
                        'Gagal menyimpan Pending Supply',
                });
            } finally {
                setSaving(false);
            }
        };

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                list.length /
                rowsPerPage
            )
        );

    const startIndex =
        (
            currentPage -
            1
        ) *
        rowsPerPage;

    const endIndex =
        startIndex +
        rowsPerPage;

    const paginatedList =
        list.slice(
            startIndex,
            endIndex
        );

    const isAllPageSelected =
        paginatedList.length > 0 &&
        paginatedList.every((row) => selectedIds.has(row.id));

    const toggleSelectAllPage = () => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (isAllPageSelected) {
                paginatedList.forEach((row) => next.delete(row.id));
            } else {
                paginatedList.forEach((row) => next.add(row.id));
            }

            return next;
        });
    };

    return (
        <>
            <div className="app-card p-4">
                <div className="fw-semibold mb-3">
                    <i className="bi bi-hourglass-split text-primary-custom me-2" />

                    {editingId
                        ? 'Edit Pending Supply'
                        : 'Input Pending Supply'}
                </div>

                {result && (
                    <div
                        className={`alert alert-${result.type ===
                            'success'
                            ? 'success'
                            : 'danger'
                            }`}
                    >
                        {
                            result.message
                        }
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="row g-3">
                        <div className="col-12 col-md-4">
                            <label className="form-label">
                                Site *
                            </label>

                            <select
                                className="form-select"
                                name="site_id"
                                value={
                                    form.site_id
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >
                                <option value="">
                                    Pilih Site
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
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {[
                            [
                                'parts_number',
                                'Part Number',
                                'Contoh: 123-4567',
                            ],

                            [
                                'description',
                                'Deskripsi',
                                'Contoh: Filter Hydraulic',
                            ],

                            [
                                'qty',
                                'Qty',
                                'Contoh: 5',
                            ],

                            [
                                'no_po',
                                'No. PO',
                                'Contoh: PO-2026-00125',
                            ],

                            [
                                'eta',
                                'ETA',
                                '',
                            ],

                            [
                                'remarks',
                                'Keterangan',
                                'Contoh: Menunggu pengiriman vendor',
                            ],
                        ].map(
                            ([
                                name,
                                label,
                                placeholder,
                            ]) => (
                                <div
                                    key={name}
                                    className="col-12 col-md-4"
                                >
                                    <label className="form-label">
                                        {label}
                                    </label>

                                    <input
                                        type={
                                            name === 'eta'
                                                ? 'date'
                                                : name === 'qty'
                                                    ? 'number'
                                                    : 'text'
                                        }
                                        className="form-control"
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={
                                    resetForm
                                }
                            >
                                Batal Edit
                            </button>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={
                                saving
                            }
                        >
                            <i className="bi bi-save me-2" />
                            Simpan
                        </button>
                    </div>
                </form>
            </div>

            <div className="app-card p-4 mt-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div className="fw-semibold">
                        Data Pending Supply
                    </div>

                    <div className="d-flex gap-2">
                        {selectMode && selectedIds.size > 0 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                            >
                                <i className="bi bi-trash3 me-2" />
                                Hapus Terpilih ({selectedIds.size})
                            </button>
                        )}

                        <button
                            type="button"
                            className={`btn btn-sm ${selectMode
                                ? 'btn-secondary'
                                : 'btn-outline-secondary'
                                }`}
                            onClick={handleToggleSelectMode}
                            disabled={bulkDeleting}
                        >
                            <i
                                className={`bi ${selectMode
                                    ? 'bi-x-lg'
                                    : 'bi-check2-square'
                                    } me-2`}
                            />
                            {selectMode
                                ? 'Batal Pilih'
                                : 'Pilih'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={
                                fetchList
                            }
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loadingList ? (
                    <div className="text-secondary">
                        Memuat data...
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle">
                                <thead>
                                    <tr>
                                        {selectMode && (
                                            <th style={{ width: '32px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isAllPageSelected}
                                                    onChange={toggleSelectAllPage}
                                                    aria-label="Pilih semua"
                                                />
                                            </th>
                                        )}

                                        <th>
                                            Site
                                        </th>

                                        <th>
                                            Part
                                        </th>

                                        <th>
                                            Deskripsi
                                        </th>

                                        <th>
                                            Qty
                                        </th>

                                        <th>
                                            No PO
                                        </th>

                                        <th>
                                            ETA
                                        </th>

                                        <th>
                                            Keterangan
                                        </th>

                                        <th>
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedList.map(
                                        (
                                            row
                                        ) => (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                {selectMode && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedIds.has(row.id)}
                                                            onChange={() => toggleSelectRow(row.id)}
                                                            aria-label={`Pilih baris ${row.id}`}
                                                        />
                                                    </td>
                                                )}

                                                <td>
                                                    {
                                                        row.site_code
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.parts_number
                                                    }
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        row.description
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        row.qty
                                                    }
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        row.no_po
                                                    )}
                                                </td>

                                                <td>
                                                    {formatEtaIndonesia(
                                                        row.eta
                                                    )}
                                                </td>

                                                <td>
                                                    {displayOrDash(
                                                        row.remarks
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    row
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil me-1" />
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    row
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-trash me-1" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={
                                currentPage
                            }
                            totalPages={
                                totalPages
                            }
                            onChange={
                                setCurrentPage
                            }
                        />
                    </>
                )}
            </div>

            <ConfirmModal
                show={
                    !!deleteTarget
                }
                title="Hapus Pending Supply?"
                message={
                    deleteTarget
                        ?.deleteMessage
                }
                loading={
                    deletingId !==
                    null
                }
                onCancel={() => {
                    if (
                        deletingId ===
                        null
                    ) {
                        setDeleteTarget(
                            null
                        );
                    }
                }}
                onConfirm={
                    handleConfirmDelete
                }
            />

            <ConfirmModal
                show={showBulkDeleteConfirm}
                title="Hapus data terpilih?"
                message={`${selectedIds.size} data Pending Supply yang dipilih akan dihapus permanen.`}
                loading={bulkDeleting}
                onCancel={() => {
                    if (!bulkDeleting) {
                        setShowBulkDeleteConfirm(false);
                    }
                }}
                onConfirm={handleConfirmBulkDelete}
            />
        </>
    );
}

// ============================================================================
// INPUT DATA
// ============================================================================

function InputData() {
    const [
        sites,
        setSites,
    ] = useState([]);

    const [
        loadingSites,
        setLoadingSites,
    ] = useState(true);

    const [
        activeTab,
        setActiveTab,
    ] = useState(
        'kpi'
    );

    useEffect(() => {
        setLoadingSites(
            true
        );

        getSites()
            .then(
                (
                    data
                ) => {
                    const rawSites =
                        Array.isArray(data)
                            ? data
                            : [];

                    const normalizedSites =
                        normalizeInputSites(
                            rawSites
                        );

                    setSites(
                        normalizedSites
                    );
                }
            )
            .catch((error) => {
                console.error(
                    'Gagal memuat daftar site:',
                    error
                );

                setSites([]);
            })
            .finally(() =>
                setLoadingSites(
                    false
                )
            );
    }, []);

    const tabs = [
        {
            key: 'kpi',
            label:
                'KPI Summary',
            icon:
                'bi-graph-up-arrow',
        },

        {
            key: 'unit',
            label:
                'Performa Unit',
            icon:
                'bi-truck',
        },

        {
            key: 'supply',
            label:
                'Pending Supply',
            icon:
                'bi-hourglass-split',
        },
    ];

    return (
        <div>
            <div className="mb-3">
                <h4
                    className="fw-bold mb-0"
                    style={{
                        color:
                            'var(--text-primary)',
                    }}
                >
                    Input Data
                </h4>

                <p className="text-secondary mb-0 small">
                    Tambahkan data KPI,
                    performa unit, atau
                    pending supply ke
                    sistem.
                </p>
            </div>

            {loadingSites && (
                <div className="alert alert-info py-2">
                    <span className="spinner-border spinner-border-sm me-2" />
                    Memuat daftar site…
                </div>
            )}

            <div className="app-card p-2 mb-3">
                <div className="d-flex gap-1 flex-nowrap">
                    {tabs.map(
                        (
                            tab
                        ) => (
                            <button
                                key={
                                    tab.key
                                }
                                type="button"
                                className={`btn btn-sm tab-nav-btn flex-fill d-flex align-items-center justify-content-center gap-2 ${activeTab ===
                                    tab.key
                                    ? 'btn-primary'
                                    : 'btn-outline-secondary'
                                    }`}
                                onClick={() =>
                                    setActiveTab(
                                        tab.key
                                    )
                                }
                            >
                                <i
                                    className={`bi ${tab.icon} tab-nav-icon`}
                                />

                                <span className="tab-nav-label text-truncate">
                                    {
                                        tab.label
                                    }
                                </span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {activeTab ===
                'kpi' && (
                    <KpiSummaryForm
                        sites={
                            sites
                        }
                    />
                )}

            {activeTab ===
                'unit' && (
                    <UnitPerformanceForm
                        sites={
                            sites
                        }
                    />
                )}

            {activeTab ===
                'supply' && (
                    <PendingSupplyForm
                        sites={
                            sites
                        }
                    />
                )}
        </div>
    );
}

export default InputData;
