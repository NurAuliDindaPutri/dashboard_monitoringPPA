import { NavLink } from 'react-router-dom';

const menuItems = [
    { label: 'Dashboard All Site', path: '/dashboard-all-site', icon: 'bi-grid-1x2' },
    { label: 'Dashboard Per Site', path: '/dashboard-per-site', icon: 'bi-pin-map' },
    { label: 'Input Data', path: '/input-data', icon: 'bi-pencil-square' },
    { label: 'Data Unit', path: '/data-unit', icon: 'bi-truck' },
    { label: 'Detail LT Supply', path: '/detail-lt-supply', icon: 'bi-clock-history' },
    { label: 'Pending Supply', path: '/pending-supply', icon: 'bi-box-seam' },
    { label: 'Import Excel Bulanan', path: '/import-master-data', icon: 'bi-file-earmark-arrow-up' },
];

function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Overlay untuk mobile saat sidebar terbuka */}
            {isOpen && (
                <div
                    className="d-lg-none"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        zIndex: 1040,
                    }}
                />
            )}

            <aside
                className={`app-sidebar thin-scrollbar ${isOpen ? '' : 'sidebar-hidden'}`}
                style={{
                    width: 'var(--sidebar-width)',
                    backgroundColor: 'var(--color-white)',
                    borderRight: '1px solid var(--color-border)',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 1050,
                    overflowY: 'auto',
                    transition: 'transform 0.25s ease-in-out',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                }}
            >
                <div
                    className="d-flex align-items-center px-4"
                    style={{ height: 'var(--navbar-height)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <i className="bi bi-speedometer2 fs-4 text-primary-custom me-2" />
                    <span className="fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                        PPA Monitor
                    </span>
                </div>

                <nav className="d-flex flex-column p-3 gap-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2 ${isActive ? 'sidebar-link-active' : 'sidebar-link'
                                }`
                            }
                        >
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}

export default Sidebar;