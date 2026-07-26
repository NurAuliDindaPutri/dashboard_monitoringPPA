const unitModelModel = require('../models/unitModel.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
    try {
        const { site_id } = req.query;
        const data = await unitModelModel.findAll({ site_id });
        return success(res, data, 'Daftar unit model berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const data = await unitModelModel.findById(req.params.id);
        if (!data) return error(res, 'Unit model tidak ditemukan', 404);
        return success(res, data, 'Detail unit model berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { site_id, model_name } = req.body;
        if (!site_id || !model_name) {
            return error(res, 'site_id dan model_name wajib diisi', 400);
        }
        const data = await unitModelModel.create(req.body);
        return success(res, data, 'Unit model berhasil dibuat', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'model_name sudah terdaftar untuk site ini', 409);
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const existing = await unitModelModel.findById(req.params.id);
        if (!existing) return error(res, 'Unit model tidak ditemukan', 404);

        const { site_id, model_name } = req.body;
        if (!site_id || !model_name) {
            return error(res, 'site_id dan model_name wajib diisi', 400);
        }

        const data = await unitModelModel.update(req.params.id, req.body);
        return success(res, data, 'Unit model berhasil diperbarui');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'model_name sudah terdaftar untuk site ini', 409);
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const existing = await unitModelModel.findById(req.params.id);
        if (!existing) return error(res, 'Unit model tidak ditemukan', 404);

        await unitModelModel.remove(req.params.id);
        return success(res, null, 'Unit model berhasil dihapus');
    } catch (err) {
        return next(err);
    }
}

module.exports = { getAll, getById, create, update, remove };