import axiosClient from './axiosClient';

/**
 * Ambil data pending supply, bisa difilter dengan site_id.
 * @param {{ site_id?: number|string }} params
 */
export async function getPendingSupply(params = {}) {
    const response = await axiosClient.get('/pending-supply', { params });
    return response.data.data;
}