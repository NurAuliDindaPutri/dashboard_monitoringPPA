function KpiCard({ icon, label, value, suffix = '', loading = false, variant = 'primary' }) {
    const variantColor = {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        secondary: 'var(--color-secondary)',
    }[variant] || 'var(--color-primary)';

    return (
        <div className="app-card p-3 h-100 d-flex align-items-center gap-3">
            <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
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
                    <div className="fw-bold fs-5" style={{ color: 'var(--color-text-primary)' }}>
                        {value}
                        {suffix && <span className="fs-6 fw-normal text-secondary ms-1">{suffix}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default KpiCard;