---
sidebar_position: 1
slug: intro
---

# Welcome to Scaffald UI

**Best-in-class UI framework for Expo (React Native + Web)**

Scaffald UI is a production-ready component library built with inline styles for React Native and web. Designed from the Forsured Design System with a focus on developer experience, accessibility, and performance.

## ✨ Features

- 🎨 **90+ Production-Ready Components** - Comprehensive component library covering all common UI patterns
- 🌐 **Cross-Platform** - Native support for React Native (iOS, Android) and web with a single codebase
- 📘 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- ♿ **Accessible** - WCAG 2.1 AA compliant components with proper ARIA attributes
- ⚡ **Performant** - Inline styles with minimal runtime overhead and excellent tree-shaking
- 🎭 **Themeable** - Design tokens mapped directly from Figma with light/dark mode support
- 📦 **Tree-Shakeable** - Import only what you need for optimal bundle sizes
- 🧪 **Well-Tested** - >80% test coverage across all components

## 🚀 Quick Start

Get started with Scaffald UI in under 5 minutes:

```bash
# Install the package
npm install @scaffald/ui react react-native

# Or with pnpm
pnpm add @scaffald/ui react react-native
```

```tsx
import { Button, Stack, TextInput } from '@scaffald/ui';
import { useState } from 'react';

function MyForm() {
  const [email, setEmail] = useState('');

  return (
    <Stack gap={16}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
      />
      <Button variant="filled" color="primary" onPress={() => {}}>
        Submit
      </Button>
    </Stack>
  );
}
```

## 📚 What's Next?

- **[Installation Guide](./guide/installation)** - Detailed setup instructions
- **[Quick Start Tutorial](./guide/quick-start)** - Build your first app
- **[Components Overview](./components/overview)** - Explore all 90+ components
- **[Theming Guide](./guide/theming)** - Customize colors and design tokens

## 🎯 Why Scaffald UI?

### Built for Expo
Scaffald UI is designed specifically for Expo applications, providing seamless integration with Expo SDK and optimal performance on mobile and web.

### Design System First
Every component is built from the Forsured Design System in Figma, ensuring visual consistency and professional design out of the box.

### Developer Experience
Intuitive APIs, comprehensive TypeScript support, and excellent documentation make it easy to build beautiful UIs quickly.

### Production Ready
Battle-tested in production apps with thousands of users. Continuously maintained and updated.

## 🤝 Community

- **[GitHub Repository](https://github.com/Scaffald/ui)** - Star us and contribute
- **[Report Issues](https://github.com/Scaffald/ui/issues)** - Found a bug? Let us know
- **[Contributing Guide](https://github.com/Scaffald/ui/blob/main/CONTRIBUTING.md)** - Help improve Scaffald UI

## 📄 License

MIT © Scaffald
