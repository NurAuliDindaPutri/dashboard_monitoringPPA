const multer = require('multer');
const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
    console.error(err);

    if (err instanceof multer.MulterError || /berformat \.xlsx/i.test(err.message || '')) {
        return error(res, err.message || 'Upload file tidak valid', 400);
    }

    error(res, err.message || 'Internal Server Error', err.status || 500);
}

module.exports = errorHandler;