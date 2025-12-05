# Supabase tRPC Test Suite

This directory contains the standalone Deno-based test workspace for all Supabase edge function tRPC routers. Suites run against a live local Supabase instance and reuse the utilities that were historically embedded in `packages/supabase/functions/trpc/__tests__`.

## Directory Overview

- `routers/` – baseline coverage for each tRPC router. File naming mirrors the router name (e.g. `jobs.test.ts`).
- `integration/` – reserved for future multi-router workflows. Currently empty.
- `shared/` – cross-suite helpers and documentation (`setup.ts`, `test-context.ts`, `seeding.ts`, reference notes).
- `fixtures/` – cached artifacts like authentication tokens (created on demand by the auth suite).
- `deno.json` / `import_map.json` – Deno configuration specific to this workspace.

## Prerequisites

1. **Supabase stack running locally** (see `pnpm supa start`). Tests assume default ports (`http://127.0.0.1:54321`) and Mailpit on `http://127.0.0.1:54324`.
2. **Valid test users** seeded in Supabase that match `packages/supabase/functions/trpc/__tests__/setup.ts` conventions (regular + optional admin). The auth suite will create accounts automatically if using magic links.
3. **Deno** available in your PATH (`deno --version`). The repo’s tooling already expects Deno for edge functions.

## Running Tests

- Run the full suite from the repository root:

```
deno test --allow-all packages/supabase/tests
```

- Individual suites:

```
deno test --allow-all packages/supabase/tests/routers/auth.test.ts
```

- `deno.json` exposes a shortcut:

```
deno task -c packages/supabase/tests/deno.json test
```

> ⚠️ **Allow flags**: `--allow-all` is required because the helpers access the filesystem (caching tokens), network (calling Supabase/Mailpit), and environment variables. Scope permissions manually if you prefer tighter control.

## Authentication Strategy

1. **Run `auth.test.ts` first.** It provisions magic-link flows, caches tokens in `fixtures/tokens.json`, and ensures both regular and admin contexts are available for dependent suites.
2. Suites that require authentication call `requireAuthSetup()` which surfaces a friendly error if tokens are missing or expired.
3. To refresh tokens manually, delete `fixtures/tokens.json` and rerun the auth suite.

## Shared Utilities

- `shared/setup.ts`
  - Supabase client factories for anonymous, user, and admin contexts.
  - HTTP helpers (`callTRPCEndpoint`) for invoking batched tRPC endpoints via the Functions gateway.
  - Magic link helpers for generating/capturing auth tokens through Mailpit.

- `shared/test-context.ts`
  - Lazy loader that hydrates Supabase clients per role using the cached tokens.
  - Guards suites with `requireAuthSetup()`.

- `shared/seeding.ts`
  - Lightweight helpers for inserting or truncating data with the service role.
  - Extend with router-specific factories as coverage expands.

## Writing Tests

- Co-locate new suites under `routers/` using the `{router}.test.ts` convention.
- Import assertions from `../shared/assert.ts` to avoid external dependencies.
- Prefer the shared helpers over duplicating setup logic.
- When tests need deterministic data, seed via `createSeedClient()` or helper factories inside a `try/finally` block to keep the database clean.
- Use descriptive names; all suites set `sanitizeResources/Ops` to `false` because Supabase clients keep sockets open.

### Template

```ts
import { assertEquals, assertExists } from "../shared/assert.ts";
import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "Router - scenario description",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens);

    const response = await callTRPCEndpoint("router.procedure", input, {
      authToken: tokens.regular.token,
      type: "mutation",
    });

    const data = response[0]?.result?.data;
    assertExists(data);
    assertEquals(data.success, true);
  },
});
```

## Troubleshooting

- **Missing tokens**: Run `deno test --allow-all packages/supabase/tests/routers/auth.test.ts`.
- **Mailpit unreachable**: Verify `pnpm supa:mailpit` (or the Supabase stack) is running. The auth tests hit `http://127.0.0.1:54324` by default.
- **Supabase URL/key mismatch**: Override via `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` environment variables before running tests.
- **RPC or view not found**: Local databases may lag migrations. Run `pnpm supa migration:up` to apply the latest schema.

## Next Steps

- Expand the `integration/` folder with workflow tests that span multiple routers (e.g., job creation → application → notification).
- Gradually replace placeholder fixtures with deterministic seed factories inside `shared/seeding.ts`.
- Hook this suite into CI (GitHub Actions) once local stability is confirmed.
