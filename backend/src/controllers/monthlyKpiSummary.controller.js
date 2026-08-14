const monthlyKpiSummaryModel = require(
    '../models/monthlyKpiSummary.model'
);

const {
    success,
    error,
} = require('../utils/response');

const KPI_FIELDS = [
    'readyness_actual',
    'readyness_target',
    'availability_actual',
    'availability_target',
    'leadtime_actual',
    'leadtime_target',
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

function normalizeKpiValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return {
            value: null,
        };
    }

    let number = Number(value);

    if (!Number.isFinite(number)) {
        return {
            validationError:
                'harus berupa angka',
        };
    }

    if (
        number < 0 ||
        number > 100
    ) {
        return {
            validationError:
                'harus berada antara 0 sampai 100',
        };
    }

    if (number > 1) {
        number /= 100;
    }

    return {
        value: number,
    };
}

// ============================================================
// QUERY FILTER
// ============================================================

function validateQuery(query = {}) {
    const filter = {};

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
        query.period_year !== undefined &&
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
    // Tetap dipakai Dashboard All Site
    // ========================================================

    if (
        query.period_month !== undefined &&
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
    // Dipakai Dashboard Per Site
    // ========================================================

    if (
        query.start_month !== undefined &&
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
        query.end_month !== undefined &&
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

    // Harus sepasang
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

    // Validasi urutan
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

    // Jangan pakai single month + range sekaligus
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
// PAYLOAD CREATE / UPDATE
// ============================================================

function validatePayload(body = {}) {
    const siteId =
        parsePositiveInteger(
            body.site_id
        );

    const periodYear =
        parsePeriodYear(
            body.period_year
        );

    const periodMonth =
        parsePeriodMonth(
            body.period_month
        );

    if (!siteId) {
        return {
            validationError:
                'site_id harus berupa angka positif',
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

    const data = {
        site_id:
            siteId,

        period_year:
            periodYear,

        period_month:
            periodMonth,
    };

    for (
        const field of KPI_FIELDS
    ) {
        const result =
            normalizeKpiValue(
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
            await monthlyKpiSummaryModel.findAll(
                filter
            );

        return success(
            res,
            data,
            'Data ringkasan KPI berhasil diambil'
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
                'ID ringkasan KPI harus berupa angka positif',
                400
            );
        }

        const data =
            await monthlyKpiSummaryModel.findById(
                id
            );

        if (!data) {
            return error(
                res,
                'Data ringkasan KPI tidak ditemukan',
                404
            );
        }

        return success(
            res,
            data,
            'Detail ringkasan KPI berhasil diambil'
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
            await monthlyKpiSummaryModel.create(
                data
            );

        return success(
            res,
            created,
            'Data ringkasan KPI berhasil dibuat',
            201
        );
    } catch (err) {
        if (
            err.code ===
            'ER_DUP_ENTRY'
        ) {
            return error(
                res,
                'Data KPI untuk site dan periode tersebut sudah tersedia',
                409
            );
        }

        if (
            err.code ===
            'ER_NO_REFERENCED_ROW_2'
        ) {
            return error(
                res,
                'site_id tidak ditemukan',
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
                'ID ringkasan KPI harus berupa angka positif',
                400
            );
        }

        const existing =
            await monthlyKpiSummaryModel.findById(
                id
            );

        if (!existing) {
            return error(
                res,
                'Data ringkasan KPI tidak ditemukan',
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
            await monthlyKpiSummaryModel.update(
                id,
                data
            );

        return success(
            res,
            updated,
            'Data ringkasan KPI berhasil diperbarui'
        );
    } catch (err) {
        if (
            err.code ===
            'ER_DUP_ENTRY'
        ) {
            return error(
                res,
                'Data KPI untuk site dan periode tersebut sudah tersedia',
                409
            );
        }

        if (
            err.code ===
            'ER_NO_REFERENCED_ROW_2'
        ) {
            return error(
                res,
                'site_id tidak ditemukan',
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
                'ID ringkasan KPI harus berupa angka positif',
                400
            );
        }

        const existing =
            await monthlyKpiSummaryModel.findById(
                id
            );

        if (!existing) {
            return error(
                res,
                'Data ringkasan KPI tidak ditemukan',
                404
            );
        }

        await monthlyKpiSummaryModel.remove(
            id
        );

        return success(
            res,
            null,
            'Data ringkasan KPI berhasil dihapus'
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