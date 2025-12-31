# Unified Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all styling into `@unicornlove/ui` so both Scaffald and Forsured share the same design system with zero CSS duplication.

**Architecture:** All color tokens, spacing, typography, and reusable components live in `@unicornlove/ui`. Both apps import and consume the shared theme. No local CSS files for styling.

**Tech Stack:** Tamagui, TypeScript, React, pnpm workspaces

---

## Phase 1: Foundation Setup

### Task 1.1: Audit and Export Missing Primitives from @unicornlove/ui

**Files:**
- Modify: `packages/ui/src/index.tsx`

**Step 1: Verify exports include all needed primitives**

Check that these are exported (most already are):
```typescript
// Already exported - verify these work
export * from '@tamagui/accordion'
export * from '@tamagui/avatar'
export * from '@tamagui/checkbox'
export * from '@tamagui/progress'
export * from '@tamagui/radio-group'
export * from '@tamagui/switch'
export * from '@tamagui/tabs'
export * from '@tamagui/tooltip'
```

**Step 2: Run build to verify**

```bash
pnpm --filter @unicornlove/ui build
```
Expected: Build succeeds

**Step 3: Commit if changes made**

```bash
git add packages/ui/src/index.tsx
git commit -m "chore(ui): verify primitive exports for design system consolidation"
```

---

## Phase 2: Component Migration to @unicornlove/ui

### Task 2.1: Move Alert Component

**Files:**
- Create: `packages/ui/src/components/alert/Alert.tsx`
- Create: `packages/ui/src/components/alert/index.ts`
- Modify: `packages/ui/src/components/index.ts`
- Test: `packages/ui/src/__tests__/Alert.test.tsx`

**Step 1: Write the test**

```typescript
// packages/ui/src/__tests__/Alert.test.tsx
import { render, screen } from '@testing-library/react'
import { Alert } from '../components/alert'
import { TamaguiProvider } from 'tamagui'
import { config } from '../tamagui.config'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

describe('Alert', () => {
  it('renders info variant by default', () => {
    render(<Alert>Test message</Alert>, { wrapper: Wrapper })
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders with title', () => {
    render(<Alert title="Alert Title">Content</Alert>, { wrapper: Wrapper })
    expect(screen.getByText('Alert Title')).toBeInTheDocument()
  })

  it('renders all variants', () => {
    const variants = ['info', 'success', 'warning', 'error'] as const
    variants.forEach(variant => {
      const { unmount } = render(
        <Alert variant={variant}>{variant} message</Alert>,
        { wrapper: Wrapper }
      )
      expect(screen.getByText(`${variant} message`)).toBeInTheDocument()
      unmount()
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @unicornlove/ui test Alert
```
Expected: FAIL - module not found

**Step 3: Create the Alert component**

```typescript
// packages/ui/src/components/alert/Alert.tsx
import { ReactNode } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { YStack, XStack, Text, styled, useTheme } from 'tamagui'
import { Button } from '../buttons'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  onClose?: () => void
  closable?: boolean
  icon?: boolean
}

const AlertContainer = styled(YStack, {
  name: 'AlertContainer',
  borderRadius: '$4',
  borderWidth: 1,
  padding: '$4',
  variants: {
    variant: {
      info: {
        backgroundColor: '$blue2',
        borderColor: '$blue4',
      },
      success: {
        backgroundColor: '$green2',
        borderColor: '$green4',
      },
      warning: {
        backgroundColor: '$orange2',
        borderColor: '$orange4',
      },
      error: {
        backgroundColor: '$red2',
        borderColor: '$red4',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'info',
  },
})

const variantConfig = {
  info: { icon: Info, colorKey: 'blue' },
  success: { icon: CheckCircle, colorKey: 'green' },
  warning: { icon: AlertTriangle, colorKey: 'orange' },
  error: { icon: XCircle, colorKey: 'red' },
} as const

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  closable = false,
  icon = true,
}: AlertProps) {
  const theme = useTheme()
  const config = variantConfig[variant]
  const Icon = config.icon
  const colorKey = config.colorKey

  return (
    <AlertContainer variant={variant}>
      <XStack>
        {icon && (
          <XStack flexShrink={0}>
            <Icon color={theme[`${colorKey}9`]?.val} size={20} />
          </XStack>
        )}
        <YStack flex={1} marginLeft={icon ? '$3' : '$0'}>
          {title && (
            <Text
              fontSize="$2"
              fontWeight="600"
              marginBottom="$1"
              color={`$${colorKey}11`}
            >
              {title}
            </Text>
          )}
          <Text fontSize="$2" color={`$${colorKey}10`}>
            {children}
          </Text>
        </YStack>
        {closable && onClose && (
          <XStack flexShrink={0} marginLeft="$3">
            <Button
              size="$2"
              circular
              chromeless
              onPress={onClose}
              aria-label="Dismiss"
            >
              <X size={16} color={theme[`${colorKey}9`]?.val} />
            </Button>
          </XStack>
        )}
      </XStack>
    </AlertContainer>
  )
}
```

**Step 4: Create index export**

```typescript
// packages/ui/src/components/alert/index.ts
export { Alert } from './Alert'
export type { AlertProps, AlertVariant } from './Alert'
```

**Step 5: Add to components index**

```typescript
// Add to packages/ui/src/components/index.ts
export * from './alert'
```

**Step 6: Run tests**

```bash
pnpm --filter @unicornlove/ui test Alert
```
Expected: PASS

**Step 7: Commit**

```bash
git add packages/ui/src/components/alert packages/ui/src/__tests__/Alert.test.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add Alert component to shared library"
```

---

### Task 2.2: Move Custom Tabs Component

**Files:**
- Create: `packages/ui/src/components/tabs-custom/TabsCustom.tsx`
- Create: `packages/ui/src/components/tabs-custom/index.ts`
- Modify: `packages/ui/src/components/index.ts`
- Test: `packages/ui/src/__tests__/TabsCustom.test.tsx`

**Step 1: Write the test**

```typescript
// packages/ui/src/__tests__/TabsCustom.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TabsCustom } from '../components/tabs-custom'
import { TamaguiProvider } from 'tamagui'
import { config } from '../tamagui.config'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

const mockTabs = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
]

describe('TabsCustom', () => {
  it('renders tabs', () => {
    render(<TabsCustom tabs={mockTabs} />, { wrapper: Wrapper })
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('shows first tab content by default', () => {
    render(<TabsCustom tabs={mockTabs} />, { wrapper: Wrapper })
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('switches tab on click', () => {
    render(<TabsCustom tabs={mockTabs} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Tab 2'))
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('supports all variants', () => {
    const variants = ['line', 'pill', 'enclosed'] as const
    variants.forEach(variant => {
      const { unmount } = render(
        <TabsCustom tabs={mockTabs} variant={variant} />,
        { wrapper: Wrapper }
      )
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      unmount()
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @unicornlove/ui test TabsCustom
```
Expected: FAIL

**Step 3: Copy and adapt TabsCustom component**

Copy from `apps/forsured-web/src/ui/Tabs.tsx` to `packages/ui/src/components/tabs-custom/TabsCustom.tsx`, updating imports to use local package paths.

**Step 4: Create index and update exports**

```typescript
// packages/ui/src/components/tabs-custom/index.ts
export { default as TabsCustom } from './TabsCustom'
export type { TabsProps as TabsCustomProps, Tab } from './TabsCustom'
```

**Step 5: Run tests**

```bash
pnpm --filter @unicornlove/ui test TabsCustom
```
Expected: PASS

**Step 6: Commit**

```bash
git add packages/ui/src/components/tabs-custom packages/ui/src/__tests__/TabsCustom.test.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add TabsCustom component with line/pill/enclosed variants"
```

---

### Task 2.3: Move EmptyState Component

**Files:**
- Create: `packages/ui/src/components/empty-state/EmptyState.tsx`
- Create: `packages/ui/src/components/empty-state/index.ts`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Write test**

```typescript
// packages/ui/src/__tests__/EmptyState.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '../components/empty-state'
import { TamaguiProvider } from 'tamagui'
import { config } from '../tamagui.config'
import { Inbox } from 'lucide-react'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState title="No items" description="Add your first item" />,
      { wrapper: Wrapper }
    )
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Add your first item')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(
      <EmptyState icon={Inbox} title="Empty" description="Nothing here" />,
      { wrapper: Wrapper }
    )
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="No items"
        description="Get started"
        action={{ label: 'Add Item', onClick: onAction }}
      />,
      { wrapper: Wrapper }
    )
    fireEvent.click(screen.getByText('Add Item'))
    expect(onAction).toHaveBeenCalled()
  })
})
```

**Step 2-6: Follow same pattern as Alert**

Copy from `apps/forsured-web/src/ui/EmptyState.tsx`, adapt imports, create index, run tests, commit.

```bash
git commit -m "feat(ui): add EmptyState component to shared library"
```

---

### Task 2.4: Move Remaining UI Components

Repeat the pattern for each component:

| Source | Destination | Commit Message |
|--------|-------------|----------------|
| `forsured-web/src/ui/Breadcrumbs.tsx` | `packages/ui/src/components/breadcrumbs/` | `feat(ui): add Breadcrumbs component` |
| `forsured-web/src/ui/Divider.tsx` | `packages/ui/src/components/divider/` | `feat(ui): add Divider component` |
| `forsured-web/src/ui/Progress.tsx` | `packages/ui/src/components/progress-custom/` | `feat(ui): add ProgressCustom component` |
| `forsured-web/src/ui/Radio.tsx` | `packages/ui/src/components/radio-custom/` | `feat(ui): add RadioCustom component` |
| `forsured-web/src/ui/Pagination.tsx` | `packages/ui/src/components/pagination/` | `feat(ui): add Pagination component` |
| `forsured-web/src/ui/CodeBlock.tsx` | `packages/ui/src/components/code-block/` | `feat(ui): add CodeBlock component` |

For each:
1. Write failing test
2. Verify test fails
3. Copy and adapt component
4. Create index export
5. Run tests
6. Commit

---

## Phase 3: Update Forsured Imports

### Task 3.1: Update forsured-web to use shared components

**Files:**
- Modify: `apps/forsured-web/src/ui/*.tsx` (convert to re-exports)

**Step 1: Convert local components to re-exports**

```typescript
// apps/forsured-web/src/ui/Alert.tsx
export { Alert } from '@unicornlove/ui'
export type { AlertProps, AlertVariant } from '@unicornlove/ui'
```

```typescript
// apps/forsured-web/src/ui/Tabs.tsx
export { TabsCustom as default } from '@unicornlove/ui'
export type { TabsCustomProps as TabsProps, Tab } from '@unicornlove/ui'
```

**Step 2: Verify build**

```bash
pnpm --filter @unicornlove/forsured-app build
```
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/forsured-web/src/ui/
git commit -m "refactor(forsured): use shared UI components from @unicornlove/ui"
```

---

## Phase 4: CSS-to-Tamagui Migration

### Task 4.1: Migrate EnhancedManagerDashboard

**Files:**
- Modify: `apps/forsured-web/src/components/Dashboard/EnhancedManagerDashboard.tsx`

**Step 1: Create before screenshot (manual)**

Open http://localhost:5173/manager/dashboard and screenshot for comparison.

**Step 2: Convert className to Tamagui**

Pattern conversions:
```tsx
// Before
<div className="space-y-6">
// After
<YStack gap="$6">

// Before
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// After
<XStack flexWrap="wrap" gap="$4">
  <YStack width="100%" $md={{ width: '50%' }} $lg={{ width: '25%' }}>

// Before
<div className="bg-surface rounded-lg shadow-sm border border-border p-5">
// After
<YStack
  backgroundColor="$background"
  borderRadius="$4"
  shadowColor="$shadowColor"
  shadowRadius={2}
  shadowOffset={{ width: 0, height: 1 }}
  borderWidth={1}
  borderColor="$borderColor"
  padding="$5"
>

// Before
<h1 className="font-display text-3xl font-bold text-text-primary">
// After
<Text fontFamily="$display" fontSize="$9" fontWeight="700" color="$color12">

// Before
<p className="text-text-secondary text-lg">
// After
<Text color="$color11" fontSize="$5">

// Before
<span className="text-2xl font-bold text-text-primary">
// After
<Text fontSize="$8" fontWeight="700" color="$color12">

// Before
<div className="flex items-center justify-center min-h-[400px]">
// After
<YStack alignItems="center" justifyContent="center" minHeight={400}>
```

**Step 3: Run build to verify**

```bash
pnpm --filter @unicornlove/forsured-app build
```
Expected: Build succeeds with no className errors

**Step 4: Visual comparison (manual)**

Compare screenshot before/after. Should look identical.

**Step 5: Commit**

```bash
git add apps/forsured-web/src/components/Dashboard/EnhancedManagerDashboard.tsx
git commit -m "refactor(forsured): migrate EnhancedManagerDashboard to Tamagui"
```

---

### Task 4.2: Migrate EnhancedSubcontractorDashboard

Same pattern as Task 4.1 for `EnhancedSubcontractorDashboard.tsx`.

```bash
git commit -m "refactor(forsured): migrate EnhancedSubcontractorDashboard to Tamagui"
```

---

### Task 4.3: Migrate EnhancedBrokerDashboard

Same pattern as Task 4.1 for `EnhancedBrokerDashboard.tsx`.

```bash
git commit -m "refactor(forsured): migrate EnhancedBrokerDashboard to Tamagui"
```

---

### Task 4.4: Migrate Remaining Files with className

**Files to migrate (by priority):**

High priority (pages):
- `apps/forsured-web/src/pages/Signup.tsx`
- `apps/forsured-web/src/pages/Start.tsx` (minimal - just spinner)
- `apps/forsured-web/src/pages/Home.tsx`

Medium priority (components):
- `apps/forsured-web/src/components/Layout/*.tsx`
- `apps/forsured-web/src/components/Common/*.tsx`
- `apps/forsured-web/src/components/admin/*.tsx`

For each file:
1. Convert `className` to Tamagui style props
2. Replace `<div>` with `<YStack>` or `<XStack>`
3. Replace `<span>` with `<Text>`
4. Verify build passes
5. Commit with descriptive message

---

## Phase 5: CSS Cleanup

### Task 5.1: Strip index.css to Minimal

**Files:**
- Modify: `apps/forsured-web/src/index.css`

**Step 1: Replace entire CSS file**

```css
/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Rokkitt:wght@400;500;600;700;800&display=swap');

/* Minimal reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Root font smoothing */
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Prevent FOUC */
body {
  visibility: visible;
}
```

**Step 2: Search for any remaining CSS variable usage**

```bash
grep -r "var(--color" apps/forsured-web/src/ | wc -l
```
Expected: 0 (no CSS variable references remain)

**Step 3: Build and test**

```bash
pnpm --filter @unicornlove/forsured-app build
```
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/forsured-web/src/index.css
git commit -m "refactor(forsured): reduce index.css to minimal reset (438 → 20 lines)"
```

---

## Phase 6: Verification

### Task 6.1: Full Build Verification

**Step 1: Build both apps**

```bash
pnpm build
```
Expected: All packages build successfully

**Step 2: Run forsured tests**

```bash
pnpm test:forsured
```
Expected: All tests pass

**Step 3: Run UI package tests**

```bash
pnpm --filter @unicornlove/ui test
```
Expected: All tests pass

---

### Task 6.2: Visual QA Checklist

Manual verification:
- [ ] Start page renders correctly
- [ ] Signup flow works
- [ ] Manager dashboard displays properly
- [ ] Subcontractor dashboard displays properly
- [ ] Broker dashboard displays properly
- [ ] Modals open/close correctly
- [ ] Forms submit properly
- [ ] Light/dark theme switching works
- [ ] Responsive layouts work at mobile/tablet/desktop

---

## Success Criteria

- [ ] All reusable components exported from `@unicornlove/ui`
- [ ] Zero `className` usages for styling in forsured-web (except third-party)
- [ ] `index.css` reduced to ~20 lines
- [ ] Both apps build successfully
- [ ] All tests pass
- [ ] Visual parity maintained

---

## Token Reference (for migrations)

| Tailwind/CSS | Tamagui Token |
|--------------|---------------|
| `text-xs` | `fontSize="$1"` |
| `text-sm` | `fontSize="$2"` |
| `text-base` | `fontSize="$3"` |
| `text-lg` | `fontSize="$5"` |
| `text-xl` | `fontSize="$6"` |
| `text-2xl` | `fontSize="$8"` |
| `text-3xl` | `fontSize="$9"` |
| `font-medium` | `fontWeight="500"` |
| `font-semibold` | `fontWeight="600"` |
| `font-bold` | `fontWeight="700"` |
| `p-1` | `padding="$1"` |
| `p-2` | `padding="$2"` |
| `p-4` | `padding="$4"` |
| `p-6` | `padding="$6"` |
| `gap-2` | `gap="$2"` |
| `gap-4` | `gap="$4"` |
| `gap-6` | `gap="$6"` |
| `rounded-md` | `borderRadius="$2"` |
| `rounded-lg` | `borderRadius="$4"` |
| `rounded-xl` | `borderRadius="$6"` |
| `text-text-primary` | `color="$color12"` |
| `text-text-secondary` | `color="$color11"` |
| `text-text-tertiary` | `color="$color10"` |
| `bg-surface` | `backgroundColor="$background"` |
| `border-border` | `borderColor="$borderColor"` |
| `text-primary-500` | `color="$primary9"` |
| `bg-primary-100` | `backgroundColor="$primary2"` |
| `text-success-600` | `color="$green9"` |
| `bg-success-100` | `backgroundColor="$green2"` |
| `text-error-500` | `color="$red9"` |
