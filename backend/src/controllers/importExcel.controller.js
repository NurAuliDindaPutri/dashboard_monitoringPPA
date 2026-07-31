const XLSX = require('xlsx');
const { findSheetName, sheetToMatrix } = require('../utils/excelHelpers');
const { importMasterDataSheet } = require('../services/import/masterData.service');
const { importKpiSummarySheet } = require('../services/import/kpiSummary.service');
const { importUnitPerformanceSheet } = require('../services/import/unitPerformance.service');
const { importPendingSupplySheet } = require('../services/import/pendingSupply.service');
const { importDetailLtSupplySheet } = require('../services/import/detailLtSupply.service');
const { success, error } = require('../utils/response');

async function importExcel(req, res, next) {
    console.log("========== IMPORT ==========");
    console.log("req.file =", req.file);
    console.log("req.body =", req.body);

    try {
        if (!req.file) {
            return error(res, 'File Excel wajib diupload (field: file)', 400);
        }

        const periodMonth = Number(req.body?.period_month);
        const periodYear = Number(req.body?.period_year);

        if (
            !Number.isInteger(periodMonth) ||
            periodMonth < 1 ||
            periodMonth > 12 ||
            !Number.isInteger(periodYear) ||
            periodYear < 2000 ||
            periodYear > 2100
        ) {
            return error(
                res,
                'Periode tidak valid. Bulan harus 1-12 dan tahun harus 2000-2100.',
                400
            );
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

        const result = {
            master_data: 'Sheet "Master Data" tidak ditemukan, dilewati',
            kpi_summary: 'Sheet "Input" tidak ditemukan, dilewati',
            unit_performance: 'Sheet "Data Unit" tidak ditemukan, dilewati',
            pending_supply: 'Sheet "Pending Supply" tidak ditemukan, dilewati',
            detail_lt_supply: 'Sheet "Detail LT Supply" tidak ditemukan, dilewati',
            skipped: [],
        };

        // ----- Master Data -> sites & unit_models -----
        const masterSheetName = findSheetName(
            workbook,
            'Master Data',
            'Master',
            'Data Master'
        );

        if (masterSheetName) {
            const rows = sheetToMatrix(workbook, masterSheetName);
            const { summary, skippedDetails } =
                await importMasterDataSheet(rows);

            result.master_data = summary;
            result.skipped.push(...skippedDetails);
        } else {
            result.skipped.push({
                sheet: 'Master Data',
                reason: 'Sheet tidak ditemukan',
            });
        }

        // ----- Input -> monthly_kpi_summary -----
        const inputSheetName = findSheetName(
            workbook,
            'Input',
            'Input Data',
            'KPI',
            'KPI Summary'
        );

        if (inputSheetName) {
            const rows = sheetToMatrix(workbook, inputSheetName);
            const { summary, skippedDetails } =
                await importKpiSummarySheet(
                    rows,
                    periodMonth,
                    periodYear
                );

            result.kpi_summary = summary;
            result.skipped.push(...skippedDetails);
        } else {
            result.skipped.push({
                sheet: 'Input',
                reason: 'Sheet tidak ditemukan',
            });
        }

        // ----- Data Unit -> monthly_unit_performance -----
        const dataUnitSheetName = findSheetName(
            workbook,
            'Data Unit',
            'Unit Data',
            'Performance Unit',
            'Unit Performance'
        );

        if (dataUnitSheetName) {
            const rows = sheetToMatrix(workbook, dataUnitSheetName);
            const { summary, skippedDetails } =
                await importUnitPerformanceSheet(
                    rows,
                    periodMonth,
                    periodYear
                );

            result.unit_performance = summary;
            result.skipped.push(...skippedDetails);
        } else {
            result.skipped.push({
                sheet: 'Data Unit',
                reason: 'Sheet tidak ditemukan',
            });
        }

        // ----- Pending Supply -> pending_supply -----
        const pendingSheetName = findSheetName(
            workbook,
            'Pending Supply',
            'Pending',
            'Supply Pending'
        );

        if (pendingSheetName) {
            const rows = sheetToMatrix(workbook, pendingSheetName);
            const { summary, skippedDetails } =
                await importPendingSupplySheet(rows);

            result.pending_supply = summary;
            result.skipped.push(...skippedDetails);
        } else {
            result.skipped.push({
                sheet: 'Pending Supply',
                reason: 'Sheet tidak ditemukan',
            });
        }

        // ----- Detail LT Supply -----
        const ltSheetName = findSheetName(
            workbook,
            'Detail LT Supply',
            'Detail Lead Time Supply',
            'LT Supply',
            'Lead Time Supply'
        );

        if (ltSheetName) {
            const rows = sheetToMatrix(workbook, ltSheetName);
            const { summary, skippedDetails } =
                await importDetailLtSupplySheet(
                    rows,
                    periodMonth,
                    periodYear
                );

            result.detail_lt_supply = summary;

            if (skippedDetails) {
                result.skipped.push(...skippedDetails);
            }
        } else {
            result.skipped.push({
                sheet: 'Detail LT Supply',
                reason: 'Sheet tidak ditemukan',
            });
        }

        return success(res, result, 'Import Excel selesai diproses');
    } catch (err) {
        console.error("IMPORT EXCEL ERROR:");
        console.error(err);

        return res.status(400).json({
            message: err.message || 'Import Excel gagal diproses',
        });
    }
}

module.exports = { importExcel };