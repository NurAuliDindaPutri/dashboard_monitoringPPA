import axiosClient from './axiosClient';

/**
 * Ambil data ringkasan KPI (Readiness, Availability VHS, Leadtime Supply),
 * bisa difilter dengan query params.
 * @param {{ site_id?: number|string, period_year?: number|string, period_month?: number|string }} params
 */
export async function getKpiSummary(params = {}) {
    const response = await axiosClient.get('/kpi-summary', { params });
    return response.data.data;
}