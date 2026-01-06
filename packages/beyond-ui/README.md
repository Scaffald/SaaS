# @unicornlove/beyond-ui

> Next-generation custom UI component library - The future of @unicornlove/ui

**Status**: 🚧 In Development (v0.1.0 MVP)

## Overview

`@unicornlove/beyond-ui` is a custom, mature UI component library built with inline styles for React Native and web. It's designed from the ground up using the Forsured Design System (Figma) with a focus on:

- **Cross-platform**: Native support for React Native (iOS, Android) and web
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Accessible**: WCAG 2.1 AA compliant components
- **Performant**: Inline styles with minimal runtime overhead
- **Tested**: >80% test coverage for all components
- **Themeable**: Design tokens mapped directly from Figma

## Installation

```bash
# pnpm
pnpm add @unicornlove/beyond-ui react react-native

# npm
npm install @unicornlove/beyond-ui react react-native

# yarn
yarn add @unicornlove/beyond-ui react react-native
```

## Quick Start

```typescript
import { Button, TextInput, Stack, Row } from '@unicornlove/beyond-ui'

function MyForm() {
  const [value, setValue] = useState('')

  return (
    <Stack gap={16}>
      <TextInput
        label="Email"
        value={value}
        onChangeText={setValue}
        placeholder="Enter your email"
      />
      <Row gap={8}>
        <Button variant="primary" onPress={handleSubmit}>
          Submit
        </Button>
        <Button variant="secondary" onPress={handleCancel}>
          Cancel
        </Button>
      </Row>
    </Stack>
  )
}
```

## Design Tokens

Access Figma design tokens directly:

```typescript
import { colors, spacing, typography, borderRadius, gradients } from '@unicornlove/beyond-ui/tokens'

// Colors from Figma Forsured Design System
colors.primary[600]  // #d54e21
colors.gray[50]      // #f9fafb
colors.success[500]  // #10b978

// Spacing scale
spacing[4]           // 12
namedSpacing.lg      // 24

// Typography (Roboto)
typography.fonts.body      // 'Roboto'
typography.fontSizes.md    // 16

// Border radius
borderRadius.m             // 10

// Gradients (reference existing color tokens)
gradients.gray[900].colors  // ['#141c25', '#1a232d'] for React Native
gradients.gray[900].css     // 'linear-gradient(180deg, #141c25 0%, #1a232d 100%)' for web
gradients.named['warm-flame'].colors  // ['#fb923c', '#fb7185']
```

## Current Components

### Phase 0 (✅ Complete)
- **Design Tokens**: colors, spacing, typography, borders, shadows, animations, breakpoints, gradients

### Phase 1 (🚧 In Progress)
- **Primitives**: Box, Stack, Row, Flex
- **Hooks**: useMediaQuery, useBreakpoint, useWindowDimensions

### Phase 2 (📅 Planned)
- **Button**: Primary, secondary, outlined, ghost, danger variants
- **Input**: TextInput, TextArea, NumberInput, PasswordInput, SearchInput
- **Selection**: Checkbox, Radio, Switch

### Phase 3+ (📅 Future)
- Alert, Toast, Dialog, Popover, Select, and more...

## Development Roadmap

See the [full roadmap](/Users/clay/.claude/plans/abstract-spinning-bachman.md) for detailed implementation plans.

**MVP Target**: v0.1.0 (10-12 weeks)
- Phase 0: Package setup + design tokens ✅
- Phase 1: Layout primitives (Week 3-4)
- Phase 2: Core components (Week 5-8)
- Phase 3: Feedback components (Week 9-10)

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Building

```bash
# Build package
pnpm build

# Watch mode
pnpm watch

# Type check
pnpm typecheck
```

## License

MIT © Scaffald

## Related Packages

- [`@unicornlove/ui`](../ui) - Current Tamagui-based UI library (legacy)
