const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API berjalan',
    });
});

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