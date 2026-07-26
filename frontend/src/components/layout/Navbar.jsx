function Navbar({ onToggleSidebar }) {
    return (
        <nav
            className="d-flex align-items-center justify-content-between px-3 border-bottom"
            style={{
                height: 'var(--navbar-height)',
                backgroundColor: 'var(--color-white)',
                borderColor: 'var(--color-border)',
                position: 'sticky',
                top: 0,
                zIndex: 1030,
            }}
        >
            <div className="d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="btn btn-light d-lg-none border"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <i className="bi bi-list fs-5" />
                </button>
                <span className="fw-semibold fs-5" style={{ color: 'var(--color-text-primary)' }}>
                    Monitoring Performance <span className="text-primary-custom">PPA</span>
                </span>
            </div>

            <div className="d-flex align-items-center gap-2">
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                    }}
                >
                    U
                </div>
            </div>
        </nav>
    );
}

export default Navbar;