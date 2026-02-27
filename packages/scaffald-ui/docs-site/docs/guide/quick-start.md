---
sidebar_position: 2
---

# Quick Start

Build your first Scaffald UI component in under 5 minutes.

## Create Your First Component

Let's build a simple login form to demonstrate Scaffald UI's capabilities:

```tsx
import { Button, Stack, TextInput, Text } from '@scaffald/ui';
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login:', { email, password });
  };

  return (
    <Stack gap={20} padding={24}>
      <Text variant="h2">Welcome Back</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
      />

      <Button
        variant="filled"
        color="primary"
        onPress={handleLogin}
        disabled={!email || !password}
      >
        Sign In
      </Button>
    </Stack>
  );
}
\`\`\`

## Understanding the Code

### Layout with Stack

The `Stack` component provides vertical layout with automatic spacing:

```tsx
<Stack gap={20} padding={24}>
  {/* Children are automatically spaced 20px apart */}
</Stack>
```

### Typography

Use the `Text` component with variant prop for consistent typography:

```tsx
<Text variant="h2">Welcome Back</Text>
```

### Form Inputs

`TextInput` provides a full-featured input with label and validation:

```tsx
<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="you@example.com"
/>
```

### Buttons

The `Button` component supports multiple variants and states:

```tsx
<Button
  variant="filled"
  color="primary"
  disabled={!email || !password}
>
  Sign In
</Button>
```

## Next Steps

### Add Validation

```tsx
import { TextInput, HelperText } from '@scaffald/ui';

const [emailError, setEmailError] = useState('');

<TextInput
  label="Email"
  value={email}
  onChangeText={(text) => {
    setEmail(text);
    if (!text.includes('@')) {
      setEmailError('Invalid email');
    } else {
      setEmailError('');
    }
  }}
  error={emailError}
/>
{emailError && <HelperText error>{emailError}</HelperText>}
```

### Add Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button
  variant="filled"
  color="primary"
  onPress={handleLogin}
  loading={isLoading}
>
  Sign In
</Button>
```

### Style with Tokens

```tsx
import { Stack, spacing, colors } from '@scaffald/ui';
import { useThemeContext } from '@scaffald/ui';

function MyComponent() {
  const { theme } = useThemeContext();

  return (
    <Stack
      gap={spacing[4]}
      style={{
        backgroundColor: colors.bg[theme].default,
        borderRadius: 8,
      }}
    >
      {/* Content */}
    </Stack>
  );
}
```

## Common Patterns

### Responsive Layout

```tsx
import { Row, Stack, Responsive } from '@scaffald/ui';

<Responsive
  mobile={
    <Stack gap={16}>
      <TextInput label="First Name" />
      <TextInput label="Last Name" />
    </Stack>
  }
  desktop={
    <Row gap={16}>
      <TextInput label="First Name" />
      <TextInput label="Last Name" />
    </Row>
  }
/>
```

### Cards and Containers

```tsx
import { Card, Stack, Text, Button } from '@scaffald/ui';

<Card>
  <Stack gap={16} padding={20}>
    <Text variant="h3">Account Settings</Text>
    <Text variant="body">
      Manage your account preferences
    </Text>
    <Button variant="outline">
      Edit Settings
    </Button>
  </Stack>
</Card>
```

### Lists

```tsx
import { List, ListItem, Avatar } from '@scaffald/ui';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

<List>
  {users.map(user => (
    <ListItem
      key={user.id}
      leading={<Avatar name={user.name} />}
      title={user.name}
      subtitle={user.email}
      onPress={() => console.log('Selected:', user)}
    />
  ))}
</List>
```

## Learn More

- **[Theming Guide](./theming)** - Customize colors and design tokens
- **[Components Overview](../components/overview)** - Explore all components
- **[Design Tokens](../tokens/overview)** - Understanding the design system
- **[Examples](../examples/forms)** - Real-world examples
