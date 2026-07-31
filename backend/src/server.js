const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function startServer() {
    try {
        await testConnection();

        console.log('Database berhasil terhubung');

        app.listen(env.port, () => {
            console.log(
                `Server berjalan di http://localhost:${env.port}`
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