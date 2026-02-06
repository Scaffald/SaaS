# Beyond-UI Migration Guide

This guide covers breaking changes and migration steps for upgrading beyond-ui to the latest version.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
  - [Theme System](#theme-system)
  - [Form Components API](#form-components-api)
  - [Style Props](#style-props)
- [New Features](#new-features)
  - [Grid Component](#grid-component)
  - [Responsive Utilities](#responsive-utilities)
- [Step-by-Step Migration](#step-by-step-migration)

---

## Overview

This release focuses on:
- **API Standardization**: Consistent prop naming across all components
- **Better Error Handling**: Unified error patterns for form components
- **New Layout Features**: Grid and responsive utilities
- **Improved Architecture**: Style factories for better performance

---

## Breaking Changes

### Theme System

**Change**: ThemeProvider moved from `/playground/` to `/theme/`

**Before:**
```typescript
import { ThemeProvider, useThemeContext } from '@unicornlove/beyond-ui/playground/ThemeProvider'
```

**After:**
```typescript
import { ThemeProvider, useThemeContext } from '@unicornlove/beyond-ui'
// or
import { ThemeProvider, useThemeContext } from '@unicornlove/beyond-ui/theme'
```

**Migration:**
Simply update your imports. The API remains unchanged.

---

### Form Components API

#### Input Component

**Change**: Deprecated style props and error handling

**Before:**
```typescript
<Input
  error="This field is required"  // ❌ String error (deprecated)
  containerStyle={{ margin: 10 }}  // ❌ Deprecated
  inputStyle={{ fontSize: 16 }}    // ❌ Deprecated
/>
```

**After:**
```typescript
<Input
  error={true}                     // ✅ Boolean error
  errorMessage="This field is required"  // ✅ Separate message
  style={{ margin: 10 }}           // ✅ Standard prop
  contentStyle={{ fontSize: 16 }} // ✅ Standard prop
/>
```

**Key Changes:**
- `error` is now `boolean` (not `string`)
- Added `errorMessage?: string` for error text
- Added `showError?: boolean` to control visibility (default: `true`)
- `containerStyle` → `style`
- `inputStyle` → `contentStyle`

---

#### Checkbox Component

**Change**: Added error handling and standardized style props

**Before:**
```typescript
<Checkbox
  checked={value}
  onChange={setValue}
  containerStyle={{ margin: 10 }}  // ❌ Deprecated
  checkboxStyle={{ borderWidth: 2 }}  // ❌ Deprecated
/>
```

**After:**
```typescript
<Checkbox
  checked={value}
  onChange={setValue}
  error={hasError}                 // ✅ New
  errorMessage="Please select"    // ✅ New
  style={{ margin: 10 }}           // ✅ Standard prop
  contentStyle={{ borderWidth: 2 }}  // ✅ Standard prop
/>
```

**Key Changes:**
- Added `error?: boolean`
- Added `errorMessage?: string`
- Added `showError?: boolean`
- `containerStyle` → `style`
- `checkboxStyle` → `contentStyle`

---

#### Toggle Component

**Change**: Added error handling and standardized style props

**Before:**
```typescript
<Toggle
  checked={value}
  onChange={setValue}
  containerStyle={{ margin: 10 }}  // ❌ Deprecated
  toggleStyle={{ width: 50 }}      // ❌ Deprecated
/>
```

**After:**
```typescript
<Toggle
  checked={value}
  onChange={setValue}
  error={hasError}                 // ✅ New
  errorMessage="Required"          // ✅ New
  style={{ margin: 10 }}           // ✅ Standard prop
  contentStyle={{ width: 50 }}    // ✅ Standard prop
/>
```

**Key Changes:**
- Added `error?: boolean`
- Added `errorMessage?: string`
- Added `showError?: boolean`
- `containerStyle` → `style`
- `toggleStyle` → `contentStyle`

---

#### Radio Component

**Change**: Added error handling and standardized style props

**Before:**
```typescript
<Radio
  checked={value}
  onChange={setValue}
  containerStyle={{ margin: 10 }}  // ❌ Deprecated
  radioStyle={{ borderWidth: 2 }}  // ❌ Deprecated
/>
```

**After:**
```typescript
<Radio
  checked={value}
  onChange={setValue}
  error={hasError}                 // ✅ New
  errorMessage="Select an option" // ✅ New
  style={{ margin: 10 }}           // ✅ Standard prop
  contentStyle={{ borderWidth: 2 }}  // ✅ Standard prop
/>
```

**Key Changes:**
- Added `error?: boolean`
- Added `errorMessage?: string`
- Added `showError?: boolean`
- `containerStyle` → `style`
- `radioStyle` → `contentStyle`

---

### Style Props

**Change**: Standardized style prop naming across all components

| Old Prop | New Prop | Description |
|----------|----------|-------------|
| `containerStyle` | `style` | Primary container style |
| `inputStyle` | `contentStyle` | Input element style |
| `checkboxStyle` | `contentStyle` | Checkbox element style |
| `toggleStyle` | `contentStyle` | Toggle element style |
| `radioStyle` | `contentStyle` | Radio element style |

**Migration Pattern:**
```typescript
// Before
<Component containerStyle={...} inputStyle={...} />

// After
<Component style={...} contentStyle={...} />
```

---

## New Features

### Grid Component

A powerful CSS Grid-based layout component with responsive breakpoints.

**Basic Usage:**
```typescript
import { Grid, GridItem } from '@unicornlove/beyond-ui'

<Grid columns={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**Responsive Grid:**
```typescript
<Grid
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  gap={{ base: 'sm', md: 'lg' }}
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**With GridItem Spans:**
```typescript
<Grid columns={12} gap="md">
  <GridItem colSpan={8}>
    <Card>Main content (8 columns)</Card>
  </GridItem>
  <GridItem colSpan={4}>
    <Card>Sidebar (4 columns)</Card>
  </GridItem>
</Grid>
```

**Auto-fit Columns:**
```typescript
<Grid minColumnWidth={200} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

---

### Responsive Utilities

New components for conditional rendering based on breakpoints.

**Show Component:**
```typescript
import { Show } from '@unicornlove/beyond-ui'

// Show only on desktop
<Show above="md">
  <DesktopNavigation />
</Show>

// Show only on mobile
<Show below="sm">
  <MobileMenu />
</Show>

// Show only at tablet
<Show at="md">
  <TabletLayout />
</Show>
```

**Hide Component:**
```typescript
import { Hide } from '@unicornlove/beyond-ui'

// Hide on desktop
<Hide above="md">
  <MobileOnlyFeature />
</Hide>

// Hide on mobile
<Hide below="sm">
  <DesktopOnlyFeature />
</Hide>
```

**Responsive Component:**
```typescript
import { Responsive } from '@unicornlove/beyond-ui'

<Responsive>
  {({ breakpoint, isMobile, isTablet, isDesktop }) => (
    <>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  )}
</Responsive>
```

---

## Step-by-Step Migration

### Step 1: Update ThemeProvider Imports

**Find and replace:**
```bash
# Search for:
from '@unicornlove/beyond-ui/playground/ThemeProvider'
from '../../playground/ThemeProvider'

# Replace with:
from '@unicornlove/beyond-ui'
from '../../theme'
```

---

### Step 2: Update Form Component Props

**For each form component (Input, Checkbox, Toggle, Radio):**

1. **Update style props:**
   ```typescript
   // Before
   containerStyle={...}
   inputStyle={...}  // or checkboxStyle, toggleStyle, radioStyle

   // After
   style={...}
   contentStyle={...}
   ```

2. **Update error handling:**
   ```typescript
   // Before
   error="Error message"  // Input only
   error={true}           // Checkbox (no message)

   // After
   error={true}
   errorMessage="Error message"
   showError={true}  // optional, defaults to true
   ```

---

### Step 3: Replace flexWrap Hacks with Grid

**Before:**
```typescript
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
  <Card style={{ width: '33%' }}>Item 1</Card>
  <Card style={{ width: '33%' }}>Item 2</Card>
  <Card style={{ width: '33%' }}>Item 3</Card>
</View>
```

**After:**
```typescript
<Grid columns={{ base: 1, sm: 2, md: 3 }} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

---

### Step 4: Add Responsive Behavior

**Replace conditional logic with responsive components:**

**Before:**
```typescript
const { isMobile } = useResponsive()

return (
  <>
    {isMobile ? <MobileNav /> : <DesktopNav />}
  </>
)
```

**After:**
```typescript
return (
  <>
    <Show below="md"><MobileNav /></Show>
    <Hide below="md"><DesktopNav /></Hide>
  </>
)
```

---

## Validation

After migration, verify:

1. **TypeScript**: Run `tsc --noEmit` to check for type errors
2. **Imports**: All ThemeProvider imports updated
3. **Props**: No deprecated props used
4. **Functionality**: Error messages display correctly
5. **Responsive**: Layout works at all breakpoints

---

## Migrating from @unicornlove/ui (Tamagui)

If you are moving from the Tamagui-based `@unicornlove/ui` to `@unicornlove/beyond-ui`, use the following mappings.

### OfficeTabs and OfficeAccordion

**@unicornlove/ui** exposes office-specific navigation: `OfficeTabs`, `OfficeAccordion`, `Tab`, `TabGroup`.

**Beyond-UI** does not ship separate "Office" components. Use the standard layout primitives instead:

| UI (Tamagui)       | Beyond-UI replacement |
|--------------------|------------------------|
| `OfficeTabs`       | `Tabs` – same pattern; use `type`, `color`, `size`, `orientation` for styling. |
| `OfficeAccordion`  | `Accordion` – same pattern; use `type`, `size` and item props for styling. |
| `Tab` / `TabGroup` | `Tabs.Item`, `Tabs.Trigger`, `Tabs.Content` (see Tabs docs). |

**Example (Tabs):**
```tsx
// Before (ui)
<OfficeTabs defaultValue="overview">
  <Tab value="overview" label="Overview" />
  <Tab value="team" label="Team" />
</OfficeTabs>

// After (beyond-ui)
import { Tabs } from '@unicornlove/beyond-ui'
<Tabs defaultValue="overview">
  <Tabs.Item value="overview">
    <Tabs.Trigger>Overview</Tabs.Trigger>
    <Tabs.Content>...</Tabs.Content>
  </Tabs.Item>
  <Tabs.Item value="team">
    <Tabs.Trigger>Team</Tabs.Trigger>
    <Tabs.Content>...</Tabs.Content>
  </Tabs.Item>
</Tabs>
```

**Example (Accordion):**
```tsx
// Before (ui)
<OfficeAccordion items={items} />

// After (beyond-ui)
import { Accordion } from '@unicornlove/beyond-ui'
<Accordion type="single" collapsible>
  {items.map((item) => (
    <Accordion.Item key={item.value} value={item.value}>
      <Accordion.Trigger>{item.title}</Accordion.Trigger>
      <Accordion.Content>{item.content}</Accordion.Content>
    </Accordion.Item>
  ))}
</Accordion>
```

Theme tokens and styling differences are covered in [Theme migration (Tamagui → Beyond)](docs/THEME_MIGRATION_TAMAGUI_TO_BEYOND.md).

---

## Need Help?

- **Documentation**: https://beyond-ui.unicorn.com/docs
- **Examples**: See `/packages/beyond-ui/stories/` for updated examples
- **Issues**: https://github.com/unicorn/beyond-ui/issues

---

## Summary of Benefits

✅ **Consistent APIs** - All components follow the same patterns
✅ **Better Errors** - Unified error handling across form components
✅ **Responsive** - Built-in responsive utilities and Grid component
✅ **Type Safe** - Better TypeScript support with standardized types
✅ **Maintainable** - Style factories for improved performance
✅ **DX** - Cleaner, more intuitive developer experience
