# Example App

This is a minimal Expo app demonstrating @unicornlove/ui component usage.

## Running the Example

```bash
# Install dependencies
pnpm install

# Start the Expo dev server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web
```

## What's Included

- Basic component usage examples
- Theme customization examples
- Cross-platform compatibility demonstration

## Customization

You can customize the theme by modifying `App.tsx`:

```tsx
import { createUIConfig } from '@unicornlove/ui'

const customConfig = createUIConfig({
  theme: {
    colors: {
      teal: {
        light: {
          teal8: '#your-color',
        },
      },
    },
  },
})
```

