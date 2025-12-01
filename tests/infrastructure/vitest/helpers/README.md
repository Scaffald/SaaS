# Test Helper Utilities

This directory contains centralized test utilities for common testing patterns.

## Available Helpers

### `tamagui-setup.tsx`

Utilities for setting up Tamagui in tests:

```tsx
import { TamaguiTestWrapper, withTamaguiProvider } from '@/tests/infrastructure/vitest/helpers/tamagui-setup';

// Option 1: Use the wrapper component
<TamaguiTestWrapper>
  <YourComponent />
</TamaguiTestWrapper>

// Option 2: Use the function
const wrapped = withTamaguiProvider(<YourComponent />);
```

### `form-setup.tsx`

Utilities for setting up React Hook Form in tests:

```tsx
import { FormTestWrapper, withFormProvider } from '@/tests/infrastructure/vitest/helpers/form-setup';

// Option 1: Use the wrapper component
<FormTestWrapper formOptions={{ defaultValues: { name: 'Test' } }}>
  <YourFormComponent />
</FormTestWrapper>

// Option 2: Use the function
const wrapped = withFormProvider(<YourFormComponent />, { defaultValues: { name: 'Test' } });
```

### `test-utils.tsx`

Custom render function that combines multiple providers:

```tsx
// Using the @test-helpers alias (configured in vitest.config.ts)
// @ts-expect-error - Vitest alias resolves at runtime
import { render } from '@test-helpers/test-utils';

// Or using relative path
import { render } from '../../../../../tests/infrastructure/vitest/helpers/test-utils';

// Render with Tamagui (default)
const { getByText } = renderWithProviders(<YourComponent />);

// Render with both Tamagui and Form providers
const { getByText } = renderWithProviders(<YourFormComponent />, {
  withTamagui: true,
  withForm: true,
  formOptions: { defaultValues: { name: 'Test' } },
});

// Render without Tamagui
const { getByText } = renderWithProviders(<YourComponent />, {
  withTamagui: false,
});
```

## Tamagui Mocks

### `mocks/tamagui-complete.tsx`

Comprehensive Tamagui mock that includes all commonly used components. Use this when you need to mock Tamagui globally:

```tsx
import { setupTamaguiMocks } from '@/tests/infrastructure/vitest/mocks/tamagui-complete';

// In your test file or setup
setupTamaguiMocks();
```

This will mock:
- All stack components (YStack, XStack, etc.)
- Basic components (View, Text, Input, Button, Image, etc.)
- Form components (Select, Switch, Checkbox, etc.)
- Typography components (H1-H6, Paragraph)
- Layout components (Card, Sheet, Dialog, etc.)
- Lucide icons (Briefcase, Image, X, Check, etc.)

## Best Practices

1. **Use `renderWithProviders`** instead of the default `render` from `@testing-library/react` when you need providers
2. **Import from test-utils** to get the enhanced render function:
   ```tsx
   import { render, screen } from '@/tests/infrastructure/vitest/helpers/test-utils';
   ```
3. **Use specific mocks** only when needed - the global setup should handle most cases
4. **Combine providers** when testing components that need multiple contexts

## Migration Guide

If you have existing tests with inline mocks, you can migrate them:

### Before:
```tsx
vi.mock('tamagui', () => ({
  YStack: ({ children }) => <div>{children}</div>,
  Text: ({ children }) => <span>{children}</span>,
  // ... many more
}));
```

### After:
```tsx
import { setupTamaguiMocks } from '@/tests/infrastructure/vitest/mocks/tamagui-complete';
setupTamaguiMocks();
```

### Before:
```tsx
import { render } from '@testing-library/react';
render(<Component />); // Missing providers
```

### After:
```tsx
// @ts-expect-error - Vitest alias @test-helpers resolves at runtime
import { render } from '@test-helpers/test-utils';
render(<Component />); // Automatically wrapped with providers
```

