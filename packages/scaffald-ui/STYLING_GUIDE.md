# Beyond-UI Styling Guide

This guide covers styling patterns, best practices, and conventions for the Beyond-UI design system.

---

## Table of Contents

- [Style Factory Pattern](#style-factory-pattern)
- [Design Tokens](#design-tokens)
- [Theme Integration](#theme-integration)
- [Component Styling](#component-styling)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)
- [Migration Examples](#migration-examples)

---

## Style Factory Pattern

The **style factory pattern** is the standard way to create styles in Beyond-UI. It replaces StyleSheet.create() with pure functions that generate styles dynamically.

### Basic Structure

```typescript
// Component.styles.ts
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'

export interface ComponentStyleConfig {
  container: ViewStyle
  content: TextStyle
}

export function getComponentStyles(
  variant: Variant,
  size: Size,
  theme: ThemeMode
): ComponentStyleConfig {
  const container: ViewStyle = {
    padding: spacing[16],
    backgroundColor: colors.bg[theme].default,
  }

  const content: TextStyle = {
    fontSize: typography.body.fontSize,
    color: colors.text[theme].primary,
  }

  return {
    container,
    content,
  }
}
```

### Using the Factory

```typescript
// Component.tsx
import { getComponentStyles } from './Component.styles'
import { useThemeContext } from '../../theme'

export function Component({ variant, size }: ComponentProps) {
  const { theme } = useThemeContext()
  const styles = getComponentStyles(variant, size, theme)

  return (
    <View style={styles.container}>
      <Text style={styles.content}>Content</Text>
    </View>
  )
}
```

### Why Style Factories?

✅ **Dynamic styling** - Adapts to props and theme
✅ **Type safety** - Explicit return types
✅ **Performance** - No StyleSheet overhead
✅ **Testability** - Pure functions
✅ **Consistency** - Single pattern everywhere

---

## Design Tokens

### Token Categories

#### 1. Colors

```typescript
// Primary colors
colors.primary[500]     // #ff6633
colors.primary[400]     // Lighter
colors.primary[600]     // Darker

// Neutral colors
colors.gray[50]         // Lightest
colors.gray[900]        // Darkest

// Semantic colors
colors.error[500]       // #e53e3e
colors.success[500]     // #38a169
colors.warning[500]     // #dd6b20
colors.info[500]        // #3182ce

// Theme-aware colors
colors.text.light.primary        // Light theme text
colors.text.dark.primary         // Dark theme text
colors.bg[theme].default         // Dynamic background
colors.border[theme].default     // Dynamic border
colors.icon[theme].default       // Dynamic icon
```

#### 2. Spacing

```typescript
spacing[0]    // 0px
spacing[2]    // 2px
spacing[4]    // 4px
spacing[6]    // 6px
spacing[8]    // 8px
spacing[10]   // 10px
spacing[12]   // 12px
spacing[16]   // 16px
spacing[20]   // 20px
spacing[24]   // 24px
spacing[32]   // 32px
spacing[40]   // 40px
spacing[48]   // 48px
spacing[64]   // 64px
spacing[96]   // 96px
```

#### 3. Typography

```typescript
// Headings
typography.h1           // 48px, bold
typography.h2           // 36px, bold
typography.h3           // 24px, semibold
typography.h4           // 20px, semibold

// Body text
typography.body         // 16px, regular
typography.bodyMedium   // 16px, medium
typography.small        // 14px, regular

// Each includes: fontSize, fontWeight, lineHeight, letterSpacing, fontFamily
```

#### 4. Borders

```typescript
// Border radius
borderRadius.xxs    // 2px
borderRadius.xs     // 4px
borderRadius.s      // 6px
borderRadius.m      // 12px
borderRadius.l      // 16px
borderRadius.xl     // 24px
borderRadius.max    // 9999px (pill shape)

// Border width
borderWidth.thin      // 1px
borderWidth.medium    // 2px
borderWidth.thick     // 4px
```

#### 5. Shadows

```typescript
// React Native shadows (object)
shadows.xs          // Extra small
shadows.s           // Small
shadows.m           // Medium
shadows.l           // Large
shadows.xl          // Extra large
shadows.button      // Button shadow
shadows.tabs        // Tabs shadow

// Web-only box shadows (string)
boxShadows.xs       // CSS box-shadow string
boxShadows.button   // CSS box-shadow string
boxShadows.focusPrimary  // Focus ring effect
```

### Token Usage Rules

**DO:**
```typescript
// ✅ Always use tokens
const styles = {
  padding: spacing[16],
  fontSize: typography.body.fontSize,
  color: colors.text[theme].primary,
  borderRadius: borderRadius.m,
  gap: spacing[12],
}
```

**DON'T:**
```typescript
// ❌ Never hardcode values
const styles = {
  padding: 16,            // ❌ Use spacing[16]
  fontSize: 16,           // ❌ Use typography.body.fontSize
  color: '#333',          // ❌ Use colors.text[theme].primary
  borderRadius: 12,       // ❌ Use borderRadius.m
  gap: 12,                // ❌ Use spacing[12]
}
```

---

## Theme Integration

### Theme-Aware Colors

```typescript
// Get theme from context
const { theme } = useThemeContext()

// Use theme-aware colors
const backgroundColor = colors.bg[theme].default
const textColor = colors.text[theme].primary
const borderColor = colors.border[theme].default
const iconColor = colors.icon[theme].default

// In style factory
export function getStyles(theme: ThemeMode) {
  return {
    container: {
      backgroundColor: colors.bg[theme].default,
      borderColor: colors.border[theme].default,
    },
    text: {
      color: colors.text[theme].primary,
    },
  }
}
```

### Conditional Theme Styles

```typescript
export function getStyles(theme: ThemeMode, variant: Variant) {
  const isLight = theme === 'light'

  // Simple condition
  const backgroundColor = isLight
    ? colors.gray[50]
    : colors.gray[900]

  // Complex condition
  const container: ViewStyle = {
    backgroundColor: isLight ? colors.gray[50] : colors.gray[900],
    borderColor: isLight ? colors.gray[200] : colors.gray[700],
  }

  // Variant-specific
  if (variant === 'filled') {
    container.backgroundColor = colors.primary[500]
  }

  return { container }
}
```

---

## Component Styling

### Container and Content Pattern

Most components follow a container + content structure:

```typescript
interface ComponentStyleConfig {
  container: ViewStyle       // Outer wrapper
  content: ViewStyle         // Inner content area
  text: TextStyle           // Text styles
  icon: ViewStyle           // Icon wrapper
  iconColor: string         // Icon color (not a style object)
}

export function getStyles(theme: ThemeMode): ComponentStyleConfig {
  return {
    container: {
      padding: spacing[16],
      backgroundColor: colors.bg[theme].default,
    },
    content: {
      gap: spacing[8],
    },
    text: {
      fontSize: typography.body.fontSize,
      color: colors.text[theme].primary,
    },
    icon: {
      width: 24,
      height: 24,
    },
    iconColor: colors.icon[theme].default,
  }
}
```

### Size Configurations

Use configuration objects for size variants:

```typescript
const sizeConfig = {
  sm: {
    height: 32,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    fontSize: typography.small.fontSize,
    iconSize: 16,
  },
  md: {
    height: 40,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    fontSize: typography.body.fontSize,
    iconSize: 20,
  },
  lg: {
    height: 48,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
    fontSize: typography.body.fontSize,
    iconSize: 24,
  },
} as const

export function getStyles(size: Size) {
  const config = sizeConfig[size]

  return {
    container: {
      height: config.height,
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
    },
    text: {
      fontSize: config.fontSize,
    },
    iconSize: config.iconSize,
  }
}
```

### State Styles

Handle interactive states in the factory:

```typescript
export function getStyles(
  isSelected: boolean,
  isDisabled: boolean,
  isHovered: boolean,
  theme: ThemeMode
) {
  const container: ViewStyle = {
    backgroundColor: colors.bg[theme].default,
    opacity: isDisabled ? 0.5 : 1,
  }

  // Selected state
  if (isSelected) {
    container.backgroundColor = colors.primary[500]
    container.borderColor = colors.primary[600]
  }

  // Hover state
  if (isHovered && !isDisabled) {
    container.backgroundColor = colors.primary[400]
  }

  // Disabled state
  if (isDisabled) {
    container.cursor = 'not-allowed' as any
  }

  return { container }
}
```

---

## Common Patterns

### 1. Flex Layouts

```typescript
// Horizontal row
const row: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[12],
}

// Vertical column
const column: ViewStyle = {
  flexDirection: 'column',
  gap: spacing[16],
}

// Centered content
const centered: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
}

// Space between
const spaceBetween: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
}
```

### 2. Responsive Gap

```typescript
// Use gap instead of margin for spacing
const container: ViewStyle = {
  flexDirection: 'row',
  gap: spacing[12],  // ✅ Preferred
}

// Instead of:
const container: ViewStyle = {
  flexDirection: 'row',
  // ❌ Don't use margins between items
}
```

### 3. Icon Styling

```typescript
// Icon container
const iconContainer: ViewStyle = {
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
}

// Icon color as separate property
const iconColor = colors.icon[theme].default

// Usage in component
<View style={styles.iconContainer}>
  <Icon size={24} color={styles.iconColor} />
</View>
```

### 4. Border Patterns

```typescript
// Full border
const bordered: ViewStyle = {
  borderWidth: borderWidth.thin,
  borderColor: colors.border[theme].default,
  borderRadius: borderRadius.m,
}

// Bottom border only
const divider: ViewStyle = {
  borderBottomWidth: borderWidth.thin,
  borderBottomColor: colors.border[theme].default,
}

// Conditional border
if (variant === 'outlined') {
  container.borderWidth = borderWidth.thin
  container.borderColor = colors.border[theme].default
}
```

### 5. Shadow Application

```typescript
// React Native shadow
const elevated: ViewStyle = {
  ...shadows.m,
}

// Web box-shadow (use in web-only contexts)
const elevatedWeb: ViewStyle = {
  boxShadow: boxShadows.m,
}
```

### 6. Platform-Specific Styles

```typescript
import { Platform } from 'react-native'

const interactive: ViewStyle = {
  ...(Platform.OS === 'web' && {
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  }),
}
```

---

## Anti-Patterns

### ❌ Don't Use StyleSheet.create

```typescript
// ❌ BAD - Don't use StyleSheet.create
import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
  }
})
```

```typescript
// ✅ GOOD - Use style factory
export function getStyles(theme: ThemeMode) {
  return {
    container: {
      padding: spacing[16],
    }
  }
}
```

### ❌ Don't Use Inline useMemo

```typescript
// ❌ BAD - Don't use inline useMemo
const styles = useMemo(() => ({
  container: {
    backgroundColor: colors.bg[theme].default,
  }
}), [theme])
```

```typescript
// ✅ GOOD - Use style factory
const styles = getComponentStyles(theme)
```

### ❌ Don't Hardcode Values

```typescript
// ❌ BAD - Hardcoded values
const container: ViewStyle = {
  padding: 16,              // ❌ Use spacing[16]
  borderRadius: 8,          // ❌ Use borderRadius.s
  fontSize: 14,             // ❌ Use typography.small.fontSize
  color: '#333333',         // ❌ Use colors.text[theme].primary
}
```

### ❌ Don't Mix Patterns

```typescript
// ❌ BAD - Mixing StyleSheet and inline styles
const staticStyles = StyleSheet.create({ ... })

return (
  <View style={[staticStyles.container, { backgroundColor: color }]} />
)
```

```typescript
// ✅ GOOD - Pure style factory
const styles = getStyles(color, theme)
return <View style={styles.container} />
```

### ❌ Don't Use Magic Numbers

```typescript
// ❌ BAD - What do these numbers mean?
const container: ViewStyle = {
  width: 272,    // ❌ What is this?
  height: 856,   // ❌ Why this value?
}
```

```typescript
// ✅ GOOD - Use named constants or tokens
const SIDEBAR_WIDTH_EXPANDED = 272
const SIDEBAR_HEIGHT = 856

const container: ViewStyle = {
  width: SIDEBAR_WIDTH_EXPANDED,
  height: SIDEBAR_HEIGHT,
}
```

---

## Migration Examples

### Before: StyleSheet.create

```typescript
// ❌ OLD PATTERN
import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
})

export function Component() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content</Text>
    </View>
  )
}
```

### After: Style Factory

```typescript
// ✅ NEW PATTERN
// Component.styles.ts
import type { ViewStyle, TextStyle } from 'react-native'
import { colors, spacing, typography } from '../../tokens'
import type { ThemeMode } from '../../tokens/colors'

export interface ComponentStyleConfig {
  container: ViewStyle
  text: TextStyle
}

export function getComponentStyles(theme: ThemeMode): ComponentStyleConfig {
  return {
    container: {
      padding: spacing[16],
      backgroundColor: colors.bg[theme].default,
    },
    text: {
      fontSize: typography.body.fontSize,
      color: colors.text[theme].primary,
    },
  }
}

// Component.tsx
import { getComponentStyles } from './Component.styles'
import { useThemeContext } from '../../theme'

export function Component() {
  const { theme } = useThemeContext()
  const styles = getComponentStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content</Text>
    </View>
  )
}
```

### Before: Inline Styles with Theme

```typescript
// ❌ OLD PATTERN
export function Component() {
  const { theme } = useThemeContext()

  return (
    <View
      style={{
        padding: spacing[16],
        backgroundColor: theme === 'light' ? '#fff' : '#000',
      }}
    >
      <Text
        style={{
          color: theme === 'light' ? '#333' : '#fff',
        }}
      >
        Content
      </Text>
    </View>
  )
}
```

### After: Theme-Aware Factory

```typescript
// ✅ NEW PATTERN
// Component.styles.ts
export function getComponentStyles(theme: ThemeMode) {
  return {
    container: {
      padding: spacing[16],
      backgroundColor: colors.bg[theme].default,
    },
    text: {
      color: colors.text[theme].primary,
    },
  }
}

// Component.tsx
export function Component() {
  const { theme } = useThemeContext()
  const styles = getComponentStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content</Text>
    </View>
  )
}
```

---

## Checklist

When creating or updating component styles, ensure:

- [ ] Created separate `.styles.ts` file
- [ ] Defined `StyleConfig` interface
- [ ] Created style factory function
- [ ] Used design tokens (no hardcoded values)
- [ ] Integrated theme support
- [ ] Removed `StyleSheet.create`
- [ ] Removed inline `useMemo` for styles
- [ ] Used `gap` instead of margins where possible
- [ ] Added type annotations for all styles
- [ ] Handled all component states (hover, disabled, selected, etc.)
- [ ] Platform-specific styles use `Platform.OS` checks
- [ ] Icon colors as separate properties (not in ViewStyle)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall architecture
- [API_CONVENTIONS.md](./API_CONVENTIONS.md) - Component API standards
- [MIGRATION.md](../MIGRATION.md) - Migration guides

---

## Questions or Issues?

- **Documentation**: https://beyond-ui.unicorn.com/docs
- **GitHub Issues**: https://github.com/unicorn/beyond-ui/issues
- **Examples**: See `/packages/beyond-ui/stories/`
