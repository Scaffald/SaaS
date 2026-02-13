---
sidebar_position: 3
---

# Theming

Learn how to customize Scaffald UI to match your brand and design system.

## Theme Provider

Wrap your app with the `ThemeProvider` to enable theming:

```tsx
import { ThemeProvider } from '@scaffald/ui';

export default function App() {
  return (
    <ThemeProvider initialTheme="light">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

## Using the Theme

Access the current theme in any component:

```tsx
import { useThemeContext } from '@scaffald/ui';

function MyComponent() {
  const { theme, setTheme } = useThemeContext();

  return (
    <View>
      <Text>Current theme: {theme}</Text>
      <Button onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </Button>
    </View>
  );
}
```

## Color Tokens

Scaffald UI uses semantic color tokens that automatically adapt to light/dark themes:

```tsx
import { colors, useThemeContext } from '@scaffald/ui';

function ThemedComponent() {
  const { theme } = useThemeContext();

  return (
    <View style={{
      backgroundColor: colors.bg[theme].default,
      borderColor: colors.border[theme].default,
    }}>
      <Text style={{ color: colors.text[theme].primary }}>
        Themed Content
      </Text>
    </View>
  );
}
```

### Color Token Structure

```typescript
colors.{semantic}.{theme}.{variant}
```

**Semantic Categories:**
- `bg` - Backgrounds
- `text` - Text colors
- `border` - Borders
- `fg` - Foregrounds
- `icon` - Icons

**Themes:**
- `light`
- `dark`

**Variants:**
- `default`
- `subtle`
- `muted`
- `primary`
- `secondary`
- `success`
- `warning`
- `error`
- `info`

### Examples

```tsx
// Background colors
colors.bg[theme].default      // Main background
colors.bg[theme].subtle       // Subtle background
colors.bg[theme].primary      // Primary brand background

// Text colors
colors.text[theme].primary    // Primary text
colors.text[theme].secondary  // Secondary text
colors.text[theme].muted      // Muted text

// Border colors
colors.border[theme].default  // Default borders
colors.border[theme].primary  // Primary borders
```

## Custom Themes

Create custom theme configurations:

```tsx
import { colors } from '@scaffald/ui';

const customTheme = {
  light: {
    ...colors.bg.light,
    primary: '#FF6B6B',      // Custom primary color
    secondary: '#4ECDC4',    // Custom secondary color
  },
  dark: {
    ...colors.bg.dark,
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
  },
};
```

## Typography Tokens

Use typography tokens for consistent text styling:

```tsx
import { typography } from '@scaffald/ui';

<Text style={typography.h1}>Heading 1</Text>
<Text style={typography.body}>Body text</Text>
<Text style={typography.caption}>Caption text</Text>
```

Available typography variants:
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` - Headings
- `body`, `bodyLarge`, `bodySmall` - Body text
- `caption` - Small text
- `label` - Form labels

## Spacing Tokens

Use spacing tokens for consistent layouts:

```tsx
import { spacing } from '@scaffald/ui';

<Stack gap={spacing[4]} padding={spacing[6]}>
  {/* Content */}
</Stack>
```

Spacing scale (in pixels):
- `spacing[0]` = 0
- `spacing[1]` = 4
- `spacing[2]` = 8
- `spacing[3]` = 12
- `spacing[4]` = 16
- `spacing[5]` = 20
- `spacing[6]` = 24
- `spacing[8]` = 32
- `spacing[10]` = 40
- `spacing[12]` = 48
- `spacing[16]` = 64

## Shadow Tokens

Apply consistent shadows:

```tsx
import { shadows } from '@scaffald/ui';

<Card style={shadows.md}>
  {/* Content */}
</Card>
```

Shadow levels:
- `shadows.sm` - Small shadow
- `shadows.md` - Medium shadow
- `shadows.lg` - Large shadow
- `shadows.xl` - Extra large shadow

## Responsive Design

Use breakpoints for responsive layouts:

```tsx
import { breakpoints } from '@scaffald/ui';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: breakpoints.lg, // 1024px
  },
});
```

Breakpoints:
- `breakpoints.sm` = 640px
- `breakpoints.md` = 768px
- `breakpoints.lg` = 1024px
- `breakpoints.xl` = 1280px
- `breakpoints.2xl` = 1536px

## Dark Mode

Scaffald UI components automatically adapt to dark mode when you change the theme:

```tsx
import { useThemeContext, Button } from '@scaffald/ui';

function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <Button
      onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      iconStart={theme === 'light' ? <MoonIcon /> : <SunIcon />}
    >
      {theme === 'light' ? 'Dark' : 'Light'} Mode
    </Button>
  );
}
```

## System Theme Detection

Respect user's system preferences:

```tsx
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@scaffald/ui';

export default function App() {
  const systemTheme = useColorScheme();

  return (
    <ThemeProvider initialTheme={systemTheme || 'light'}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Best Practices

1. **Always use theme tokens** - Don't hardcode colors
2. **Test both themes** - Ensure your UI works in light and dark modes
3. **Respect system preferences** - Allow users to choose their preferred theme
4. **Use semantic tokens** - Use `colors.text[theme].primary` instead of `#000000`
5. **Consistent spacing** - Use spacing tokens for all margins and padding

## Next Steps

- [Design Tokens Overview](../tokens/overview)
- [Color Tokens](../tokens/colors)
- [Typography Tokens](../tokens/typography)
- [Component Examples](../examples/forms)
