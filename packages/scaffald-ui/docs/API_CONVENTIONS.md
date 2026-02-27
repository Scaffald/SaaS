# Beyond UI - API Conventions

This document establishes consistent API conventions for all Beyond UI components to ensure a predictable and intuitive developer experience.

## Core Principles

1. **Consistency**: Components with similar purposes should have similar APIs
2. **Clarity**: Prop names should be self-documenting and unambiguous
3. **Simplicity**: Avoid redundant props or overly nested configuration
4. **Flexibility**: Support both controlled and uncontrolled modes where appropriate
5. **Composability**: Favor composition over configuration

## Component Structure

### File Organization

```
/components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.types.ts      # TypeScript type definitions
├── ComponentName.styles.ts     # Style factory functions
├── ComponentName.utils.ts      # Helper functions (if needed)
├── index.ts                    # Public exports
└── __tests__/                  # Component tests
```

### Style Architecture

All components MUST use **style factory functions** instead of inline styles or StyleSheet.create():

```typescript
// ✅ CORRECT: Style factory in separate .styles.ts file
export function getComponentStyles(
  variant: Variant,
  theme: ThemeMode,
  disabled: boolean
): ComponentStyleConfig {
  return {
    container: { /* styles */ },
    text: { /* styles */ },
  }
}

// ❌ INCORRECT: StyleSheet.create() at component level
const styles = StyleSheet.create({
  container: { /* styles */ }
})

// ❌ INCORRECT: Inline useMemo for styles
const styles = useMemo(() => ({
  container: { /* styles */ }
}), [deps])
```

**Benefits of style factories:**
- Better testability
- Type-safe style composition
- Separation of concerns
- Easier to maintain and update

## Prop Naming Conventions

### Style Props

Use **consistent, non-redundant** style prop names:

| ✅ Use | ❌ Avoid | Reason |
|--------|----------|---------|
| `style` | `containerStyle`, `boxStyle`, `wrapperStyle` | Primary style prop should be `style` |
| `contentStyle` | `innerStyle`, `contentContainerStyle` | For inner content wrapper |
| `padding` | `containerPadding`, `innerPadding` | Apply to component directly |
| `gap` | `itemSpacing`, `spacing` | Standard CSS terminology |

**Example:**
```tsx
<Card
  style={{ marginBottom: 16 }}      // External styling
  contentStyle={{ padding: 24 }}    // Internal content styling
  padding="lg"                        // Predefined padding
/>
```

### Layout Props

| Prop | Type | Description |
|------|------|-------------|
| `gap` | `GapValue \| ResponsiveValue<GapValue>` | Spacing between child elements |
| `padding` | `PaddingValue \| ResponsiveValue<PaddingValue>` | Internal spacing |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | Cross-axis alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'space-between'` | Main-axis alignment |

### State Props

#### Controlled vs Uncontrolled

Components should support both controlled and uncontrolled modes:

```tsx
// Controlled mode
<Component
  value={value}
  onChange={(newValue) => setValue(newValue)}
/>

// Uncontrolled mode
<Component
  defaultValue={initialValue}
  onChange={(newValue) => console.log(newValue)}
/>
```

**Naming convention:**
- Controlled: `value`, `checked`, `selected`, `visible`, `open`, `collapsed`
- Uncontrolled: `defaultValue`, `defaultChecked`, `defaultSelected`, `defaultVisible`, `defaultOpen`, `defaultCollapsed`
- Change handler: `onChange`, `onValueChange`, `onCheck`, `onSelect`, `onVisibleChange`, `onOpenChange`, `onCollapseChange`

#### Disabled State

```tsx
interface ComponentProps {
  disabled?: boolean  // ✅ Use boolean
  // Not: isDisabled, enable, enabled
}
```

### Variant Props

Use clear, semantic variant names:

```tsx
interface ComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost'  // ✅ Clear options
  color?: 'primary' | 'gray' | 'error'                     // ✅ Semantic colors
  size?: 'sm' | 'md' | 'lg'                                // ✅ T-shirt sizing
}
```

**Avoid:**
- Generic names: `type`, `kind`, `mode` (unless truly ambiguous)
- Numeric sizes: `size={1}`, `size={2}`
- Overly specific variants: `variantPrimaryLargeWithBorder`

### Callback Props

Standard callback naming:

| Event | Prop Name | Signature |
|-------|-----------|-----------|
| Click/Press | `onPress` | `() => void` |
| Value Change | `onChange` | `(value: T) => void` |
| Focus | `onFocus` | `() => void` |
| Blur | `onBlur` | `() => void` |
| Submit | `onSubmit` | `(data: T) => void` |
| Close/Dismiss | `onClose` | `() => void` |
| Cancel | `onCancel` | `() => void` |

**Note:** Use `onPress` (React Native convention) instead of `onClick` for better cross-platform compatibility.

### Content Props

| Prop | Type | Usage |
|------|------|-------|
| `children` | `React.ReactNode` | Primary content slot |
| `title` | `string` | Main heading text |
| `subtitle` | `string` | Supporting text |
| `description` | `string` | Detailed text |
| `label` | `string` | Form field label |
| `helperText` | `string` | Additional guidance |
| `placeholder` | `string` | Input placeholder |

## Error Handling

Standardized error handling across form components:

```tsx
interface FormComponentProps {
  /** Whether the field has an error */
  error?: boolean

  /** Error message to display */
  errorMessage?: string

  /** Whether to show error state visually */
  showError?: boolean

  /** Validate on blur event */
  validateOnBlur?: boolean
}
```

**Example:**
```tsx
<Input
  value={email}
  onChange={setEmail}
  error={!isValidEmail}
  errorMessage="Please enter a valid email"
  validateOnBlur
/>
```

## Accessibility Props

All interactive components must support accessibility:

```tsx
interface AccessibleComponentProps {
  /** Accessibility label for screen readers */
  accessibilityLabel?: string

  /** Accessibility role */
  accessibilityRole?: string

  /** Accessibility hint */
  accessibilityHint?: string

  /** Test ID for automated testing */
  testID?: string
}
```

## Component Composition

Prefer composition over configuration for complex components:

### ✅ Good: Composition Pattern

```tsx
<Card>
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardContent>
    <Text>Content here</Text>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### ❌ Avoid: Configuration Pattern

```tsx
<Card
  header={{ title: "Title", subtitle: "Subtitle" }}
  content={<Text>Content</Text>}
  footer={<Button>Action</Button>}
/>
```

## Responsive Design

Support responsive values using a consistent API:

```tsx
type ResponsiveValue<T> = T | {
  base?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}

// Usage
<Grid
  columns={{ base: 1, sm: 2, lg: 3 }}
  gap={{ base: 'md', lg: 'xl' }}
>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</Grid>
```

## Theme Integration

Components must integrate with the theme system:

```tsx
import { useThemeContext } from '../../theme'
import { getComponentStyles } from './Component.styles'

export function Component({ variant = 'default' }: ComponentProps) {
  const { theme } = useThemeContext()
  const styles = getComponentStyles(variant, theme)

  return <View style={styles.container}>...</View>
}
```

## TypeScript Best Practices

### Prop Types

```tsx
// Export all prop interfaces
export interface ComponentProps {
  /** JSDoc comment for each prop */
  variant?: ComponentVariant
  children?: React.ReactNode
  style?: ViewStyle
}

// Export discriminated unions for variants
export type ComponentVariant = 'default' | 'outlined' | 'filled'

// Export style configuration types
export interface ComponentStyleConfig {
  container: ViewStyle
  text: TextStyle
  iconColor: string
}
```

### Generic Components

```tsx
// For components that work with generic types
export interface SelectProps<T = string> {
  value?: T
  onChange?: (value: T) => void
  options: Array<{ label: string; value: T }>
}

export function Select<T = string>(props: SelectProps<T>) {
  // Implementation
}
```

## Breaking Changes

When introducing breaking changes to component APIs:

1. **Document** the change in `MIGRATION_V0_TO_V1.md`
2. **Deprecate** old props with console warnings for one major version
3. **Provide** codemods when possible
4. **Update** all examples and documentation

### Deprecation Pattern

```tsx
export interface ComponentProps {
  /** @deprecated Use `padding` instead. Will be removed in v2.0 */
  containerPadding?: PaddingValue

  /** Padding for component */
  padding?: PaddingValue
}

export function Component({
  containerPadding,
  padding = containerPadding
}: ComponentProps) {
  if (containerPadding && process.env.NODE_ENV !== 'production') {
    console.warn(
      'Component: `containerPadding` is deprecated. Use `padding` instead.'
    )
  }
  // ...
}
```

## Examples

### Complete Component Example

```tsx
// Button.types.ts
export interface ButtonProps {
  children?: React.ReactNode
  variant?: 'filled' | 'outlined' | 'ghost'
  color?: 'primary' | 'gray' | 'error'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onPress?: () => void
  iconStart?: IconComponent
  iconEnd?: IconComponent
  style?: ViewStyle
  testID?: string
  accessibilityLabel?: string
}

// Button.tsx
import { Pressable, Text } from 'react-native'
import { useThemeContext } from '../../theme'
import { getButtonStyles } from './Button.styles'
import type { ButtonProps } from './Button.types'

export function Button({
  children,
  variant = 'filled',
  color = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  iconStart: IconStart,
  iconEnd: IconEnd,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useThemeContext()
  const styles = getButtonStyles(variant, color, size, disabled, theme)

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {IconStart && <IconStart size={styles.iconSize} color={styles.iconColor} />}
      {children && <Text style={styles.text}>{children}</Text>}
      {IconEnd && <IconEnd size={styles.iconSize} color={styles.iconColor} />}
    </Pressable>
  )
}
```

## Review Checklist

Before submitting a new component, verify:

- [ ] Uses style factory functions (not StyleSheet.create() or inline useMemo)
- [ ] Follows prop naming conventions (style, not containerStyle)
- [ ] Supports controlled/uncontrolled modes where applicable
- [ ] Includes TypeScript types with JSDoc comments
- [ ] Integrates with theme system
- [ ] Has accessibility props
- [ ] Has error handling (for form components)
- [ ] Exports all necessary types
- [ ] Has test coverage
- [ ] Has Storybook stories
- [ ] Documented in component README

## Resources

- [Component Checklist](./COMPONENT_CHECKLIST.md) - New component requirements
- [Styling Guide](./STYLING_GUIDE.md) - Style factory patterns
- [Architecture](./ARCHITECTURE.md) - Package structure
- [Migration Guide](../MIGRATION_V0_TO_V1.md) - Breaking changes
