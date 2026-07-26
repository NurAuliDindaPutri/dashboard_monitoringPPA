import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const DEFAULT_COLORS = ['#1a56db', '#16a34a', '#d97706', '#dc2626', '#64748b'];

/**
 * @param {string} title Judul chart
 * @param {'line'|'bar'} type Tipe chart
 * @param {Array<object>} data Data array untuk Recharts
 * @param {string} xKey Key sumbu X
 * @param {Array<{ key: string, label: string, color?: string }>} series Daftar series yang ditampilkan
 * @param {boolean} loading Status loading
 * @param {number} height Tinggi chart (px)
 */
function ChartCard({ title, type = 'line', data = [], xKey, series = [], loading = false, height = 280 }) {
    const ChartComponent = type === 'bar' ? BarChart : LineChart;
    const SeriesComponent = type === 'bar' ? Bar : Line;

    return (
        <div className="app-card p-3 h-100">
            <div className="fw-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {title}
            </div>

            {loading ? (
                <div className="placeholder-glow w-100" style={{ height }}>
                    <span className="placeholder w-100 h-100 rounded" />
                </div>
            ) : data.length === 0 ? (
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center"
                    style={{ height }}
                >
                    <i className="bi bi-bar-chart" style={{ fontSize: '1.75rem', color: 'var(--color-text-muted)' }} />
                    <small className="text-muted mt-2">Data belum tersedia</small>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <ChartComponent data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {series.map((s, idx) => (
                            <SeriesComponent
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                fill={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </ChartComponent>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default ChartCard;