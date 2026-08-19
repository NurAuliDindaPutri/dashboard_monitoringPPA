const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message:
            'Terlalu banyak permintaan. Silakan coba kembali beberapa saat lagi.',
    },
});

app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                env.corsOrigins.includes(
                    origin
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            const corsError =
                new Error(
                    'Alamat website tidak diizinkan.'
                );

            corsError.status = 403;
            return callback(corsError);
        },
        credentials: true,
        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
        ],
        allowedHeaders: [
            'Accept',
            'Content-Type',
            'X-PPA-Client',
        ],
    })
);

app.use(
    express.json({ limit: '1mb' })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: '1mb',
    })
);
app.use(cookieParser());

// Request yang mengubah data wajib berasal dari frontend PPA.
// Header custom memaksa browser melakukan pemeriksaan CORS/preflight.
app.use('/api', (req, res, next) => {
    const writeMethods = new Set([
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
    ]);

    if (
        writeMethods.has(req.method) &&
        req.get('X-PPA-Client') !==
        'web'
    ) {
        return res.status(403).json({
            status: 'error',
            message:
                'Request aplikasi tidak valid.',
        });
    }

    return next();
});

// /api/health tetap memeriksa koneksi database.
app.use('/api', apiLimiter, routes);

app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
});

app.use(errorHandler);

module.exports = app;