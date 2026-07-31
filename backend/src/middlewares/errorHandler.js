const multer = require('multer');
const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    // Error dari upload Multer
    if (err instanceof multer.MulterError) {
        let message = err.message || 'Upload file tidak valid';

        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Ukuran file terlalu besar';
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Field atau jumlah file upload tidak sesuai';
        }

        return error(res, message, 400);
    }

    // File bukan XLSX atau validasi file gagal
    if (/berformat \.xlsx/i.test(err.message || '')) {
        return error(
            res,
            err.message || 'File harus berformat .xlsx',
            400
        );
    }

    // Error duplikasi data MySQL
    if (err.code === 'ER_DUP_ENTRY') {
        return error(
            res,
            'Data yang sama sudah tersedia',
            409
        );
    }

    // Error foreign key MySQL
    if (
        err.code === 'ER_NO_REFERENCED_ROW_2' ||
        err.code === 'ER_ROW_IS_REFERENCED_2'
    ) {
        return error(
            res,
            'Data tidak dapat diproses karena masih memiliki hubungan dengan data lain',
            409
        );
    }

    const statusCode =
        Number(err.statusCode || err.status) || 500;

    const message =
        statusCode >= 500
            ? 'Terjadi kesalahan pada server'
            : err.message || 'Permintaan tidak dapat diproses';

    return error(res, message, statusCode);
}

module.exports = errorHandler;