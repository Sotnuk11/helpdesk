# HelpDesk

[![CI](https://github.com/Sotnuk11/helpdesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Sotnuk11/helpdesk/actions/workflows/ci.yml)

A secure help desk ticketing system. Users register and submit support tickets; admins review them, change their status and reply.
Built with **Node.js, Express and PostgreSQL**, with a focus on application security. The vanilla JavaScript frontend supports Ukrainian, English and Polish.

## Features

- Registration and login with **bcrypt** (12 rounds) and **JWT** access tokens (HS256, 15 min)
- Role-based access control: `user` creates tickets, `admin` views all tickets and updates status/reply
- Admin console with ticket statistics, detail view and status workflow (Open → In Progress → Resolved)
- Language switcher (UK / EN / PL)
- 12 automated tests (Node's built-in test runner, no database needed)

## Security design

| Threat | Mitigation |
|---|---|
| SQL injection | All queries are parameterized (`$1, $2, ...`) |
| XSS | Ticket data is stored as plain text and rendered with `textContent` / DOM APIs, never `innerHTML`; strict CSP (`script-src 'self'`, `object-src 'none'`) via Helmet |
| Brute force | `express-rate-limit`: 5 logins / 15 min, 3 registrations / hour, 100 requests / 15 min on tickets and admin routes |
| Token forgery | Algorithm pinned to HS256 (blocks `alg: none`); tokens verified on every request; JWT secret must be 32+ characters or the server refuses to start |
| Privilege escalation | Role is read from the signed token on the server; admin routes sit behind `authorizeRoles('admin')`; user input never sets a role |
| User enumeration | Same 401 response for wrong password and unknown email, and bcrypt runs in both cases (constant-ish timing) |
| Oversized / malformed input | `express-validator` length and type checks, 10 kb JSON body limit, JSON error responses without stack traces |
| Clickjacking, MIME sniffing | `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` (Helmet) |
| Secrets in the repo | Configuration only through `.env` (git-ignored); `.env.example` documents the variables |

### Known limitations

- The JWT is kept in `sessionStorage`, so a successful XSS would expose it (an `HttpOnly` cookie plus CSRF protection would be stronger).
- No refresh tokens, token revocation, password reset or e-mail verification.
- Behind a reverse proxy, set `app.set('trust proxy', ...)` so rate limiting sees real client IPs, and serve over HTTPS.

## Getting started

Requirements: Node.js 20+, PostgreSQL.

```bash
git clone https://github.com/Sotnuk11/helpdesk.git && cd helpdesk
npm install
createdb helpdesk && psql -d helpdesk -f schema.sql
cp .env.example .env          # fill in DB credentials and JWT_SECRET
npm start                     # http://localhost:3000
```

Create the first admin (registration always creates normal users):

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-12-characters' npm run create-admin
```

## Tests

```bash
npm test
```

The tests run the real Express app against a fake database object, and cover validation, authentication (expired, forged and `alg: none` tokens), authorization, duplicate registration and security headers.

## API

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | public | `{ email, password }`, password 8-128 chars |
| POST | `/login` | public | returns `{ token, role }` |
| POST | `/tickets` | user, admin | `{ title (≤150), description (≤5000), priority: Low\|Medium\|High }` |
| GET | `/admin/tickets` | admin | all tickets with author e-mail |
| PUT | `/admin/tickets/:id/status` | admin | `{ status: Open\|In Progress\|Resolved, admin_reply? }` |

Protected routes expect `Authorization: Bearer <token>`.

## Project structure

```
server.js            entry point: reads .env, connects to PostgreSQL, starts the app
src/app.js           Express app factory (middleware, routes, error handling)
schema.sql           PostgreSQL tables
scripts/create-admin.js
public/              frontend (index.html, main.js, style.css)
test/app.test.js
```

## Tech stack

Node.js, Express 5, PostgreSQL (`pg`), bcrypt, jsonwebtoken, Helmet, express-rate-limit, express-validator, vanilla JS/CSS.

## License

MIT
