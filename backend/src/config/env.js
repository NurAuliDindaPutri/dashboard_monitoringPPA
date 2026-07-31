require('dotenv').config();

module.exports = {
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
};