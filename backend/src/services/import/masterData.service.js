const { pool } = require('../../config/db');
const { getField } = require('../../utils/excelHelpers');

/**
 * Import baris-baris sheet "Master Data" (kolom: SITE, MODEL UNIT).
 * Site baru akan dibuat otomatis jika belum ada. Model unit yang sudah
 * terdaftar untuk site tersebut akan dilewati (tidak duplicate).
 */
async function importMasterDataSheet(rows) {
    let successCount = 0;
    let skippedCount = 0;
    const skippedDetails = [];
    const siteCache = new Map();

    for (const row of rows) {
        const siteCode = String(getField(row, 'SITE') ?? '').trim();
        const modelName = String(getField(row, 'MODEL UNIT') ?? '').trim();

        if (!siteCode || !modelName) {
            skippedCount += 1;
            skippedDetails.push({ sheet: 'Master Data', row, reason: 'Kolom SITE atau MODEL UNIT kosong' });
            continue;
        }

        let siteId = siteCache.get(siteCode);
        if (!siteId) {
            const [siteRows] = await pool.query('SELECT id FROM sites WHERE site_code = ? LIMIT 1', [siteCode]);
            if (siteRows[0]) {
                siteId = siteRows[0].id;
            } else {
                const [result] = await pool.query(
                    'INSERT INTO sites (site_code, site_name, is_active) VALUES (?, NULL, 1)',
                    [siteCode]
                );
                siteId = result.insertId;
            }
            siteCache.set(siteCode, siteId);
        }

        const [modelRows] = await pool.query(
            'SELECT id FROM unit_models WHERE site_id = ? AND model_name = ? LIMIT 1',
            [siteId, modelName]
        );
        if (modelRows[0]) {
            skippedCount += 1;
            skippedDetails.push({ sheet: 'Master Data', row, reason: 'Model unit sudah terdaftar untuk site ini' });
            continue;
        }

        await pool.query('INSERT INTO unit_models (site_id, model_name) VALUES (?, ?)', [siteId, modelName]);
        successCount += 1;
    }

    return {
        summary: `${successCount} berhasil, ${skippedCount} dilewati`,
        skippedDetails,
    };
}

module.exports = { importMasterDataSheet };