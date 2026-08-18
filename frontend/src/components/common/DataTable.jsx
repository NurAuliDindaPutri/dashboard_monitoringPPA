import { useEffect, useMemo, useState } from 'react';

/**
 * @param {string} title Judul tabel (opsional)
 * @param {Array<{ key: string, label: string, align?: 'left'|'center'|'right', render?: (row: object) => React.ReactNode }>} columns
 * @param {Array<object>} data Data baris tabel
 * @param {boolean} loading Status loading
 * @param {string} emptyMessage Pesan saat data kosong
 * @param {string|number} rowKey Nama field unik untuk key React (default 'id')
 * @param {boolean} pagination Aktifkan pagination secara opsional
 * @param {number} pageSize Jumlah baris per halaman
 * @param {string|number} paginationKey Reset ke halaman pertama saat filter berubah
 */
function DataTable({
    title,
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'Data belum tersedia',
    rowKey = 'id',
    pagination = false,
    pageSize = 10,
    paginationKey = '',
}) {
    const [currentPage, setCurrentPage] = useState(1);

    const safeData = Array.isArray(data) ? data : [];
    const safePageSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const totalPages = Math.max(1, Math.ceil(safeData.length / safePageSize));

    useEffect(() => {
        setCurrentPage(1);
    }, [paginationKey, safePageSize]);

    useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedData = useMemo(() => {
        if (!pagination) {
            return safeData;
        }

        const startIndex = (currentPage - 1) * safePageSize;
        return safeData.slice(startIndex, startIndex + safePageSize);
    }, [currentPage, pagination, safeData, safePageSize]);

    const pageNumbers = useMemo(() => {
        if (!pagination || totalPages <= 1) {
            return [];
        }

        const maximumVisiblePages = 5;
        const firstVisiblePage = Math.max(
            1,
            Math.min(
                currentPage - 2,
                totalPages - maximumVisiblePages + 1
            )
        );

        const lastVisiblePage = Math.min(
            totalPages,
            firstVisiblePage + maximumVisiblePages - 1
        );

        return Array.from(
            { length: lastVisiblePage - firstVisiblePage + 1 },
            (_, index) => firstVisiblePage + index
        );
    }, [currentPage, pagination, totalPages]);

    const firstVisibleRow =
        safeData.length === 0
            ? 0
            : (currentPage - 1) * safePageSize + 1;

    const lastVisibleRow = Math.min(
        currentPage * safePageSize,
        safeData.length
    );

    return (
        <div className="app-card table-card p-3">
            {title && (
                <div className="fw-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </div>
            )}

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="text-secondary small text-uppercase"
                                    style={{
                                        textAlign: column.align || 'left',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4">
                                    <div
                                        className="spinner-border spinner-border-sm text-primary-custom"
                                        role="status"
                                    />
                                </td>
                            </tr>
                        ) : safeData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-4 text-muted"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={
                                        row[rowKey] ??
                                        `${currentPage}-${rowIndex}`
                                    }
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            style={{ textAlign: column.align || 'left' }}
                                        >
                                            {column.render
                                                ? column.render(row)
                                                : row[column.key] ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && !loading && safeData.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                    <small className="text-secondary">
                        Menampilkan {firstVisibleRow}–{lastVisibleRow} dari{' '}
                        {safeData.length} data
                    </small>

                    {totalPages > 1 && (
                        <nav aria-label="Navigasi halaman tabel">
                            <ul className="pagination pagination-sm mb-0">
                                <li
                                    className={`page-item ${currentPage === 1 ? 'disabled' : ''
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link d-flex align-items-center justify-content-center"
                                        style={{ minWidth: 36, minHeight: 34 }}
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.max(1, page - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        aria-label="Halaman sebelumnya"
                                    >
                                        <i className="bi bi-chevron-left" aria-hidden="true" />
                                    </button>
                                </li>

                                {pageNumbers.map((pageNumber) => (
                                    <li
                                        key={pageNumber}
                                        className={`page-item ${currentPage === pageNumber
                                                ? 'active'
                                                : ''
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            className="page-link d-flex align-items-center justify-content-center"
                                            style={{ minWidth: 36, minHeight: 34 }}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            aria-current={
                                                currentPage === pageNumber
                                                    ? 'page'
                                                    : undefined
                                            }
                                        >
                                            {pageNumber}
                                        </button>
                                    </li>
                                ))}

                                <li
                                    className={`page-item ${currentPage === totalPages ? 'disabled' : ''
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link d-flex align-items-center justify-content-center"
                                        style={{ minWidth: 36, minHeight: 34 }}
                                        onClick={() =>
                                            setCurrentPage((page) =>
                                                Math.min(totalPages, page + 1)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        aria-label="Halaman berikutnya"
                                    >
                                        <i className="bi bi-chevron-right" aria-hidden="true" />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            )}
        </div>
    );
}

export default DataTable;
