import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import { createPortal } from 'react-dom';

import { Link } from 'react-router-dom';

import {
    getKpiSummary,
} from '../../api/kpiSummary.api';

import {
    getPendingSupply,
} from '../../api/pendingSupply.api';

import {
    getNotifications,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    NOTIFICATION_EVENT,
} from '../../utils/notification';

import {
    buildKpiBelowTargetAnalysis,
} from '../../utils/aggregate';

// ============================================================================
// HELPER RESPONSE
// ============================================================================

function extractRows(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (
        Array.isArray(
            response?.data?.data
        )
    ) {
        return response.data.data;
    }

    if (
        Array.isArray(
            response?.data
        )
    ) {
        return response.data;
    }

    return [];
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
                    event.currentTarget
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="confirm-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="navbar-confirm-title"
            >
                {/* CLOSE */}
                <button
                    type="button"
                    className="confirm-modal-close"
                    onClick={onCancel}
                    aria-label="Tutup"
                >
                    <i className="bi bi-x-lg" />
                </button>

                {/* ICON */}
                <div className="confirm-modal-icon confirm-modal-icon-danger">
                    <i className="bi bi-trash3" />
                </div>

                {/* CONTENT */}
                <div className="confirm-modal-content">
                    <h5
                        id="navbar-confirm-title"
                        className="confirm-modal-title"
                    >
                        {title}
                    </h5>

                    <p className="confirm-modal-message">
                        {message}
                    </p>
                </div>

                {/* ACTION */}
                <div className="confirm-modal-actions">
                    <button
                        type="button"
                        className="btn btn-light confirm-modal-btn"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger confirm-modal-btn"
                        onClick={onConfirm}
                    >
                        <i className="bi bi-trash3 me-2" />

                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// NAVBAR
// ============================================================================

function LogoutConfirmModal({
    show,
    user,
    loading,
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!show) {
            return undefined;
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                onCancel();
            }
        }

        document.addEventListener(
            'keydown',
            handleEscape
        );

        return () => {
            document.removeEventListener(
                'keydown',
                handleEscape
            );
        };
    }, [show, onCancel]);

    if (!show) {
        return null;
    }

    return createPortal(
        <div
            className="logout-modal-backdrop"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="logout-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-modal-title"
            >
                <button
                    type="button"
                    className="logout-modal-close"
                    onClick={onCancel}
                    aria-label="Tutup"
                    disabled={loading}
                >
                    <i className="bi bi-x-lg" />
                </button>

                <div className="logout-modal-icon">
                    <i className="bi bi-box-arrow-right" />
                </div>

                <h5
                    id="logout-modal-title"
                    className="logout-modal-title"
                >
                    Keluar dari PPA NEXUS?
                </h5>

                <p className="logout-modal-message">
                    Sesi akun{' '}
                    <strong>
                        {user?.full_name ||
                            'pengguna'}
                    </strong>{' '}
                    akan diakhiri. Kamu harus login
                    kembali untuk membuka dashboard.
                </p>

                <div className="logout-modal-actions">
                    <button
                        type="button"
                        className="btn logout-modal-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        className="btn logout-modal-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Keluar...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-right me-2" />
                                Ya, Keluar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function Navbar({
    onToggleMobileSidebar,
    theme,
    onToggleTheme,
    user,
    onLogout,
    loggingOut = false,
}) {
    const isDark =
        theme === 'dark';

    const notificationRef =
        useRef(null);

    const notificationDropdownRef =
        useRef(null);

    // ------------------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------------------

    const navigate = useNavigate();

    const [
        isNotificationOpen,
        setIsNotificationOpen,
    ] = useState(false);

    const [
        kpiRows,
        setKpiRows,
    ] = useState([]);

    const [
        pendingRows,
        setPendingRows,
    ] = useState([]);

    const [
        activityNotifications,
        setActivityNotifications,
    ] = useState([]);

    const [
        loadingNotifications,
        setLoadingNotifications,
    ] = useState(true);

    // CUSTOM MODAL HAPUS SEMUA
    const [
        showClearConfirm,
        setShowClearConfirm,
    ] = useState(false);

    const [
        showLogoutConfirm,
        setShowLogoutConfirm,
    ] = useState(false);

    const userInitial =
        user?.full_name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() || 'U';
    // =========================================================================
    // LOAD NOTIFICATION
    // =========================================================================

    const loadNotifications =
        useCallback(
            async () => {
                try {
                    setLoadingNotifications(
                        true
                    );

                    const now =
                        new Date();

                    const params = {
                        period_year:
                            now.getFullYear(),

                        period_month:
                            now.getMonth() +
                            1,
                    };

                    const [
                        kpiResponse,
                        pendingResponse,
                    ] =
                        await Promise.all(
                            [
                                getKpiSummary(
                                    params
                                ),

                                getPendingSupply(
                                    {}
                                ),
                            ]
                        );

                    setKpiRows(
                        extractRows(
                            kpiResponse
                        )
                    );

                    setPendingRows(
                        extractRows(
                            pendingResponse
                        )
                    );

                    setActivityNotifications(
                        getNotifications()
                    );
                } catch (error) {
                    console.error(
                        'Gagal memuat notifikasi:',
                        error
                    );

                    setKpiRows(
                        []
                    );

                    setPendingRows(
                        []
                    );

                    setActivityNotifications(
                        getNotifications()
                    );
                } finally {
                    setLoadingNotifications(
                        false
                    );
                }
            },
            []
        );

    // =========================================================================
    // LISTENER DATA
    // =========================================================================

    useEffect(() => {
        loadNotifications();

        function handleDataChanged() {
            loadNotifications();
        }

        function handleNotificationChanged() {
            setActivityNotifications(
                getNotifications()
            );
        }

        window.addEventListener(
            'dashboard-data-changed',
            handleDataChanged
        );

        window.addEventListener(
            NOTIFICATION_EVENT,
            handleNotificationChanged
        );

        return () => {
            window.removeEventListener(
                'dashboard-data-changed',
                handleDataChanged
            );

            window.removeEventListener(
                NOTIFICATION_EVENT,
                handleNotificationChanged
            );
        };
    }, [loadNotifications]);

    // =========================================================================
    // CLICK DI LUAR DROPDOWN
    // =========================================================================

    useEffect(() => {
        function handleOutsideClick(
            event
        ) {
            const clickedBell =
                notificationRef.current?.contains(
                    event.target
                );

            const clickedDropdown =
                notificationDropdownRef.current?.contains(
                    event.target
                );

            if (
                !clickedBell &&
                !clickedDropdown
            ) {
                setIsNotificationOpen(
                    false
                );
            }
        }

        document.addEventListener(
            'mousedown',
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );
        };
    }, []);

    // =========================================================================
    // KPI BELOW TARGET
    // =========================================================================

    const belowTargetRows =
        useMemo(() => {
            try {
                return buildKpiBelowTargetAnalysis(
                    Array.isArray(
                        kpiRows
                    )
                        ? kpiRows
                        : []
                );
            } catch (error) {
                console.error(
                    'Gagal menganalisis KPI:',
                    error
                );

                return [];
            }
        }, [kpiRows]);

    // =========================================================================
    // PENDING SUPPLY MELEWATI ETA
    // =========================================================================

    const overduePendingRows =
        useMemo(() => {
            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            return pendingRows.filter(
                (row) => {
                    if (!row.eta) {
                        return false;
                    }

                    const etaDate =
                        new Date(
                            row.eta
                        );

                    if (
                        Number.isNaN(
                            etaDate.getTime()
                        )
                    ) {
                        return false;
                    }

                    etaDate.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    return (
                        etaDate <
                        today
                    );
                }
            );
        }, [pendingRows]);

    // =========================================================================
    // COUNTERS
    // =========================================================================

    const unreadActivityCount =
        activityNotifications.filter(
            (item) =>
                !item.isRead
        ).length;

    const operationalCount =
        belowTargetRows.length +
        overduePendingRows.length;

    const notificationCount =
        unreadActivityCount +
        operationalCount;

    // =========================================================================
    // NOTIFICATION ACTION
    // =========================================================================

    function toggleNotification() {
        setIsNotificationOpen(
            (previous) =>
                !previous
        );
    }

    function closeNotification() {
        setIsNotificationOpen(
            false
        );
    }

    // Notifikasi KPI ini selalu merujuk ke periode yang SEDANG di-fetch
    // oleh Navbar (bulan/tahun kalender berjalan — lihat `loadNotifications`
    // di atas), BUKAN periode yang sedang aktif di filter DashboardAllSite.
    // Karena itu target bulan/tahun harus dikirim eksplisit lewat
    // navigation state sekali-pakai, lengkap dengan `requestId` unik supaya
    // DashboardAllSite bisa memastikan scroll hanya terjadi SATU KALI dan
    // SETELAH data periode tsb selesai dimuat (bukan berdasarkan
    // `loadingKpi` semata yang bisa membawa nilai basi dari periode lama).
    function handleOpenKpiAnalysis() {
        const currentDate = new Date();

        const notificationMonth =
            currentDate.getMonth() + 1;

        const notificationYear =
            currentDate.getFullYear();

        const requestId =
            (typeof crypto !== 'undefined' &&
                typeof crypto.randomUUID === 'function')
                ? crypto.randomUUID()
                : `kpi-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;

        setIsNotificationOpen(false);

        // State navigasi sekali pakai: DashboardAllSite yang akan membaca
        // flag ini, mengganti filter bulan/tahun ke periode notifikasi,
        // menunggu fetch selesai, lalu melakukan scroll SEKALI dan
        // membuang state ini sendiri. Mengganti filter bulan/tahun secara
        // manual di halaman tersebut TIDAK PERNAH memicu alur ini.
        navigate(
            '/dashboard-all-site',
            {
                state: {
                    scrollToKpiAnalysis: true,
                    notificationMonth,
                    notificationYear,
                    requestId,
                },
            }
        );
    }

    function handleMarkAllRead() {
        markAllNotificationsAsRead();

        setActivityNotifications(
            getNotifications()
        );
    }

    function handleRemoveNotification(
        notificationId
    ) {
        removeNotification(
            notificationId
        );

        setActivityNotifications(
            getNotifications()
        );
    }

    // =========================================================================
    // HAPUS SEMUA - BUKA CUSTOM MODAL
    // =========================================================================

    function handleClearAll() {
        if (
            activityNotifications.length ===
            0
        ) {
            return;
        }

        setShowClearConfirm(
            true
        );
    }

    // =========================================================================
    // HAPUS SEMUA - SETELAH KONFIRMASI
    // =========================================================================

    function handleConfirmClearAll() {
        clearAllNotifications();

        setActivityNotifications(
            []
        );

        setShowClearConfirm(
            false
        );
    }

    // =========================================================================
    // FORMAT WAKTU
    // =========================================================================

    function formatNotificationTime(
        value
    ) {
        if (!value) {
            return '';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return '';
        }

        return date.toLocaleString(
            'id-ID',
            {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }
        );
    }

    // =========================================================================
    // NOTIFICATION STYLE
    // =========================================================================

    function getNotificationStyle(
        type
    ) {
        if (
            type === 'success'
        ) {
            return {
                icon:
                    'bi-check-circle',

                color:
                    '#16a34a',

                background:
                    'rgba(22, 163, 74, 0.14)',
            };
        }

        if (
            type === 'danger'
        ) {
            return {
                icon:
                    'bi-exclamation-triangle',

                color:
                    '#dc2626',

                background:
                    'rgba(220, 38, 38, 0.14)',
            };
        }

        if (
            type === 'warning'
        ) {
            return {
                icon:
                    'bi-pencil-square',

                color:
                    '#d97706',

                background:
                    'rgba(217, 119, 6, 0.14)',
            };
        }

        return {
            icon:
                'bi-info-circle',

            color:
                '#2563eb',

            background:
                'rgba(37, 99, 235, 0.14)',
        };
    }

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <nav className="app-navbar d-flex align-items-center justify-content-between px-3">
                {/* ============================================================
                    LEFT
                ============================================================ */}

                <div className="d-flex align-items-center gap-3">
                    <button
                        type="button"
                        className="navbar-icon-btn d-lg-none"
                        onClick={
                            onToggleMobileSidebar
                        }
                        aria-label="Buka sidebar"
                    >
                        <i className="bi bi-list fs-5" />
                    </button>

                    <span
                        className="fw-semibold fs-5 navbar-title"
                        style={{
                            color:
                                'var(--navbar-text)',
                        }}
                    >
                        Monitoring
                        Performance{' '}

                        <span
                            style={{
                                color:
                                    'var(--accent-violet)',
                            }}
                        >
                            PPA
                        </span>
                    </span>
                </div>

                {/* ============================================================
                    RIGHT
                ============================================================ */}


                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="navbar-profile-btn"
                        onClick={() =>
                            setShowLogoutConfirm(true)
                        }
                        title="Akun dan logout"
                        aria-label="Buka konfirmasi logout"
                    >
                        <span className="navbar-profile-avatar">
                            {userInitial}
                        </span>

                        <span className="navbar-profile-copy">
                            <strong>
                                {user?.full_name ||
                                    'Pengguna'}
                            </strong>

                            <small>
                                {user?.email || ''}
                            </small>
                        </span>

                        <i className="bi bi-box-arrow-right navbar-profile-logout-icon" />
                    </button>
                    {/* THEME */}

                    <button
                        type="button"
                        className="navbar-icon-btn"
                        onClick={
                            onToggleTheme
                        }
                        aria-label={
                            isDark
                                ? 'Aktifkan light mode'
                                : 'Aktifkan dark mode'
                        }
                        title={
                            isDark
                                ? 'Light mode'
                                : 'Dark mode'
                        }
                    >
                        <i
                            className={`bi ${isDark
                                ? 'bi-sun'
                                : 'bi-moon-stars'
                                } fs-6`}
                        />
                    </button>

                    {/* ========================================================
                        NOTIFICATION
                    ======================================================== */}

                    <div
                        ref={
                            notificationRef
                        }
                        className="position-relative"
                    >
                        {/* BELL */}

                        <button
                            type="button"
                            className="navbar-icon-btn position-relative"
                            aria-label="Notifikasi operasional"
                            title="Notifikasi operasional"
                            onClick={
                                toggleNotification
                            }
                        >
                            <i className="bi bi-bell fs-6" />

                            {!loadingNotifications &&
                                notificationCount >
                                0 && (
                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                        style={{
                                            fontSize:
                                                '0.6rem',

                                            minWidth:
                                                18,
                                        }}
                                    >
                                        {notificationCount >
                                            99
                                            ? '99+'
                                            : notificationCount}
                                    </span>
                                )}
                        </button>

                        {/* ====================================================
                            DROPDOWN
                        ==================================================== */}

                        {isNotificationOpen &&
                            createPortal(
                                <div
                                    ref={notificationDropdownRef}
                                    className="notification-dropdown"
                                >
                                    {/* HEADER */}

                                    <div
                                        className="px-3 py-3"
                                        style={{
                                            borderBottom:
                                                '1px solid var(--border-color)',
                                        }}
                                    >
                                        <div className="d-flex align-items-start justify-content-between gap-2">
                                            <div>
                                                <div
                                                    className="fw-semibold"
                                                    style={{
                                                        color:
                                                            'var(--text-primary)',
                                                    }}
                                                >
                                                    Notifikasi
                                                    Operasional
                                                </div>

                                                <small className="text-secondary">
                                                    Ringkasan
                                                    kondisi
                                                    dan
                                                    aktivitas
                                                    terbaru
                                                </small>
                                            </div>

                                            <span className="badge rounded-pill text-bg-danger">
                                                {
                                                    notificationCount
                                                }
                                            </span>
                                        </div>

                                        {/* ACTION BUTTON */}

                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={
                                                    handleMarkAllRead
                                                }
                                                disabled={
                                                    unreadActivityCount ===
                                                    0
                                                }
                                            >
                                                <i className="bi bi-check2-all me-1" />

                                                Tandai
                                                dibaca
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={
                                                    handleClearAll
                                                }
                                                disabled={
                                                    activityNotifications.length ===
                                                    0
                                                }
                                            >
                                                <i className="bi bi-trash me-1" />

                                                Hapus
                                                semua
                                            </button>
                                        </div>
                                    </div>

                                    {/* =================================================
                                    CONTENT
                                ================================================= */}

                                    <div
                                        className="thin-scrollbar"
                                        style={{
                                            maxHeight:
                                                460,

                                            overflowY:
                                                'auto',
                                        }}
                                    >
                                        {/* LOADING */}

                                        {loadingNotifications ? (
                                            <div className="text-center py-4">
                                                <div
                                                    className="spinner-border spinner-border-sm"
                                                    role="status"
                                                />

                                                <div className="small text-secondary mt-2">
                                                    Memuat
                                                    notifikasi...
                                                </div>
                                            </div>
                                        ) : notificationCount ===
                                            0 &&
                                            activityNotifications.length ===
                                            0 ? (
                                            /* EMPTY */

                                            <div className="text-center py-4 px-3">
                                                <i className="bi bi-check-circle-fill text-success fs-3" />

                                                <div
                                                    className="fw-semibold mt-2"
                                                    style={{
                                                        color:
                                                            'var(--text-primary)',
                                                    }}
                                                >
                                                    Tidak
                                                    ada
                                                    peringatan
                                                </div>

                                                <small className="text-secondary">
                                                    Semua
                                                    kondisi
                                                    operasional
                                                    terlihat
                                                    aman.
                                                </small>
                                            </div>
                                        ) : (
                                            <>
                                                {/* =====================================
                                                KONDISI OPERASIONAL
                                            ===================================== */}

                                                {operationalCount >
                                                    0 && (
                                                        <div>
                                                            <div className="px-3 pt-3 pb-2">
                                                                <small className="fw-semibold text-secondary text-uppercase">
                                                                    Kondisi
                                                                    Operasional
                                                                </small>
                                                            </div>

                                                            {/* KPI */}

                                                            {belowTargetRows.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleOpenKpiAnalysis}
                                                                    className="d-flex gap-3 px-3 py-3 text-start w-100"
                                                                    style={{
                                                                        border: 0,
                                                                        borderBottom:
                                                                            '1px solid var(--border-color)',
                                                                        color: 'inherit',
                                                                        background: 'transparent',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                        style={{
                                                                            width: 38,
                                                                            height: 38,
                                                                            backgroundColor:
                                                                                'rgba(220, 38, 38, 0.14)',
                                                                            color: '#dc2626',
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-graph-down-arrow" />
                                                                    </div>

                                                                    <div>
                                                                        <div
                                                                            className="fw-semibold small"
                                                                            style={{
                                                                                color:
                                                                                    'var(--text-primary)',
                                                                            }}
                                                                        >
                                                                            {belowTargetRows.length}{' '}
                                                                            KPI belum mencapai target
                                                                        </div>

                                                                        <small className="text-secondary">
                                                                            Klik untuk melihat analisis KPI.
                                                                        </small>
                                                                    </div>
                                                                </button>
                                                            )}

                                                            {/* PENDING SUPPLY */}

                                                            {overduePendingRows.length > 0 && (
                                                                <Link
                                                                    to="/pending-supply"
                                                                    onClick={closeNotification}
                                                                    className="d-flex gap-3 px-3 py-3 text-decoration-none"
                                                                    style={{
                                                                        borderBottom:
                                                                            '1px solid var(--border-color)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                        style={{
                                                                            width: 38,
                                                                            height: 38,
                                                                            backgroundColor:
                                                                                'rgba(217, 119, 6, 0.14)',
                                                                            color: '#d97706',
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-clock-history" />
                                                                    </div>

                                                                    <div>
                                                                        <div
                                                                            className="fw-semibold small"
                                                                            style={{
                                                                                color:
                                                                                    'var(--text-primary)',
                                                                            }}
                                                                        >
                                                                            {overduePendingRows.length}{' '}
                                                                            pending supply melewati ETA
                                                                        </div>

                                                                        <small className="text-secondary">
                                                                            Klik untuk membuka Pending Supply.
                                                                        </small>
                                                                    </div>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}

                                                {/* =====================================
                                                AKTIVITAS TERBARU
                                            ===================================== */}

                                                {activityNotifications.length >
                                                    0 && (
                                                        <div>
                                                            <div className="px-3 pt-3 pb-2">
                                                                <small className="fw-semibold text-secondary text-uppercase">
                                                                    Aktivitas
                                                                    Terbaru
                                                                </small>
                                                            </div>

                                                            {activityNotifications.map(
                                                                (
                                                                    item
                                                                ) => {
                                                                    const style =
                                                                        getNotificationStyle(
                                                                            item.type
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                item.id
                                                                            }
                                                                            className="d-flex gap-3 px-3 py-3"
                                                                            style={{
                                                                                borderBottom:
                                                                                    '1px solid var(--border-color)',
                                                                            }}
                                                                        >
                                                                            {/* ICON */}

                                                                            <div
                                                                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                                style={{
                                                                                    width:
                                                                                        38,

                                                                                    height:
                                                                                        38,

                                                                                    color:
                                                                                        style.color,

                                                                                    backgroundColor:
                                                                                        style.background,
                                                                                }}
                                                                            >
                                                                                <i
                                                                                    className={`bi ${style.icon}`}
                                                                                />
                                                                            </div>

                                                                            {/* CONTENT */}

                                                                            <div className="flex-grow-1">
                                                                                {item.link ? (
                                                                                    <Link
                                                                                        to={
                                                                                            item.link
                                                                                        }
                                                                                        onClick={
                                                                                            closeNotification
                                                                                        }
                                                                                        className="text-decoration-none"
                                                                                    >
                                                                                        <div
                                                                                            className="fw-semibold small"
                                                                                            style={{
                                                                                                color:
                                                                                                    'var(--text-primary)',
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.title
                                                                                            }
                                                                                        </div>

                                                                                        <small className="text-secondary d-block">
                                                                                            {
                                                                                                item.message
                                                                                            }
                                                                                        </small>
                                                                                    </Link>
                                                                                ) : (
                                                                                    <>
                                                                                        <div
                                                                                            className="fw-semibold small"
                                                                                            style={{
                                                                                                color:
                                                                                                    'var(--text-primary)',
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.title
                                                                                            }
                                                                                        </div>

                                                                                        <small className="text-secondary d-block">
                                                                                            {
                                                                                                item.message
                                                                                            }
                                                                                        </small>
                                                                                    </>
                                                                                )}

                                                                                <small
                                                                                    className="text-muted"
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '0.7rem',
                                                                                    }}
                                                                                >
                                                                                    {formatNotificationTime(
                                                                                        item.createdAt
                                                                                    )}
                                                                                </small>
                                                                            </div>

                                                                            {/* DELETE SATU */}

                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-link text-danger p-0 align-self-start"
                                                                                title="Hapus notifikasi"
                                                                                onClick={() =>
                                                                                    handleRemoveNotification(
                                                                                        item.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                <i className="bi bi-x-lg" />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                </div>,
                                document.body
                            )}
                    </div>
                </div>
            </nav>

            {/* ================================================================
                CUSTOM CONFIRMATION MODAL
            ================================================================= */}

            <ConfirmModal
                show={
                    showClearConfirm
                }
                title="Hapus semua aktivitas?"
                message="Semua riwayat notifikasi aktivitas akan dihapus. Kondisi operasional yang masih aktif tetap akan ditampilkan."
                confirmText="Hapus Semua"
                cancelText="Batal"
                onCancel={() =>
                    setShowClearConfirm(
                        false
                    )
                }
                onConfirm={
                    handleConfirmClearAll
                }
            />
            <LogoutConfirmModal
                show={showLogoutConfirm}
                user={user}
                loading={loggingOut}
                onCancel={() =>
                    setShowLogoutConfirm(false)
                }
                onConfirm={async () => {
                    try {
                        await onLogout();
                    } finally {
                        setShowLogoutConfirm(false);
                    }
                }}
            />
        </>
    );
}

export default Navbar;  