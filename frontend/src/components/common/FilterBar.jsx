import { MONTHS, YEARS } from '../../utils/constants';

/**
 * Filter umum yang dapat digunakan kembali oleh dashboard.
 *
 * Catatan untuk Dashboard Per Site:
 * - Gunakan allowAllSites={false} agar site wajib dipilih.
 * - Gunakan allowAllUnits={true} agar tersedia ringkasan "Semua Unit".
 * - Nilai default Januari sampai bulan sekarang diatur dari state halaman induk.
 *
 * @param {Array} sites Daftar site dari /api/sites
 * @param {string|number} siteId Site terpilih ('' = semua site atau belum dipilih)
 * @param {Array<{id?:number|string, value?:number|string, label:string}>} units Daftar model unit
 * @param {string|number} unitId Model terpilih ('' = semua unit)
 * @param {number} month Bulan terpilih untuk mode bulan tunggal
 * @param {number} year Tahun terpilih
 * @param {number} startMonth Bulan awal untuk mode rentang
 * @param {number} endMonth Bulan akhir untuk mode rentang
 */
function FilterBar({
    sites = [],
    siteId = '',
    units = [],
    unitId = '',
    month,
    year,
    startMonth,
    endMonth,
    onSiteChange,
    onUnitChange,
    onMonthChange,
    onYearChange,
    onStartMonthChange,
    onEndMonthChange,
    showSiteFilter = true,
    showUnitFilter = false,
    showMonthFilter = true,
    showMonthRangeFilter = false,
    showYearFilter = true,
    allowAllSites = true,
    allowAllUnits = true,
}) {
    const isSingleMonthVisible = showMonthFilter && !showMonthRangeFilter;

    const visibleCount =
        [showSiteFilter, showUnitFilter, showYearFilter].filter(Boolean).length +
        (isSingleMonthVisible ? 1 : 0) +
        (showMonthRangeFilter ? 2 : 0);

    const colClass =
        visibleCount <= 1
            ? 'col-12 col-md-6'
            : visibleCount === 2
                ? 'col-12 col-sm-6'
                : visibleCount === 3
                    ? 'col-12 col-sm-6 col-md-4'
                    : visibleCount === 4
                        ? 'col-12 col-sm-6 col-md-3'
                        : 'col-12 col-sm-6 col-md-4 col-xl';

    const numericStartMonth = Number(startMonth);
    const numericEndMonth = Number(endMonth);
    const hasStartMonth = numericStartMonth >= 1 && numericStartMonth <= 12;
    const hasEndMonth = numericEndMonth >= 1 && numericEndMonth <= 12;

    return (
        <div className="app-card p-3 mb-3">
            <div className="row g-2 align-items-end">
                {showSiteFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Site</label>
                        <select
                            className="form-select"
                            value={siteId}
                            onChange={(event) => onSiteChange?.(event.target.value)}
                        >
                            <option value="" disabled={!allowAllSites}>
                                {allowAllSites ? 'Semua Site' : 'Pilih Site'}
                            </option>

                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.site_code}
                                    {site.site_name ? ` - ${site.site_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showUnitFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">
                            Model Unit
                        </label>
                        <select
                            className="form-select"
                            value={unitId}
                            onChange={(event) => onUnitChange?.(event.target.value)}
                            disabled={!siteId || units.length === 0}
                        >
                            <option value="" disabled={!allowAllUnits}>
                                {allowAllUnits ? 'Semua Unit' : 'Pilih Model Unit'}
                            </option>

                            {units.map((unit) => {
                                const value = unit.value ?? unit.id;

                                return (
                                    <option key={value} value={value}>
                                        {unit.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}

                {showYearFilter && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Tahun</label>
                        <select
                            className="form-select"
                            value={year}
                            onChange={(event) =>
                                onYearChange?.(Number(event.target.value))
                            }
                        >
                            {YEARS.map((availableYear) => (
                                <option key={availableYear} value={availableYear}>
                                    {availableYear}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {isSingleMonthVisible && (
                    <div className={colClass}>
                        <label className="form-label small text-secondary mb-1">Bulan</label>
                        <select
                            className="form-select"
                            value={month}
                            onChange={(event) =>
                                onMonthChange?.(Number(event.target.value))
                            }
                        >
                            {MONTHS.map((availableMonth) => (
                                <option key={availableMonth.value} value={availableMonth.value}>
                                    {availableMonth.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showMonthRangeFilter && (
                    <>
                        <div className={colClass}>
                            <label className="form-label small text-secondary mb-1">
                                Dari Bulan
                            </label>
                            <select
                                className="form-select"
                                value={startMonth}
                                onChange={(event) =>
                                    onStartMonthChange?.(Number(event.target.value))
                                }
                            >
                                {MONTHS.map((availableMonth) => (
                                    <option
                                        key={availableMonth.value}
                                        value={availableMonth.value}
                                        disabled={
                                            hasEndMonth &&
                                            availableMonth.value > numericEndMonth
                                        }
                                    >
                                        {availableMonth.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={colClass}>
                            <label className="form-label small text-secondary mb-1">
                                Sampai Bulan
                            </label>
                            <select
                                className="form-select"
                                value={endMonth}
                                onChange={(event) =>
                                    onEndMonthChange?.(Number(event.target.value))
                                }
                            >
                                {MONTHS.map((availableMonth) => (
                                    <option
                                        key={availableMonth.value}
                                        value={availableMonth.value}
                                        disabled={
                                            hasStartMonth &&
                                            availableMonth.value < numericStartMonth
                                        }
                                    >
                                        {availableMonth.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default FilterBar;
