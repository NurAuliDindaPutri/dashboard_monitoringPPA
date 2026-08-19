const express = require('express');
const upload = require('../middlewares/upload.middleware');
const importExcelController = require('../controllers/importExcel.controller');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const importLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan import. Silakan tunggu beberapa saat.',
    },
});

router.post(
    '/excel',
    importLimiter,
    upload.single('file'),
    importExcelController.importExcel
);

module.exports = router;