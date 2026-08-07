import { MONTHS, YEARS } from '../../utils/constants';

/**
 * @param {Array} sites Daftar site dari /api/sites
 * @param {string|number} siteId Site terpilih ('' = semua site)
 * @param {Array<{id:number|string, label:string}>} units Daftar unit (opsional, untuk site terpilih)
 * @param {string|number} unitId Unit terpilih ('' = semua unit)
 * @param {number} month Bulan terpilih
 * @param {number} year Tahun terpilih
 * @param {Function} onSiteChange
 * @param {Function} onUnitChange
 * @param {Function} onMonthChange
 * @param {Function} onYearChange
 * @param {boolean} showSiteFilter Tampilkan filter site atau tidak
 * @param {boolean} showUnitFilter Tampilkan filter unit atau tidak
 * @param {boolean} showMonthFilter Tampilkan filter bulan atau tidak
 * @param {boolean} showYearFilter Tampilkan filter tahun atau tidak
 */
function FilterBar({
    sites = [],
    siteId = '',
    units = [],
    unitId = '',
    month,
    year,
    onSiteChange,
    onUnitChange,
    onMonthChange,
    onYearChange,
    showSiteFilter = true,
    showUnitFilter = false,
    showMonthFilter = true,
    showYearFilter = true,
}) {
    const visibleCount = [showSiteFilter, showUnitFilter, showMonthFilter, showYearFilter].filter(Boolean).length;
    const colClass =
        visibleCount <= 1
            ? 'col-12 col-md-6'
            : visibleCount === 2
                ? 'col-6 col-md-6'
                : visibleCount === 3
                    ? 'col-6 col-md-4'
                    : 'col-6 col-md-3';

    return (
        <div className="app-card p-3 mb-3">
            <div className="row g-2 align-items-end">
                {showSiteFilter && (
                    <div className={colClass}>
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

                {showUnitFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Unit</label>
                        <select
                            className="form-select"
                            value={unitId}
                            onChange={(e) => onUnitChange(e.target.value)}
                            disabled={!siteId}
                        >
                            <option value="">Semua Unit</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.label}
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