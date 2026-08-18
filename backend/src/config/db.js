const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { pool, testConnection };