<!-- Catalog of existing tRPC test infrastructure to inform the new Deno test suite -->

## Existing test helpers in `packages/supabase/functions/trpc/__tests__/`

- `setup.ts`: Supabase client factories, auth token acquisition, cached token management, Mailpit helpers, and HTTP wrappers (`callTRPCEndpoint`).
- `test-context.ts`: Lazy-loading cached tokens into per-role Supabase clients (`anon`, `user`, `admin`) with expiration checks.
- `fixtures/tokens.json`: Cached regular and admin auth tokens written by the auth test suite.
- `run-tests.sh`: Ordered execution helper that seeds tokens before dependent suites run.
- Integration suites (e.g., `integration/applications.test.ts`) illustrate full workflow coverage patterns that we can reference when composing baseline router tests.

## Configuration references

- `packages/supabase/functions/trpc/deno.json`: Points to `import_map.json` for esm.sh module resolution.
- `packages/supabase/functions/trpc/import_map.json`: Registers `@supabase/supabase-js`, `@trpc/server`, `zod`, `jose`, and `pdf-lib` for existing function code and tests.

## Observations for the new shared test workspace

1. Reuse the Supabase client/token helpers rather than reimplementing them; extract them into `packages/supabase/tests/shared/` for cross-router coverage.
2. Mirror the import map entries needed for tests so Deno resolves shared dependencies consistently outside the functions directory.
3. Maintain fixtures under `packages/supabase/tests/fixtures/` with an eye toward token caching and deterministic seed data.
4. Provide a top-level runner (shell script or deno.json task) to orchestrate auth setup before dependent suites.

## Target layout (initial scaffold created)

```
packages/supabase/tests/
├── deno.json            # Suite-level config (to be finalized)
├── import_map.json      # Mirrors required module aliases
├── fixtures/            # Cached tokens, reusable seed payloads
├── integration/         # Cross-router workflow suites
├── routers/             # One file per router baseline tests
└── shared/              # Common helpers (auth, context, seeding)
```
