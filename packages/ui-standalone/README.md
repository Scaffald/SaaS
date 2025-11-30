# @scaffald/tamagui-ui

Comprehensive UI component library for Tamagui and Expo, supporting iOS, Android, and web platforms.

## Installation

```bash
npm install @scaffald/tamagui-ui
# or
pnpm add @scaffald/tamagui-ui
# or
yarn add @scaffald/tamagui-ui
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
import { Button, Card, Input } from '@scaffald/tamagui-ui'

function App() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button>Click me</Button>
    </Card>
  )
}
```

## Documentation

Full documentation is available in the [docs](./docs/) directory.

## License

MIT

