# Imports and Exports

This package supports both a single main entry and **subpath exports** for better tree-shaking and smaller bundles.

## Main entry

Import most components, hooks, and tokens from the main entry:

```typescript
import { Button, Stack, useResponsive, colors } from '@unicornlove/beyond-ui'
```

This is the default and works for most apps. The build output is optimized (e.g. ESM + CJS, `sideEffects: false`).

## Subpath exports

Use subpath imports when you only need a subset of the package. That can reduce bundle size by allowing the bundler to omit unused code.

### Tokens only

If you only need design tokens (e.g. in a shared config or build step):

```typescript
import { colors, spacing, typography } from '@unicornlove/beyond-ui/tokens'
```

## Available subpaths

| Subpath | Contents |
|--------|----------|
| `@unicornlove/beyond-ui` | Full library (components, hooks, tokens, animation, a11y, etc.) |
| `@unicornlove/beyond-ui/tokens` | Design tokens (colors, spacing, typography, borders, shadows, breakpoints, etc.) |

## Adding new subpaths

New subpaths require:

1. A dedicated entry in `package.json` `exports` (and corresponding build output from `tsup`/build config).
2. An update to this doc and to [CONTRIBUTING.md](../CONTRIBUTING.md) if the pattern for adding subpaths is documented there.

Keeping the main entry as the default ensures existing imports keep working; subpaths are optional for apps that want finer-grained imports.
