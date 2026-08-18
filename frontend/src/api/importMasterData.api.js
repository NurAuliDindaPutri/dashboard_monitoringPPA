import axiosClient from './axiosClient';

export function importExcel(file) {
    const formData = new FormData();

    formData.append('file', file);

    return axiosClient.post(
        '/import/excel',
        formData
    );
}