---
sidebar_position: 1
---

# Design Tokens Overview

Scaffald UI uses design tokens for consistent styling across all components. Tokens are the building blocks of the design system.

## What are Design Tokens?

Design tokens are named variables that store visual design attributes. They provide a single source of truth for colors, spacing, typography, and other design decisions.

### Benefits

- **Consistency** - Same values used everywhere
- **Maintainability** - Change once, update everywhere
- **Themability** - Easy light/dark mode switching
- **Scalability** - Add new variants without breaking existing code

## Token Categories

### Colors

Semantic color tokens that adapt to light/dark themes:

```tsx
import { colors, useThemeContext } from '@scaffald/ui';

const { theme } = useThemeContext();

colors.bg[theme].default      // Background colors
colors.text[theme].primary    // Text colors
colors.border[theme].default  // Border colors
```

[Learn more about Colors →](./colors)

### Spacing

Consistent spacing scale for margins, padding, and gaps:

```tsx
import { spacing } from '@scaffald/ui';

spacing[0]  // 0px
spacing[1]  // 4px
spacing[2]  // 8px
spacing[4]  // 16px
spacing[6]  // 24px
spacing[8]  // 32px
```

[Learn more about Spacing →](./spacing)

### Typography

Text styles for all content:

```tsx
import { typography } from '@scaffald/ui';

typography.h1      // Heading 1
typography.body    // Body text
typography.caption // Small text
```

[Learn more about Typography →](./typography)

### Shadows

Elevation and depth:

```tsx
import { shadows } from '@scaffald/ui';

shadows.sm  // Small shadow
shadows.md  // Medium shadow
shadows.lg  // Large shadow
```

[Learn more about Shadows →](./shadows)

## Using Tokens

### In Components

```tsx
import { Stack, spacing, colors, useThemeContext } from '@scaffald/ui';

function MyComponent() {
  const { theme } = useThemeContext();

  return (
    <Stack
      gap={spacing[4]}
      padding={spacing[6]}
      style={{
        backgroundColor: colors.bg[theme].default,
        borderColor: colors.border[theme].default,
        borderWidth: 1,
        borderRadius: 8,
      }}
    >
      {/* Content */}
    </Stack>
  );
}
```

### In StyleSheets

```tsx
import { StyleSheet } from 'react-native';
import { spacing, typography } from '@scaffald/ui';

const styles = StyleSheet.create({
  container: {
    padding: spacing[6],
    gap: spacing[4],
  },
  title: {
    ...typography.h2,
  },
});
```

## Token Structure

All tokens follow a predictable structure:

```typescript
// Colors
colors.{semantic}.{theme}.{variant}

// Typography
typography.{variant}

// Spacing
spacing[{scale}]

// Shadows
shadows.{size}
```

## Available Tokens

### Color Semantics

- `bg` - Backgrounds
- `text` - Text colors
- `border` - Borders and dividers
- `fg` - Foregrounds (buttons, icons)
- `icon` - Icon colors

### Typography Variants

- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Body: `body`, `bodyLarge`, `bodySmall`
- UI: `label`, `caption`

### Spacing Scale

- `0` through `16` (0px to 64px)
- Follows 4px base unit

### Shadow Sizes

- `sm`, `md`, `lg`, `xl`, `2xl`

## Extending Tokens

You can extend the default tokens for custom needs:

```tsx
import { spacing, colors } from '@scaffald/ui';

// Add custom spacing
const customSpacing = {
  ...spacing,
  xxl: 128,
};

// Add custom colors (maintain theme structure)
const customColors = {
  ...colors,
  brand: {
    light: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
    },
    dark: {
      primary: '#FF8787',
      secondary: '#5FE3D8',
    },
  },
};
```

## Best Practices

1. **Always use tokens** - Never hardcode values
2. **Semantic naming** - Use `colors.bg[theme].primary` not `colors.red`
3. **Consistent scale** - Stick to the spacing scale (multiples of 4)
4. **Theme-aware** - Always access colors through theme context
5. **Type-safe** - TypeScript will catch invalid token references

## Token Reference

For complete token values and usage examples:

- **[Colors Reference](./colors)** - All color tokens
- **[Spacing Reference](./spacing)** - Spacing scale
- **[Typography Reference](./typography)** - Text styles
- **[Shadows Reference](./shadows)** - Shadow values

## Migration from Hardcoded Values

If you're migrating from hardcoded values:

```tsx
// ❌ Before - Hardcoded
<View style={{ padding: 24, backgroundColor: '#FFFFFF' }}>

// ✅ After - Using tokens
<View style={{
  padding: spacing[6],
  backgroundColor: colors.bg[theme].default
}}>
```

## Token Updates

Tokens are versioned with the package. Check the [changelog](https://github.com/Scaffald/ui/releases) for token updates in new releases.

## Next Steps

- Explore [Color Tokens](./colors)
- Learn about [Typography](./typography)
- See [Component Examples](../examples/forms)
- Read [Theming Guide](../guide/theming)
