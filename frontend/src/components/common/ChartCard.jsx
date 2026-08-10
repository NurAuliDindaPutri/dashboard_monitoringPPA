import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const DEFAULT_COLORS = [
    'var(--chart-purple)',
    'var(--chart-cyan)',
    'var(--chart-orange)',
    'var(--chart-pink)',
    'var(--chart-blue)',
];

function CustomTooltip({
    active,
    payload,
    label,
}) {
    if (
        !active ||
        !payload ||
        payload.length === 0
    ) {
        return null;
    }

    return (
        <div className="ppa-chart-tooltip">
            <div className="ppa-chart-tooltip-label">
                {label}
            </div>

            <div className="ppa-chart-tooltip-items">
                {payload.map((item) => (
                    <div
                        key={item.dataKey}
                        className="ppa-chart-tooltip-row"
                    >
                        <span
                            className="ppa-chart-tooltip-dot"
                            style={{
                                background:
                                    item.color,
                            }}
                        />

                        <span className="ppa-chart-tooltip-name">
                            {item.name}
                        </span>

                        <strong className="ppa-chart-tooltip-value">
                            {item.value ===
                                null ||
                                item.value ===
                                undefined
                                ? '-'
                                : item.value}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
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
}) {
    const hasMixedSeries =
        series.some(
            (item) =>
                item.renderAs
        );

    let ChartComponent;

    if (hasMixedSeries) {
        ChartComponent =
            ComposedChart;
    } else if (
        type === 'bar'
    ) {
        ChartComponent =
            BarChart;
    } else {
        ChartComponent =
            LineChart;
    }

    return (
        <div className="ppa-chart-card">
            <div className="ppa-chart-header">
                <div className="ppa-chart-title">
                    {title}
                </div>
            </div>

            {loading ? (
                <div
                    className="placeholder-glow w-100"
                    style={{
                        height,
                    }}
                >
                    <span className="placeholder w-100 h-100 rounded" />
                </div>
            ) : data.length ===
                0 ? (
                <div
                    className="ppa-chart-empty"
                    style={{
                        height,
                    }}
                >
                    <div className="ppa-chart-empty-icon">
                        <i className="bi bi-bar-chart-line" />
                    </div>

                    <small>
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
                            top: 15,
                            right: 18,
                            left: -3,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="4 5"
                            stroke="var(--chart-grid)"
                        />

                        <XAxis
                            dataKey={xKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill:
                                    'var(--chart-axis-text)',
                                fontWeight:
                                    500,
                            }}
                            dy={7}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill:
                                    'var(--chart-axis-text)',
                                fontWeight:
                                    500,
                            }}
                            width={38}
                        />

                        <Tooltip
                            content={
                                <CustomTooltip />
                            }
                            cursor={{
                                fill:
                                    'var(--chart-hover)',
                            }}
                        />

                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                fontSize: 11,
                                color:
                                    'var(--chart-axis-text)',
                                paddingTop: 14,
                            }}
                        />

                        {series.map(
                            (
                                item,
                                index
                            ) => {
                                const color =
                                    item.color ||
                                    DEFAULT_COLORS[
                                    index %
                                    DEFAULT_COLORS.length
                                    ];

                                const renderType =
                                    item.renderAs ||
                                    type;

                                if (
                                    renderType ===
                                    'line'
                                ) {
                                    return (
                                        <Line
                                            key={
                                                item.key
                                            }
                                            type="monotone"
                                            dataKey={
                                                item.key
                                            }
                                            name={
                                                item.label
                                            }
                                            stroke={
                                                color
                                            }
                                            strokeWidth={
                                                item.dashed
                                                    ? 2
                                                    : 3
                                            }
                                            strokeDasharray={
                                                item.dashed
                                                    ? '7 6'
                                                    : undefined
                                            }
                                            dot={{
                                                r: 3,
                                                fill:
                                                    'var(--chart-dot-bg)',
                                                stroke:
                                                    color,
                                                strokeWidth:
                                                    2,
                                            }}
                                            activeDot={{
                                                r: 5,
                                                fill:
                                                    color,
                                                stroke:
                                                    'var(--chart-dot-bg)',
                                                strokeWidth:
                                                    2,
                                            }}
                                            connectNulls={
                                                false
                                            }
                                        />
                                    );
                                }

                                return (
                                    <Bar
                                        key={
                                            item.key
                                        }
                                        dataKey={
                                            item.key
                                        }
                                        name={
                                            item.label
                                        }
                                        fill={
                                            color
                                        }
                                        radius={[
                                            7,
                                            7,
                                            2,
                                            2,
                                        ]}
                                        maxBarSize={
                                            34
                                        }
                                    />
                                );
                            }
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default ChartCard;