# Auth Service

NestJS + Fastify microservice handling authentication, token issuance, and profile bootstrap.

## Getting started

```bash
cd services/node/auth-service
npm install
cp env.example .env.local
npm run start:dev
```

Expose downstream DB/JWT secrets via environment variables. By default the service listens on port `5001`.

## Environment

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `5001`) |
| `SQLITE_DB_PATH`/`SQLITE_URL` | Filesystem path (or `sqlite:///` URL) to the SQLite database file |
| `JWT_SECRET` | Symmetric key used to sign and verify access tokens |
| `JWT_EXPIRES_IN` | Token TTL string accepted by `jsonwebtoken` (e.g. `1h`, `15m`) |

## Routes

- `POST /auth/signup` – creates a new user (email/password) and returns a signed JWT plus user metadata.
- `POST /auth/login` – authenticates existing users and returns a fresh JWT.
- `POST /auth/validate` – verifies a presented JWT and returns `valid` plus decoded claims.
- `GET /health` – lightweight readiness probe consumed by the API gateway.

