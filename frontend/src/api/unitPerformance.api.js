import axiosClient from './axiosClient';

/**
 * Ambil data performa unit, bisa difilter dengan query params.
 * @param {{ site_id?: number|string, unit_model_id?: number|string, period_year?: number|string, period_month?: number|string }} params
 */
export async function getUnitPerformance(params = {}) {
    const response = await axiosClient.get('/unit-performance', { params });
    return response.data.data;
}