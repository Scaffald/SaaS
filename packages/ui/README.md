# @unicornlove/ui

Comprehensive UI component library for Tamagui and Expo, supporting iOS, Android, and web platforms.

## Installation

```bash
npm install @unicornlove/ui
# or
pnpm add @unicornlove/ui
# or
yarn add @unicornlove/ui
```

## Peer Dependencies

This package requires the following peer dependencies:

- `react` >= 18.0.0
- `react-native` >= 0.74.0 (optional, for React Native)
- `expo` >= 51.0.0 (optional, for Expo)
- `tamagui` >= 1.138.0
- `@tamagui/core` >= 1.138.0
- `react-hook-form` >= 7.0.0
- `zod` >= 3.0.0

## Quick Start

```tsx
import { Button, Card, Input } from '@unicornlove/ui'

function App() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button>Click me</Button>
    </Card>
  )
}
```

## Local Development

For local development with the package linked to your project:

### Linking the Package

1. **In the @unicornlove/ui repository:**
   ```bash
   pnpm link --global
   ```

2. **In your consuming project (e.g., SCF-Scaffald):**
   ```bash
   pnpm link --global @unicornlove/ui
   ```

3. **Watch mode for development:**
   ```bash
   # In @unicornlove/ui directory
   pnpm build --watch
   ```

### Unlinking

To unlink and use the published version:
```bash
# In your consuming project
pnpm unlink --global @unicornlove/ui && pnpm install
```

## Theming

The package includes a configurable theme system. Use the default scaffald theme or customize it:

```tsx
import { createUIConfig } from '@unicornlove/ui'

// Customize theme colors
const customConfig = createUIConfig({
  theme: {
    colors: {
      teal: {
        light: {
          teal8: '#your-custom-teal',
        },
      },
    },
  },
})
```

See [Theming Guide](./docs/theming.md) for detailed customization options.

## Components

The package exports a wide variety of components:

- **Forms**: Input, Checkbox, Radio, PhoneNumberInput, ToggleSwitch, etc.
- **Layout**: Card, Stack, Sheet, Dialog, Modal, etc.
- **Navigation**: Breadcrumb, Tabs, Accordion, etc.
- **Data Display**: Charts, Tables, Lists, etc.
- **Feedback**: Toast, Spinner, Loading states, etc.
- **And many more...**

See [API Reference](./docs/api-reference.md) for complete component documentation.

## Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web

## Type Definitions

The package includes TypeScript definitions and exports types for geographic and phone utilities:

```tsx
import type { Boundary, Coordinate } from '@unicornlove/ui/types/geographic'
import { formatPhoneNumber, isValidPhoneNumber } from '@unicornlove/ui/types/phone'
```

## Documentation

- [API Reference](./docs/api-reference.md) - Complete component API documentation
- [Theming Guide](./docs/theming.md) - Theme customization guide
- [Contributing](./CONTRIBUTING.md) - Development setup and contribution guidelines

## License

MIT
