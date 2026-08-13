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

async function importExcel(req, res) {
    try {
        if (!req.file) {
            return error(
                res,
                'File Excel wajib diupload dengan field "file".',
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