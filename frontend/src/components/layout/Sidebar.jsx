import { NavLink } from 'react-router-dom';

const menuItems = [
    {
        label: 'Dashboard All Site',
        path: '/dashboard-all-site',
        icon: 'bi-grid-1x2',
    },
    {
        label: 'Dashboard Per Site',
        path: '/dashboard-per-site',
        icon: 'bi-pin-map',
    },
    {
        label: 'Input Data',
        path: '/input-data',
        icon: 'bi-pencil-square',
    },
    {
        label: 'Data Unit',
        path: '/data-unit',
        icon: 'bi-truck',
    },
    {
        label: 'Detail LT Supply',
        path: '/detail-lt-supply',
        icon: 'bi-clock-history',
    },
    {
        label: 'Pending Supply',
        path: '/pending-supply',
        icon: 'bi-box-seam',
    },
    {
        label: 'Import Excel Bulanan',
        path: '/import-master-data',
        icon: 'bi-file-earmark-arrow-up',
    },
];

function Sidebar({
    isMobileOpen,
    onCloseMobile,
    isCollapsed,
    onToggleCollapse,
}) {
    return (
        <>
            {isMobileOpen && (
                <button
                    type="button"
                    className="sidebar-overlay d-lg-none border-0"
                    onClick={onCloseMobile}
                    aria-label="Tutup sidebar"
                />
            )}

            <aside
                className={[
                    'app-sidebar',
                    'thin-scrollbar',
                    isCollapsed ? 'is-collapsed' : '',
                    isMobileOpen ? 'is-open' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo-wrap">
                        <div className="sidebar-logo-chip">
                            <i className="bi bi-speedometer2" />
                        </div>

                        <span className="sidebar-brand-text">
                            PPA Monitor
                        </span>
                    </div>

                    <button
                        type="button"
                        className="sidebar-toggle-btn d-none d-lg-flex"
                        onClick={onToggleCollapse}
                        aria-label={
                            isCollapsed
                                ? 'Perluas sidebar'
                                : 'Perkecil sidebar'
                        }
                        title={
                            isCollapsed
                                ? 'Perluas sidebar'
                                : 'Perkecil sidebar'
                        }
                    >
                        <i
                            className={`bi ${isCollapsed
                                    ? 'bi-chevron-right'
                                    : 'bi-chevron-left'
                                }`}
                        />
                    </button>

                    <button
                        type="button"
                        className="sidebar-mobile-close d-lg-none"
                        onClick={onCloseMobile}
                        aria-label="Tutup sidebar"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onCloseMobile}
                            data-tooltip={item.label}
                            className={({ isActive }) =>
                                isActive
                                    ? 'sidebar-link-active'
                                    : 'sidebar-link'
                            }
                        >
                            <i
                                className={`bi ${item.icon}`}
                                aria-hidden="true"
                            />

                            <span className="sidebar-link-label">
                                {item.label}
                            </span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}

export default Sidebar;