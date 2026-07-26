const express = require('express');
const { success } = require('../utils/response');
const { testConnection } = require('../config/db');
const siteRoutes = require('./site.routes');
const unitModelRoutes = require('./unitModel.routes');
const monthlyKpiSummaryRoutes = require('./monthlyKpiSummary.routes');
const monthlyUnitPerformanceRoutes = require('./monthlyUnitPerformance.routes');
const pendingSupplyRoutes = require('./pendingSupply.routes');
const criticalItemRoutes = require('./criticalItem.routes');
const importRoutes = require('./import.routes');

const router = express.Router();

router.get('/health', async (req, res, next) => {
    try {
        await testConnection();
        success(res, { db: 'connected' }, 'Server is healthy');
    } catch (err) {
        next(err);
    }
});

router.use('/sites', siteRoutes);
router.use('/unit-models', unitModelRoutes);
router.use('/kpi-summary', monthlyKpiSummaryRoutes);
router.use('/unit-performance', monthlyUnitPerformanceRoutes);
router.use('/pending-supply', pendingSupplyRoutes);
router.use('/critical-items', criticalItemRoutes);
router.use('/import', importRoutes);

module.exports = router;