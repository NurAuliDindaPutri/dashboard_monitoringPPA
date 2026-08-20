require('dotenv').config();

function parseOrigins(value) {
    return String(
        value ||
        'http://localhost:5173'
    )
        .split(',')
        .map((origin) =>
            origin.trim()
        )
        .filter(Boolean);
}

const nodeEnv =
    process.env.NODE_ENV ||
    'development';

const jwtSecret = String(
    process.env.JWT_SECRET || ''
).trim();

if (!jwtSecret) {
    throw new Error(
        'JWT_SECRET wajib diisi di file .env.'
    );
}

if (
    nodeEnv === 'production' &&
    jwtSecret.length < 32
) {
    throw new Error(
        'JWT_SECRET production minimal 32 karakter.'
    );
}

const sameSiteValue = String(
    process.env.COOKIE_SAME_SITE ||
    'lax'
).toLowerCase();

const allowedSameSiteValues = [
    'lax',
    'strict',
    'none',
];

const cookieSameSite =
    allowedSameSiteValues.includes(
        sameSiteValue
    )
        ? sameSiteValue
        : 'lax';

const cookieSecure =
    process.env.COOKIE_SECURE ===
    'true';

if (
    cookieSameSite === 'none' &&
    !cookieSecure
) {
    throw new Error(
        'COOKIE_SECURE harus true jika COOKIE_SAME_SITE=none.'
    );
}

const env = {
    nodeEnv,

    port:
        Number(process.env.PORT) ||
        5000,

    db: {
        host:
            process.env.DB_HOST ||
            'localhost',

        port:
            Number(
                process.env.DB_PORT
            ) || 3306,

        user:
            process.env.DB_USER ||
            'root',

        password:
            process.env.DB_PASSWORD ||
            '',

        database:
            process.env.DB_NAME ||
            'ppa_monitoring',
    },

    corsOrigins: parseOrigins(
        process.env.CORS_ORIGINS
    ),

    auth: {
        jwtSecret,

        jwtExpiresIn:
            process.env
                .JWT_EXPIRES_IN ||
            '8h',

        cookieName:
            process.env
                .AUTH_COOKIE_NAME ||
            'ppa_session',

        cookieSecure,

        cookieSameSite,

        cookieMaxAgeMs:
            Number(
                process.env
                    .COOKIE_MAX_AGE_MS
            ) ||
            8 * 60 * 60 * 1000,
    },

    registration: {
        enabled:
            process.env
                .REGISTRATION_ENABLED ===
            'true',
    },
};

module.exports = env;