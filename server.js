'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const { createApp } = require('./src/app');

for (const name of ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'JWT_SECRET']) {
    if (!process.env[name]) {
        console.error(`Missing required environment variable: ${name} (see .env.example)`);
        process.exit(1);
    }
}

const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

const port = Number(process.env.PORT) || 3000;
const app = createApp({
    db,
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.CORS_ORIGIN || `http://localhost:${port}`,
});

app.listen(port, () => console.log(`HelpDesk running on http://localhost:${port}`));
