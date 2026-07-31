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

const DEFAULT_COLORS = [
    '#1a56db',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#64748b',
];

/**
 * @param {string} title Judul chart
 * @param {'line'|'bar'} type Tipe chart
 * @param {Array<object>} data Data array untuk Recharts
 * @param {string} xKey Key sumbu X
 * @param {Array<{ key: string, label: string, color?: string }>} series
 * @param {boolean} loading Status loading
 * @param {number} height Tinggi chart dalam px
 */
function ChartCard({
    title,
    type = 'line',
    data = [],
    xKey,
    series = [],
    loading = false,
    height = 280,
}) {
    const ChartComponent =
        type === 'bar' ? BarChart : LineChart;

    const SeriesComponent =
        type === 'bar' ? Bar : Line;

    return (
        <div className="app-card chart-card p-3">
            <div
                className="fw-semibold mb-3"
                style={{
                    color: 'var(--text-primary)',
                }}
            >
                {title}
            </div>

            {loading ? (
                <div
                    className="placeholder-glow w-100"
                    style={{ height }}
                >
                    <span className="placeholder w-100 h-100 rounded" />
                </div>
            ) : data.length === 0 ? (
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center"
                    style={{ height }}
                >
                    <i
                        className="bi bi-bar-chart"
                        style={{
                            fontSize: '1.75rem',
                            color: 'var(--text-muted)',
                        }}
                    />

                    <small className="text-muted mt-2">
                        Data belum tersedia
                    </small>
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={height}
                >
                    <ChartComponent
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chart-grid)"
                        />

                        <XAxis
                            dataKey={xKey}
                            tick={{
                                fontSize: 12,
                                fill: 'var(--text-secondary)',
                            }}
                            axisLine={{
                                stroke: 'var(--border-color)',
                            }}
                            tickLine={{
                                stroke: 'var(--border-color)',
                            }}
                        />

                        <YAxis
                            tick={{
                                fontSize: 12,
                                fill: 'var(--text-secondary)',
                            }}
                            axisLine={{
                                stroke: 'var(--border-color)',
                            }}
                            tickLine={{
                                stroke: 'var(--border-color)',
                            }}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card-bg)',
                                border:
                                    '1px solid var(--border-color)',
                                borderRadius: '10px',
                                color: 'var(--text-primary)',
                                boxShadow: 'var(--shadow-soft)',
                            }}
                            labelStyle={{
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                            }}
                            itemStyle={{
                                color: 'var(--text-secondary)',
                            }}
                        />

                        <Legend
                            wrapperStyle={{
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                            }}
                        />

                        {series.map((item, index) => {
                            const chartColor =
                                item.color ||
                                DEFAULT_COLORS[
                                index %
                                DEFAULT_COLORS.length
                                ];

                            return (
                                <SeriesComponent
                                    key={item.key}
                                    type="monotone"
                                    dataKey={item.key}
                                    name={item.label}
                                    stroke={chartColor}
                                    fill={chartColor}
                                    strokeWidth={2}
                                    dot={false}
                                    radius={
                                        type === 'bar'
                                            ? [4, 4, 0, 0]
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </ChartComponent>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default ChartCard;