# Testing Guide

## Test commands

| Command | Purpose |
|---------|---------|
| `pnpm test` | Unit tests + API tests (primary) |
| `pnpm test:unit` | Nx unit tests (Vitest) |
| `pnpm test:affected` | Unit tests for changed packages only |
| `pnpm test:api` | Supabase REST API endpoint tests |
| `pnpm test:all` | Full validation (deps, lint, build) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:ui` | Vitest UI dashboard |
| `pnpm test:playwright` | Playwright E2E tests |
| `pnpm test:contracts` | Contract tests (third-party integrations) |

## Git hooks

- **pre-commit**: Lint + typecheck (affected). Runs automatically before each commit.
- **pre-push**: Unit tests (affected). Runs before each push.

Skip with `--no-verify` when needed (e.g. `git push --no-verify`).

See [.githooks/](../.githooks/README.md) for details.

## Hand-run scripts (developer tools)

For local debugging and ad-hoc verification:

| Script | Purpose |
|--------|---------|
| `./scripts/test-api.sh` | Quick REST API health checks (curl) |
| `./scripts/test-api-local.ts` | Deno-based API test (health + auth flows) |
| `./scripts/test-api-keys.mjs` | API key auth flow (Node) |
| `./scripts/test-api-keys.sh` | API key auth flow (bash/curl) |

Use when Supabase is running locally (`pnpm supa start`). See [API testing guide](API_TESTING_GUIDE.md).

## CI

- **test.yml**: Runs on push/PR to main/develop — typecheck, lint, tests (affected). Blocking.
- **api-tests.yml**: REST API tests when `packages/supabase/functions/api/**` changes.
- **scaffald-tests.yml**: Unit + E2E when scaffald/packages change.
- **contracts.yml**: Contract tests when third-party integration code changes.
