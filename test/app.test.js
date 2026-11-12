'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');

const SECRET = 'x'.repeat(48);
let server, base, queries, userRow;

// A tiny fake of pg.Pool: records queries and returns canned rows.
const fakeDb = {
    async query(sql, params) {
        queries.push({ sql, params });
        if (sql.startsWith('INSERT INTO users')) {
            if (params[0] === 'taken@example.com') { const e = new Error('duplicate'); e.code = '23505'; throw e; }
            return { rows: [], rowCount: 1 };
        }
        if (sql.startsWith('SELECT id, password_hash')) return { rows: userRow && params[0] === userRow.email ? [userRow] : [] };
        if (sql.startsWith('UPDATE tickets')) return { rows: [], rowCount: params[2] === '999' ? 0 : 1 };
        if (sql.includes('FROM tickets')) return { rows: [{ id: 1, title: '<img src=x onerror=alert(1)>', description: 'd', priority: 'High', status: 'Open', email: 'a@b.com' }] };
        return { rows: [], rowCount: 1 };
    },
};

const token = (payload, opts = {}) => jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '15m', ...opts });
const call = (method, path, { body, auth } = {}) => fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
});

before(async () => {
    userRow = { id: 7, email: 'user@example.com', role: 'user', password_hash: await bcrypt.hash('correct-password', 4) };
    const app = createApp({ db: fakeDb, jwtSecret: SECRET, disableRateLimit: true });
    await new Promise((resolve) => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
const reset = () => { queries = []; };

test('refuses to start with a weak JWT secret', () => {
    assert.throws(() => createApp({ db: fakeDb, jwtSecret: 'short' }), /JWT_SECRET/);
});

test('login: wrong password and unknown user get the same 401', async () => {
    reset();
    const bad = await call('POST', '/login', { body: { email: 'user@example.com', password: 'nope-nope' } });
    const ghost = await call('POST', '/login', { body: { email: 'ghost@example.com', password: 'nope-nope' } });
    assert.equal(bad.status, 401);
    assert.equal(ghost.status, 401);
    assert.deepEqual(await bad.json(), await ghost.json());
});

test('login: correct password returns a 15 minute HS256 token with role', async () => {
    const res = await call('POST', '/login', { body: { email: 'user@example.com', password: 'correct-password' } });
    assert.equal(res.status, 200);
    const data = await res.json();
    const payload = jwt.verify(data.token, SECRET, { algorithms: ['HS256'] });
    assert.equal(payload.role, 'user');
    assert.equal(payload.exp - payload.iat, 900);
});

test('register: validation, duplicate email and SQL injection attempt', async () => {
    assert.equal((await call('POST', '/register', { body: { email: 'not-an-email', password: 'long-enough-1' } })).status, 400);
    assert.equal((await call('POST', '/register', { body: { email: 'a@example.com', password: 'short' } })).status, 400);
    assert.equal((await call('POST', '/register', { body: { email: 'taken@example.com', password: 'long-enough-1' } })).status, 409);
    reset();
    const ok = await call('POST', '/register', { body: { email: 'new@example.com', password: 'long-enough-1' } });
    assert.equal(ok.status, 201);
    assert.ok(queries[0].sql.includes('$1'), 'must use parameterized queries');
    assert.notEqual(queries[0].params[1], 'long-enough-1', 'password must be hashed');
});

test('gmail dots are preserved so register and login use the same address', async () => {
    reset();
    await call('POST', '/register', { body: { email: 'First.Last@gmail.com', password: 'long-enough-1' } });
    assert.equal(queries[0].params[0], 'first.last@gmail.com');
});

test('tickets require a valid token', async () => {
    const body = { title: 't', description: 'd', priority: 'Low' };
    assert.equal((await call('POST', '/tickets', { body })).status, 401);
    assert.equal((await call('POST', '/tickets', { body, auth: 'garbage' })).status, 401);
    const forged = jwt.sign({ id: 1, role: 'admin' }, 'y'.repeat(48), { algorithm: 'HS256' });
    assert.equal((await call('POST', '/tickets', { body, auth: forged })).status, 401);
    const expired = token({ id: 1, role: 'user' }, { expiresIn: -10 });
    assert.equal((await call('POST', '/tickets', { body, auth: expired })).status, 401);
});

test('unsigned "alg: none" tokens are rejected', async () => {
    const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ id: 1, role: 'admin' })}.`;
    assert.equal((await call('GET', '/admin/tickets', { auth: none })).status, 401);
});

test('ticket creation validates input and passes the token user id', async () => {
    const auth = token({ id: 7, role: 'user' });
    assert.equal((await call('POST', '/tickets', { auth, body: { title: '', description: 'd', priority: 'Low' } })).status, 400);
    assert.equal((await call('POST', '/tickets', { auth, body: { title: 't', description: 'd', priority: 'Urgent' } })).status, 400);
    assert.equal((await call('POST', '/tickets', { auth, body: { title: 'x'.repeat(151), description: 'd', priority: 'Low' } })).status, 400);
    reset();
    const ok = await call('POST', '/tickets', { auth, body: { title: ' Printer ', description: 'broken', priority: 'High' } });
    assert.equal(ok.status, 201);
    assert.deepEqual(queries[0].params, ['Printer', 'broken', 'High', 7]);
});

test('users can list only their own tickets', async () => {
    assert.equal((await call('GET', '/tickets/mine')).status, 401);
    reset();
    const res = await call('GET', '/tickets/mine', { auth: token({ id: 7, role: 'user' }) });
    assert.equal(res.status, 200);
    assert.deepEqual(queries[0].params, [7], 'query must be filtered by the id from the token');
    assert.ok(queries[0].sql.includes('user_id = $1'));
});

test('role comes from the verified token, not the request body', async () => {
    const auth = token({ id: 7, role: 'user' });
    assert.equal((await call('GET', '/admin/tickets', { auth })).status, 403);
    const upd = await call('PUT', '/admin/tickets/1/status', { auth, body: { status: 'Resolved', role: 'admin' } });
    assert.equal(upd.status, 403);
});

test('admin can list and update tickets; input is validated', async () => {
    const auth = token({ id: 1, role: 'admin' });
    const list = await call('GET', '/admin/tickets', { auth });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).length, 1);
    assert.equal((await call('PUT', '/admin/tickets/abc/status', { auth, body: { status: 'Open' } })).status, 400);
    assert.equal((await call('PUT', '/admin/tickets/1/status', { auth, body: { status: 'Hacked' } })).status, 400);
    assert.equal((await call('PUT', '/admin/tickets/999/status', { auth, body: { status: 'Open' } })).status, 404);
    assert.equal((await call('PUT', '/admin/tickets/1/status', { auth, body: { status: 'Resolved', admin_reply: 'Fixed' } })).status, 200);
});

test('malformed JSON returns 400 without leaking internals', async () => {
    const res = await fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { message: 'Invalid request body' });
});

test('security headers are set', async () => {
    const res = await fetch(base + '/');
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
