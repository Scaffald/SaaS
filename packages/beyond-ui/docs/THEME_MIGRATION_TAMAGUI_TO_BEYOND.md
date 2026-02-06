# Theme Migration: Tamagui Tokens → Beyond-UI Tokens

This guide helps you move from **Tamagui theme tokens** (e.g. `$color1`, `$teal8`, `background="$gray2"`) to **Beyond-UI design tokens** (plain objects: `colors.primary[500]`, `spacing[4]`). Beyond-UI does not use a theme compiler; you import tokens and pass them to styles.

## Key differences

| Tamagui (packages/ui) | Beyond-UI |
|-----------------------|-----------|
| Theme built with `@tamagui/theme-builder`; tokens resolved at runtime via theme context | Tokens are plain JS/TS objects; no theme context required for tokens |
| Props use `$` prefix: `color="$teal9"`, `backgroundColor="$gray2"` | Use token objects in style: `color: colors.primary[600]`, `backgroundColor: colors.gray[100]` |
| Light/dark via Tamagui theme name (e.g. `light`, `dark`) | Use `colors.text.light.primary` vs `colors.text.dark.primary`, or your own theme mode switch |
| Spacing: `$2`, `$4`, `gap="$4"` | `spacing[2]`, `spacing[4]`, `gap: spacing[4]` |

## Token mapping (conceptual)

Tamagui’s scaffald-theme uses **HSL scales** (teal, gray, blue, green, yellow, red, etc.) with steps 1–12. Beyond-UI uses **numeric scales** (50–900) and **semantic** tokens. Approximate mapping:

### Colors

- **Tamagui** `$teal8` (primary brand) → **Beyond** `colors.primary[500]` or `colors.primary[600]` (Figma Primary Brand).
- **Tamagui** `$gray1`–`$gray12` → **Beyond** `colors.gray[50]`–`colors.gray[900]` (Figma Base scale).
- **Tamagui** `$blue9`, `$green9`, `$red9`, etc. → **Beyond** `colors.blue`, `colors.green`, `colors.error` (or equivalent semantic) in the same scale pattern.

Use **Beyond** `colors.text.light.primary`, `colors.bg.light.default`, `colors.border.light.default` (and `.dark.*`) for semantic roles instead of raw scale names where possible.

### Spacing

- **Tamagui** `$1`–`$12` (and named like `$space.md`) → **Beyond** `spacing[1]`–`spacing[12]` and `namedSpacing`, `padding`, `gap` from `@unicornlove/beyond-ui/tokens`.

### Typography

- **Tamagui** `$fontSize`, `$fontWeight`, etc. → **Beyond** `typography`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` from tokens.

### Borders and shadows

- **Tamagui** `$radius`, `$borderWidth` → **Beyond** `borderRadius`, `radius`, `borderWidth`, `borders` from tokens.
- **Tamagui** shadow tokens → **Beyond** `shadows`, `boxShadows`, `elevation`.

## Before / after examples

### Button background and text

**Before (Tamagui):**
```tsx
<Button backgroundColor="$teal8" color="$teal12" />
```

**After (Beyond-UI):**
```tsx
import { Button } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

<Button
  style={{ backgroundColor: colors.primary[500], color: colors.gray[50] }}
/>
```
(Prefer the Button’s built-in variants so you rarely set raw colors.)

### Card with padding and border

**Before (Tamagui):**
```tsx
<YStack padding="$4" borderColor="$gray6" borderRadius="$4" />
```

**After (Beyond-UI):**
```tsx
import { Stack } from '@unicornlove/beyond-ui'
import { spacing, colors, borderRadius } from '@unicornlove/beyond-ui/tokens'

<Stack
  style={{
    padding: spacing[4],
    borderColor: colors.border.light.default,
    borderRadius: borderRadius.md,
  }}
/>
```

### Text color (semantic)

**Before (Tamagui):**
```tsx
<Text color="$gray12" />
```

**After (Beyond-UI):**
```tsx
import { Text } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

<Text style={{ color: colors.text.light.primary }} />
// or dark: colors.text.dark.primary
```

## Light / dark mode

- **Tamagui**: Switch theme (e.g. `ThemeProvider` with `defaultTheme="dark"`); tokens resolve per theme.
- **Beyond-UI**: No built-in theme context for tokens. Options:
  1. Use semantic tokens that have `.light` and `.dark` (e.g. `colors.text.light.primary` vs `colors.text.dark.primary`) and switch in your app (e.g. context or config).
  2. Use Beyond-UI’s `ThemeProvider` / `useThemeContext` if your app already uses it for mode; then pass the right token object into styles based on mode.

## Where to import tokens

- **Main entry:** `import { colors, spacing } from '@unicornlove/beyond-ui'`
- **Subpath (smaller bundle):** `import { colors, spacing } from '@unicornlove/beyond-ui/tokens'`

See [IMPORTS_AND_EXPORTS.md](./IMPORTS_AND_EXPORTS.md) for all subpaths.

## Further reading

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Token system and style factories.
- [STYLING_GUIDE.md](../STYLING_GUIDE.md) – How to use tokens in components.
- [MIGRATION.md](../MIGRATION.md) – General migration from @unicornlove/ui to beyond-ui.
