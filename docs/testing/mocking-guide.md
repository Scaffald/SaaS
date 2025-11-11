# Mocking Guide

Vitest ships with first-class mocking utilities (`vi.mock`, `vi.fn`, `vi.spyOn`). This guide captures the patterns that already work in the SCF-Neue monorepo so we get predictable behaviour across packages.

## Global Mocks

`test/setup.ts` configures the following once for every suite:

- Replaces `react-native` primitives with DOM-backed shims (`View` → `<div>`, `Text` → `<span>`) so React Native components render under jsdom.
- Mocks `expo-modules-core` to return inert module stubs, preventing missing native module errors.
- Calls `cleanup` after each test and clears/restores Vitest mocks.
- Defines `process.env.EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` defaults so Supabase clients initialise cleanly.

Avoid re-declaring these mocks in individual tests. If a suite needs different behaviour, override it with `vi.doMock` or `vi.mock` inside the file.

## Component-Level Mocks

Use `vi.mock` at the top of a test file when you need consistent replacements:

```ts
vi.mock('@app/core/utils/logger', () => ({
  logEvent: vi.fn(),
}))
```

When mocks get more complex, create a sibling `__mocks__` directory and leverage Vitest's automock resolution:

```
packages/core/features/profile/__tests__/__mocks__/expo-router.ts
```

Vitest automatically picks up these files when you call `vi.mock('expo-router')`.

## Supabase Helpers

The new utilities in `test/helpers/database.ts` expose `createTestClient`, `createServiceRoleClient`, `setupTestDatabase`, and `teardownTestDatabase`. They dynamically import `@supabase/supabase-js`, set non-persistent auth, and gracefully skip reset/seed/cleanup when service-role credentials are unavailable. Use them instead of inlining Supabase client creation logic, e.g.:

```ts
import { beforeAll, afterAll, expect, it } from 'vitest'
import { createServiceRoleClient, setupTestDatabase } from '../../../test/helpers/database'

let client: Awaited<ReturnType<typeof createServiceRoleClient>>

beforeAll(async () => {
  await setupTestDatabase()
  client = await createServiceRoleClient()
})

it('reads seeded rows', async () => {
  const { data, error } = await client.from('profiles').select('*')
  expect(error).toBeNull()
  expect(data).toHaveLength(1)
})
```

Clients cache internally, so multiple calls during a run reuse the same instance.

## Network & Browser APIs

- **fetch**: Vitest polyfills `fetch` in Node 22. For deterministic responses, use `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(...))` or adopt [MSW](https://mswjs.io/) when you need request-level assertions.
- **Clipboard, Linking, Device APIs**: Mock the Expo module via `vi.mock('expo-clipboard', () => ({ getStringAsync: vi.fn() }))`.
- **Navigation**: Use `vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))` or create dedicated helper mocks for complex flows.

## Timers & Dates

When testing code that relies on timers or `Date.now()`:

```ts
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

The shared teardown already restores timers, but pairing calls inside the suite makes intent explicit.

## Debugging Mocks

- Call `vi.mocked(originalFn)` to access typed mock helpers on imported functions.
- Use `console.warn` inside your mock implementation for temporary visibility; remove the logging before committing.
- If a module should fall back to the real implementation in some tests, call `vi.importActual` within the mock factory.

With these patterns in place, we can mock confidently without leaking state between suites or duplicating work.


