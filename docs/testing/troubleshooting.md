# Troubleshooting

Common hiccups when running the Vitest and Supabase suites, plus the fixes that worked during REQ-172.

## Vitest Cannot Open Modules (`EPERM: operation not permitted`)

When running inside restricted environments (e.g. remote sandboxes) Node may not have permission to read `node_modules`. Re-run the command with elevated permissions or outside the sandbox. Locally this error usually means the repo is on a read-only volume.

## Supabase Integration Tests Fail with `TRPC response should include data`

The O*NET integration relies on the `onet.search_occupations` RPC. If your local database lacks the function, the test exits early with a warning and the assertion fails. Options:

1. Run `pnpm supa seed:onet` to populate the O*NET tables and functions.
2. Set `ONET_BASE_URL` to point at a reachable upstream service.
3. When working on unrelated features, skip the step by running the Vitest suites only: `pnpm test:unit`.

A follow-up task will harden the fallback path to query `onet.occupation_data` automatically.

## Missing Supabase Service Role Key

The helpers in `test/helpers/database.ts` require a service-role key to reset or seed data. Without it you will see a warning:  
`Skipping Supabase reset step for tests because no service role key is configured.`  
Add `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_TEST_SERVICE_ROLE_KEY`) to your shell environment, or set `shouldReset: false` when calling `setupTestDatabase`.

## Expo Module Errors in Tests

If you see messages like `Cannot find module expo-constants`, ensure:

- You are importing from the Expo package name (`expo-constants`, `expo-linking`) rather than a relative path.
- The module is listed in `test/mocks/` if it requires custom behaviour.
- You are running tests through Vitest (`pnpm test:unit`), which applies the shared setup mocks.

## Coverage Threshold Failures

The root configuration enforces 50% line/function/branch/statement coverage. When adding new packages or large components:

- Start by tagging TODO tests or `test.skip` to land scaffolding, then follow up to raise coverage.
- Check `coverage/index.html` for gaps. Files under `packages/ui` and `packages/core/features` typically benefit from enumerating user interactions rather than simple render assertions.

## EADDRINUSE / Port Conflicts

When the Supabase test runner reports `EADDRINUSE`, verify a previous `pnpm supa start` process shut down cleanly. Use `pnpm supa stop` or `pkill -f supabase` then rerun the test command.

## React Native Event Warnings

If a React Native suite warns about missing gesture handlers or native modules, check that you are importing the component under test from the correct wrapper. Many Expo screens re-export modules from `packages/core`; make sure the test file matches the production entry point so the shared mocks apply.

Keeping these fixes in mind should get most local runs back on track quickly. Update this document whenever new edge cases surface so future contributors waste less time debugging the same issues.


