/* Palette chart dikontrol dari CSS utama melalui --chart-* variables. */
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList,
} from 'recharts';

// Warna default dipetakan ke variabel yang benar-benar didefinisikan
// di dashboard-theme.css (sebelumnya menunjuk ke --chart-teal /
// --chart-berry / --chart-slate yang tidak pernah dideklarasikan).
const DEFAULT_COLORS = [
    '#5f5aa5',
    '#baacec',
];

function sanitizeId(value) {
    return String(value ?? 'series').replace(/[^a-zA-Z0-9-_]/g, '-');
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    // Area dan Line bisa punya dataKey sama, jadi ambil satu per dataKey
    // supaya tooltip tidak dobel.
    const seen = new Set();
    const uniquePayload = payload.filter((item) => {
        if (seen.has(item.dataKey)) return false;
        seen.add(item.dataKey);
        return true;
    });

    return (
        <div className="ppa-chart-tooltip">
            <div className="ppa-chart-tooltip-label">{label}</div>

            <div className="ppa-chart-tooltip-items">
                {uniquePayload.map((item) => (
                    <div key={item.dataKey} className="ppa-chart-tooltip-row">
                        <span
                            className="ppa-chart-tooltip-dot"
                            style={{ background: item.color || item.stroke || item.fill }}
                        />
                        <span className="ppa-chart-tooltip-name">{item.name}</span>
                        <strong className="ppa-chart-tooltip-value">
                            {item.value === null || item.value === undefined ? '-' : item.value}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BarValueLabel({ x, y, width, value }) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return null;
    }

    return (
        <text
            x={Number(x) + Number(width) / 2}
            y={Number(y) - 7}
            textAnchor="middle"
            className="ppa-chart-bar-value"
        >
            {Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)}
        </text>
    );
}

function ChartCard({
    title,
    type = 'line',
    data = [],
    xKey,
    series = [],
    loading = false,
    height = 280,
    showBarValues = true,
}) {

    return (
        <div className="ppa-chart-card">
            {/* HEADER */}
            <div className="ppa-chart-header">
                <div className="ppa-chart-title-wrap">
                    <div className="ppa-chart-title">{title}</div>
                    <span className="ppa-chart-info">
                        <i className="bi bi-info-circle" />
                    </span>
                </div>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="placeholder-glow w-100" style={{ height }}>
                    <span className="placeholder w-100 h-100 rounded" />
                </div>
            ) : data.length === 0 ? (
                <div className="ppa-chart-empty" style={{ height }}>
                    <div className="ppa-chart-empty-icon">
                        <i className="bi bi-bar-chart-line" />
                    </div>
                    <small>Data belum tersedia</small>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <ComposedChart data={data} margin={{ top: 24, right: 22, left: -4, bottom: 8 }}>
                        <defs>
                            {series.map((item, index) => {
                                const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                const id = `gradient-${sanitizeId(item.key)}-${index}`;

                                return (
                                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                        {/*highlight */}
                                        <stop offset="0%" stopColor={color} stopOpacity="0.40" />

                                        {/*warna utama */}
                                        <stop offset="10%" stopColor={color} stopOpacity="1" />

                                        <stop offset="65%" stopColor={color} stopOpacity="0.9" />

                                        {/* bagian bawah lebih gelap */}
                                        <stop
                                            offset="85%"
                                            stopColor={color}
                                            stopOpacity="0.72"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor={color}
                                            stopOpacity="0.88"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor={color}
                                            stopOpacity="0.72"
                                        />
                                    </linearGradient>
                                );
                            })}

                            {series.map((item, index) => {
                                const gradientId = `gradient-${sanitizeId(item.key)}-${index}`;

                                return (
                                    <filter
                                        key={`shadow-${gradientId}`}
                                        id={`shadow-${gradientId}`}
                                        x="-20%"
                                        y="-20%"
                                        width="140%"
                                        height="150%"
                                    >
                                        <feDropShadow
                                            dx="3"
                                            dy="5"
                                            stdDeviation="4"
                                            floodColor="#000000"
                                            floodOpacity="0.22"
                                        />
                                    </filter>
                                );
                            })}

                            {series.map((item, index) => {
                                const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                const id = `area-${sanitizeId(item.key)}-${index}`;

                                return (
                                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                                    </linearGradient>
                                );
                            })}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="5 4"
                            stroke="var(--chart-grid-strong)"
                            strokeWidth={1.4}
                            vertical={false}
                        />

                        <XAxis
                            dataKey={xKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'var(--chart-axis-text)', fontWeight: 500 }}
                            dy={8}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'var(--chart-axis-text)', fontWeight: 500 }}
                            width={40}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--chart-hover)' }} />

                        <Legend
                            iconType="circle"
                            iconSize={7}
                            wrapperStyle={{ fontSize: 11, color: 'var(--chart-axis-text)', paddingTop: 14 }}
                        />

                        {/* AREA HALUS DI BELAKANG LINE */}
                        {series.map((item, index) => {
                            const renderType = item.renderAs || type;
                            if (renderType !== 'line' || item.dashed) return null;

                            const id = `area-${sanitizeId(item.key)}-${index}`;

                            return (
                                <Area
                                    key={`area-${item.key}`}
                                    type="monotone"
                                    dataKey={item.key}
                                    stroke="none"
                                    fill={`url(#${id})`}
                                    fillOpacity={1}
                                    legendType="none"
                                    tooltipType="none"
                                    connectNulls={false}
                                    isAnimationActive
                                />
                            );
                        })}

                        {/* SERIES */}
                        {series.map((item, index) => {
                            const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                            const renderType = item.renderAs || type;

                            if (renderType === 'line') {
                                return (
                                    <Line
                                        key={item.key}
                                        type="monotone"
                                        dataKey={item.key}
                                        name={item.label}
                                        stroke={color}
                                        strokeWidth={item.dashed ? 2 : 2.7}
                                        strokeDasharray={item.dashed ? '7 6' : undefined}
                                        dot={
                                            item.dashed
                                                ? false
                                                : { r: 3.5, fill: 'var(--chart-dot-bg)', stroke: color, strokeWidth: 2 }
                                        }
                                        activeDot={
                                            item.dashed
                                                ? false
                                                : { r: 5.5, fill: color, stroke: 'var(--chart-dot-bg)', strokeWidth: 2.5 }
                                        }
                                        connectNulls={false}
                                        className={item.dashed ? 'ppa-target-line' : 'ppa-data-line'}
                                    />
                                );
                            }

                            const gradientId = `gradient-${sanitizeId(item.key)}-${index}`;

                            return (
                                <Bar
                                    dataKey={item.key}
                                    name={item.label}
                                    fill={`url(#${gradientId})`}
                                    stroke={item.color}
                                    strokeWidth={1}
                                    radius={[10, 10, 3, 3]}
                                    filter={`url(#shadow-${gradientId})`}
                                    maxBarSize={48}
                                >
                                    <LabelList
                                        dataKey={item.key}
                                        position="top"
                                        style={{
                                            fill: 'var(--text-primary)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    />
                                </Bar>
                            );
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default ChartCard;
