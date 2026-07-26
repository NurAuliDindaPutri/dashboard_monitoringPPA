/**
 * @param {string} title Judul tabel (opsional)
 * @param {Array<{ key: string, label: string, align?: 'left'|'center'|'right', render?: (row: object) => React.ReactNode }>} columns
 * @param {Array<object>} data Data baris tabel
 * @param {boolean} loading Status loading
 * @param {string} emptyMessage Pesan saat data kosong
 * @param {string|number} rowKey Nama field unik untuk key React (default 'id')
 */
function DataTable({
    title,
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'Data belum tersedia',
    rowKey = 'id',
}) {
    return (
        <div className="app-card p-3">
            {title && (
                <div className="fw-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                </div>
            )}

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="text-secondary small text-uppercase"
                                    style={{ textAlign: col.align || 'left', whiteSpace: 'nowrap' }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4">
                                    <div className="spinner-border spinner-border-sm text-primary-custom" role="status" />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4 text-muted">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row[rowKey]}>
                                    {columns.map((col) => (
                                        <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                                            {col.render ? col.render(row) : row[col.key] ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;