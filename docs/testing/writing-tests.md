# Writing Tests

This guide records the conventions we are adopting while bootstrapping the Vitest suite for REQ-172.

## Tooling

* **Test runner**: Vitest (mirrors the Jest API).
* **React components**: `@testing-library/react` for web, `@testing-library/react-native` (with lightweight `react-native` mocks) for Expo.
* **Schemas**: `zod` schemas should be validated with unit tests that call `schema.parse(...)` on success paths and assert on the thrown `ZodError` messages for error paths.

## File Placement & Naming

| Area                        | Location Example                                                       |
|-----------------------------|------------------------------------------------------------------------|
| Core utilities              | `packages/core/utils/__tests__/slugify.test.ts`                        |
| Schema validation           | `packages/schemas/src/__tests__/general-profile-schema.test.ts`        |
| Expo screens/components     | `apps/expo/app/<feature>/__tests__/<Component>.test.tsx`               |
| Shared UI components        | `packages/ui/src/components/<feature>/__tests__/<Component>.test.tsx`  |

Use `.test.ts` or `.test.tsx` suffixes; Vitest picks these up automatically.

## Testing Patterns

### Zod Schemas

```ts
import { describe, expect, it } from 'vitest'
import { exampleSchema } from '../example'

describe('exampleSchema', () => {
  it('accepts valid payloads', () => {
    expect(() => exampleSchema.parse({ name: 'Valid' })).not.toThrow()
  })

  it('surfaces validation errors', () => {
    expect(() => exampleSchema.parse({ name: '' })).toThrowError(/name is required/)
  })
})
```

### Utilities

Keep tests descriptive and focus on edge cases. See [`slugify.test.ts`](../../packages/core/utils/__tests__/slugify.test.ts) for a fresh example that exercises primary helpers and their error paths.

### React / Expo Components

* Render with the relevant Testing Library helper (`render` or `renderHook`).
* Prefer user-centric assertions (`screen.getByRole`, `fireEvent.press`, etc.).
* When mocking shared modules, use `vi.mock` in the test file. For global React Native primitives (View, Text, etc.) rely on the synthetic mock in `test/setup.ts` rather than inlining custom stubs.

### Asynchronous Behaviour

* Use `await screen.findByText(...)` or `waitFor(...)` for async expectations.
* Clean up fake timers by calling `vi.clearAllMocks()` and `vi.useRealTimers()` in `afterEach` when tests opt into `vi.useFakeTimers()`.

## Linting & Type Safety

* Keep assertions strongly typed; avoid `any` in test helpers.
* If a module ships without TypeScript definitions, add ambient module declarations under `types/custom-modules.d.ts`.
* Run `pnpm lint` and `pnpm typecheck` before submitting test-heavy PRs to ensure utilities exported from the new suites do not break consumers.

