require('dotenv').config();

function parseOrigins(value) {
    return String(value || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const sameSiteValue = String(
    process.env.COOKIE_SAME_SITE || 'lax'
).toLowerCase();

const allowedSameSiteValues = [
    'lax',
    'strict',
    'none',
];

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database:
            process.env.DB_NAME ||
            'ppa_monitoring',
    },

    corsOrigins: parseOrigins(
        process.env.CORS_ORIGINS
    ),

    auth: {
        jwtSecret:
            process.env.JWT_SECRET ||
            'development-only-change-this-secret',
        jwtExpiresIn:
            process.env.JWT_EXPIRES_IN ||
            '8h',
        cookieName:
            process.env.AUTH_COOKIE_NAME ||
            'ppa_session',
        cookieSecure:
            process.env.COOKIE_SECURE ===
            'true',
        cookieSameSite:
            allowedSameSiteValues.includes(
                sameSiteValue
            )
                ? sameSiteValue
                : 'lax',
        cookieMaxAgeMs:
            Number(
                process.env
                    .COOKIE_MAX_AGE_MS
            ) ||
            8 * 60 * 60 * 1000,
    },

    registration: {
        enabled:
            process.env.REGISTRATION_ENABLED ===
            'true',
    },
}

module.exports = env;