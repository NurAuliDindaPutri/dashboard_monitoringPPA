const XLSX = require('xlsx');

const {
    findSheetName,
    sheetToMatrix,
} = require('../utils/excelHelpers');

const {
    importKpiSummarySheet,
} = require('../services/import/kpiSummary.service');

const {
    importUnitPerformanceSheet,
} = require('../services/import/unitPerformance.service');

const {
    importPendingSupplySheet,
} = require('../services/import/pendingSupply.service');

const {
    importDetailLtSupplySheet,
} = require('../services/import/detailLtSupply.service');

const { success, error } = require('../utils/response');

function hasValidExcelSignature(buffer) {
    if (
        !Buffer.isBuffer(buffer) ||
        buffer.length < 8
    ) {
        return false;
    }

    // XLSX merupakan file ZIP dan diawali PK
    const isXlsx =
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b;

    // XLS lama menggunakan format OLE
    const isXls =
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1;

    return isXlsx || isXls;
}

async function importExcel(req, res) {
    try {
        if (!req.file) {
            return error(
                res,
                'File Excel wajib diupload dengan field "file".',
                400
            );
        }

        if (
            !hasValidExcelSignature(
                req.file.buffer
            )
        ) {
            return error(
                res,
                'Isi file tidak sesuai dengan format Excel.',
                400
            );
        }

        const workbook = XLSX.read(req.file.buffer, {
            type: 'buffer',
            cellDates: true,
        });

        const result = {
            kpi_summary:
                'Sheet "KPI Summary" tidak ditemukan, dilewati',

            unit_performance:
                'Sheet "Unit Performance" tidak ditemukan, dilewati',

            pending_supply:
                'Sheet "Pending Supply" tidak ditemukan, dilewati',

            detail_lt_supply:
                'Sheet "Detail LT Supply" tidak ditemukan, dilewati',
            skipped: [],
        };

        /*
         * KPI Summary
         * Masuk ke tabel monthly_kpi_summary
         */
        const kpiSheetName = findSheetName(
            workbook,
            'KPI Summary',
            'KPI',
            'Input'
        );

        if (kpiSheetName) {
            const rows = sheetToMatrix(
                workbook,
                kpiSheetName
            );

            const {
                summary,
                skippedDetails,
            } = await importKpiSummarySheet(rows);

            result.kpi_summary = summary;

            if (Array.isArray(skippedDetails)) {
                result.skipped.push(...skippedDetails);
            }
        } else {
            result.skipped.push({
                sheet: 'KPI Summary',
                reason: 'Sheet tidak ditemukan',
            });
        }

        /*
         * Unit Performance
         * Masuk ke tabel monthly_unit_performance
         */
        const unitSheetName = findSheetName(
            workbook,
            'Unit Performance',
            'Data Unit',
            'Unit Data',
            'Performance Unit'
        );

        if (unitSheetName) {
            const rows = sheetToMatrix(
                workbook,
                unitSheetName
            );

            const {
                summary,
                skippedDetails,
            } = await importUnitPerformanceSheet(rows);

            result.unit_performance = summary;

            if (Array.isArray(skippedDetails)) {
                result.skipped.push(...skippedDetails);
            }
        } else {
            result.skipped.push({
                sheet: 'Unit Performance',
                reason: 'Sheet tidak ditemukan',
            });
        }

        /*
         * Pending Supply
         * Masuk ke tabel pending_supply
         */
        const pendingSheetName = findSheetName(
            workbook,
            'Pending Supply',
            'Pending',
            'Supply Pending'
        );

        if (pendingSheetName) {
            const rows = sheetToMatrix(
                workbook,
                pendingSheetName
            );

            const {
                summary,
                skippedDetails,
            } = await importPendingSupplySheet(rows);

            result.pending_supply = summary;

            if (Array.isArray(skippedDetails)) {
                result.skipped.push(...skippedDetails);
            }
        } else {
            result.skipped.push({
                sheet: 'Pending Supply',
                reason: 'Sheet tidak ditemukan',
            });
        }

        /*
         * Detail LT Supply
         * Memperbarui leadtime_actual dan leadtime_target pada
         * tabel monthly_kpi_summary untuk setiap site dan bulan.
         */
        const detailLtSheetName = findSheetName(
            workbook,
            'Detail LT Supply',
            'Detail Lead Time Supply',
            'LT Supply'
        );

        if (detailLtSheetName) {
            const rows = sheetToMatrix(
                workbook,
                detailLtSheetName
            );

            const {
                summary,
                skippedDetails,
            } = await importDetailLtSupplySheet(rows);

            result.detail_lt_supply = summary;

            if (Array.isArray(skippedDetails)) {
                result.skipped.push(...skippedDetails);
            }
        } else {
            result.skipped.push({
                sheet: 'Detail LT Supply',
                reason: 'Sheet tidak ditemukan',
            });
        }

        return success(
            res,
            result,
            'Import template Excel selesai diproses'
        );
    } catch (err) {
        console.error('IMPORT EXCEL ERROR:');
        console.error(err);

        return error(
            res,
            err.message || 'Import Excel gagal diproses',
            400
        );
    }
}

module.exports = { importExcel };