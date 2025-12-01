# Theming Guide

@unicornlove/ui provides a flexible theming system that allows you to customize colors, tokens, and component styles.

## Default Theme

The package includes a default "scaffald" theme with a professional teal-based design system. You can use it as-is:

```tsx
import { config } from '@unicornlove/ui'

// Use the default config
export default config
```

## Customizing Colors

You can customize individual color scales:

```tsx
import { createUIConfig } from '@unicornlove/ui'

const customConfig = createUIConfig({
  theme: {
    colors: {
      teal: {
        light: {
          teal8: '#239CB2', // Primary brand color
          teal9: '#1a7a8a', // Darker variant
        },
        dark: {
          teal8: '#4db8cc', // Lighter for dark mode
        },
      },
      blue: {
        light: {
          blue9: '#your-custom-blue',
        },
      },
    },
  },
})
```

## Color Scales

Each color has 12 steps (1-12) representing different shades:
- Steps 1-3: Lightest (backgrounds)
- Steps 4-6: Light (subtle elements)
- Steps 7-9: Medium (primary colors, buttons)
- Steps 10-12: Dark (text, emphasis)

## Available Color Scales

- `teal` - Primary brand color
- `gray` - Neutral grays
- `blue` - Info/primary actions
- `green` - Success states
- `red` - Error/danger states
- `yellow` - Warning states
- `purple` - Accent color
- `pink` - Accent color
- `orange` - Accent color

## Customizing Tokens

You can also customize design tokens:

```tsx
const customConfig = createUIConfig({
  tokens: {
    spacing: {
      '$1': 4,
      '$2': 8,
      // ... custom spacing
    },
    radius: {
      '$1': 4,
      '$2': 8,
      // ... custom radius
    },
  },
})
```

## Component Theme Overrides

Customize component-specific themes:

```tsx
import { defaultComponentThemes } from '@tamagui/theme-builder'

const customConfig = createUIConfig({
  theme: {
    components: {
      ...defaultComponentThemes,
      Button: {
        // Custom button theme
      },
    },
  },
})
```

## Examples

See the [example app](./examples/) for complete theming examples.

