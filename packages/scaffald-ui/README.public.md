# @scaffald/ui

**Best-in-class UI framework for Expo (React Native + Web)**

[![npm version](https://img.shields.io/npm/v/@scaffald/ui.svg)](https://www.npmjs.com/package/@scaffald/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-ui.scaffald.com-brightgreen)](https://ui.scaffald.com)

Production-ready component library built with inline styles for React Native and web. Designed from the Forsured Design System with 90+ components, comprehensive theming, and excellent TypeScript support.

## ✨ Features

- 🎨 **90+ Production-Ready Components** - Complete UI toolkit
- 🌐 **Cross-Platform** - iOS, Android, and Web with single codebase
- 📘 **Type-Safe** - Full TypeScript support
- ♿ **Accessible** - WCAG 2.1 AA compliant
- ⚡ **Performant** - Inline styles, minimal overhead
- 🎭 **Themeable** - Light/dark mode + custom themes
- 📦 **Tree-Shakeable** - Import only what you need

## 📦 Installation

```bash
npm install @scaffald/ui react react-native
```

For Expo apps:

```bash
npx expo install @scaffald/ui react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-svg
```

## 🚀 Quick Start

```tsx
import { Button, Stack, TextInput } from '@scaffald/ui';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <Stack gap={16}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <Button variant="filled" color="primary">
        Sign In
      </Button>
    </Stack>
  );
}
```

## 📚 Documentation

**[Read the full documentation →](https://ui.scaffald.com)**

- [Installation Guide](https://ui.scaffald.comdocs/guide/installation)
- [Quick Start Tutorial](https://ui.scaffald.comdocs/guide/quick-start)
- [Components Overview](https://ui.scaffald.comdocs/components/overview)
- [Theming Guide](https://ui.scaffald.comdocs/guide/theming)
- [Design Tokens](https://ui.scaffald.comdocs/tokens/overview)

## 🎨 Component Categories

### Form Components
Button, TextInput, Textarea, Select, Checkbox, Radio, Toggle, Slider, DatePicker

### Layout
Stack, Row, Container, Divider, Spacer, Grid

### Navigation
Tabs, Breadcrumbs, Pagination, Menu, Drawer

### Feedback
Alert, Toast, Modal, Dialog, Progress, Spinner, Skeleton, Badge, Tooltip

### Data Display
Card, Table, List, Avatar, Chip, Icon, Image

### Typography
Text, Heading, Link

[View all 90+ components →](https://ui.scaffald.comdocs/components/overview)

## 🎯 Why Scaffald UI?

### Built for Expo
Designed specifically for Expo applications with seamless SDK integration and optimal performance on mobile and web.

### Design System First
Every component built from the Forsured Design System in Figma, ensuring visual consistency and professional design.

### Developer Experience
Intuitive APIs, comprehensive TypeScript support, and excellent documentation make building beautiful UIs quick and easy.

### Production Ready
Battle-tested in production apps with thousands of users. Continuously maintained and updated.

## 🤝 Contributing

We welcome contributions! However, this repository is a **read-only mirror** of the main monorepo.

**To contribute:**
1. Visit the [main repository](https://github.com/unicornlove/UNI-Construct)
2. Follow the [contributing guide](https://github.com/Scaffald/ui/blob/main/CONTRIBUTING.md)
3. Submit PRs to the monorepo

Changes will be automatically synced to this public repository.

## 📄 License

MIT © Scaffald

## 🔗 Links

- **[Documentation](https://ui.scaffald.com)** - Full documentation and guides
- **[npm Package](https://www.npmjs.com/package/@scaffald/ui)** - Install from npm
- **[GitHub](https://github.com/Scaffald/ui)** - Source code (mirror)
- **[Issues](https://github.com/Scaffald/ui/issues)** - Report bugs
- **[Scaffald SDK](https://scaffald.github.io/sdk/)** - Companion SDK

---

**Made with ❤️ by the Scaffald team**
