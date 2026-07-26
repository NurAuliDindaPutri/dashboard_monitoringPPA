import axiosClient from './axiosClient';

export async function getSites() {
    const response = await axiosClient.get('/sites');
    return response.data.data;
}

export async function getSiteById(id) {
    const response = await axiosClient.get(`/sites/${id}`);
    return response.data.data;
}