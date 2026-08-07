/**
 * BigStatCard
 * Satu card besar berisi beberapa card kecil (mini stat) di dalamnya.
 * Dipakai di Dashboard Per Site untuk menampilkan ringkasan PA / UA / MTBF / MTTR.
 *
 * @param {string} title Judul card besar
 * @param {Array<{label:string, value:string|number, suffix?:string, icon?:string, color?:string}>} items
 * @param {boolean} loading
 */
function BigStatCard({ title, items = [], loading = false }) {
    return (
        <div className="app-card p-3 h-100">
            {title && (
                <div className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </div>
            )}

            <div className="row g-3">
                {items.map((item) => (
                    <div key={item.label} className="col-6 col-lg-3">
                        <div
                            className="rounded p-3 h-100 d-flex flex-column justify-content-between"
                            style={{
                                backgroundColor: 'var(--navy-800)',
                                border: '1px solid var(--border-color)',
                            }}
                        >
                            <div className="d-flex align-items-center gap-2 mb-2">
                                {item.icon && (
                                    <div
                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '8px',
                                            backgroundColor: `${item.color || 'var(--accent-indigo)'}1A`,
                                            color: item.color || 'var(--accent-indigo)',
                                        }}
                                    >
                                        <i className={`bi ${item.icon}`} style={{ fontSize: '0.9rem' }} />
                                    </div>
                                )}
                                <span className="text-secondary small">{item.label}</span>
                            </div>

                            {loading ? (
                                <div className="placeholder-glow">
                                    <span className="placeholder col-6" />
                                </div>
                            ) : (
                                <div className="fw-bold fs-5" style={{ color: 'var(--text-primary)' }}>
                                    {item.value}
                                    {item.suffix && (
                                        <span className="fs-6 fw-normal text-secondary ms-1">{item.suffix}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BigStatCard;