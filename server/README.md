# 3DP-Manager — Backend (NestJS)

Backend API for 3DP-Manager. Built with [NestJS](https://nestjs.com/), TypeORM, and PostgreSQL.

## Setup

```bash
npm install
```

## Development

```bash
# watch mode (auto-reload)
npm run start:dev

# lint
npm run lint

# type checking
npm run typecheck
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Production

```bash
npm run build
npm run start:prod
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_PASSWORD` | `postgres` | DB password |
| `POSTGRES_DB` | `3dp-manager` | DB name |
| `JWT_SECRET` | `SECRET_KEY_CHANGE_ME` | JWT signing secret |
| `MASTER_KEY` | (required) | AES-256-GCM encryption key |
| `LOG_LEVEL` | `log` | NestJS log level |
| `DB_SYNCHRONIZE` | `false` | TypeORM auto-sync (dev only) |
| `DB_MIGRATIONS_RUN` | `true` | Run migrations on start |
