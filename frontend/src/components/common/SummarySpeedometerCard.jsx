/* Palette UI dikontrol dari CSS utama: Sand / Sky Blue / Deep Sea / Moss / Terracotta / Cherry / Red Wine / Sunshine. */
function toPercent(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    const result =
        Math.abs(number) <= 1
            ? number * 100
            : number;

    return Number(result.toFixed(1));
}

function getGaugeStatus(
    actual,
    target
) {
    if (actual === null) {
        return {
            key: 'no-data',
            label: 'Belum Ada Data',

            color:
                'var(--status-neutral)',

            soft:
                'var(--status-neutral-soft)',

            icon:
                'bi-dash-circle',
        };
    }

    if (
        target !== null &&
        actual >= target
    ) {
        return {
            key: 'good',
            label: 'Memenuhi Target',

            color:
                'var(--status-good)',

            soft:
                'var(--status-good-soft)',

            icon:
                'bi-check-circle',
        };
    }

    if (
        target !== null &&
        target - actual <= 2
    ) {
        return {
            key: 'near',
            label: 'Mendekati Target',

            color:
                'var(--status-warning)',

            soft:
                'var(--status-warning-soft)',

            icon:
                'bi-exclamation-circle',
        };
    }

    return {
        key: 'low',
        label: 'Belum Target',

        color:
            'var(--status-danger)',

        soft:
            'var(--status-danger-soft)',

        icon:
            'bi-x-circle',
    };
}

function SummarySpeedometerCard({
    title,
    actual,
    target,
    loading = false,
}) {
    const actualPercent =
        toPercent(actual);

    const targetPercent =
        toPercent(target);

    const status =
        getGaugeStatus(
            actualPercent,
            targetPercent
        );

    const gaugeGradient = {
        good: {
            start: '#5FAFB5',
            middle: '#7FC7CC',
            end: '#7FC7CC',
        },
        near: {
            start: '#E4CBA9',
            middle: '#EA8913',
            end: '#EA8913',
        },
        low: {
            start: '#FDABA5',
            middle: '#AF5031',
            end: '#980204',
        },
        'no-data': {
            start: '#A8B4B5',
            middle: '#A8B4B5',
            end: '#A8B4B5',
        },
    }[status.key];

    const value =
        actualPercent === null
            ? 0
            : Math.max(
                0,
                Math.min(
                    actualPercent,
                    100
                )
            );

    /*
     * Gauge setengah lingkaran.
     * -180° = sisi kiri
     * 0°    = sisi kanan
     */
    const minAngle = -180;
    const maxAngle = 0;

    const angle =
        minAngle +
        (value / 100) *
        (maxAngle - minAngle);

    const cx = 120;
    const cy = 105;
    const radius = 82;

    function polar(
        degrees,
        r = radius
    ) {
        const radians =
            (degrees * Math.PI) /
            180;

        return {
            x:
                cx +
                r *
                Math.cos(
                    radians
                ),

            y:
                cy +
                r *
                Math.sin(
                    radians
                ),
        };
    }

    function arcPath(
        startAngle,
        endAngle,
        r = radius
    ) {
        const start =
            polar(
                startAngle,
                r
            );

        const end =
            polar(
                endAngle,
                r
            );

        const largeArc =
            Math.abs(
                endAngle -
                startAngle
            ) > 180
                ? 1
                : 0;

        return [
            `M ${start.x} ${start.y}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        ].join(' ');
    }

    const needleInner =
        polar(
            angle,
            30
        );

    const needle =
        polar(
            angle,
            66
        );

    const ticks = [
        0,
        25,
        50,
        75,
        100,
    ];

    if (loading) {
        return (
            <div className="summary-speedometer-card">
                <div className="placeholder-glow h-100">
                    <span className="placeholder rounded w-100 h-100" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={[
                'summary-speedometer-card',
                `status-${status.key}`,
            ].join(' ')}
        >
            {/* HEADER */}
            <div className="summary-speedometer-header">
                <div className="summary-speedometer-title-wrap">
                    <h6 className="summary-speedometer-title">
                        {title}
                    </h6>

                    <span
                        className="summary-speedometer-info-icon"
                        title="Nilai aktual dibandingkan dengan target"
                    >
                        <i className="bi bi-info-circle" />
                    </span>
                </div>
            </div>

            {/* GAUGE */}
            <div className="summary-speedometer-main">
                <div className="summary-speedometer-gauge">
                    <svg
                        viewBox="0 0 240 135"
                        className="summary-speedometer-svg"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient
                                id={`gauge-${status.key}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={gaugeGradient.start}
                                />

                                <stop
                                    offset="52%"
                                    stopColor={gaugeGradient.middle}
                                />

                                <stop
                                    offset="100%"
                                    stopColor={
                                        gaugeGradient.end
                                    }
                                />
                            </linearGradient>

                            <filter
                                id={`gauge-glow-${status.key}`}
                                x="-30%"
                                y="-30%"
                                width="160%"
                                height="160%"
                            >
                                <feGaussianBlur
                                    stdDeviation="4"
                                    result="blur"
                                />

                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* BASE TRACK */}
                        <path
                            d={arcPath(
                                minAngle,
                                maxAngle
                            )}
                            fill="none"
                            stroke="var(--gauge-track)"
                            strokeWidth="14"
                            strokeLinecap="round"
                        />

                        {/* ACTIVE ARC */}
                        {actualPercent !==
                            null && (
                                <path
                                    d={arcPath(
                                        minAngle,
                                        angle
                                    )}
                                    fill="none"
                                    stroke={`url(#gauge-${status.key})`}
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    filter={`url(#gauge-glow-${status.key})`}
                                    className="summary-speedometer-progress"
                                />
                            )}

                        {/* TICK MARKS */}
                        {Array.from({
                            length: 21,
                        }).map(
                            (
                                _,
                                index
                            ) => {
                                const tickValue =
                                    index *
                                    5;

                                const tickAngle =
                                    minAngle +
                                    (tickValue /
                                        100) *
                                    (maxAngle -
                                        minAngle);

                                const isMajor =
                                    tickValue %
                                    25 ===
                                    0;

                                const outer =
                                    polar(
                                        tickAngle,
                                        72
                                    );

                                const inner =
                                    polar(
                                        tickAngle,
                                        isMajor
                                            ? 63
                                            : 67
                                    );

                                return (
                                    <line
                                        key={
                                            tickValue
                                        }
                                        x1={
                                            inner.x
                                        }
                                        y1={
                                            inner.y
                                        }
                                        x2={
                                            outer.x
                                        }
                                        y2={
                                            outer.y
                                        }
                                        stroke={
                                            isMajor
                                                ? 'var(--gauge-tick-major)'
                                                : 'var(--gauge-tick)'
                                        }
                                        strokeWidth={
                                            isMajor
                                                ? 1.8
                                                : 1
                                        }
                                    />
                                );
                            }
                        )}

                        {/* NUMBER LABELS */}
                        {ticks.map(
                            (
                                tickValue
                            ) => {
                                const tickAngle =
                                    minAngle +
                                    (tickValue /
                                        100) *
                                    (maxAngle -
                                        minAngle);

                                const point =
                                    polar(
                                        tickAngle,
                                        99
                                    );

                                return (
                                    <text
                                        key={
                                            tickValue
                                        }
                                        x={
                                            point.x
                                        }
                                        y={
                                            point.y +
                                            4
                                        }
                                        textAnchor="middle"
                                        className="summary-speedometer-tick-label"
                                    >
                                        {
                                            tickValue
                                        }
                                    </text>
                                );
                            }
                        )}

                        {/* NEEDLE */}
                        {actualPercent !==
                            null && (
                                <>
                                    <line
                                        x1={
                                            needleInner.x
                                        }
                                        y1={
                                            needleInner.y
                                        }
                                        x2={
                                            needle.x
                                        }
                                        y2={
                                            needle.y
                                        }
                                        stroke="var(--gauge-needle)"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        className="summary-speedometer-needle"
                                    />

                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r="5"
                                        fill="var(--gauge-needle)"
                                    />

                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r="2.2"
                                        fill="var(--gauge-center)"
                                    />
                                </>
                            )}

                    </svg>

                    <div className="summary-speedometer-center-value">
                        <strong
                            style={{
                                color:
                                    status.color,
                            }}
                        >
                            {actualPercent ===
                                null
                                ? 'N/A'
                                : `${actualPercent}%`}
                        </strong>

                        <span>
                            Target:{' '}
                            {targetPercent ===
                                null
                                ? '-'
                                : `${targetPercent}%`}
                        </span>
                    </div>
                </div>

                {/* STATUS */}
                <div
                    className="summary-speedometer-status"
                    style={{
                        color:
                            status.color,

                        background:
                            status.soft,

                        borderColor:
                            status.color,
                    }}
                >
                    <i
                        className={`bi ${status.icon}`}
                    />

                    <span>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* VISUAL ACCENT - bukan data trend */}
            <div
                className="summary-speedometer-accent"
                aria-hidden="true"
            >
                <span
                    style={{
                        background:
                            status.color,
                    }}
                />
            </div>
        </div>
    );
}

export default SummarySpeedometerCard;