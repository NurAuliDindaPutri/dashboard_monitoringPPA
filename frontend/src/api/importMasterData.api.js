import axiosClient from './axiosClient';

export function importExcel(
    file,
    periodYear
) {
    const formData = new FormData();

    formData.append('file', file);

    if (periodYear) {
        formData.append(
            'period_year',
            String(periodYear)
        );
    }

    return axiosClient.post(
        '/import/excel',
        formData
    );
}