'use strict';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const { body, param, validationResult } = require('express-validator');

const BCRYPT_ROUNDS = 12;
// Compared against when the user does not exist, so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);
const normalizeEmail = () => body('email').isEmail().isLength({ max: 254 }).normalizeEmail({ gmail_remove_dots: false });

/**
 * Builds the Express app. The database and secret are injected so the app can be tested without a real database.
 */
function createApp({ db, jwtSecret, corsOrigin = 'http://localhost:3000', disableRateLimit = false }) {
    if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

    const app = express();
    const limiter = (opts) => rateLimit({ standardHeaders: true, legacyHeaders: false, skip: () => disableRateLimit, ...opts });

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                connectSrc: ["'self'", corsOrigin],
                imgSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                upgradeInsecureRequests: null,
            },
        },
    }));
    app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
    app.use(express.json({ limit: '10kb' }));

    app.use(['/tickets', '/admin'], limiter({ windowMs: 15 * 60 * 1000, limit: 100 }));
    const loginLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 5, message: { message: 'Too many login attempts' } });
    const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 3, message: { message: 'Too many registrations' } });

    app.use(express.static(path.join(__dirname, '..', 'public')));

    // ---------- auth middleware ----------
    const authenticateToken = (req, res, next) => {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication required' });
        jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }, (err, payload) => {
            if (err) return res.status(401).json({ message: 'Invalid or expired token' });
            req.user = payload;
            next();
        });
    };

    const authorizeRoles = (...roles) => (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
        next();
    };

    const rejectInvalid = (req, res, next) => {
        if (!validationResult(req).isEmpty()) return res.status(400).json({ message: 'Validation failed' });
        next();
    };

    // ---------- routes ----------
    app.post('/register', registerLimiter, normalizeEmail(),
        body('password').isString().isLength({ min: 8, max: 128 }), rejectInvalid, async (req, res, next) => {
            try {
                const hash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
                await db.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [req.body.email, hash, 'user']);
                res.status(201).json({ message: 'Registered' });
            } catch (err) {
                if (err.code === '23505') return res.status(409).json({ message: 'Email already registered' });
                next(err);
            }
        });

    app.post('/login', loginLimiter, normalizeEmail(), body('password').isString().isLength({ min: 1, max: 128 }),
        rejectInvalid, async (req, res, next) => {
            try {
                const result = await db.query('SELECT id, password_hash, role FROM users WHERE email = $1', [req.body.email]);
                const user = result.rows[0];
                const ok = await bcrypt.compare(req.body.password, user ? user.password_hash : DUMMY_HASH);
                if (!user || !ok) return res.status(401).json({ message: 'Invalid credentials' });
                const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { algorithm: 'HS256', expiresIn: '15m' });
                res.json({ token, role: user.role });
            } catch (err) { next(err); }
        });

    app.post('/tickets', authenticateToken, [
        body('title').isString().trim().isLength({ min: 1, max: 150 }),
        body('description').isString().trim().isLength({ min: 1, max: 5000 }),
        body('priority').isIn(['Low', 'Medium', 'High']),
    ], rejectInvalid, async (req, res, next) => {
        try {
            // Stored as plain text. The frontend renders it with textContent, so no HTML escaping is needed here.
            await db.query('INSERT INTO tickets (title, description, priority, user_id) VALUES ($1, $2, $3, $4)',
                [req.body.title, req.body.description, req.body.priority, req.user.id]);
            res.status(201).json({ message: 'Created' });
        } catch (err) { next(err); }
    });

    app.get('/tickets/mine', authenticateToken, async (req, res, next) => {
        try {
            const result = await db.query(
                `SELECT id, title, priority, status, admin_reply, created_at
                 FROM tickets WHERE user_id = $1 ORDER BY id DESC`, [req.user.id]);
            res.json(result.rows);
        } catch (err) { next(err); }
    });

    app.get('/admin/tickets', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
        try {
            const result = await db.query(`
                SELECT t.id, t.title, t.description, t.priority, t.status, t.created_at, t.admin_reply, u.email
                FROM tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.id DESC`);
            res.json(result.rows);
        } catch (err) { next(err); }
    });

    app.put('/admin/tickets/:id/status', authenticateToken, authorizeRoles('admin'), [
        param('id').isInt({ min: 1 }),
        body('status').isIn(['Open', 'In Progress', 'Resolved']),
        body('admin_reply').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
    ], rejectInvalid, async (req, res, next) => {
        try {
            const result = await db.query('UPDATE tickets SET status = $1, admin_reply = $2 WHERE id = $3',
                [req.body.status, req.body.admin_reply || null, req.params.id]);
            if (result.rowCount === 0) return res.status(404).json({ message: 'Ticket not found' });
            res.json({ message: 'Updated' });
        } catch (err) { next(err); }
    });

    // ---------- errors: never leak stack traces or SQL details ----------
    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
        if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
            return res.status(400).json({ message: 'Invalid request body' });
        }
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    });

    return app;
}

module.exports = { createApp };
