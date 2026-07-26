const siteModel = require('../models/site.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
    try {
        const data = await siteModel.findAll();
        return success(res, data, 'Daftar site berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const data = await siteModel.findById(req.params.id);
        if (!data) return error(res, 'Site tidak ditemukan', 404);
        return success(res, data, 'Detail site berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { site_code, site_name } = req.body;
        if (!site_code) {
            return error(res, 'site_code wajib diisi', 400);
        }
        const data = await siteModel.create(req.body);
        return success(res, data, 'Site berhasil dibuat', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'site_code sudah digunakan', 409);
        }
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const existing = await siteModel.findById(req.params.id);
        if (!existing) return error(res, 'Site tidak ditemukan', 404);

        const { site_code } = req.body;
        if (!site_code) {
            return error(res, 'site_code wajib diisi', 400);
        }

        const data = await siteModel.update(req.params.id, req.body);
        return success(res, data, 'Site berhasil diperbarui');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'site_code sudah digunakan', 409);
        }
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const existing = await siteModel.findById(req.params.id);
        if (!existing) return error(res, 'Site tidak ditemukan', 404);

        await siteModel.remove(req.params.id);
        return success(res, null, 'Site berhasil dihapus');
    } catch (err) {
        return next(err);
    }
}

module.exports = { getAll, getById, create, update, remove };