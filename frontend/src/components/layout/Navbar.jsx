import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Link } from 'react-router-dom';

import { getKpiSummary } from '../../api/kpiSummary.api';
import { getPendingSupply } from '../../api/pendingSupply.api';
import { getCriticalItems } from '../../api/criticalItem.api';

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

function Navbar({
    onToggleMobileSidebar,
    theme,
    onToggleTheme,
}) {
    const isDark = theme === 'dark';

    const notificationRef = useRef(null);

    const [isNotificationOpen, setIsNotificationOpen] =
        useState(false);

    const [kpiRows, setKpiRows] = useState([]);
    const [pendingRows, setPendingRows] = useState([]);
    const [criticalRows, setCriticalRows] = useState([]);
    const [activityNotifications, setActivityNotifications] =
        useState([]);

    const [loadingNotifications, setLoadingNotifications] =
        useState(true);

    const loadNotifications = useCallback(async () => {
        try {
            setLoadingNotifications(true);

            const now = new Date();

            const params = {
                period_year: now.getFullYear(),
                period_month: now.getMonth() + 1,
            };

            const [
                kpiResponse,
                pendingResponse,
                criticalResponse,
            ] = await Promise.all([
                getKpiSummary(params),
                getPendingSupply({}),
                getCriticalItems({}),
            ]);

            setKpiRows(extractRows(kpiResponse));
            setPendingRows(extractRows(pendingResponse));
            setCriticalRows(extractRows(criticalResponse));
            setActivityNotifications(getNotifications());
        } catch (error) {
            console.error(
                'Gagal memuat notifikasi:',
                error
            );

            setKpiRows([]);
            setPendingRows([]);
            setCriticalRows([]);
            setActivityNotifications(getNotifications());
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

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

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target
                )
            ) {
                setIsNotificationOpen(false);
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

    const belowTargetRows = useMemo(() => {
        try {
            return buildKpiBelowTargetAnalysis(
                Array.isArray(kpiRows)
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

    const overduePendingRows = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return pendingRows.filter((row) => {
            if (!row.eta) {
                return false;
            }

            const etaDate = new Date(row.eta);

            if (Number.isNaN(etaDate.getTime())) {
                return false;
            }

            etaDate.setHours(0, 0, 0, 0);

            return etaDate < today;
        });
    }, [pendingRows]);

    const unreadActivityCount =
        activityNotifications.filter(
            (item) => !item.isRead
        ).length;

    const operationalCount =
        belowTargetRows.length +
        overduePendingRows.length +
        criticalRows.length;

    const notificationCount =
        unreadActivityCount + operationalCount;

    function toggleNotification() {
        setIsNotificationOpen(
            (previous) => !previous
        );
    }

    function closeNotification() {
        setIsNotificationOpen(false);
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
        removeNotification(notificationId);

        setActivityNotifications(
            getNotifications()
        );
    }

    function handleClearAll() {
        if (
            activityNotifications.length === 0
        ) {
            return;
        }

        const confirmed = window.confirm(
            'Yakin ingin menghapus semua notifikasi aktivitas?'
        );

        if (!confirmed) {
            return;
        }

        clearAllNotifications();
        setActivityNotifications([]);
    }

    function formatNotificationTime(value) {
        if (!value) {
            return '';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getNotificationStyle(type) {
        if (type === 'success') {
            return {
                icon: 'bi-check-circle',
                color: '#16a34a',
                background:
                    'rgba(22, 163, 74, 0.14)',
            };
        }

        if (type === 'danger') {
            return {
                icon:
                    'bi-exclamation-triangle',
                color: '#dc2626',
                background:
                    'rgba(220, 38, 38, 0.14)',
            };
        }

        if (type === 'warning') {
            return {
                icon: 'bi-pencil-square',
                color: '#d97706',
                background:
                    'rgba(217, 119, 6, 0.14)',
            };
        }

        return {
            icon: 'bi-info-circle',
            color: '#2563eb',
            background:
                'rgba(37, 99, 235, 0.14)',
        };
    }

    return (
        <nav className="app-navbar d-flex align-items-center justify-content-between px-3">
            <div className="d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="navbar-icon-btn d-lg-none"
                    onClick={onToggleMobileSidebar}
                    aria-label="Buka sidebar"
                >
                    <i className="bi bi-list fs-5" />
                </button>

                <span
                    className="fw-semibold fs-5"
                    style={{
                        color:
                            'var(--navbar-text)',
                    }}
                >
                    Monitoring Performance{' '}
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

            <div className="d-flex align-items-center gap-2">
                <button
                    type="button"
                    className="navbar-icon-btn"
                    onClick={onToggleTheme}
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

                <div
                    ref={notificationRef}
                    className="position-relative"
                >
                    <button
                        type="button"
                        className="navbar-icon-btn position-relative"
                        aria-label="Notifikasi operasional"
                        title="Notifikasi operasional"
                        onClick={toggleNotification}
                    >
                        <i className="bi bi-bell fs-6" />

                        {!loadingNotifications &&
                            notificationCount > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{
                                        fontSize:
                                            '0.6rem',
                                        minWidth: 18,
                                    }}
                                >
                                    {notificationCount >
                                        99
                                        ? '99+'
                                        : notificationCount}
                                </span>
                            )}
                    </button>

                    {isNotificationOpen && (
                        <div
                            className="app-card position-absolute end-0 mt-2 p-0 shadow"
                            style={{
                                width: 390,
                                maxWidth:
                                    'calc(100vw - 24px)',
                                zIndex: 1050,
                                overflow:
                                    'hidden',
                            }}
                        >
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
                                            Notifikasi Operasional
                                        </div>

                                        <small className="text-secondary">
                                            Ringkasan kondisi dan
                                            aktivitas terbaru
                                        </small>
                                    </div>

                                    <span className="badge rounded-pill text-bg-danger">
                                        {notificationCount}
                                    </span>
                                </div>

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
                                        Tandai dibaca
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
                                        Hapus semua
                                    </button>
                                </div>
                            </div>

                            <div
                                className="thin-scrollbar"
                                style={{
                                    maxHeight: 460,
                                    overflowY:
                                        'auto',
                                }}
                            >
                                {loadingNotifications ? (
                                    <div className="text-center py-4">
                                        <div
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                        />

                                        <div className="small text-secondary mt-2">
                                            Memuat notifikasi...
                                        </div>
                                    </div>
                                ) : notificationCount ===
                                    0 &&
                                    activityNotifications.length ===
                                    0 ? (
                                    <div className="text-center py-4 px-3">
                                        <i className="bi bi-check-circle-fill text-success fs-3" />

                                        <div
                                            className="fw-semibold mt-2"
                                            style={{
                                                color:
                                                    'var(--text-primary)',
                                            }}
                                        >
                                            Tidak ada peringatan
                                        </div>

                                        <small className="text-secondary">
                                            Semua kondisi
                                            operasional terlihat
                                            aman.
                                        </small>
                                    </div>
                                ) : (
                                    <>
                                        {operationalCount >
                                            0 && (
                                                <div>
                                                    <div className="px-3 pt-3 pb-2">
                                                        <small className="fw-semibold text-secondary text-uppercase">
                                                            Kondisi Operasional
                                                        </small>
                                                    </div>

                                                    {belowTargetRows.length >
                                                        0 && (
                                                            <Link
                                                                to="/dashboard-all-site"
                                                                onClick={
                                                                    closeNotification
                                                                }
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
                                                                            'rgba(220, 38, 38, 0.14)',
                                                                        color:
                                                                            '#dc2626',
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
                                                                        {
                                                                            belowTargetRows.length
                                                                        }{' '}
                                                                        KPI belum mencapai target
                                                                    </div>

                                                                    <small className="text-secondary">
                                                                        Klik untuk melihat analisis KPI.
                                                                    </small>
                                                                </div>
                                                            </Link>
                                                        )}

                                                    {overduePendingRows.length >
                                                        0 && (
                                                            <Link
                                                                to="/pending-supply"
                                                                onClick={
                                                                    closeNotification
                                                                }
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
                                                                        color:
                                                                            '#d97706',
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
                                                                        {
                                                                            overduePendingRows.length
                                                                        }{' '}
                                                                        pending supply melewati ETA
                                                                    </div>

                                                                    <small className="text-secondary">
                                                                        Jadwal kedatangan perlu ditindaklanjuti.
                                                                    </small>
                                                                </div>
                                                            </Link>
                                                        )}

                                                    {criticalRows.length >
                                                        0 && (
                                                            <Link
                                                                to="/critical-items"
                                                                onClick={
                                                                    closeNotification
                                                                }
                                                                className="d-flex gap-3 px-3 py-3 text-decoration-none"
                                                            >
                                                                <div
                                                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                    style={{
                                                                        width: 38,
                                                                        height: 38,
                                                                        backgroundColor:
                                                                            'rgba(220, 38, 38, 0.14)',
                                                                        color:
                                                                            '#dc2626',
                                                                    }}
                                                                >
                                                                    <i className="bi bi-exclamation-diamond" />
                                                                </div>

                                                                <div>
                                                                    <div
                                                                        className="fw-semibold small"
                                                                        style={{
                                                                            color:
                                                                                'var(--text-primary)',
                                                                        }}
                                                                    >
                                                                        {
                                                                            criticalRows.length
                                                                        }{' '}
                                                                        critical item
                                                                    </div>

                                                                    <small className="text-secondary">
                                                                        Spare part kritis perlu dipantau.
                                                                    </small>
                                                                </div>
                                                            </Link>
                                                        )}
                                                </div>
                                            )}

                                        {activityNotifications.length >
                                            0 && (
                                                <div>
                                                    <div className="px-3 pt-3 pb-2">
                                                        <small className="fw-semibold text-secondary text-uppercase">
                                                            Aktivitas Terbaru
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
                                                                    <div
                                                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                        style={{
                                                                            width: 38,
                                                                            height: 38,
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
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
