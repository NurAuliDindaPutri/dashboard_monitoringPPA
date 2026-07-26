const express = require('express');
const monthlyUnitPerformanceController = require('../controllers/monthlyUnitPerformance.controller');

const router = express.Router();

router.get('/', monthlyUnitPerformanceController.getAll);
router.get('/:id', monthlyUnitPerformanceController.getById);
router.post('/', monthlyUnitPerformanceController.create);
router.put('/:id', monthlyUnitPerformanceController.update);
router.delete('/:id', monthlyUnitPerformanceController.remove);

module.exports = router;