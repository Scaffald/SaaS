# Contributing to Beyond-UI

Thank you for your interest in contributing to **@scaffald/ui**. This document covers how to set up the repo, our standards, and how to submit changes.

## Development setup

- **Package manager**: Use **pnpm** (this repo is a pnpm workspace).
- **Install**: From the monorepo root, run `pnpm install`.
- **Build**: `pnpm nx run beyond-ui:build`
- **Lint**: `pnpm nx run beyond-ui:lint`
- **Type check**: `pnpm nx run beyond-ui:typecheck`
- **Tests**: `pnpm nx run beyond-ui:test`
- **Storybook**: Run from the monorepo according to workspace scripts (e.g. storybook for the design system).

## Code standards

### Design tokens

- **Use tokens for all visual values.** Colors, spacing, typography, borders, and shadows must come from `src/tokens/` (see [ARCHITECTURE.md](./ARCHITECTURE.md) and [STYLING_GUIDE.md](./STYLING_GUIDE.md)).
- Do not add hardcoded hex colors or magic numbers; add or reuse tokens instead.

### React and TypeScript

- **Use named imports from React** (e.g. `import { useState, useEffect } from 'react'` and `import type { FC, ReactNode } from 'react'`). Avoid default `import React from 'react'` for function/type usage.
- **Do not use `@ts-ignore`, `@ts-expect-error`, or `// biome-ignore`** to silence errors. Fix the underlying type or lint issue instead.

### Component structure

- Follow the existing pattern per component folder:
  - `ComponentName.tsx` – main component
  - `ComponentName.types.ts` – public types
  - `ComponentName.styles.ts` – style factory (if needed)
  - `index.ts` – public exports only
- New components must be exported from `src/index.ts` (and from the component’s `index.ts`).

### Dependencies

- Keep the library **minimal-dependency**. Prefer React Native primitives and the existing token/system APIs.
- Heavy or optional features (e.g. map libs, rich text, DnD) should be **optional or peer dependencies**, with adapter/pluggable APIs where possible.

## Testing

- Use **Vitest** for unit tests. Place tests next to the code (e.g. `ComponentName.test.tsx`) or in `__tests__` as per existing convention.
- **Do not mock internal systems** (e.g. our own API or database). Mock only external third-party services when necessary.
- Ensure new or touched code is covered and that `pnpm nx run beyond-ui:test` passes.

## Submitting changes

1. Create a branch from the default branch.
2. Make your changes, ensuring lint and typecheck pass:  
   `pnpm nx run beyond-ui:lint` and `pnpm nx run beyond-ui:typecheck`.
3. Add or update tests as needed and run `pnpm nx run beyond-ui:test`.
4. Update documentation (ARCHITECTURE.md, README, or component docs) if you change behavior or add features.
5. Open a pull request with a clear description of the change and reference any related issues.

## Docs and architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** – Design principles, package structure, styling, tokens, accessibility.
- **[STYLING_GUIDE.md](./STYLING_GUIDE.md)** – How to use tokens and style factories.
- **[docs/API_CONVENTIONS.md](./docs/API_CONVENTIONS.md)** – Prop naming and API consistency.
- Migrating from the legacy UI package: see docs and ARCHITECTURE for tokens and component mapping.

If you have questions, open an issue or reach out to the maintainers.
