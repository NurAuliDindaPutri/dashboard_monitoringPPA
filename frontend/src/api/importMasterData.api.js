import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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