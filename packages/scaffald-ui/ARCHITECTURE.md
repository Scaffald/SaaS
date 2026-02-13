# Beyond-UI Architecture Guide

This document describes the architecture, design patterns, and organizational structure of the Beyond-UI design system.

---

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Package Structure](#package-structure)
- [Component Architecture](#component-architecture)
- [Styling Strategy](#styling-strategy)
- [Token System](#token-system)
- [Theme System](#theme-system)
- [Type System](#type-system)
- [Accessibility](#accessibility)
- [Platform Support](#platform-support)

---

## Overview

Beyond-UI is a production-ready design system built for React Native and Web applications. It provides:

- **67+ components** with comprehensive variants
- **Cross-platform support** (React Native + Web via react-native-web)
- **Design tokens** mapped from Figma Forsured Design System
- **Light/Dark theme support** with automatic switching
- **Full TypeScript support** with discriminated union types
- **Accessibility-first** with ARIA attributes and focus management
- **Style factories** for consistent, performant styling

---

## Design Principles

### 1. Consistency First
- All components follow the same API conventions
- Predictable prop naming across all components
- Unified error handling patterns

### 2. Token-Driven Design
- All visual properties sourced from design tokens
- No magic numbers or hardcoded values
- Single source of truth from Figma

### 3. Type Safety
- Discriminated union types for variant props
- Compile-time validation of component usage
- IntelliSense support for all props

### 4. Performance
- Style factories (not StyleSheet.create)
- Minimal re-renders through context optimization
- Lazy-loaded optional features

### 5. Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader optimized

---

## Package Structure

```
/packages/beyond-ui/
├── src/
│   ├── components/          # All UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx           # Main component
│   │   │   ├── Button.types.ts      # Type definitions
│   │   │   ├── Button.styles.ts     # Style factory
│   │   │   └── index.ts             # Public exports
│   │   ├── ListItem/
│   │   │   ├── ListItem.tsx
│   │   │   ├── ListItem.types.ts
│   │   │   ├── ListItem.styles.ts
│   │   │   ├── variants/            # Decomposed variants
│   │   │   │   ├── UserProfile01ListItem.tsx
│   │   │   │   ├── ProductListItem.tsx
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   └── ...
│   ├── tokens/              # Design tokens
│   │   ├── colors.ts        # Color palette
│   │   ├── spacing.ts       # Spacing scale
│   │   ├── typography.ts    # Type scale
│   │   ├── borders.ts       # Border radius, widths
│   │   ├── shadows.ts       # Elevation system
│   │   └── index.ts
│   ├── theme/               # Theme system
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   ├── hooks/               # Shared hooks
│   ├── utils/               # Utilities
│   ├── accessibility/       # A11y utilities
│   ├── animation/           # Animation system
│   ├── platform/            # Platform utilities
│   └── index.ts             # Package exports
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── STYLING_GUIDE.md
│   └── API_CONVENTIONS.md
└── MIGRATION.md
```

---

## Component Architecture

### Component Structure

Every component follows this structure:

```typescript
// Button.tsx
import { getButtonStyles } from './Button.styles'
import { useThemeContext } from '../../theme'

export function Button({ variant, size, color, ...props }: ButtonProps) {
  const { theme } = useThemeContext()
  const styles = getButtonStyles(variant, size, color, theme)

  return (
    <Pressable style={styles.container} {...props}>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  )
}
```

### Component Files

1. **Component.tsx** - Main component implementation
2. **Component.types.ts** - Type definitions (props, variants, configs)
3. **Component.styles.ts** - Style factory functions
4. **index.ts** - Public exports

### Variant Components

Large components with many variants are decomposed into separate variant components:

```typescript
// Instead of:
<ListItem variant="user-profile" name="John" />

// Use:
<UserProfileListItem name="John" />
```

**Benefits:**
- Smaller bundle size (tree-shakeable)
- Clearer API (no variant discrimination)
- Better performance (no switch statements)
- Easier maintenance

**Examples:**
- `ListItem` → 11 variant components (UserProfile01ListItem, ProductListItem, etc.)
- Future: `TableCell` → 30+ cell type components

---

## Styling Strategy

### Style Factories (Recommended Pattern)

**DO:**
```typescript
// Button.styles.ts
export interface ButtonStyleConfig {
  container: ViewStyle
  text: TextStyle
}

export function getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  theme: ThemeMode
): ButtonStyleConfig {
  const container: ViewStyle = {
    paddingHorizontal: sizeConfig[size].paddingHorizontal,
    backgroundColor: colors.primary[500],
  }

  const text: TextStyle = {
    fontSize: sizeConfig[size].fontSize,
    color: colors.text[theme].primary,
  }

  return { container, text }
}
```

**DON'T:**
```typescript
// ❌ Don't use StyleSheet.create
const styles = StyleSheet.create({
  button: {
    padding: 16, // ❌ Hardcoded value
  }
})

// ❌ Don't use inline useMemo
const styles = useMemo(() => ({
  container: { ... }
}), [theme])
```

### Why Style Factories?

1. **Dynamic styling** - Easily adapt to props and theme
2. **Type safety** - Explicit style config interfaces
3. **Performance** - No StyleSheet overhead
4. **Testability** - Pure functions, easy to test
5. **Consistency** - Single pattern across all components

---

## Token System

All design tokens are sourced from Figma Forsured Design System.

### Token Categories

#### Colors (`tokens/colors.ts`)
```typescript
colors.primary[500]     // Brand colors
colors.gray[100]        // Neutral scale
colors.error[500]       // Semantic colors
colors.text.light.primary    // Text colors
colors.bg.dark.default       // Background colors
colors.border.light.default  // Border colors
colors.icon.dark.subtle      // Icon colors
```

#### Spacing (`tokens/spacing.ts`)
```typescript
spacing[4]   // 4px
spacing[8]   // 8px
spacing[12]  // 12px
spacing[16]  // 16px
// ... up to spacing[96]
```

#### Typography (`tokens/typography.ts`)
```typescript
typography.h1           // Heading styles
typography.body         // Body text
typography.bodyMedium   // Medium weight body
typography.small        // Small text
```

#### Shadows (`tokens/shadows.ts`)
```typescript
shadows.xs      // Extra small shadow
shadows.button  // Button shadow
boxShadows.focusPrimary  // Focus ring (web only)
```

#### Borders (`tokens/borders.ts`)
```typescript
borderRadius.xxs    // 2px
borderRadius.s      // 6px
borderRadius.m      // 12px
borderRadius.max    // 9999px (pill)

borderWidth.thin    // 1px
borderWidth.medium  // 2px
```

### Token Usage

**DO:**
```typescript
// ✅ Use tokens
padding: spacing[16]
color: colors.text[theme].primary
borderRadius: borderRadius.m
```

**DON'T:**
```typescript
// ❌ No hardcoded values
padding: 16
color: '#333333'
borderRadius: 12
```

---

## Theme System

### ThemeProvider Setup

```typescript
import { ThemeProvider } from '@scaffald/ui'

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <YourApp />
    </ThemeProvider>
  )
}
```

### Using Theme

```typescript
import { useThemeContext } from '@scaffald/ui'

function MyComponent() {
  const { theme, setTheme } = useThemeContext()

  return (
    <View style={{
      backgroundColor: colors.bg[theme].default
    }}>
      <Button onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </Button>
    </View>
  )
}
```

### Theme Storage

The theme preference is automatically persisted to:
- **Web:** localStorage (`theme-storage-key`)
- **Native:** AsyncStorage (`theme-storage-key`)

---

## Type System

### Discriminated Union Types

Components with variants use discriminated union types for type safety:

```typescript
type ButtonProps =
  | { variant: 'filled'; color: ColorVariant }
  | { variant: 'outlined'; color: ColorVariant }
  | { variant: 'text' }  // No color prop

// ✅ Valid
<Button variant="filled" color="primary" />

// ❌ Type error - text variant doesn't accept color
<Button variant="text" color="primary" />
```

### Prop Conventions

- `variant` - Visual style variant
- `size` - Component size (sm, md, lg)
- `color` - Color variant (primary, secondary, etc.)
- `disabled` - Disabled state
- `style` - Container style override
- `contentStyle` - Inner content style override
- `error` - Boolean error state
- `errorMessage` - Error message text
- `onPress` - Primary action handler

---

## Accessibility

### Built-in Features

- **ARIA attributes** on all interactive components
- **Keyboard navigation** with Tab, Enter, Space, Arrow keys
- **Focus management** with focus traps and roving tabindex
- **Screen reader support** with proper roles and labels
- **High contrast** mode support
- **Reduced motion** support

### Accessibility APIs

```typescript
// Visual hidden content for screen readers
<VisuallyHidden>Accessible label</VisuallyHidden>

// Live region announcements
<LiveRegion>{dynamicMessage}</LiveRegion>

// Focus management
const { trapProps } = useFocusTrap({ enabled: isOpen })

// Skip links
<SkipLink href="#main">Skip to main content</SkipLink>
```

---

## Platform Support

### React Native Web

All components work on web via `react-native-web`. Platform-specific code is minimal:

```typescript
// Platform detection
const isWeb = Platform.OS === 'web'

// Platform-specific props
{...(Platform.OS === 'web' && {
  role: 'button',
  'aria-label': label,
} as any)}

// Platform-specific styles
...(Platform.OS === 'web' && {
  cursor: 'pointer' as any,
})
```

### Responsive Design

```typescript
import { Grid, Show, Hide } from '@scaffald/ui'

// Responsive grid
<Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</Grid>

// Conditional rendering
<Show above="md"><DesktopNav /></Show>
<Hide above="md"><MobileNav /></Hide>
```

---

## Best Practices

### Component Development

1. **Always use design tokens** - Never hardcode values
2. **Use style factories** - Not StyleSheet.create
3. **Follow naming conventions** - See API_CONVENTIONS.md
4. **Add TypeScript types** - Discriminated unions for variants
5. **Include accessibility** - Roles, labels, keyboard support
6. **Write examples** - JSDoc with usage examples
7. **Test on both platforms** - Web and Native

### Performance

1. **Use style factories** - Better than useMemo
2. **Avoid inline functions** - Use useCallback for callbacks
3. **Minimize context usage** - Only subscribe to what you need
4. **Lazy load features** - Optional animation support
5. **Tree-shakeable exports** - Individual component exports

### Maintenance

1. **Keep components small** - Decompose large components
2. **Single responsibility** - One component, one purpose
3. **Document breaking changes** - Update MIGRATION.md
4. **Follow conventions** - Consistency across codebase

---

## Related Documentation

- [STYLING_GUIDE.md](./STYLING_GUIDE.md) - Detailed styling patterns
- [API_CONVENTIONS.md](./API_CONVENTIONS.md) - Component API standards
- [MIGRATION.md](../MIGRATION.md) - Breaking changes and migration guides

---

## Questions or Issues?

- **Documentation**: https://beyond-ui.unicorn.com/docs
- **GitHub Issues**: https://github.com/unicorn/beyond-ui/issues
- **Examples**: See `/packages/beyond-ui/stories/`
