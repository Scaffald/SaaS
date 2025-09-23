# @app/ui

This package contains the shared UI kit that powers the Scaffald web and native surfaces. Components are built on top of [Tamagui](https://tamagui.dev/) and often integrate with form utilities such as `@ts-react/form` and `react-hook-form`.

## Running tests

The component suite is covered by [Vitest](https://vitest.dev/) using a JSDOM environment. From the repository root run:

```bash
yarn workspace @app/ui test
```

A watch mode is also available via `yarn workspace @app/ui test:watch`.

## Testing utilities

Tamagui components expect to be rendered inside a `TamaguiProvider`. The test environment wires this up automatically:

- `vitest.setup.ts` registers JSDOM helpers, Tamagui environment variables, and adds the Jest DOM assertions.
- `test/test-utils.tsx` wraps React Testing Library's `render` helper with a `TamaguiProvider` + `Theme` so components receive tokens and theming without needing to duplicate setup in every test.

When testing form fields that rely on `@ts-react/form` you can mock `useTsController`/`useFieldInfo` to provide deterministic controller state. Composite inputs such as the date, image, and address fields are exercised through lightweight mocks that surface the same callbacks as the production implementations, allowing interaction tests to verify the integration points without depending on browser APIs like `react-dropzone`.
