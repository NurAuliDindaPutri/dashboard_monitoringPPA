const monthlyUnitPerformanceModel = require('../models/monthlyUnitPerformance.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
    try {
        const { unit_model_id, site_id, period_year, period_month } = req.query;
        const data = await monthlyUnitPerformanceModel.findAll({
            unit_model_id,
            site_id,
            period_year,
            period_month,
        });
        return success(res, data, 'Data performa unit berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const data = await monthlyUnitPerformanceModel.findById(req.params.id);
        if (!data) return error(res, 'Data performa unit tidak ditemukan', 404);
        return success(res, data, 'Detail performa unit berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { unit_model_id, period_year, period_month } = req.body;
        if (!unit_model_id || !period_year || !period_month) {
            return error(
                res,
                'unit_model_id, period_year, dan period_month wajib diisi',
                400
            );
        }
        if (period_month < 1 || period_month > 12) {
            return error(res, 'period_month harus antara 1-12', 400);
        }

        const data = await monthlyUnitPerformanceModel.create(req.body);
        return success(res, data, 'Data performa unit berhasil dibuat', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'Data unit untuk periode ini sudah ada, gunakan update',
                409
            );
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'unit_model_id tidak valid', 400);
        }
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const existing = await monthlyUnitPerformanceModel.findById(req.params.id);
        if (!existing) return error(res, 'Data performa unit tidak ditemukan', 404);

        const { unit_model_id, period_year, period_month } = req.body;
        if (!unit_model_id || !period_year || !period_month) {
            return error(
                res,
                'unit_model_id, period_year, dan period_month wajib diisi',
                400
            );
        }
        if (period_month < 1 || period_month > 12) {
            return error(res, 'period_month harus antara 1-12', 400);
        }

        const data = await monthlyUnitPerformanceModel.update(req.params.id, req.body);
        return success(res, data, 'Data performa unit berhasil diperbarui');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Data unit untuk periode ini sudah ada', 409);
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'unit_model_id tidak valid', 400);
        }
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const existing = await monthlyUnitPerformanceModel.findById(req.params.id);
        if (!existing) return error(res, 'Data performa unit tidak ditemukan', 404);

        await monthlyUnitPerformanceModel.remove(req.params.id);
        return success(res, null, 'Data performa unit berhasil dihapus');
    } catch (err) {
        return next(err);
    }
}

module.exports = { getAll, getById, create, update, remove };