const monthlyKpiSummaryModel = require('../models/monthlyKpiSummary.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
    try {
        const { site_id, period_year, period_month } = req.query;
        const data = await monthlyKpiSummaryModel.findAll({
            site_id,
            period_year,
            period_month,
        });
        return success(res, data, 'Data ringkasan KPI berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function getById(req, res, next) {
    try {
        const data = await monthlyKpiSummaryModel.findById(req.params.id);
        if (!data) return error(res, 'Data ringkasan KPI tidak ditemukan', 404);
        return success(res, data, 'Detail ringkasan KPI berhasil diambil');
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const { site_id, period_year, period_month } = req.body;
        if (!site_id || !period_year || !period_month) {
            return error(res, 'site_id, period_year, dan period_month wajib diisi', 400);
        }
        if (period_month < 1 || period_month > 12) {
            return error(res, 'period_month harus antara 1-12', 400);
        }

        const data = await monthlyKpiSummaryModel.create(req.body);
        return success(res, data, 'Data ringkasan KPI berhasil dibuat', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Data KPI untuk site & periode ini sudah ada', 409);
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const existing = await monthlyKpiSummaryModel.findById(req.params.id);
        if (!existing) return error(res, 'Data ringkasan KPI tidak ditemukan', 404);

        const { site_id, period_year, period_month } = req.body;
        if (!site_id || !period_year || !period_month) {
            return error(res, 'site_id, period_year, dan period_month wajib diisi', 400);
        }
        if (period_month < 1 || period_month > 12) {
            return error(res, 'period_month harus antara 1-12', 400);
        }

        const data = await monthlyKpiSummaryModel.update(req.params.id, req.body);
        return success(res, data, 'Data ringkasan KPI berhasil diperbarui');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Data KPI untuk site & periode ini sudah ada', 409);
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'site_id tidak valid', 400);
        }
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const existing = await monthlyKpiSummaryModel.findById(req.params.id);
        if (!existing) return error(res, 'Data ringkasan KPI tidak ditemukan', 404);

        await monthlyKpiSummaryModel.remove(req.params.id);
        return success(res, null, 'Data ringkasan KPI berhasil dihapus');
    } catch (err) {
        return next(err);
    }
}

module.exports = { getAll, getById, create, update, remove };