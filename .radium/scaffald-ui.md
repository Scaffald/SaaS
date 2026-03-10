---
pillar: "@scaffald/ui"
status: active
last_verified: 2026-03-10
packages:
  - packages/scaffald-ui/
key_files:
  - packages/scaffald-ui/src/hooks/useResponsive.ts
  - packages/scaffald-ui/src/theme/ThemeProvider.tsx
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
import { useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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

## Tamagui → Beyond-UI Token Mapping

| Tamagui | Beyond-UI |
|---------|-----------|
| `$background` | `colors.bg[theme].default` |
| `$borderColor` | `colors.border[theme].default` |
| `$color1` | `colors.text[theme].onPrimary` |
| `$color2` | `colors.bg[theme].subtle` |
| `$color3` | `colors.bg[theme].muted` |
| `$color5` | `colors.bg[theme].inactive` |
| `$color7` | `colors.border[theme].subtle` |
| `$color10` | `colors.text[theme].tertiary` |
| `$color11` | `colors.text[theme].secondary` |
| `$color12` | `colors.text[theme].primary` |
| `$red9` | `colors.bg[theme].error` |
| `$red10` / `$red11` | `colors.text[theme].error` |
| `$blue9` | `colors.bg[theme].primary` |
| `$blue10` | `colors.text[theme].info` |
| `$green9` | `colors.bg[theme].success` |
| `$green10` | `colors.text[theme].success` |

## Spacing Tokens

**Valid indices only:** 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256, 384, 512, 768

```typescript
<Row gap={spacing[3]}>   // ❌ index 3 doesn't exist
<Row gap={12}>           // ✅ use literal value
<Row gap={spacing[4]}>   // ✅ valid index (resolves to 16)
```

## Component API Mapping

| Tamagui | Beyond-UI |
|---------|-----------|
| `YStack` | `Stack` |
| `XStack` | `Row` |
| `SizableText` | `Text` with `size` prop |
| `<Button.Text>` | Direct children in `Button` |
| `CustomCheckbox` + `onCheckedChange` | `Checkbox` + `onChange` |
| `ToggleSwitch` | `Toggle` + `onChange` |
| `size="$3"` / `size="$4"` | `size="sm"` / `size="md"` / `size="lg"` |
| `variant="primary"` | `variant="filled"` + `color="primary"` |
| `variant="outlined"` | `variant="outline"` |

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
