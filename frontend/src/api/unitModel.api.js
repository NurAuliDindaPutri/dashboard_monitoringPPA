import axiosClient from './axiosClient';

/**
 * Ambil daftar unit model (unit alat), bisa difilter dengan site_id.
 * Dipakai untuk mengisi dropdown "Unit" di Dashboard Per Site.
 * @param {{ site_id?: number|string }} params
 */
export async function getUnitModels(params = {}) {
    const response = await axiosClient.get('/unit-models', { params });
    return response.data.data;
}

export async function getUnitModelById(id) {
    const response = await axiosClient.get(`/unit-models/${id}`);
    return response.data.data;
}