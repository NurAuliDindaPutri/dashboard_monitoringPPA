function KpiCard({ icon, label, value, suffix = '', loading = false, variant = 'primary' }) {
    const variantColor = {
        primary: 'var(--accent-indigo)',
        secondary: 'var(--accent-violet)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
    }[variant] || 'var(--accent-indigo)';

    return (
        <div className="app-card kpi-card p-3 h-100 d-flex align-items-center gap-3">
            <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: `${variantColor}1A`,
                    color: variantColor,
                }}
            >
                <i className={`bi ${icon} fs-4`} />
            </div>

            <div className="flex-grow-1">
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    {label}
                </div>
                {loading ? (
                    <div className="placeholder-glow">
                        <span className="placeholder col-6" />
                    </div>
                ) : (
                    <div className="fw-bold fs-5" style={{ color: 'var(--text-primary)' }}>
                        {value}
                        {suffix && <span className="fs-6 fw-normal text-secondary ms-1">{suffix}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default KpiCard;