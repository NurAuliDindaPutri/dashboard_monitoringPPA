const express = require('express');
const upload = require('../middlewares/upload.middleware');
const importExcelController = require('../controllers/importExcel.controller');

const router = express.Router();

router.post('/excel', upload.single('file'), importExcelController.importExcel);

module.exports = router;