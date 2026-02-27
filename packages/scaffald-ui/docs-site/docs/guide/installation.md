---
sidebar_position: 1
---

# Installation

Learn how to install and configure Scaffald UI in your Expo or React Native project.

## Prerequisites

- Node.js >= 20.0
- React >= 19.0.0
- React Native >= 0.83.0 (for native apps)
- Expo SDK >= 55.0 (for Expo apps)

## Package Installation

Install Scaffald UI and its peer dependencies:

```bash
# Using npm
npm install @scaffald/ui react react-native

# Using pnpm (recommended)
pnpm add @scaffald/ui react react-native

# Using yarn
yarn add @scaffald/ui react react-native
```

## Expo Setup

If you're using Expo, you'll also need these additional dependencies:

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-svg
```

### Configure babel.config.js

Add the Reanimated plugin to your `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
```

## Web Setup (React Native Web)

For web applications, install `react-native-web`:

```bash
npm install react-native-web
```

### Webpack/Vite Configuration

If using a custom bundler, alias `react-native` to `react-native-web`:

**Webpack:**
```js
module.exports = {
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
  },
};
```

**Vite:**
```js
export default {
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
};
```

## Font Setup (Optional but Recommended)

Scaffald UI uses system fonts by default, but for the best experience, install Inter font:

```bash
npx expo install expo-font @expo-google-fonts/inter
```

Then load fonts in your app:

```tsx
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <YourApp />;
}
```

## TypeScript Configuration

Scaffald UI is written in TypeScript and includes type definitions. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "jsx": "react-native",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Verify Installation

Create a test component to verify everything works:

```tsx
import { Button, Stack, Text } from '@scaffald/ui';

export default function TestScreen() {
  return (
    <Stack gap={16} padding={16}>
      <Text variant="h1">Hello Scaffald UI!</Text>
      <Button variant="filled" color="primary" onPress={() => alert('Works!')}>
        Click Me
      </Button>
    </Stack>
  );
}
```

If you see the styled button and text, you're all set!

## Next Steps

- [Quick Start Tutorial](./quick-start) - Build your first UI
- [Theming Guide](./theming) - Customize colors and tokens
- [Components Overview](../components/overview) - Explore all components
