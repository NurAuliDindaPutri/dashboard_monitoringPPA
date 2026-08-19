const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:5173'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            const error = new Error(
                'Alamat website tidak diizinkan'
            );

            error.status = 403;

            return callback(error);
        },
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /api/health didefinisikan di src/routes/index.js agar ikut memeriksa database.
app.use('/api', routes);

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