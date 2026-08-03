import axiosClient from './axiosClient';

export function getUnitPerformances(params = {}) {
    return axiosClient.get('/monthly-unit-performance', {
        params,
    });
}

export function createUnitPerformance(data) {
    return axiosClient.post(
        '/monthly-unit-performance',
        data
    );
}

export function updateUnitPerformance(id, data) {
    return axiosClient.put(
        `/monthly-unit-performance/${id}`,
        data
    );
}

export function deleteUnitPerformance(id) {
    return axiosClient.delete(
        `/monthly-unit-performance/${id}`
    );
}