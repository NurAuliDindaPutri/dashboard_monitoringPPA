import axiosClient from './axiosClient';

/**
 * Ambil KPI Summary.
 *
 * Mode lama:
 * {
 *   site_id,
 *   period_year,
 *   period_month
 * }
 *
 * Mode rentang:
 * {
 *   site_id,
 *   period_year,
 *   start_month,
 *   end_month
 * }
 */
export async function getKpiSummary(
    params = {}
) {
    const response =
        await axiosClient.get(
            '/kpi-summary',
            {
                params,
            }
        );

    return response.data.data;
}