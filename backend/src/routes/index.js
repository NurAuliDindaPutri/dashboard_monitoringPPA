const express = require('express');
const { success, error } = require('../utils/response');
const { testConnection } = require('../config/db');
const siteRoutes = require('./site.routes');
const unitModelRoutes = require('./unitModel.routes');
const monthlyKpiSummaryRoutes = require('./monthlyKpiSummary.routes');
const monthlyUnitPerformanceRoutes = require('./monthlyUnitPerformance.routes');
const pendingSupplyRoutes = require('./pendingSupply.routes');
const importRoutes = require('./import.routes');


const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        await testConnection();
        return success(
            res,
            {
                api: 'up',
                database: 'connected',
                uptime_seconds: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
            },
            'API dan database dalam kondisi sehat'
        );
    } catch (err) {
        console.error(
            'Health check database gagal:',
            err.message
        );

        return error(
            res,
            'API berjalan, tetapi database tidak terhubung',
            503,
            {
                api: 'up',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            }
        );
    }
});

router.use('/sites', siteRoutes);
router.use('/unit-models', unitModelRoutes);
router.use('/kpi-summary', monthlyKpiSummaryRoutes);
router.use('/unit-performance', monthlyUnitPerformanceRoutes);
router.use('/pending-supply', pendingSupplyRoutes);
router.use('/import', importRoutes);
router.use('/monthly-unit-performance', monthlyUnitPerformanceRoutes);

module.exports = router;