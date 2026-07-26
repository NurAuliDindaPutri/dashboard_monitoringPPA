import ReactSpeedometer from 'react-d3-speedometer';
import { getKpiStatus, KPI_STATUS_COLOR, formatPercent } from '../../utils/kpiStatus';

/**
 * @param {string} title Judul gauge (mis. "Readiness")
 * @param {number|null} value Nilai aktual (0-1)
 * @param {number|null} target Nilai target (0-1)
 * @param {boolean} loading Status loading data
 */
function GaugeCard({ title, value, target, loading = false }) {
    const status = getKpiStatus(value, target);
    const hasData = status !== 'empty';

    // Fallback aman untuk value (clamp 0 - 100)
    const numValue = typeof value === 'number' && !isNaN(value) ? value * 100 : 0;
    const safeValue = Math.min(Math.max(Math.round(numValue), 0), 100);

    // Fallback aman untuk target dan custom segment stops
    const numTarget = typeof target === 'number' && !isNaN(target) ? target * 100 : 95;
    const safeTarget = Math.min(Math.max(Math.round(numTarget), 0), 100);
    const stop1 = Math.min(Math.max(Math.round(safeTarget * 0.95), 0), safeTarget);
    const segmentStops = [0, stop1, safeTarget, 100];

    return (
        <div className="app-card p-3 h-100 d-flex flex-column align-items-center">
            <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                </span>
                {hasData && (
                    <span
                        className="badge rounded-pill"
                        style={{
                            backgroundColor: `${KPI_STATUS_COLOR[status]}1A`,
                            color: KPI_STATUS_COLOR[status],
                        }}
                    >
                        {status === 'good' ? 'Memenuhi Target' : status === 'warning' ? 'Mendekati Target' : 'Di Bawah Target'}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="placeholder-glow w-100" style={{ height: 160 }}>
                    <span className="placeholder w-100 h-100 rounded" />
                </div>
            ) : !hasData ? (
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center"
                    style={{ height: 160 }}
                >
                    <i className="bi bi-slash-circle fs-2" style={{ color: 'var(--color-text-muted)' }} />
                    <small className="text-muted mt-2">Data belum tersedia</small>
                </div>
            ) : (
                <>
                    <ReactSpeedometer
                        width={220}
                        height={160}
                        value={safeValue}
                        minValue={0}
                        maxValue={100}
                        needleColor="#334155"
                        startColor="#dc2626"
                        segments={3}
                        customSegmentStops={segmentStops}
                        segmentColors={['#dc2626', '#d97706', '#16a34a']}
                        maxSegmentLabels={0}
                        currentValueText=""
                        ringWidth={18}
                        needleTransitionDuration={800}
                    />
                    <div className="text-center mt-1">
                        <div className="fs-4 fw-bold" style={{ color: KPI_STATUS_COLOR[status] }}>
                            {formatPercent(value)}
                        </div>
                        <small className="text-muted">Target: {formatPercent(target)}</small>
                    </div>
                </>
            )}
        </div>
    );
}

export default GaugeCard;