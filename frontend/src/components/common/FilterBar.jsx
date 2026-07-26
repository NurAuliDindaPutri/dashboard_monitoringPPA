import { MONTHS, YEARS } from '../../utils/constants';

/**
 * @param {Array} sites Daftar site dari /api/sites
 * @param {string|number} siteId Site terpilih ('' = semua site)
 * @param {number} month Bulan terpilih
 * @param {number} year Tahun terpilih
 * @param {Function} onSiteChange
 * @param {Function} onMonthChange
 * @param {Function} onYearChange
 * @param {boolean} showSiteFilter Tampilkan filter site atau tidak
 * @param {boolean} showMonthFilter Tampilkan filter bulan atau tidak
 * @param {boolean} showYearFilter Tampilkan filter tahun atau tidak
 */
function FilterBar({
    sites = [],
    siteId = '',
    month,
    year,
    onSiteChange,
    onMonthChange,
    onYearChange,
    showSiteFilter = true,
    showMonthFilter = true,
    showYearFilter = true,
}) {
    const visibleCount = [showSiteFilter, showMonthFilter, showYearFilter].filter(Boolean).length;
    const colClass = visibleCount === 1 ? 'col-12 col-md-6' : visibleCount === 2 ? 'col-6 col-md-6' : 'col-6 col-md-4';

    return (
        <div className="app-card p-3 mb-3">
            <div className="row g-2 align-items-end">
                {showSiteFilter && (
                    <div className={`col-12 ${visibleCount === 1 ? 'col-md-6' : 'col-md-4'}`}>
                        <label className="form-label small text-secondary mb-1">Site</label>
                        <select
                            className="form-select"
                            value={siteId}
                            onChange={(e) => onSiteChange(e.target.value)}
                        >
                            <option value="">Semua Site</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.site_code} {site.site_name ? `- ${site.site_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showMonthFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Bulan</label>
                        <select
                            className="form-select"
                            value={month}
                            onChange={(e) => onMonthChange(Number(e.target.value))}
                        >
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showYearFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Tahun</label>
                        <select
                            className="form-select"
                            value={year}
                            onChange={(e) => onYearChange(Number(e.target.value))}
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FilterBar;