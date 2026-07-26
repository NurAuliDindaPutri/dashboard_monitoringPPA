import { useState } from 'react';
import * as XLSX from 'xlsx';
import { importExcel } from '../../api/importMasterData.api';

const SHEET_LABELS = {
    master_data: 'Master Data (Site & Model Unit)',
    kpi_summary: 'Input (Readiness, Availability VHS, Lead Time Supply)',
    unit_performance: 'Data Unit',
    pending_supply: 'Pending Supply',
    detail_lt_supply: 'Detail LT Supply',
};

const MONTH_OPTIONS = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

const YEAR_OPTIONS = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

function ImportMasterData() {
    const [file, setFile] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [detectedLabel, setDetectedLabel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        setResult(null);
        setErrorMsg(null);
        setDetectedLabel(null);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    let detectedM = null;
                    let detectedY = null;

                    const monthMap = {
                        jan: 1, januari: 1, january: 1,
                        feb: 2, februari: 2, february: 2,
                        mar: 3, maret: 3, march: 3,
                        apr: 4, april: 4,
                        mei: 5, may: 5,
                        jun: 6, juni: 6, june: 6,
                        jul: 7, juli: 7, july: 7,
                        agu: 8, agustus: 8, aug: 8, august: 8,
                        sep: 9, sept: 9, september: 9,
                        okt: 10, oktober: 10, oct: 10, october: 10,
                        nov: 11, november: 11,
                        des: 12, desember: 12, dec: 12, december: 12,
                    };

                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
                        for (let r = 0; r < Math.min(matrix.length, 15); r += 1) {
                            const row = matrix[r] || [];
                            for (let c = 0; c < Math.min(row.length, 15); c += 1) {
                                const cellVal = String(row[c] || '').trim();
                                if (!cellVal) continue;

                                const yMatch = cellVal.match(/(20\d{2})/);
                                if (yMatch && !detectedY) {
                                    detectedY = yMatch[1];
                                }

                                for (const [mKey, mNum] of Object.entries(monthMap)) {
                                    const regex = new RegExp(`\\b${mKey}\\b`, 'i');
                                    if (regex.test(cellVal) && !detectedM) {
                                        detectedM = String(mNum);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (detectedM) setSelectedMonth(detectedM);
                    if (detectedY) setSelectedYear(detectedY);

                    if (detectedM && detectedY) {
                        const monthObj = MONTH_OPTIONS.find((m) => m.value === detectedM);
                        setDetectedLabel(`Terdeteksi dari file: ${monthObj?.label || detectedM} ${detectedY}`);
                    } else if (detectedY) {
                        setDetectedLabel(`Tahun ${detectedY} terdeteksi. Silakan pilih bulan.`);
                    } else {
                        setDetectedLabel(null);
                    }
                } catch (err) {
                    console.error('Gagal mendeteksi periode file:', err);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file || !selectedMonth || !selectedYear) return;

        try {
            setLoading(true);
            setErrorMsg(null);
            setResult(null);

            const response = await importExcel(file, selectedMonth, selectedYear);
            setResult(response.data);
        } catch (err) {
            console.error('Gagal import Excel', err);
            setErrorMsg(
                err.response?.data?.message || 'Gagal mengimpor file. Pastikan format file Excel valid.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-3">
                <h4 className="fw-semibold mb-1">Import Excel Bulanan</h4>
                <p className="text-secondary mb-0">
                    Upload satu file Excel laporan bulanan. Sheet yang dikenali akan diproses otomatis:{' '}
                    <strong>Master Data</strong>, <strong>Input</strong>, <strong>Data Unit</strong>,{' '}
                    <strong>Pending Supply</strong>, <strong>Detail LT Supply</strong>. Silakan tentukan periode bulan dan tahun data sebelum mengimpor.
                </p>
            </div>

            <div className="app-card p-4" style={{ maxWidth: 540 }}>
                <label className="form-label small text-secondary mb-1">Pilih File Excel (.xlsx / .xls)</label>
                <input
                    type="file"
                    className="form-control mb-3"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                />

                {detectedLabel && (
                    <div className="alert alert-info py-2 small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-info-circle-fill" />
                        <span>{detectedLabel}</span>
                    </div>
                )}

                <div className="row g-2 mb-3">
                    <div className="col-6">
                        <label className="form-label small text-secondary mb-1">Bulan Data <span className="text-danger">*</span></label>
                        <select
                            className="form-select form-select-sm"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Pilih Bulan --</option>
                            {MONTH_OPTIONS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6">
                        <label className="form-label small text-secondary mb-1">Tahun Data <span className="text-danger">*</span></label>
                        <select
                            className="form-select form-select-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Pilih Tahun --</option>
                            {YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleImport}
                    disabled={!file || !selectedMonth || !selectedYear || loading}
                >
                    {loading && <span className="spinner-border spinner-border-sm" role="status" />}
                    <i className="bi bi-upload" />
                    Import
                </button>
            </div>

            {errorMsg && (
                <div className="alert alert-danger mt-3 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-exclamation-triangle" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {result && (
                <div className="app-card p-4 mt-3">
                    <div className="fw-semibold mb-3">Ringkasan Hasil Import per Sheet</div>

                    <div className="table-responsive mb-3">
                        <table className="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Sheet</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(SHEET_LABELS).map((key) => (
                                    <tr key={key}>
                                        <td className="fw-medium">{SHEET_LABELS[key]}</td>
                                        <td className="text-secondary">{result[key]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {result.skipped?.length > 0 && (
                        <div>
                            <div className="small text-secondary mb-2">
                                Detail baris yang dilewati ({result.skipped.length}):
                            </div>
                            <div className="table-responsive" style={{ maxHeight: 320, overflowY: 'auto' }}>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Sheet</th>
                                            <th>Alasan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.skipped.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.sheet}</td>
                                                <td className="text-muted">{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ImportMasterData;