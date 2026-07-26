const express = require('express');
const monthlyKpiSummaryController = require('../controllers/monthlyKpiSummary.controller');

const router = express.Router();

router.get('/', monthlyKpiSummaryController.getAll);
router.get('/:id', monthlyKpiSummaryController.getById);
router.post('/', monthlyKpiSummaryController.create);
router.put('/:id', monthlyKpiSummaryController.update);
router.delete('/:id', monthlyKpiSummaryController.remove);

module.exports = router;