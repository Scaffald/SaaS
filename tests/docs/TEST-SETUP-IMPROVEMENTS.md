# Test Setup Improvements

This document describes the improvements made to centralize test setup and separate Deno tests.

## Changes Made

### 1. Separated Deno Tests

**Problem**: Deno tests in `packages/supabase/tests/routers/*.test.ts` were being picked up by Vitest, causing "Deno is not defined" errors.

**Solution**:
- Updated `vitest.config.ts` to exclude Deno test files
- Added `test:deno` command to `package.json` to run Deno tests separately

**Usage**:
```bash
# Run Deno tests
pnpm test:deno

# Run Vitest tests (now excludes Deno tests)
pnpm test:unit
```

### 2. Centralized Test Setup Utilities

**Problem**: Tests had inconsistent setup with duplicated mocks and providers.

**Solution**: Created centralized utilities in `tests/infrastructure/vitest/helpers/`:

#### `tamagui-setup.tsx`
Provides Tamagui provider wrapper for tests:
```tsx
import { TamaguiTestWrapper } from '@/tests/infrastructure/vitest/helpers/tamagui-setup';

<TamaguiTestWrapper>
  <YourComponent />
</TamaguiTestWrapper>
```

#### `form-setup.tsx`
Provides React Hook Form provider wrapper:
```tsx
import { FormTestWrapper } from '@/tests/infrastructure/vitest/helpers/form-setup';

<FormTestWrapper formOptions={{ defaultValues: { name: 'Test' } }}>
  <YourFormComponent />
</FormTestWrapper>
```

#### `test-utils.tsx`
Enhanced render function that combines providers:
```tsx
import { render } from '@/tests/infrastructure/vitest/helpers/test-utils';

// Automatically includes Tamagui provider
const { getByText } = render(<YourComponent />);

// Include both Tamagui and Form providers
const { getByText } = render(<YourFormComponent />, {
  withTamagui: true,
  withForm: true,
  formOptions: { defaultValues: { name: 'Test' } },
});
```

### 3. Comprehensive Tamagui Mocks

**Problem**: Tests had incomplete Tamagui mocks, causing "No 'X' export is defined" errors.

**Solution**: Created `tests/infrastructure/vitest/mocks/tamagui-complete.tsx` with:
- All stack components (YStack, XStack, ZStack, HStack, VStack)
- Basic components (View, Text, Input, TextArea, Button, Image, ScrollView)
- Form components (Select, Switch, Checkbox, RadioGroup)
- Typography components (H1-H6, Paragraph)
- Layout components (Card, Sheet, Dialog, Popover)
- Lucide icons (Briefcase, Image, X, Check, ChevronRight, etc.)

**Usage**:
```tsx
import { setupTamaguiMocks } from '@/tests/infrastructure/vitest/mocks/tamagui-complete';

// In your test file
setupTamaguiMocks();
```

## Migration Guide

### Migrating Existing Tests

#### Before (Inline Tamagui Mock):
```tsx
vi.mock('tamagui', () => ({
  YStack: ({ children }) => <div>{children}</div>,
  Text: ({ children }) => <span>{children}</span>,
  // ... many more components
}));
```

#### After (Centralized Mock):
```tsx
import { setupTamaguiMocks } from '@/tests/infrastructure/vitest/mocks/tamagui-complete';
setupTamaguiMocks();
```

#### Before (Missing Providers):
```tsx
import { render } from '@testing-library/react';
render(<Component />); // Missing Tamagui/Form providers
```

#### After (With Providers):
```tsx
import { render } from '@/tests/infrastructure/vitest/helpers/test-utils';
render(<Component />); // Automatically includes providers
```

## Benefits

1. **Consistency**: All tests use the same setup utilities
2. **Maintainability**: Update mocks in one place
3. **Completeness**: Comprehensive mocks reduce "missing export" errors
4. **Developer Experience**: Easier to write tests with pre-configured providers
5. **Separation**: Deno tests run separately, preventing environment conflicts

## Next Steps

1. Gradually migrate existing tests to use the new utilities
2. Update test templates to use centralized setup
3. Add more icons to `tamagui-complete.tsx` as needed
4. Consider adding more provider wrappers (e.g., React Query, Router)

## Files Changed

- `vitest.config.ts` - Excluded Deno tests
- `package.json` - Added `test:deno` command
- `tests/infrastructure/vitest/helpers/tamagui-setup.tsx` - New
- `tests/infrastructure/vitest/helpers/form-setup.tsx` - New
- `tests/infrastructure/vitest/helpers/test-utils.tsx` - New
- `tests/infrastructure/vitest/mocks/tamagui-complete.tsx` - New
- `tests/infrastructure/vitest/helpers/README.md` - New documentation

