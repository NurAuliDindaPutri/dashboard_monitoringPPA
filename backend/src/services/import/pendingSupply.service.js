const { pool } = require('../../config/db');

const {
    findHeaderRowIndex,
    buildColumnIndexMap,
    toNumberOrNull,
    toDateStringOrNull,
} = require('../../utils/excelHelpers');

const { ensureSiteId } = require('./resolvers');

function normalizeIdentifier(value) {
    const text = String(value ?? '')
        .trim()
        .toUpperCase();

    return text || null;
}

function parseQty(value) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return { value: 0 };
    }

    const qty = toNumberOrNull(value);

    if (
        qty === null ||
        !Number.isInteger(qty) ||
        qty < 0
    ) {
        return {
            validationError:
                'qty harus berupa bilangan bulat dan tidak boleh negatif',
        };
    }

    return { value: qty };
}

const COLUMN_LABELS = {
    partsNumber: [
        'parts_number',
        'Parts Number',
        'Part Number',
        'No Part',
    ],

    description: [
        'description',
        'Description',
    ],

    qty: [
        'qty',
        'Qty',
    ],

    noPo: [
        'no_po',
        'No PO',
        'PO',
    ],

    site: [
        'site_code',
        'Site',
        'SITE',
    ],

    eta: [
        'eta',
        'ETA',
    ],

    remarks: [
        'remarks',
        'Remarks',
    ],
};

async function importPendingSupplySheet(matrix) {
    let headerRowIdx = findHeaderRowIndex(
        matrix,
        'parts_number'
    );

    if (headerRowIdx === -1) {
        headerRowIdx = findHeaderRowIndex(
            matrix,
            'site_code'
        );
    }

    // Support template lama
    if (headerRowIdx === -1) {
        headerRowIdx = findHeaderRowIndex(
            matrix,
            'Parts Number'
        );
    }

    if (headerRowIdx === -1) {
        return {
            summary:
                '0 ditambahkan, 0 diperbarui, 0 dilewati',
            skippedDetails: [],
        };
    }

    const headerRow = matrix[headerRowIdx];

    const colIdx = buildColumnIndexMap(
        headerRow,
        COLUMN_LABELS
    );

    if (
        colIdx.partsNumber < 0 ||
        colIdx.site < 0
    ) {
        return {
            summary:
                '0 ditambahkan, 0 diperbarui, 1 dilewati',
            skippedDetails: [
                {
                    sheet: 'Pending Supply',
                    row: headerRowIdx + 1,
                    reason:
                        'Kolom site_code dan parts_number wajib tersedia',
                },
            ],
        };
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const skippedDetails = [];

    for (
        let r = headerRowIdx + 1;
        r < matrix.length;
        r += 1
    ) {
        const row = matrix[r] || [];

        const partsNumber =
            colIdx.partsNumber >= 0 &&
                row[colIdx.partsNumber] !== null &&
                row[colIdx.partsNumber] !== undefined
                ? normalizeIdentifier(
                    row[colIdx.partsNumber]
                )
                : null;

        const siteCode =
            colIdx.site >= 0 &&
                row[colIdx.site] !== null &&
                row[colIdx.site] !== undefined
                ? String(
                    row[colIdx.site]
                )
                    .trim()
                    .toUpperCase()
                : null;

        // Baris benar-benar kosong tidak dianggap dilewati
        if (!partsNumber && !siteCode) {
            continue;
        }

        // Data wajib tidak lengkap
        if (!partsNumber || !siteCode) {
            skippedCount += 1;

            skippedDetails.push({
                sheet: 'Pending Supply',
                row: r + 1,
                reason:
                    'site_code atau parts_number kosong',
            });

            continue;
        }

        try {
            const siteId =
                await ensureSiteId(siteCode);

            const description =
                colIdx.description >= 0 &&
                    row[colIdx.description] !== null &&
                    row[colIdx.description] !== undefined
                    ? String(
                        row[colIdx.description]
                    ).trim() || null
                    : null;

            const qtyResult = parseQty(
                colIdx.qty >= 0
                    ? row[colIdx.qty]
                    : null
            );

            if (qtyResult.validationError) {
                skippedCount += 1;
                skippedDetails.push({
                    sheet: 'Pending Supply',
                    row: r + 1,
                    reason: qtyResult.validationError,
                });
                continue;
            }

            const qty = qtyResult.value;

            const noPo =
                colIdx.noPo >= 0 &&
                    row[colIdx.noPo] !== null &&
                    row[colIdx.noPo] !== undefined
                    ? normalizeIdentifier(
                        row[colIdx.noPo]
                    )
                    : null;

            const etaRaw =
                colIdx.eta >= 0
                    ? row[colIdx.eta]
                    : null;

            const eta =
                toDateStringOrNull(
                    etaRaw
                );

            if (
                etaRaw !== null &&
                etaRaw !== undefined &&
                String(etaRaw).trim() !== '' &&
                !eta
            ) {
                skippedCount += 1;
                skippedDetails.push({
                    sheet: 'Pending Supply',
                    row: r + 1,
                    reason: 'eta bukan tanggal yang valid',
                });
                continue;
            }

            const remarks =
                colIdx.remarks >= 0 &&
                    row[colIdx.remarks] !== null &&
                    row[colIdx.remarks] !== undefined
                    ? String(
                        row[colIdx.remarks]
                    ).trim() || null
                    : null;

            /*
             * Identitas satu Pending Supply:
             *
             * site_id
             * + parts_number
             * + no_po
             *
             * Jika PO baru terisi sedangkan record lama masih tanpa PO,
             * record lama tersebut juga diperbarui agar tidak menjadi duplikat.
             */
            const [existingRows] =
                await pool.query(
                    `
                    SELECT id
                    FROM pending_supply
                    WHERE site_id = ?
                      AND UPPER(TRIM(parts_number)) = ?
                      AND (
                            no_po <=> ?
                            OR (
                                ? IS NOT NULL
                                AND (
                                    no_po IS NULL
                                    OR TRIM(no_po) = ''
                                )
                            )
                      )
                    ORDER BY
                        (no_po <=> ?) DESC,
                        id ASC
                    LIMIT 1
                    `,
                    [
                        siteId,
                        partsNumber,
                        noPo,
                        noPo,
                        noPo,
                    ]
                );

            const existing =
                existingRows[0];

            if (existing) {
                await pool.query(
                    `
                    UPDATE pending_supply
                    SET
                        parts_number = ?,
                        description = ?,
                        qty = ?,
                        no_po = ?,
                        eta = ?,
                        remarks = ?
                    WHERE id = ?
                    `,
                    [
                        partsNumber,
                        description,
                        qty,
                        noPo,
                        eta,
                        remarks,
                        existing.id,
                    ]
                );

                updatedCount += 1;
            } else {
                await pool.query(
                    `
                    INSERT INTO pending_supply
                    (
                        site_id,
                        parts_number,
                        description,
                        qty,
                        no_po,
                        eta,
                        remarks
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        siteId,
                        partsNumber,
                        description,
                        qty,
                        noPo,
                        eta,
                        remarks,
                    ]
                );

                addedCount += 1;
            }
        } catch (err) {
            skippedCount += 1;

            skippedDetails.push({
                sheet: 'Pending Supply',
                row: r + 1,
                reason:
                    err.message ||
                    'Baris gagal diproses',
            });
        }
    }

    return {
        summary:
            `${addedCount} ditambahkan, ` +
            `${updatedCount} diperbarui, ` +
            `${skippedCount} dilewati`,

        skippedDetails,
    };
}

module.exports = {
    importPendingSupplySheet,
};