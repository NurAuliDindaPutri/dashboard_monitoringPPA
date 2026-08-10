function toPercent(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return null;
    }

    const result =
        Math.abs(number) <= 1
            ? number * 100
            : number;

    return Number(
        result.toFixed(1)
    );
}

function getGaugeStatus(
    actual,
    target
) {
    if (actual === null) {
        return {
            key: 'no-data',

            label:
                'Belum Ada Data',

            color:
                '#94a3b8',

            soft:
                'rgba(148, 163, 184, 0.14)',
        };
    }

    if (
        target !== null &&
        actual >= target
    ) {
        return {
            key: 'good',

            label:
                'Memenuhi Target',

            color:
                '#16a34a',

            soft:
                'rgba(22, 163, 74, 0.12)',
        };
    }

    if (
        target !== null &&
        target - actual <= 2
    ) {
        return {
            key: 'near',

            label:
                'Mendekati Target',

            color:
                '#d97706',

            soft:
                'rgba(217, 119, 6, 0.12)',
        };
    }

    return {
        key: 'low',

        label:
            'Belum Target',

        color:
            '#b91c1c',

        soft:
            'rgba(185, 28, 28, 0.12)',
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
     * Gauge dari kiri ke kanan:
     * -140deg sampai -40deg
     *
     * Bentuknya dibuat lebih kecil
     * dan clean seperti referensi.
     */
    const minAngle = -140;
    const maxAngle = -40;

    const angle =
        minAngle +
        (value / 100) *
        (maxAngle -
            minAngle);

    /*
     * SVG geometry
     */
    const cx = 72;
    const cy = 72;
    const radius = 48;

    function polar(
        degrees,
        r = radius
    ) {
        const radians =
            (degrees *
                Math.PI) /
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
        endAngle
    ) {
        const start =
            polar(
                startAngle
            );

        const end =
            polar(
                endAngle
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
            `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        ].join(' ');
    }

    /*
     * Zona gauge
     *
     * merah  : 0 - 90
     * orange : 90 - 98
     * hijau  : 98 - 100
     *
     * Warnanya tetap status-oriented,
     * bukan pink.
     */
    const redEnd =
        minAngle +
        0.9 *
        (maxAngle -
            minAngle);

    const orangeEnd =
        minAngle +
        0.98 *
        (maxAngle -
            minAngle);

    const needle =
        polar(
            angle,
            40
        );

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
        <div className="summary-speedometer-card">
            {/* HEADER */}
            <div className="summary-speedometer-header">
                <h6 className="summary-speedometer-title">
                    {title}
                </h6>

                <span
                    className="summary-speedometer-badge"
                    style={{
                        color:
                            status.color,

                        background:
                            status.soft,
                    }}
                >
                    {
                        status.label
                    }
                </span>
            </div>

            {/* CONTENT */}
            <div className="summary-speedometer-content">
                {/* GAUGE */}
                <div className="summary-speedometer-gauge">
                    <svg
                        viewBox="0 0 144 100"
                        className="summary-speedometer-svg"
                    >
                        {/* BASE */}
                        <path
                            d={arcPath(
                                minAngle,
                                maxAngle
                            )}
                            fill="none"
                            stroke="var(--gauge-track)"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />

                        {/* RED ZONE */}
                        <path
                            d={arcPath(
                                minAngle,
                                redEnd
                            )}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />

                        {/* ORANGE ZONE */}
                        <path
                            d={arcPath(
                                redEnd,
                                orangeEnd
                            )}
                            fill="none"
                            stroke="#d97706"
                            strokeWidth="12"
                        />

                        {/* GREEN ZONE */}
                        <path
                            d={arcPath(
                                orangeEnd,
                                maxAngle
                            )}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />

                        {/* NEEDLE */}
                        {actualPercent !==
                            null && (
                                <>
                                    <line
                                        x1={
                                            cx
                                        }
                                        y1={
                                            cy
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
                                    />

                                    <circle
                                        cx={
                                            cx
                                        }
                                        cy={
                                            cy
                                        }
                                        r="5"
                                        fill="var(--gauge-needle)"
                                    />
                                </>
                            )}
                    </svg>
                </div>

                {/* INFO */}
                <div className="summary-speedometer-info">
                    <div
                        className="summary-speedometer-value"
                        style={{
                            color:
                                status.color,
                        }}
                    >
                        {actualPercent ===
                            null
                            ? 'N/A'
                            : `${actualPercent}%`}
                    </div>

                    <div className="summary-speedometer-actual-label">
                        Actual
                    </div>

                    <div className="summary-speedometer-divider" />

                    <div className="summary-speedometer-target">
                        Target

                        <strong>
                            {targetPercent ===
                                null
                                ? '-'
                                : `${targetPercent}%`}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SummarySpeedometerCard;