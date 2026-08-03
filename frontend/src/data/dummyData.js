const DUMMY_YEAR = 2026;

export const dummySites = [
    {
        id: 1,
        site_code: 'BIB',
        site_name: 'Borneo Indobara',
    },
    {
        id: 2,
        site_code: 'WARA',
        site_name: 'Wara',
    },
    {
        id: 3,
        site_code: 'VALE',
        site_name: 'Vale',
    },
    {
        id: 4,
        site_code: 'ADARO',
        site_name: 'Adaro',
    },
    {
        id: 5,
        site_code: 'KPC',
        site_name: 'Kaltim Prima Coal',
    },
];

const unitModelsBySite = {
    1: [
        'PC2000-8',
        'HD785-7',
        'D155A-6',
        'FMX440',
        'SCANIA P410',
    ],
    2: [
        'PC1250-8',
        'HD465-7R',
        'D85ESS-2',
        'FMX400',
    ],
    3: [
        'PC850-8R1',
        'GD705-5',
        'WA480-6',
        'SCANIA P460',
    ],
    4: [
        'PC3000-8',
        'HD1500-8',
        'D375A-6',
        'GD825A-2',
    ],
    5: [
        'PC4000-11',
        'HD785-8',
        'WA600-8',
        'FMX440',
    ],
};

function round(value, decimals = 2) {
    const multiplier = 10 ** decimals;

    return (
        Math.round(value * multiplier) /
        multiplier
    );
}

function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
}

function getMonthDate(month, day = 15) {
    return `${DUMMY_YEAR}-${String(
        month
    ).padStart(2, '0')}-${String(
        day
    ).padStart(2, '0')}`;
}

/*
 * KPI SUMMARY
 * Januari sampai Desember untuk seluruh site.
 */
export const dummyKpiSummary =
    dummySites.flatMap(
        (site, siteIndex) =>
            Array.from(
                { length: 12 },
                (_, monthIndex) => {
                    const month =
                        monthIndex + 1;

                    const variation =
                        (
                            (
                                month +
                                siteIndex
                            ) %
                            6
                        ) * 0.006;

                    return {
                        id: `dummy-kpi-${site.id}-${month}`,

                        site_id:
                            site.id,

                        site_code:
                            site.site_code,

                        site_name:
                            site.site_name,

                        period_month:
                            month,

                        period_year:
                            DUMMY_YEAR,

                        readyness_actual:
                            round(
                                clamp(
                                    0.885 +
                                    variation +
                                    siteIndex *
                                    0.004,
                                    0.85,
                                    0.99
                                ),
                                4
                            ),

                        readyness_target:
                            0.9,

                        availability_actual:
                            round(
                                clamp(
                                    0.945 +
                                    variation +
                                    siteIndex *
                                    0.003,
                                    0.9,
                                    0.995
                                ),
                                4
                            ),

                        availability_target:
                            0.98,

                        leadtime_actual:
                            round(
                                clamp(
                                    0.895 +
                                    variation +
                                    siteIndex *
                                    0.005,
                                    0.85,
                                    0.99
                                ),
                                4
                            ),

                        leadtime_target:
                            0.93,

                        created_at:
                            `${getMonthDate(
                                month,
                                1
                            )}T08:00:00`,

                        updated_at:
                            `${getMonthDate(
                                month,
                                20
                            )}T09:00:00`,
                    };
                }
            )
    );

/*
 * UNIT PERFORMANCE
 * Beberapa model unit per site untuk Januari–Desember.
 */
export const dummyUnitPerformances =
    dummySites.flatMap(
        (site, siteIndex) => {
            const models =
                unitModelsBySite[
                site.id
                ] || [];

            return Array.from(
                { length: 12 },
                (_, monthIndex) => {
                    const month =
                        monthIndex + 1;

                    return models.map(
                        (
                            modelName,
                            modelIndex
                        ) => {
                            const seasonal =
                                (
                                    (
                                        month +
                                        modelIndex +
                                        siteIndex
                                    ) %
                                    7
                                ) *
                                0.006;

                            return {
                                id: `dummy-unit-${site.id}-${month}-${modelIndex + 1}`,

                                site_id:
                                    site.id,

                                site_code:
                                    site.site_code,

                                site_name:
                                    site.site_name,

                                unit_model_id:
                                    site.id *
                                    100 +
                                    modelIndex +
                                    1,

                                model_name:
                                    modelName,

                                period_month:
                                    month,

                                period_year:
                                    DUMMY_YEAR,

                                physical_availability:
                                    round(
                                        clamp(
                                            0.91 +
                                            seasonal +
                                            modelIndex *
                                            0.004,
                                            0.88,
                                            0.995
                                        ),
                                        4
                                    ),

                                unit_availability:
                                    round(
                                        clamp(
                                            0.72 +
                                            seasonal +
                                            modelIndex *
                                            0.018,
                                            0.6,
                                            0.98
                                        ),
                                        4
                                    ),

                                mtbf:
                                    round(
                                        190 +
                                        month *
                                        4 +
                                        modelIndex *
                                        18 +
                                        siteIndex *
                                        11,
                                        1
                                    ),

                                mttr:
                                    round(
                                        6.5 -
                                        month *
                                        0.12 +
                                        modelIndex *
                                        0.25,
                                        1
                                    ),

                                productivity:
                                    round(
                                        72 +
                                        month *
                                        1.3 +
                                        modelIndex *
                                        2.1 +
                                        siteIndex *
                                        1.4,
                                        2
                                    ),

                                fuel_consumption:
                                    Math.round(
                                        9500 +
                                        month *
                                        210 +
                                        modelIndex *
                                        760 +
                                        siteIndex *
                                        430
                                    ),

                                created_at:
                                    `${getMonthDate(
                                        month,
                                        1
                                    )}T08:00:00`,

                                updated_at:
                                    `${getMonthDate(
                                        month,
                                        20
                                    )}T09:00:00`,
                            };
                        }
                    );
                }
            ).flat();
        }
    );

/*
 * PENDING SUPPLY
 */
const dummyParts = [
    {
        number:
            'HYD-12345',
        description:
            'Filter hydraulic',
    },
    {
        number:
            'SEAL-7788',
        description:
            'Seal kit cylinder',
    },
    {
        number:
            'BRG-90210',
        description:
            'Bearing assembly',
    },
    {
        number:
            'HOSE-4455',
        description:
            'Hydraulic hose',
    },
    {
        number:
            'PUMP-6812',
        description:
            'Fuel pump',
    },
    {
        number:
            'FILTER-7731',
        description:
            'Air filter',
    },
    {
        number:
            'BELT-2215',
        description:
            'Fan belt',
    },
    {
        number:
            'VALVE-8902',
        description:
            'Control valve',
    },
];

export const dummyPendingSupply =
    dummySites.flatMap(
        (site, siteIndex) =>
            Array.from(
                { length: 12 },
                (_, monthIndex) => {
                    const month =
                        monthIndex + 1;

                    return Array.from(
                        { length: 3 },
                        (_, itemIndex) => {
                            const part =
                                dummyParts[
                                (
                                    monthIndex +
                                    itemIndex +
                                    siteIndex
                                ) %
                                dummyParts.length
                                ];

                            return {
                                id: `dummy-supply-${site.id}-${month}-${itemIndex + 1}`,

                                site_id:
                                    site.id,

                                site_code:
                                    site.site_code,

                                site_name:
                                    site.site_name,

                                parts_number:
                                    part.number,

                                description:
                                    part.description,

                                qty:
                                    3 +
                                    month +
                                    itemIndex *
                                    4,

                                no_po:
                                    itemIndex ===
                                        2
                                        ? null
                                        : `PO-${site.site_code}-${DUMMY_YEAR}${String(
                                            month
                                        ).padStart(
                                            2,
                                            '0'
                                        )}-${itemIndex + 1}`,

                                eta:
                                    itemIndex ===
                                        2
                                        ? null
                                        : getMonthDate(
                                            month,
                                            5 +
                                            itemIndex *
                                            8
                                        ),

                                remarks:
                                    itemIndex ===
                                        0
                                        ? 'Menunggu pengiriman vendor'
                                        : itemIndex ===
                                            1
                                            ? 'Dalam proses pengiriman'
                                            : 'ETA belum dikonfirmasi',

                                period_month:
                                    month,

                                period_year:
                                    DUMMY_YEAR,

                                created_at:
                                    `${getMonthDate(
                                        month,
                                        1
                                    )}T08:00:00`,

                                updated_at:
                                    `${getMonthDate(
                                        month,
                                        18
                                    )}T09:00:00`,
                            };
                        }
                    );
                }
            ).flat()
    );

/*
 * CRITICAL ITEMS
 */
const criticalParts = [
    {
        part_number:
            'CRIT-ENG-001',
        description:
            'Engine control module',
        category:
            'Engine',
    },
    {
        part_number:
            'CRIT-HYD-002',
        description:
            'Main hydraulic pump',
        category:
            'Hydraulic',
    },
    {
        part_number:
            'CRIT-TRM-003',
        description:
            'Transmission assembly',
        category:
            'Transmission',
    },
    {
        part_number:
            'CRIT-BRK-004',
        description:
            'Brake accumulator',
        category:
            'Brake',
    },
    {
        part_number:
            'CRIT-ELC-005',
        description:
            'Alternator assembly',
        category:
            'Electrical',
    },
];

export const dummyCriticalItems =
    dummySites.flatMap(
        (site, siteIndex) =>
            Array.from(
                { length: 12 },
                (_, monthIndex) => {
                    const month =
                        monthIndex + 1;

                    return Array.from(
                        { length: 2 },
                        (_, itemIndex) => {
                            const part =
                                criticalParts[
                                (
                                    siteIndex +
                                    monthIndex +
                                    itemIndex
                                ) %
                                criticalParts.length
                                ];

                            return {
                                id: `dummy-critical-${site.id}-${month}-${itemIndex + 1}`,

                                site_id:
                                    site.id,

                                site_code:
                                    site.site_code,

                                site_name:
                                    site.site_name,

                                parts_number:
                                    part.part_number,

                                part_number:
                                    part.part_number,

                                description:
                                    part.description,

                                category:
                                    part.category,

                                qty:
                                    itemIndex +
                                    1,

                                priority:
                                    itemIndex ===
                                        0
                                        ? 'High'
                                        : 'Medium',

                                status:
                                    itemIndex ===
                                        0
                                        ? 'Open'
                                        : 'Monitoring',

                                period_month:
                                    month,

                                period_year:
                                    DUMMY_YEAR,

                                remarks:
                                    'Data dummy untuk kebutuhan demonstrasi',

                                created_at:
                                    `${getMonthDate(
                                        month,
                                        2
                                    )}T08:00:00`,

                                updated_at:
                                    `${getMonthDate(
                                        month,
                                        19
                                    )}T09:00:00`,
                            };
                        }
                    );
                }
            ).flat()
    );

/*
 * UNIT MODEL
 */
export const dummyUnitModels =
    dummySites.flatMap(
        (site) =>
            (
                unitModelsBySite[
                site.id
                ] || []
            ).map(
                (
                    modelName,
                    modelIndex
                ) => ({
                    id:
                        site.id *
                        100 +
                        modelIndex +
                        1,

                    site_id:
                        site.id,

                    site_code:
                        site.site_code,

                    model_name:
                        modelName,
                })
            )
    );

export function getDummyUnitModelsBySite(
    siteId
) {
    if (!siteId) {
        return dummyUnitModels;
    }

    return dummyUnitModels.filter(
        (row) =>
            String(
                row.site_id
            ) === String(siteId)
    );
}

/*
 * Jangan buat fungsi filterDummyByPeriod
 * lagi di bagian lain file ini.
 */
export function filterDummyByPeriod(
    rows,
    {
        siteId = '',
        month = '',
        year = '',
    } = {}
) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.filter(
        (row) => {
            const matchSite =
                !siteId ||
                String(
                    row.site_id
                ) ===
                String(siteId);

            const matchMonth =
                !month ||
                Number(
                    row.period_month
                ) ===
                Number(month);

            const matchYear =
                !year ||
                Number(
                    row.period_year
                ) ===
                Number(year);

            return (
                matchSite &&
                matchMonth &&
                matchYear
            );
        }
    );
}