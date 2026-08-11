const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function startServer() {
    try {
        await testConnection();

        console.log('Database berhasil terhubung');

        app.listen(env.port, '0.0.0.0', () => {
            console.log(
                `Server berjalan diport ${env.port}`
            );
        });
    } catch (err) {

        console.error(
            'Server gagal dijalankan:',
            err.message
        );

        process.exit(1);
    }
}

startServer();