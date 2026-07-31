const siteModel = require('../models/site.model');
const { success, error } = require('../utils/response');

function parsePositiveId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

function normalizeSitePayload(body = {}) {
    const siteCode =
        typeof body.site_code === 'string'
            ? body.site_code.trim().toUpperCase()
            : '';

    const siteName =
        typeof body.site_name === 'string'
            ? body.site_name.trim()
            : null;

    let isActive = 1;

    if (body.is_active !== undefined) {
        if (
            body.is_active === 1 ||
            body.is_active === '1' ||
            body.is_active === true
        ) {
            isActive = 1;
        } else if (
            body.is_active === 0 ||
            body.is_active === '0' ||
            body.is_active === false
        ) {
            isActive = 0;
        } else {
            return {
                validationError: 'is_active hanya boleh bernilai 0 atau 1',
            };
        }
    }

    if (!siteCode) {
        return {
            validationError: 'site_code wajib diisi',
        };
    }

    if (siteCode.length > 50) {
        return {
            validationError: 'site_code maksimal 50 karakter',
        };
    }

    if (siteName && siteName.length > 255) {
        return {
            validationError: 'site_name maksimal 255 karakter',
        };
    }

    return {
        data: {
            site_code: siteCode,
            site_name: siteName || null,
            is_active: isActive,
        },
    };
}

async function getAll(req, res, next) {
    try {
        const data = await siteModel.findAll();

        return success(
            res,
            data,
            'Daftar site berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return error(
                res,
                'ID site harus berupa angka positif',
                400
            );
        }

        const data = await siteModel.findById(id);

        if (!data) {
            return error(res, 'Site tidak ditemukan', 404);
        }

        return success(
            res,
            data,
            'Detail site berhasil diambil'
        );
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { data, validationError } =
            normalizeSitePayload(req.body);

        if (validationError) {
            return error(res, validationError, 400);
        }

        const created = await siteModel.create(data);

        return success(
            res,
            created,
            'Site berhasil dibuat',
            201
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'site_code sudah digunakan',
                409
            );
        }

        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return error(
                res,
                'ID site harus berupa angka positif',
                400
            );
        }

        const existing = await siteModel.findById(id);

        if (!existing) {
            return error(res, 'Site tidak ditemukan', 404);
        }

        const { data, validationError } =
            normalizeSitePayload(req.body);

        if (validationError) {
            return error(res, validationError, 400);
        }

        const updated = await siteModel.update(id, data);

        return success(
            res,
            updated,
            'Site berhasil diperbarui'
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'site_code sudah digunakan',
                409
            );
        }

        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return error(
                res,
                'ID site harus berupa angka positif',
                400
            );
        }

        const existing = await siteModel.findById(id);

        if (!existing) {
            return error(res, 'Site tidak ditemukan', 404);
        }

        await siteModel.remove(id);

        return success(
            res,
            null,
            'Site berhasil dihapus'
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