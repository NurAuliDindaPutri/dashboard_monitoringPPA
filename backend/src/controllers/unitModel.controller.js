const unitModelModel = require('../models/unitModel.model');
const { success, error } = require('../utils/response');

function parsePositiveInteger(value) {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
        return null;
    }

    return number;
}

function validatePayload(body = {}) {
    const siteId = parsePositiveInteger(body.site_id);

    if (!siteId) {
        return {
            validationError: 'site_id harus berupa angka positif',
        };
    }

    const modelName =
        typeof body.model_name === 'string'
            ? body.model_name.trim()
            : '';

    if (!modelName) {
        return {
            validationError: 'model_name wajib diisi',
        };
    }

    if (modelName.length > 100) {
        return {
            validationError: 'model_name maksimal 100 karakter',
        };
    }

    return {
        data: {
            site_id: siteId,
            model_name: modelName,
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

        const data = await unitModelModel.findAll(filter);

        return success(
            res,
            data,
            'Daftar unit model berhasil diambil'
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
                'ID unit model harus berupa angka positif',
                400
            );
        }

        const data = await unitModelModel.findById(id);

        if (!data) {
            return error(
                res,
                'Unit model tidak ditemukan',
                404
            );
        }

        return success(
            res,
            data,
            'Detail unit model berhasil diambil'
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
            return error(res, validationError, 400);
        }

        const created = await unitModelModel.create(data);

        return success(
            res,
            created,
            'Unit model berhasil dibuat',
            201
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'model_name sudah terdaftar untuk site ini',
                409
            );
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'site_id tidak ditemukan',
                400
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
                'ID unit model harus berupa angka positif',
                400
            );
        }

        const existing = await unitModelModel.findById(id);

        if (!existing) {
            return error(
                res,
                'Unit model tidak ditemukan',
                404
            );
        }

        const { data, validationError } =
            validatePayload(req.body);

        if (validationError) {
            return error(res, validationError, 400);
        }

        const updated = await unitModelModel.update(
            id,
            data
        );

        return success(
            res,
            updated,
            'Unit model berhasil diperbarui'
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'model_name sudah terdaftar untuk site ini',
                409
            );
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'site_id tidak ditemukan',
                400
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
                'ID unit model harus berupa angka positif',
                400
            );
        }

        const existing = await unitModelModel.findById(id);

        if (!existing) {
            return error(
                res,
                'Unit model tidak ditemukan',
                404
            );
        }

        await unitModelModel.remove(id);

        return success(
            res,
            null,
            'Unit model berhasil dihapus'
        );
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return error(
                res,
                'Unit model tidak dapat dihapus karena masih digunakan pada data performa unit',
                409
            );
        }

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