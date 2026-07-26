function Navbar({ onToggleMobileSidebar }) {
    return (
        <nav className="app-navbar d-flex align-items-center justify-content-between px-3">
            <div className="d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="navbar-icon-btn d-lg-none"
                    onClick={onToggleMobileSidebar}
                    aria-label="Toggle sidebar"
                >
                    <i className="bi bi-list fs-5" />
                </button>
                <span className="fw-semibold fs-5" style={{ color: 'var(--navbar-text)' }}>
                    Monitoring Performance <span style={{ color: 'var(--accent-violet)' }}>PPA</span>
                </span>
            </div>

            <div className="d-flex align-items-center gap-2">
                <button type="button" className="navbar-icon-btn" aria-label="Notifikasi">
                    <i className="bi bi-bell fs-6" />
                </button>
                <div className="navbar-avatar rounded-circle d-flex align-items-center justify-content-center">
                    U
                </div>
            </div>
        </nav>
    );
}

export default Navbar;