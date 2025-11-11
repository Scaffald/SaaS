# Test Patterns

We are standardising on a small set of patterns to keep the new Vitest suites consistent and easy to review. This reference highlights the approaches already in use across the repository and the helpers available in `test/setup.ts`.

## General Guidelines

- Follow Arrange → Act → Assert structure and keep expectations focused on one behaviour at a time.
- Prefer user-facing interactions (`screen.getByRole`, `fireEvent.press`) over implementation details.
- Reset side-effects in `afterEach` when using fake timers or global mocks. The shared setup file already invokes `cleanup`, clears mocks, and restores timers; add extra teardown only when a suite opts into global state.

## Utilities (`packages/core/utils`)

Use plain Vitest assertions and cover both happy paths and edge cases. Reference implementation: `packages/core/utils/__tests__/slugify.test.ts`.

```ts
import { describe, expect, it } from 'vitest'
import { slugify } from '../slugify'

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('New Role')).toBe('new-role')
  })

  it('strips unsafe characters', () => {
    expect(slugify('Manager & Co.')).toBe('manager-co')
  })
})
```

Key reminders:

- When a helper throws, assert on the error message: `await expect(fn).rejects.toThrowError(/message/)`.
- Time-sensitive utilities should use `vi.useFakeTimers()` inside the individual test (and rely on the shared teardown to reset).

## React & Tamagui Components (`packages/ui`)

Render via Testing Library and assert on what a user sees. The image picker helper suites under `packages/ui/src/components/image-picker/__tests__/` demonstrate lightweight mocks combined with query-based assertions.

```ts
import { render, screen } from '@testing-library/react'
import { Button } from '../../buttons/Button'

it('handles loading state', () => {
  render(<Button loading text="Upload" />)
  expect(screen.getByRole('button', { name: 'Upload' })).toHaveAttribute('aria-busy', 'true')
})
```

Guidelines:

- Use Tamagui shorthand props in fixtures to mirror production usage.
- Mock external APIs (Mapbox, Supabase Storage, clipboard) with `vi.mock` at the top of the file; co-locate custom mocks under a sibling `__mocks__` directory.
- For cross-platform components, assert the same interface using the `react-native` aliases defined in `test/setup.ts` (they render to simple DOM nodes in Vitest).

## React Native Hooks & Screens (`apps/expo`, `packages/core/features`)

Hooks like `useProtectedRoute` already use React Native Testing Library via the alias set up in `test/mocks/testing-library-react-native.ts`. When testing navigation hooks or Expo modules:

- Mock `expo-router` or `expo-modules-core` inside the suite for per-test behaviour.
- Use `renderHook` from Testing Library to inspect hook return values without DOM boilerplate.
- Advance timers manually when hooks depend on `setTimeout`, e.g. the pending session timeout in `useProtectedRoute`.

## Schema Validation (`packages/schemas`)

The Zod schema suites (`packages/schemas/src/__tests__/general-profile-schema.test.ts`) take the following form:

```ts
import { describe, expect, it } from 'vitest'
import { generalProfileSchema } from '../profile/general'

describe('generalProfileSchema', () => {
  it('accepts valid payloads', () => {
    expect(() =>
      generalProfileSchema.parse({ fullName: 'Test Member', email: 'valid@example.com' }),
    ).not.toThrow()
  })

  it('rejects empty names', () => {
    expect(() => generalProfileSchema.parse({ fullName: '', email: 'a@b.com' })).toThrowError(
      /fullName/,
    )
  })
})
```

Maintain full coverage of success and failure paths, and assert on specific error messages so changes to the schema surface breaking differences.

## Supabase & tRPC Integration

Keep Deno-based suites inside `packages/supabase/functions/trpc/__tests__/` and run them through the `run-tests.sh` harness. Integration tests should:

- Use the cached tokens generated during the authentication step.
- Reset the database (or relevant tables) via the helpers in `test/helpers/database.ts` before mutating state.
- Wrap network expectations with retries or soft assertions when local services may be missing (for example, the O*NET fallback that queries `onet.occupation_data` when the RPC is unavailable).

For Vitest-based database tests, import `createServiceRoleClient` and guard the test with `skipIf(!process.env.SUPABASE_SERVICE_ROLE_KEY)` if elevated credentials are optional.

## Snapshot Usage

Snapshots can be useful for large menu structures, but keep them rare:

- Co-locate snapshot files next to the test (`Component.test.tsx.snap`).
- Use `expect(tree).toMatchInlineSnapshot()` for small fragments (under ~10 lines).
- Always pair snapshots with behavioural assertions so failures are meaningful.

Sticking to these patterns makes it easier for reviewers to navigate new suites and for future contributors to extend coverage without reinventing the approach each time.


