const monthlyUnitPerformanceModel = require(
    '../models/monthlyUnitPerformance.model'
);

const {
    success,
    error,
} = require('../utils/response');

const NON_NEGATIVE_FIELDS = [
    'mtbf',
    'mttr',
    'productivity',
    'fuel_consumption',
];

function parsePositiveInteger(value) {
    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
}

function parsePeriodYear(value) {
    const year = Number(value);

    if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
    ) {
        return null;
    }

    return year;
}

function parsePeriodMonth(value) {
    const month = Number(value);

    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {
        return null;
    }

    return month;
}

function normalizePercentageValue(
    value,
    allowNegative = false
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return { value: null };
    }

    let number = Number(value);

    if (!Number.isFinite(number)) {
        return {
            validationError: 'harus berupa angka',
        };
    }

    const minimum = allowNegative ? -100 : 0;

    if (number < minimum || number > 100) {
        return {
            validationError: allowNegative
                ? 'harus berada antara -100 sampai 100'
                : 'harus berada antara 0 sampai 100',
        };
    }

    if (number > 1 || number < -1) {
        number /= 100;
    }

    return { value: number };
}

function normalizeNonNegativeValue(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return {
            value: null,
        };
    }

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return {
            validationError:
                'harus berupa angka',
        };
    }

    if (number < 0) {
        return {
            validationError:
                'tidak boleh negatif',
        };
    }

    return {
        value: number,
    };
}

// ============================================================
// QUERY
// ============================================================

function validateQuery(query = {}) {
    const filter = {};

    // MODEL UNIT
    if (
        query.unit_model_id !==
        undefined &&
        query.unit_model_id !== ''
    ) {
        const unitModelId =
            parsePositiveInteger(
                query.unit_model_id
            );

        if (!unitModelId) {
            return {
                validationError:
                    'unit_model_id harus berupa angka positif',
            };
        }

        filter.unit_model_id =
            unitModelId;
    }

    // SITE
    if (
        query.site_id !== undefined &&
        query.site_id !== ''
    ) {
        const siteId =
            parsePositiveInteger(
                query.site_id
            );

        if (!siteId) {
            return {
                validationError:
                    'site_id harus berupa angka positif',
            };
        }

        filter.site_id =
            siteId;
    }

    // TAHUN
    if (
        query.period_year !==
        undefined &&
        query.period_year !== ''
    ) {
        const periodYear =
            parsePeriodYear(
                query.period_year
            );

        if (!periodYear) {
            return {
                validationError:
                    'period_year harus berada antara 2000-2100',
            };
        }

        filter.period_year =
            periodYear;
    }

    // ========================================================
    // BULAN TUNGGAL
    // ========================================================

    if (
        query.period_month !==
        undefined &&
        query.period_month !== ''
    ) {
        const periodMonth =
            parsePeriodMonth(
                query.period_month
            );

        if (!periodMonth) {
            return {
                validationError:
                    'period_month harus berada antara 1-12',
            };
        }

        filter.period_month =
            periodMonth;
    }

    // ========================================================
    // RENTANG BULAN
    // ========================================================

    if (
        query.start_month !==
        undefined &&
        query.start_month !== ''
    ) {
        const startMonth =
            parsePeriodMonth(
                query.start_month
            );

        if (!startMonth) {
            return {
                validationError:
                    'start_month harus berada antara 1-12',
            };
        }

        filter.start_month =
            startMonth;
    }

    if (
        query.end_month !==
        undefined &&
        query.end_month !== ''
    ) {
        const endMonth =
            parsePeriodMonth(
                query.end_month
            );

        if (!endMonth) {
            return {
                validationError:
                    'end_month harus berada antara 1-12',
            };
        }

        filter.end_month =
            endMonth;
    }

    const hasStart =
        filter.start_month !==
        undefined;

    const hasEnd =
        filter.end_month !==
        undefined;

    if (hasStart !== hasEnd) {
        return {
            validationError:
                'start_month dan end_month harus dikirim bersamaan',
        };
    }

    if (
        hasStart &&
        hasEnd &&
        filter.start_month >
        filter.end_month
    ) {
        return {
            validationError:
                'start_month tidak boleh lebih besar dari end_month',
        };
    }

    if (
        filter.period_month !==
        undefined &&
        (
            hasStart ||
            hasEnd
        )
    ) {
        return {
            validationError:
                'Gunakan period_month atau start_month/end_month, bukan keduanya',
        };
    }

    return {
        filter,
    };
}

// ============================================================
// PAYLOAD
// ============================================================

function validatePayload(
    body = {}
) {
    const unitModelId =
        parsePositiveInteger(
            body.unit_model_id
        );

    const periodYear =
        parsePeriodYear(
            body.period_year
        );

    const periodMonth =
        parsePeriodMonth(
            body.period_month
        );

    if (!unitModelId) {
        return {
            validationError:
                'unit_model_id harus berupa angka positif',
        };
    }

    if (!periodYear) {
        return {
            validationError:
                'period_year harus berada antara 2000-2100',
        };
    }

    if (!periodMonth) {
        return {
            validationError:
                'period_month harus berada antara 1-12',
        };
    }

    const physicalAvailability =
        normalizePercentageValue(
            body.physical_availability
        );

    if (
        physicalAvailability
            .validationError
    ) {
        return {
            validationError:
                `physical_availability ${physicalAvailability.validationError}`,
        };
    }

    const unitAvailability =
        normalizePercentageValue(
            body.unit_availability,
            true
        );

    if (
        unitAvailability
            .validationError
    ) {
        return {
            validationError:
                `unit_availability ${unitAvailability.validationError}`,
        };
    }

    const data = {
        unit_model_id:
            unitModelId,

        period_year:
            periodYear,

        period_month:
            periodMonth,

        physical_availability:
            physicalAvailability.value,

        unit_availability:
            unitAvailability.value,
    };

    for (
        const field of
        NON_NEGATIVE_FIELDS
    ) {
        const result =
            normalizeNonNegativeValue(
                body[field]
            );

        if (
            result.validationError
        ) {
            return {
                validationError:
                    `${field} ${result.validationError}`,
            };
        }

        data[field] =
            result.value;
    }

    return {
        data,
    };
}

// ============================================================
// GET ALL
// ============================================================

async function getAll(
    req,
    res,
    next
) {
    try {
        const {
            filter,
            validationError,
        } =
            validateQuery(
                req.query
            );

        if (validationError) {
            return error(
                res,
                validationError,
                400
            );
        }

        const data =
            await monthlyUnitPerformanceModel.findAll(
                filter
            );

        return success(
            res,
            data,
            'Data performa unit berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

// ============================================================
// GET BY ID
// ============================================================

async function getById(
    req,
    res,
    next
) {
    try {
        const id =
            parsePositiveInteger(
                req.params.id
            );

        if (!id) {
            return error(
                res,
                'ID performa unit harus berupa angka positif',
                400
            );
        }

        const data =
            await monthlyUnitPerformanceModel.findById(
                id
            );

        if (!data) {
            return error(
                res,
                'Data performa unit tidak ditemukan',
                404
            );
        }

        return success(
            res,
            data,
            'Detail performa unit berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

// ============================================================
// CREATE
// ============================================================

async function create(
    req,
    res,
    next
) {
    try {
        const {
            data,
            validationError,
        } =
            validatePayload(
                req.body
            );

        if (validationError) {
            return error(
                res,
                validationError,
                400
            );
        }

        const created =
            await monthlyUnitPerformanceModel.create(
                data
            );

        return success(
            res,
            created,
            'Data performa unit berhasil dibuat',
            201
        );
    } catch (err) {
        if (
            err.code ===
            'ER_DUP_ENTRY'
        ) {
            return error(
                res,
                'Data unit untuk periode tersebut sudah tersedia',
                409
            );
        }

        if (
            err.code ===
            'ER_NO_REFERENCED_ROW_2'
        ) {
            return error(
                res,
                'unit_model_id tidak ditemukan',
                400
            );
        }

        return next(err);
    }
}

// ============================================================
// UPDATE
// ============================================================

async function update(
    req,
    res,
    next
) {
    try {
        const id =
            parsePositiveInteger(
                req.params.id
            );

        if (!id) {
            return error(
                res,
                'ID performa unit harus berupa angka positif',
                400
            );
        }

        const existing =
            await monthlyUnitPerformanceModel.findById(
                id
            );

        if (!existing) {
            return error(
                res,
                'Data performa unit tidak ditemukan',
                404
            );
        }

        const {
            data,
            validationError,
        } =
            validatePayload(
                req.body
            );

        if (validationError) {
            return error(
                res,
                validationError,
                400
            );
        }

        const updated =
            await monthlyUnitPerformanceModel.update(
                id,
                data
            );

        return success(
            res,
            updated,
            'Data performa unit berhasil diperbarui'
        );
    } catch (err) {
        if (
            err.code ===
            'ER_DUP_ENTRY'
        ) {
            return error(
                res,
                'Data unit untuk periode tersebut sudah tersedia',
                409
            );
        }

        if (
            err.code ===
            'ER_NO_REFERENCED_ROW_2'
        ) {
            return error(
                res,
                'unit_model_id tidak ditemukan',
                400
            );
        }

        return next(err);
    }
}

// ============================================================
// DELETE
// ============================================================

async function remove(
    req,
    res,
    next
) {
    try {
        const id =
            parsePositiveInteger(
                req.params.id
            );

        if (!id) {
            return error(
                res,
                'ID performa unit harus berupa angka positif',
                400
            );
        }

        const existing =
            await monthlyUnitPerformanceModel.findById(
                id
            );

        if (!existing) {
            return error(
                res,
                'Data performa unit tidak ditemukan',
                404
            );
        }

        await monthlyUnitPerformanceModel.remove(
            id
        );

        return success(
            res,
            null,
            'Data performa unit berhasil dihapus'
        );
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};