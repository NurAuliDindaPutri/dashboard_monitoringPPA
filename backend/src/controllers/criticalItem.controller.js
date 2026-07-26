const criticalItemModel = require('../models/criticalItem.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
    try {
        const { site_id } = req.query;
        const data = await criticalItemModel.findAll({ site_id });
        return success(res, data, 'Daftar critical item berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const data = await criticalItemModel.findById(req.params.id);
        if (!data) return error(res, 'Critical item tidak ditemukan', 404);
        return success(res, data, 'Detail critical item berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { site_id, parts_number } = req.body;
        if (!site_id || !parts_number) {
            return error(res, 'site_id dan parts_number wajib diisi', 400);
        }

        const data = await criticalItemModel.create(req.body);
        return success(res, data, 'Critical item berhasil dibuat', 201);
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const existing = await criticalItemModel.findById(req.params.id);
        if (!existing) return error(res, 'Critical item tidak ditemukan', 404);

        const { site_id, parts_number } = req.body;
        if (!site_id || !parts_number) {
            return error(res, 'site_id dan parts_number wajib diisi', 400);
        }

        const data = await criticalItemModel.update(req.params.id, req.body);
        return success(res, data, 'Critical item berhasil diperbarui');
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const existing = await criticalItemModel.findById(req.params.id);
        if (!existing) return error(res, 'Critical item tidak ditemukan', 404);

        await criticalItemModel.remove(req.params.id);
        return success(res, null, 'Critical item berhasil dihapus');
    } catch (err) {
        return next(err);
    }
}

module.exports = { getAll, getById, create, update, remove };