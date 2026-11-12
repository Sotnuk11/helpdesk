'use strict';

// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/create-admin.js
// Creates an admin account, or promotes an existing user to admin and sets a new password.
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email.includes('@') || password.length < 12) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
    process.exit(1);
}

const db = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT),
});

(async () => {
    const hash = await bcrypt.hash(password, 12);
    await db.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
        [email, hash]);
    console.log(`Admin ready: ${email}`);
    await db.end();
})().catch((err) => { console.error(err.message); process.exit(1); });
