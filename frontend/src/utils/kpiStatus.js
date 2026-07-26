import { NEAR_TARGET_THRESHOLD } from './constants';

export const KPI_STATUS_COLOR = {
    good: '#16a34a', // hijau - memenuhi target
    warning: '#d97706', // kuning - mendekati target
    danger: '#dc2626', // merah - di bawah target
    empty: '#94a3b8', // abu-abu - data belum tersedia
};

/**
 * Menentukan status KPI berdasarkan nilai aktual terhadap target.
 * @param {number|null|undefined} value nilai aktual (0-1 atau angka biasa)
 * @param {number|null|undefined} target nilai target pembanding
 * @returns {'good'|'warning'|'danger'|'empty'}
 */
export function getKpiStatus(value, target) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return 'empty';
    }
    if (target === null || target === undefined || Number.isNaN(target)) {
        return 'empty';
    }

    if (value >= target) return 'good';
    if (value >= target * NEAR_TARGET_THRESHOLD) return 'warning';
    return 'danger';
}

export function getKpiStatusColor(value, target) {
    return KPI_STATUS_COLOR[getKpiStatus(value, target)];
}

/**
 * Format angka desimal (0-1) menjadi persentase string, aman untuk nilai null.
 */
export function formatPercent(value, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '-';
    }
    return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Format angka biasa (mis. MTBF/MTTR dalam jam), aman untuk nilai null.
 */
export function formatNumber(value, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '-';
    }
    return Number(value).toFixed(digits);
}