import axiosClient from './axiosClient';

function unwrapResponse(response) {
    return response.data?.data ?? response.data;
}

export async function getCriticalItems(params = {}) {
    const response = await axiosClient.get('/critical-items', {
        params,
    });

    return unwrapResponse(response);
}

export async function getCriticalItemById(id) {
    const response = await axiosClient.get(
        `/critical-items/${id}`
    );

    return unwrapResponse(response);
}

export async function createCriticalItem(payload) {
    const response = await axiosClient.post(
        '/critical-items',
        payload
    );

    return unwrapResponse(response);
}

export async function updateCriticalItem(id, payload) {
    const response = await axiosClient.put(
        `/critical-items/${id}`,
        payload
    );

    return unwrapResponse(response);
}

export async function deleteCriticalItem(id) {
    const response = await axiosClient.delete(
        `/critical-items/${id}`
    );

    return unwrapResponse(response);
}