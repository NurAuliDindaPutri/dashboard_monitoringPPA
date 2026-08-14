import axiosClient from './axiosClient';

/**
 * Ambil data performa unit.
 *
 * Bisa menggunakan:
 *
 * Single month:
 * {
 *   site_id,
 *   period_year,
 *   period_month
 * }
 *
 * Rentang:
 * {
 *   site_id,
 *   unit_model_id,
 *   period_year,
 *   start_month,
 *   end_month
 * }
 */
export function getUnitPerformances(
    params = {}
) {
    return axiosClient.get(
        '/monthly-unit-performance',
        {
            params,
        }
    );
}

export function createUnitPerformance(
    data
) {
    return axiosClient.post(
        '/monthly-unit-performance',
        data
    );
}

export function updateUnitPerformance(
    id,
    data
) {
    return axiosClient.put(
        `/monthly-unit-performance/${id}`,
        data
    );
}

export function deleteUnitPerformance(
    id
) {
    return axiosClient.delete(
        `/monthly-unit-performance/${id}`
    );
}