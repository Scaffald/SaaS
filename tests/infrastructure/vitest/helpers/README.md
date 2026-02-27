# Test Helper Utilities

This directory contains centralized test utilities for common testing patterns.

## Available Helpers

### `theme-setup.tsx` (Beyond-UI)

Utilities for setting up theme (Beyond-UI) in tests:

```tsx
import { BeyondUIThemeWrapper } from '@/tests/infrastructure/vitest/helpers/theme-setup';

<BeyondUIThemeWrapper>
  <YourComponent />
</BeyondUIThemeWrapper>
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

// Render with default providers
const { getByText } = renderWithProviders(<YourComponent />);

// Render with Form provider
const { getByText } = renderWithProviders(<YourFormComponent />, {
  withTheme: true,
  withForm: true,
  formOptions: { defaultValues: { name: 'Test' } },
});

// Render without theme provider
const { getByText } = renderWithProviders(<YourComponent />, {
  withTheme: false,
});
```

## Beyond UI mocks

### `mocks/beyond-ui-complete.tsx`

Full Beyond UI mock for tests that cannot use theme-setup. Prefer theme-setup and real Beyond UI when possible:

```tsx
import { setupBeyondUIMocks } from '@/tests/infrastructure/vitest/mocks/beyond-ui-complete';
setupBeyondUIMocks();
```

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

For new tests, use Beyond UI and the app's theme/UI provider (theme-setup). Use `beyond-ui-complete` only when a full mock is required.

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

