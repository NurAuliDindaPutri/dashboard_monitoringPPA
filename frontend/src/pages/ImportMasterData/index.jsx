import { useState } from 'react';
import { importExcel } from '../../api/importMasterData.api';
import { YEARS } from '../../utils/constants';

const SHEET_LABELS = {
    kpi_summary: 'KPI Summary',
    unit_performance: 'Unit Performance',
    pending_supply: 'Pending Supply',
    detail_lt_supply: 'Detail LT Supply',
};

const CURRENT_YEAR = new Date().getFullYear();

function ImportMasterData() {
    const [file, setFile] = useState(null);
    const [periodYear, setPeriodYear] = useState(
        CURRENT_YEAR
    );
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile =
            event.target.files?.[0] || null;

        setFile(selectedFile);
        setResult(null);
        setErrorMsg(null);
    };

    const handleImport = async () => {
        if (!file) {
            return;
        }

        try {
            setLoading(true);
            setResult(null);
            setErrorMsg(null);

            const response = await importExcel(
                file,
                periodYear
            );

            setResult(response.data?.data || response.data);

        } catch (err) {
            console.error('Gagal import Excel:', err);

            setErrorMsg(
                err.response?.data?.message ||
                'Gagal mengimpor file Excel.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                <div>
                    <h4 className="fw-semibold mb-1">
                        Import Data Excel
                    </h4>

                    <p className="text-secondary mb-0">
                        Download template, isi data sesuai
                        kolom, lalu upload kembali.
                    </p>
                </div>

                <a
                    href="/templates/template-ppa.xlsx"
                    download="Template Import PPA.xlsx"
                    className="btn btn-outline-success d-flex align-items-center gap-2"
                >
                    <i className="bi bi-download" />
                    Download Template Excel
                </a>
            </div>

            <div
                className="app-card p-4"
                style={{ maxWidth: 540 }}
            >
                <label className="form-label small text-secondary mb-1">
                    Pilih File Excel (.xlsx / .xls)
                </label>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-8">
                        <input
                            type="file"
                            className="form-control"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="col-12 col-md-4">
                        <select
                            className="form-select"
                            value={periodYear}
                            onChange={(event) =>
                                setPeriodYear(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            disabled={loading}
                            aria-label="Tahun fallback import"
                        >
                            {YEARS.map((year) => (
                                <option
                                    key={year}
                                    value={year}
                                >
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-text mb-3">
                    Tahun dipakai jika sheet Detail LT Supply tidak memiliki judul tahun.
                </div>

                <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleImport}
                    disabled={!file || loading}
                >
                    {loading && (
                        <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                        />
                    )}

                    <i className="bi bi-upload" />
                    Import
                </button>
            </div>

            {errorMsg && (
                <div
                    className="alert alert-danger mt-3"
                    role="alert"
                >
                    {errorMsg}
                </div>
            )}

            {result && (
                <div className="app-card p-4 mt-3">
                    <div className="fw-semibold mb-3">
                        Ringkasan Hasil Import
                    </div>

                    <div className="table-responsive mb-3">
                        <table className="table table-sm align-middle">
                            <thead>
                                <tr>
                                    <th>Sheet</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {Object.entries(
                                    SHEET_LABELS
                                ).map(([key, label]) => (
                                    <tr key={key}>
                                        <td className="fw-medium">
                                            {label}
                                        </td>

                                        <td className="text-secondary">
                                            {result[key] || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {result.skipped?.length > 0 && (
                        <div>
                            <div className="small text-secondary mb-2">
                                Data dilewati:{' '}
                                {result.skipped.length}
                            </div>

                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Sheet</th>
                                            <th>Baris</th>
                                            <th>Alasan</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {result.skipped.map(
                                            (item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {item.sheet}
                                                    </td>
                                                    <td>
                                                        {item.row ||
                                                            '-'}
                                                    </td>
                                                    <td>
                                                        {item.reason}
                                                    </td>
                                                </tr>
                                            )
                                        )}
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
