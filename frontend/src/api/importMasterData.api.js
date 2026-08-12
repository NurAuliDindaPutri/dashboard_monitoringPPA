import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function importExcel(file) {
    const formData = new FormData();

    formData.append('file', file);

    return axios.post(
        `${API_URL}/import/excel`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
}