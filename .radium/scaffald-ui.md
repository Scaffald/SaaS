---
pillar: "@scaffald/ui"
status: active
last_verified: 2026-09-15
packages:
  - packages/ui/
key_files:
  - packages/ui/src/hooks/useResponsive.ts
  - packages/ui/src/theme/ThemeProvider.tsx
critical_constraints:
  - "Use colors.bg[theme].default NOT colors.background[theme].default"
  - "Use colors.text[theme].primary NOT colors.text.primary — always include [theme]"
  - "Use useResponsive from @scaffald/ui, NOT useWindowDimensions from react-native-web"
  - "Import ScrollView and View from react-native, not from the UI library"
---

# @scaffald/ui — UI Components & Tokens

## Color Token Structure

```
colors.{semantic}[theme].{variant}
```

| Semantic | Theme | Variants |
|----------|-------|----------|
| `bg` | `light` / `dark` | `default`, `subtle`, `muted`, `primary`, `info`, `success`, `error`, `inactive` |
| `text` | `light` / `dark` | `primary`, `secondary`, `tertiary`, `error`, `success`, `info`, `onPrimary` |
| `border` | `light` / `dark` | `default`, `subtle`, `error`, `info` |
| `fg` | `light` / `dark` | `default`, `subtle`, `muted` |
| `icon` | `light` / `dark` | `primary`, `secondary` |

### Usage
```typescript
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

const { theme } = useThemeContext()

colors.bg[theme].default       // ✅ background
colors.text[theme].primary     // ✅ text
colors.border[theme].default   // ✅ border
```

### Common Mistakes
```typescript
colors.background[theme].default  // ❌ 'background' doesn't exist — use 'bg'
colors.text.primary               // ❌ missing [theme] — use colors.text[theme].primary
colors.border.default             // ❌ missing [theme] — use colors.border[theme].default
```

## Spacing Tokens

**Valid indices only:** 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256, 384, 512, 768

```typescript
<Row gap={spacing[3]}>   // ❌ index 3 doesn't exist
<Row gap={12}>           // ✅ use literal value
<Row gap={spacing[4]}>   // ✅ valid index (resolves to 16)
```

## Type, Radius and Colour Literals — the Ratchet

`packages/scf-core/features` carries ~1,600 literal styling values. The tokens
landed in #621 and nothing held the line, so the counts went **up** through
three releases of reskinning. `scripts/lint/check-literal-ratchet.mjs` now pins
them per directory per pattern; the ceilings in
`scripts/lint/literal-baseline.json` may only come down.

**It runs in three places:** `pnpm lint:literals` (and as part of `pnpm lint`),
`pnpm prepush`, and the CI lint job. Lower a ceiling with
`pnpm lint:literals --update`; it refuses to raise one.

**Both syntaxes are counted** — `fontSize: 13` and `fontSize={13}`, `'#abc'` and
`"#abc"`. Counting one and not the other is a bypass, not a rule.

### The map

Measured on `main` at `1ca00321d`. Roughly half the sites are already on the
scale and need only the token name; the rest change the rendered value, so read
the row before applying it.

- **`borderRadius`** — 322 of 693 are already on scale (225 are literally `7`,
  63 are `4`). The off-scale remainder clusters on the pre-token radii: 129 are
  `16`, 122 are `12`, 59 are `8`. All three become `7`, so corners visibly
  tighten.
- **`fontSize`** — 203 of 637 are on scale (81 are `11`, 109 are `14`). The two
  biggest clusters are off it: 181 are `13` and 128 are `12`, and both become
  12.5. That half-pixel is deliberate, not a rounding slip — see the comment at
  the top of `tokens/typography.ts`.

The on-scale half is what makes a directory codemoddable (#820); the rest is a
per-site decision.

| `fontSize:` literal | Token | Resolves to |
|---|---|---|
| 10, 11 | `fontSize.xxs`, or `fontSize.h6` for an uppercase kicker | 11 |
| 12, 13 | `fontSize.xs` / `fontSize.sm` | 12.5 |
| 14, 15, 16 | `fontSize.md` (body), or `fontSize.h5` for a heading carried by weight | 14 |
| 17, 18 | `fontSize.lg`, or `fontSize.h4` | 17 |
| 20, 22, 24 | `fontSize.xl`, or `fontSize.h3` | 22 |
| 28, 30, 36 | `fontSize.h2` | 30 |
| 40, 42 | `fontSize.h1` — page titles only | 42 |

| `borderRadius:` literal | Token | Resolves to |
|---|---|---|
| 0 | `borderRadius.none` | 0 |
| 2, 3 | `borderRadius.xxs` | 2 |
| 4, 5, 6 | `borderRadius.xs` / `.s` / `.m` | 4 |
| 7 … 24 | `borderRadius.l` / `.xl` / `.xxl` / `.xxxl` / `.xxxxl` | 7 |
| 32, 40, 60, 70 | `borderRadius.xxxxl` — unless it is a native sheet, see below | 7 |
| 99, 999, 9999 | `borderRadius.max` | 999 |

The 34 px and larger radii in `borders.ts` are iOS 26 sheet/alert shapes, not
part of the interface scale. Never reach for them to round a card.

```typescript
fontSize: 13                      // ❌ counted by the ratchet
fontSize: fontSize.sm             // ✅
borderRadius={8}                  // ❌ counted, both syntaxes are
borderRadius={borderRadius.l}     // ✅
backgroundColor: '#1d7282'        // ❌ counted
backgroundColor: colors.bg[theme].subtle  // ✅
```

### Exceptions

A literal that is genuinely right gets pinned in the baseline's `pinned` map
with a reason — not a raised ceiling. There is one: `marketing/theme.ts`, a
deliberate palette the file itself explains is not the product's, carrying WCAG
contrast notes against each value.

Tests, stories and `__tests__` are not counted at all. A mock colour in a test
fixture is correct code and must not be able to block an unrelated PR.

## useResponsive Hook

Always use `useResponsive` from `@scaffald/ui` instead of `useWindowDimensions` from `react-native-web`.

**Why:** `useWindowDimensions` creates per-instance listeners. When many components mount (dashboard, drawer, layout), N simultaneous setState calls cascade into "Maximum update depth exceeded."

`useResponsive` uses `useSyncExternalStore` with a singleton store — one listener, shared state.

```typescript
// ❌ WRONG
import { useWindowDimensions } from 'react-native'
const { width } = useWindowDimensions()
const isDesktop = width >= 768

// ✅ CORRECT
import { useResponsive } from '@scaffald/ui'
const { isDesktop } = useResponsive()
```

## Primitives

Import `ScrollView`, `View`, and `Image` from `react-native`, not from the UI library.

```typescript
import { ScrollView, View, Image } from 'react-native'  // ✅
```
