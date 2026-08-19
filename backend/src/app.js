const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.disable('x-powered-by');
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan. Silakan coba kembali beberapa saat lagi.',
    },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(
    express.urlencoded({
        extended: true,
        limit: '1mb',
    })
);

// /api/health didefinisikan di src/routes/index.js agar ikut memeriksa database.
app.use('/api', apiLimiter, routes);

// Route tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
});

// Global error handler harus paling akhir
app.use(errorHandler);

module.exports = app;