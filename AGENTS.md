# AGENTS.md — e-server (Library Management Backend)

## Quick reference

```json
// package manager: pnpm (lockfile v9)
// framework: NestJS v11 + TypeScript (nodenext module resolution)
// database: PostgreSQL + Prisma v7 (@prisma/adapter-pg + pg Pool)
// auth: passport-jwt with hardcoded secret (see quirks)
// validation: class-validator + class-transformer
```

## Commands

| Command | What it runs |
|---------|-------------|
| `pnpm start:dev` | `nest start --watch` (hot reload dev server on :5000) |
| `pnpm build` | `nest build` (outputs to `dist/`) |
| `pnpm lint` | `eslint --fix` (flat config, ESLint v9) |
| `pnpm format` | `prettier --write src test` |
| `pnpm test` | `jest` (inline config in package.json, rootDir: src, pattern: `*.spec.ts`) |
| `pnpm test:e2e` | `jest --config ./test/jest-e2e.json` (pattern: `*.e2e-spec.ts`) |
| `pnpm test:cov` | `jest --coverage` (outputs to `coverage/`) |
| `pnpm test:watch` | `jest --watch` |

## Prisma

- Schema is **multi-file** under `prisma/schema/` (one file per model + enums).
- Uses **Prisma driver adapter** (`@prisma/adapter-pg` + `pg.Pool`), **not** the traditional `PrismaClient` constructor. See `src/prisma/prisma.service.ts`.
- Config is in `prisma.config.ts` (needs `dotenv/config` import — the `prisma` CLI reads this).
- `prisma generate` / `prisma migrate` commands use `prisma.config.ts`.
- `PrismaModule` is `@Global()` — no need to re-import in feature modules.

## Architecture

- **Global response interceptor** (`common/interceptors/transform.interceptor.ts`) wraps all 2xx responses in `{ success: true, statusCode, data }`.
- **Global exception filter** (`common/global-error.handelar.ts`) catches everything, returns `{ success: false, statusCode, message, ... }`. Prisma `P1001` (DB connection) gets a 503.
- **Provider-level `APP_FILTER`** in `app.module.ts` AND `app.useGlobalFilters()` in `main.ts` — **both** are active (redundant but harmless).
- Default port: `process.env.PORT` (currently `5000` from committed `.env`).

## API routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | No | Health check |
| POST | `/auth/singin` | No | Login → JWT token (note typo: "singin" not "signin") |
| POST | `/user` | No | Create user |
| GET | `/user` | JWT | List users |
| GET/PATCH/DELETE | `/user/:id` | No | No auth on patch/delete (likely a gap) |
| POST/GET/PATCH/DELETE | `/book/:id` | No | **Stub** — returns placeholder strings, not backed by Prisma |

## Known quirks / bugs

- **JWT secret is hardcoded** in two places (`auth.module.ts:13` and `jwt.strategy.ts:14`). The `.env` `JWT_SECRET` is **not used** by the auth module.
- **Auth endpoint typo**: `/auth/singin` (should be `signin`), `SinginDto`, `singIn()` method.
- **Filename typo**: `global-error.handelar.ts` (should be `handler`).
- **Book module is a stub** — `BookService` returns literal strings, `CreateBookDto` is empty, and `findOne(id: number)` uses `number` but the schema uses UUIDs (`string`).
- **`.env` is committed** to git despite being in `.gitignore`.
- **Auth guards are inconsistent**: `GET /user` is protected, but `PATCH /user/:id` and `DELETE /user/:id` are open.
- **`dist/` is committed** to git (compiled JS, source maps, `.d.ts` files).

## Testing notes

- Jest config is **inline in `package.json`** (rootDir: `src`, testRegex: `.*\\.spec\\.ts$`).
- E2E tests use a **separate config** at `test/jest-e2e.json` (rootDir: `.`, testRegex: `.e2e-spec.ts$`).
- Most spec files are trivial ("should be defined" only).
- Only meaningful test: `src/app.controller.spec.ts` (GET / returns Hello World) and `test/app.e2e-spec.ts`.

## What's NOT here

- No CI/CD workflows
- No Docker/Docker Compose
- No Makefile
- No Husky, lint-staged, or commit hooks
- No `.env.example`
- No `.nvmrc` / `.node-version`

