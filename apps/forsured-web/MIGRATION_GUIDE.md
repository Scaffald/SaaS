# Beyond UI Migration Guide

This guide documents the migration from CSS variables and native HTML elements to Beyond UI components and design tokens.

## Migration Patterns

### 1. CSS Variables → Beyond UI Tokens

#### Spacing
```typescript
// ❌ Old
gap: 'var(--space-8)'
marginBottom: 'var(--space-12)'
padding: 'var(--space-4)'

// ✅ New
import { spacing } from '@unicornlove/beyond-ui';
gap: spacing[32]  // 32px (was --space-8)
marginBottom: spacing[48]  // 48px (was --space-12)
padding: spacing[16]  // 16px (was --space-4)
```

#### Colors
```typescript
// ❌ Old
color: 'var(--color-12)'
backgroundColor: 'var(--color-background-hover)'
borderColor: 'var(--color-border)'

// ✅ New
import { colors } from '@unicornlove/beyond-ui';
color: colors.text.light.primary
backgroundColor: colors.bg.light.hover
borderColor: colors.border.light.default
```

#### Typography
```typescript
// ❌ Old
fontSize: 'var(--font-size-9)'
fontSize: 'var(--font-size-5)'

// ✅ New
import { fontSize } from '@unicornlove/beyond-ui';
fontSize: fontSize.h3  // 48px (was --font-size-9)
fontSize: fontSize.h5  // 28px (was --font-size-5)
```

#### Border Radius
```typescript
// ❌ Old
borderRadius: 'var(--radius-4)'

// ✅ New
import { borderRadius } from '@unicornlove/beyond-ui';
borderRadius: borderRadius.s  // 8px (was --radius-4)
```

### 2. Native HTML Elements → Beyond UI Components

#### Layout
```typescript
// ❌ Old
<div style={{ ... }}>
  <span>Text</span>
</div>

// ✅ New
import { Box, Text } from '@unicornlove/beyond-ui';
<Box style={{ ... }}>
  <Text>Text</Text>
</Box>
```

#### Buttons
```typescript
// ❌ Old
<button onClick={handleClick}>Click me</button>

// ✅ New
import { Button } from '@unicornlove/beyond-ui';
<Button onPress={handleClick}>Click me</Button>
```

#### Forms
```typescript
// ❌ Old
<input type="text" value={value} onChange={handleChange} />
<select value={value} onChange={handleChange}>
  <option>Option 1</option>
</select>
<textarea value={value} onChange={handleChange} />

// ✅ New
import { Input, Select, Textarea } from '@unicornlove/beyond-ui';
<Input value={value} onChangeText={handleChange} />
<Select value={value} onValueChange={handleChange} options={[...]} />
<Textarea value={value} onChangeText={handleChange} />
```

### 3. Typography Components

```typescript
// ❌ Old
<h1 style={{ fontSize: 'var(--font-size-9)', color: 'var(--color-12)' }}>
  Heading
</h1>
<p style={{ fontSize: 'var(--font-size-5)', color: 'var(--color-11)' }}>
  Paragraph
</p>

// ✅ New
import { H1, Text } from '@unicornlove/beyond-ui';
import { fontSize, colors } from '@unicornlove/beyond-ui';

<H1 style={{ fontSize: fontSize.h3, color: colors.text.light.primary }}>
  Heading
</H1>
<Text style={{ fontSize: fontSize.h5, color: colors.text.light.secondary }}>
  Paragraph
</Text>
```

## Common Mappings

### Spacing Scale
- `var(--space-1)` → `spacing[4]` (4px)
- `var(--space-2)` → `spacing[8]` (8px)
- `var(--space-3)` → `spacing[12]` (12px)
- `var(--space-4)` → `spacing[16]` (16px)
- `var(--space-6)` → `spacing[24]` (24px)
- `var(--space-8)` → `spacing[32]` (32px)
- `var(--space-12)` → `spacing[48]` (48px)

### Font Sizes
- `var(--font-size-3)` → `fontSize.sm` (14px)
- `var(--font-size-5)` → `fontSize.h5` (28px)
- `var(--font-size-8)` → `fontSize.h4` (36px)
- `var(--font-size-9)` → `fontSize.h3` (48px)
- `var(--font-size-10)` → `fontSize.h1` (72px)

### Colors
- `var(--color-10)` → `colors.text.light.secondary`
- `var(--color-11)` → `colors.text.light.secondary`
- `var(--color-12)` → `colors.text.light.primary`
- `var(--color-background-hover)` → `colors.bg.light.hover`
- `var(--color-background-tertiary)` → `colors.bg.light.secondary`
- `var(--color-border)` → `colors.border.light.default`
- `var(--blue10)` → `colors.primary[600]`

## Import Pattern

Always import tokens at the top of the file:

```typescript
import { Stack, Row, Box, Text, H1, H2, H3, Button } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize, borderRadius } from '@unicornlove/beyond-ui';
```

## Migration Checklist

For each file:
- [ ] Replace all `var(--space-*)` with `spacing[*]`
- [ ] Replace all `var(--color-*)` with `colors.*`
- [ ] Replace all `var(--font-size-*)` with `fontSize.*`
- [ ] Replace all `var(--radius-*)` with `borderRadius.*`
- [ ] Replace `<div>` with `<Box>` where appropriate
- [ ] Replace `<span>` with `<Text>` where appropriate
- [ ] Replace native `<button>` with `<Button>`
- [ ] Replace native form elements with Beyond UI components
- [ ] Replace native headings with Beyond UI `H1-H6` components
- [ ] Remove any remaining CSS classes
- [ ] Verify imports include necessary tokens

## Files Migrated

### Design System Files
- ✅ `apps/forsured-web/src/components/DesignSystem/sections/ComponentsSection.tsx`
- ✅ `apps/forsured-web/src/components/DesignSystem/sections/FoundationsSection.tsx`
- ✅ `apps/forsured-web/src/components/DesignSystem/ComponentShowcase.tsx`

### Pages
- ✅ `apps/forsured-web/src/pages/Home.tsx`
- ✅ `apps/forsured-web/src/pages/NotFound.tsx`
- ✅ `apps/forsured-web/src/pages/NotFoundPage.tsx`
- ✅ `apps/forsured-web/src/pages/Unauthorized.tsx`
- ✅ `apps/forsured-web/src/pages/UnauthorizedPage.tsx`
- ✅ `apps/forsured-web/src/pages/Signup.tsx`
- ✅ `apps/forsured-web/src/pages/VerifyEmail.tsx`
- ✅ `apps/forsured-web/src/pages/Callback.tsx`
- ✅ `apps/forsured-web/src/pages/docs/Changelog.tsx`
- ✅ `apps/forsured-web/src/pages/docs/Patterns.tsx`
- ✅ `apps/forsured-web/src/pages/docs/Tokens.tsx`
- ✅ `apps/forsured-web/src/pages/admin/Dashboard.tsx`
- ✅ `apps/forsured-web/src/pages/admin/AuditLog.tsx`

### Components
- ✅ `apps/forsured-web/src/components/auth/LoginPage.tsx`
- ✅ `apps/forsured-web/src/components/auth/UnauthorizedPage.tsx`

### Configuration
- ✅ `apps/forsured-web/src/index.css` (fonts updated to Roboto)

## Remaining Work

There are approximately 8,198 CSS variable usages across 250 files that need migration. Priority order:

1. **High Priority**: Pages and main components
   - All files in `apps/forsured-web/src/pages/`
   - All files in `apps/forsured-web/src/components/Common/`
   - All files in `apps/forsured-web/src/components/Dashboard/`

2. **Medium Priority**: Feature components
   - Files in `apps/forsured-web/src/components/Broker/`
   - Files in `apps/forsured-web/src/components/Manager/`
   - Files in `apps/forsured-web/src/components/compliance/`

3. **Lower Priority**: Supporting components
   - Files in `apps/forsured-web/src/components/Onboarding/`
   - Files in `apps/forsured-web/src/components/documents/`
   - Other component directories
