export const MONTHS = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

// Rentang tahun untuk filter (3 tahun ke belakang s.d. tahun berjalan)
const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

// Target KPI acuan (dipakai untuk perhitungan warna gauge ketika data tersedia).
// Readiness & Leadtime Supply belum memiliki sumber data di backend saat ini.
export const KPI_TARGETS = {
    readiness: 0.9,
    availability: 0.98,
    leadtimeSupply: 0.93,
};

// Ambang batas "mendekati target" (kuning) dalam persentase dari target
export const NEAR_TARGET_THRESHOLD = 0.97;