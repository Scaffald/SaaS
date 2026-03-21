---
sidebar_position: 1
---

# Form Examples

Complete examples demonstrating form patterns with Scaffald UI components.

## Login Form

```tsx
import { useState } from 'react';
import { Button, Input, Stack, Text, ThemeProvider } from '@scaffald/ui';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ThemeProvider initialTheme="light">
      <Stack gap={16} style={{ maxWidth: 400, padding: 24 }}>
        <Text size="xl" weight="bold">Sign In</Text>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button variant="filled" color="primary">
          Sign In
        </Button>
      </Stack>
    </ThemeProvider>
  );
}
```

## Registration Form

```tsx
import { useState } from 'react';
import {
  Button,
  Checkbox,
  Input,
  PasswordInput,
  PasswordStrength,
  Stack,
  Text,
} from '@scaffald/ui';

function RegistrationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <Stack gap={16} style={{ maxWidth: 400, padding: 24 }}>
      <Text size="xl" weight="bold">Create Account</Text>
      <Input label="Full Name" value={name} onChangeText={setName} />
      <Input label="Email" value={email} onChangeText={setEmail} />
      <PasswordInput label="Password" value={password} onChangeText={setPassword} />
      <PasswordStrength password={password} />
      <Checkbox
        label="I agree to the Terms of Service"
        checked={agreed}
        onChange={setAgreed}
      />
      <Button variant="filled" color="primary" disabled={!agreed}>
        Create Account
      </Button>
    </Stack>
  );
}
```

## Settings Form

```tsx
import { Button, Input, Row, Stack, Text, Toggle } from '@scaffald/ui';

function SettingsForm() {
  return (
    <Stack gap={24} style={{ maxWidth: 500, padding: 24 }}>
      <Text size="xl" weight="bold">Account Settings</Text>

      <Stack gap={16}>
        <Input label="Display Name" defaultValue="Jane Smith" />
        <Input label="Email" defaultValue="jane@example.com" />
        <Input label="Bio" multiline numberOfLines={3} />
      </Stack>

      <Stack gap={12}>
        <Text weight="semibold">Notifications</Text>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Email notifications</Text>
          <Toggle defaultValue={true} />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Push notifications</Text>
          <Toggle defaultValue={false} />
        </Row>
      </Stack>

      <Row gap={12}>
        <Button variant="outline">Cancel</Button>
        <Button variant="filled" color="primary">Save Changes</Button>
      </Row>
    </Stack>
  );
}
```

## Form Validation

```tsx
import { Button, FieldError, Input, Stack } from '@scaffald/ui';

function ValidatedForm() {
  return (
    <Stack gap={16} style={{ maxWidth: 400, padding: 24 }}>
      <Stack gap={4}>
        <Input label="Email" state="error" placeholder="you@example.com" />
        <FieldError message="Please enter a valid email address" />
      </Stack>
      <Stack gap={4}>
        <Input label="Username" state="success" value="janedoe" />
      </Stack>
      <Button variant="filled" color="primary">Submit</Button>
    </Stack>
  );
}
```

## See Also

- [Button](../components/button) - Button component documentation
- [Input](../components/input) - Input component documentation
- [Theming Guide](../guide/theming) - Theme configuration
