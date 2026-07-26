import axiosClient from './axiosClient';

/**
 * Upload satu file Excel bulanan ke backend dengan periode.
 * @param {File} file
 * @param {number|string} periodMonth
 * @param {number|string} periodYear
 */
export async function importExcel(file, periodMonth, periodYear) {
    const formData = new FormData();
    formData.append('file', file);
    if (periodMonth) formData.append('period_month', periodMonth);
    if (periodYear) formData.append('period_year', periodYear);

    const response = await axiosClient.post('/import/excel', formData);
    return response.data;
}