const criticalItemModel = require('../models/criticalItem.model');
const { success, error } = require('../utils/response');

function parsePositiveInteger(value) {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
        return null;
    }

    return number;
}

function normalizeOptionalText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();

    return text || null;
}

function normalizeQty(value) {
    if (value === null || value === undefined || value === '') {
        return {
            value: 0,
        };
    }

    const qty = Number(value);

    if (!Number.isInteger(qty)) {
        return {
            validationError:
                'qty harus berupa bilangan bulat',
        };
    }

    if (qty < 0) {
        return {
            validationError:
                'qty tidak boleh bernilai negatif',
        };
    }

    return {
        value: qty,
    };
}

function normalizeDate(value) {
    if (value === null || value === undefined || value === '') {
        return {
            value: null,
        };
    }

    const dateText = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
        return {
            validationError:
                'estimasi harus menggunakan format YYYY-MM-DD',
        };
    }

    const [year, month, day] = dateText
        .split('-')
        .map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    const isValid =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

    if (!isValid) {
        return {
            validationError:
                'estimasi bukan tanggal yang valid',
        };
    }

    return {
        value: dateText,
    };
}

function validatePayload(body = {}) {
    const siteId = parsePositiveInteger(body.site_id);

    if (!siteId) {
        return {
            validationError:
                'site_id harus berupa angka positif',
        };
    }

    const partsNumber =
        typeof body.parts_number === 'string'
            ? body.parts_number.trim()
            : '';

    if (!partsNumber) {
        return {
            validationError:
                'parts_number wajib diisi',
        };
    }

    if (partsNumber.length > 100) {
        return {
            validationError:
                'parts_number maksimal 100 karakter',
        };
    }

    const description = normalizeOptionalText(
        body.description
    );

    if (description && description.length > 255) {
        return {
            validationError:
                'description maksimal 255 karakter',
        };
    }

    const noPo = normalizeOptionalText(body.no_po);

    if (noPo && noPo.length > 100) {
        return {
            validationError:
                'no_po maksimal 100 karakter',
        };
    }

    const qtyResult = normalizeQty(body.qty);

    if (qtyResult.validationError) {
        return {
            validationError:
                qtyResult.validationError,
        };
    }

    const estimasiResult = normalizeDate(
        body.estimasi
    );

    if (estimasiResult.validationError) {
        return {
            validationError:
                estimasiResult.validationError,
        };
    }

    return {
        data: {
            site_id: siteId,
            parts_number: partsNumber,
            description,
            qty: qtyResult.value,
            no_po: noPo,
            estimasi: estimasiResult.value,
        },
    };
}

async function getAll(req, res, next) {
    try {
        const filter = {};

        if (
            req.query.site_id !== undefined &&
            req.query.site_id !== ''
        ) {
            const siteId = parsePositiveInteger(
                req.query.site_id
            );

            if (!siteId) {
                return error(
                    res,
                    'site_id harus berupa angka positif',
                    400
                );
            }

            filter.site_id = siteId;
        }

        const data =
            await criticalItemModel.findAll(filter);

        return success(
            res,
            data,
            'Daftar critical item berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const id = parsePositiveInteger(req.params.id);

        if (!id) {
            return error(
                res,
                'ID critical item harus berupa angka positif',
                400
            );
        }

        const data =
            await criticalItemModel.findById(id);

        if (!data) {
            return error(
                res,
                'Critical item tidak ditemukan',
                404
            );
        }

        return success(
            res,
            data,
            'Detail critical item berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { data, validationError } =
            validatePayload(req.body);

        if (validationError) {
            return error(
                res,
                validationError,
                400
            );
        }

        const created =
            await criticalItemModel.create(data);

        return success(
            res,
            created,
            'Critical item berhasil dibuat',
            201
        );
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'site_id tidak ditemukan',
                400
            );
        }

        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'Critical item yang sama sudah tersedia',
                409
            );
        }

        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const id = parsePositiveInteger(req.params.id);

        if (!id) {
            return error(
                res,
                'ID critical item harus berupa angka positif',
                400
            );
        }

        const existing =
            await criticalItemModel.findById(id);

        if (!existing) {
            return error(
                res,
                'Critical item tidak ditemukan',
                404
            );
        }

        const { data, validationError } =
            validatePayload(req.body);

        if (validationError) {
            return error(
                res,
                validationError,
                400
            );
        }

        const updated =
            await criticalItemModel.update(id, data);

        return success(
            res,
            updated,
            'Critical item berhasil diperbarui'
        );
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'site_id tidak ditemukan',
                400
            );
        }

        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'Critical item yang sama sudah tersedia',
                409
            );
        }

        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const id = parsePositiveInteger(req.params.id);

        if (!id) {
            return error(
                res,
                'ID critical item harus berupa angka positif',
                400
            );
        }

        const existing =
            await criticalItemModel.findById(id);

        if (!existing) {
            return error(
                res,
                'Critical item tidak ditemukan',
                404
            );
        }

        await criticalItemModel.remove(id);

        return success(
            res,
            null,
            'Critical item berhasil dihapus'
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