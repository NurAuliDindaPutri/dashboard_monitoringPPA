import {
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
    clearNotifications,
    NOTIFICATION_EVENT,
} from '../../utils/notification';


import {
    buildKpiBelowTargetAnalysis,
} from '../../utils/aggregate';

function Navbar({
    onToggleMobileSidebar,
    theme,
    onToggleTheme,
}) {
    const isDark = theme === 'dark';

    const [isNotificationOpen, setIsNotificationOpen] =
        useState(false);

    const [kpiRows, setKpiRows] = useState([]);
    const [pendingRows, setPendingRows] = useState([]);
    const [criticalRows, setCriticalRows] = useState([]);
    const [activityNotifications, setActivityNotifications] =
        useState([]);

    const [loadingNotifications, setLoadingNotifications] =
        useState(true);

    const notificationRef = useRef(null);

    useEffect(() => {
        function refreshActivityNotifications() {
            setActivityNotifications(getNotifications());
        }

        window.addEventListener(
            NOTIFICATION_EVENT,
            refreshActivityNotifications
        );

        return () => {
            window.removeEventListener(
                NOTIFICATION_EVENT,
                refreshActivityNotifications
            );
        };
    }, []);


    async function loadNotifications() {
        try {
            setLoadingNotifications(true);

            const now = new Date();

            const params = {
                period_year: now.getFullYear(),
                period_month: now.getMonth() + 1,
            };

            const [
                kpiData,
                pendingData,
                criticalData,
            ] = await Promise.all([
                getKpiSummary(params),
                getPendingSupply({}),
                getCriticalItems({}),
            ]);

            setKpiRows(kpiData ?? []);
            setPendingRows(pendingData ?? []);
            setCriticalRows(criticalData ?? []);
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
    }

    useEffect(() => {
        loadNotifications();

        function handleDataChanged() {
            loadNotifications();
        }

        window.addEventListener(
            'dashboard-data-changed',
            handleDataChanged
        );

        return () => {
            window.removeEventListener(
                'dashboard-data-changed',
                handleDataChanged
            );
        };
    }, []);

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

    const belowTargetRows = useMemo(
        () => buildKpiBelowTargetAnalysis(kpiRows),
        [kpiRows]
    );

    const unreadActivityCount =
        activityNotifications.filter(
            (item) => !item.isRead
        ).length;

    const operationalCount =
        belowTargetRows.length +
        (pendingRows.length > 0 ? 1 : 0) +
        (criticalRows.length > 0 ? 1 : 0);

    const notificationCount =
        unreadActivityCount + operationalCount;

    function handleOpenNotification() {
        setIsNotificationOpen((previous) => {
            const nextValue = !previous;

            if (nextValue) {
                markAllNotificationsAsRead();

                setActivityNotifications(
                    getNotifications()
                );
            }

            return nextValue;
        });
    }

    function handleClearNotifications() {
        clearNotifications();
        setActivityNotifications([]);
    }

    function closeNotification() {
        setIsNotificationOpen(false);
    }

    function formatNotificationTime(dateValue) {
        if (!dateValue) {
            return '';
        }

        const date = new Date(dateValue);

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

    function getNotificationIcon(type) {
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
                icon: 'bi-exclamation-triangle',
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
                        color: 'var(--navbar-text)',
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
                        onClick={handleOpenNotification}
                    >
                        <i className="bi bi-bell fs-6" />

                        {!loadingNotifications &&
                            notificationCount > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{
                                        fontSize: '0.6rem',
                                        minWidth: 18,
                                    }}
                                >
                                    {notificationCount > 99
                                        ? '99+'
                                        : notificationCount}
                                </span>
                            )}
                    </button>

                    {isNotificationOpen && (
                        <div
                            className="app-card position-absolute end-0 mt-2 p-0 shadow"
                            style={{
                                width: 360,
                                maxWidth:
                                    'calc(100vw - 24px)',
                                zIndex: 1050,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                className="d-flex align-items-center justify-content-between gap-2 px-3 py-3"
                                style={{
                                    borderBottom:
                                        '1px solid var(--border-color)',
                                }}
                            >
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

                                <div className="d-flex align-items-center gap-2">
                                    {activityNotifications.length >
                                        0 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={
                                                    handleClearNotifications
                                                }
                                                title="Hapus riwayat notifikasi"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        )}

                                    <span className="badge rounded-pill text-bg-danger">
                                        {notificationCount}
                                    </span>
                                </div>
                            </div>

                            <div
                                className="thin-scrollbar"
                                style={{
                                    maxHeight: 420,
                                    overflowY: 'auto',
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
                                ) : notificationCount === 0 &&
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
                                            Semua kondisi operasional
                                            terlihat aman.
                                        </small>
                                    </div>
                                ) : (
                                    <>
                                        {activityNotifications.length >
                                            0 && (
                                                <div>
                                                    <div className="px-3 pt-3 pb-2">
                                                        <small className="fw-semibold text-secondary text-uppercase">
                                                            Aktivitas Terbaru
                                                        </small>
                                                    </div>

                                                    {activityNotifications.map(
                                                        (item) => {
                                                            const style =
                                                                getNotificationIcon(
                                                                    item.type
                                                                );

                                                            const content = (
                                                                <div
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
                                                                </div>
                                                            );

                                                            return item.link ? (
                                                                <Link
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    to={
                                                                        item.link
                                                                    }
                                                                    onClick={
                                                                        closeNotification
                                                                    }
                                                                    className="text-decoration-none"
                                                                >
                                                                    {
                                                                        content
                                                                    }
                                                                </Link>
                                                            ) : (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    {
                                                                        content
                                                                    }
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}

                                        {operationalCount > 0 && (
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
                                                                    KPI belum
                                                                    mencapai
                                                                    target
                                                                </div>

                                                                <small className="text-secondary">
                                                                    Klik
                                                                    untuk
                                                                    melihat
                                                                    analisis
                                                                    KPI.
                                                                </small>
                                                            </div>
                                                        </Link>
                                                    )}

                                                {pendingRows.length >
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
                                                                <i className="bi bi-box-seam" />
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
                                                                        pendingRows.length
                                                                    }{' '}
                                                                    pending
                                                                    supply
                                                                </div>

                                                                <small className="text-secondary">
                                                                    Supply
                                                                    masih
                                                                    menunggu.
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
                                                                    critical
                                                                    item
                                                                </div>

                                                                <small className="text-secondary">
                                                                    Spare
                                                                    part
                                                                    kritis
                                                                    perlu
                                                                    dipantau.
                                                                </small>
                                                            </div>
                                                        </Link>
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