const crypto = require('node:crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');

const AuthController = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        status: 'error',
        message:
            'Terlalu banyak percobaan login. Coba kembali 15 menit lagi.',
    },
});

const registerLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message:
            'Terlalu banyak percobaan registrasi. Coba kembali 30 menit lagi.',
    },
});

router.post(
    '/register',
    registerLimiter,
    AuthController.register
);

router.post(
    '/login',
    loginLimiter,
    AuthController.login
);

router.post(
    '/logout',
    AuthController.logout
);

router.get(
    '/me',
    requireAuth,
    AuthController.me
);

module.exports = router;