# Migration Guide: @app/ui to @scaffald/tamagui-ui

This document describes the migration from the legacy `@app/ui` package to the new `@scaffald/tamagui-ui` package and the reorganization of domain-specific components.

## Overview

The UI component library has been split into two packages:

1. **`@scaffald/tamagui-ui`** - Generic, reusable UI components (publishable package)
2. **`@app/core`** - Domain-specific components that depend on application logic

The legacy `@app/ui` package has been **removed**.

## What Changed

### Package Structure

- ✅ **Removed**: `packages/ui` (legacy `@app/ui` package)
- ✅ **Updated**: `packages/neue-ui` → now `@scaffald/tamagui-ui` (publishable)
- ✅ **Updated**: `packages/core` → now contains domain-specific UI components

### Component Locations

#### Generic Components → `@scaffald/tamagui-ui`

All generic, reusable components remain in `@scaffald/tamagui-ui`:

- Form components (Input, Checkbox, Radio, PhoneNumberInput, ToggleSwitch, etc.)
- Layout components (Card, Stack, Sheet, Dialog, Modal, etc.)
- Navigation components (Breadcrumb, Tabs, Accordion, etc.)
- Data display components (Charts, Tables, Lists, etc.)
- Map components (MapContainer, MapPin, etc.)
- Rich text editor components
- And many more...

**Import from:**
```typescript
import { Button, Card, Input, Breadcrumb } from '@scaffald/tamagui-ui'
```

#### Domain-Specific Components → `@app/core`

Components that depend on application-specific logic have been moved to `@app/core`:

- **Layouts**: `AssessmentsLayout`, `DashboardLayout`, `OfficeLayout`, `ProfileLayout`
- **Navigation**: `AssessmentsTabs`, `ProfileTabs`
- **UI Components**: `ImageUpload`, `DataTable`, `SoftSkillsRadarGrid`
- **Hooks**: `useBreadcrumbs`

**Import from:**
```typescript
// Layouts
import { DashboardLayout, ProfileLayout } from '@app/core/components/layouts'

// Navigation
import { AssessmentsTabs, ProfileTabs } from '@app/core/components/navigation'

// UI Components
import { ImageUpload, DataTable, SoftSkillsRadarGrid } from '@app/core/components/ui'

// Hooks
import { useBreadcrumbs } from '@app/core/hooks'
```

## Migration Steps

### 1. Update Package Dependencies

**Before:**
```json
{
  "dependencies": {
    "@app/ui": "workspace:*"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@scaffald/tamagui-ui": "workspace:*"
  }
}
```

### 2. Update Import Statements

#### Generic Components

**Before:**
```typescript
import { Button, Card, Input } from '@app/ui'
```

**After:**
```typescript
import { Button, Card, Input } from '@scaffald/tamagui-ui'
```

#### Domain-Specific Components

**Before:**
```typescript
import { DashboardLayout, ImageUpload, useBreadcrumbs } from '@app/ui'
```

**After:**
```typescript
import { DashboardLayout } from '@app/core/components/layouts'
import { ImageUpload } from '@app/core/components/ui'
import { useBreadcrumbs } from '@app/core/hooks'
```

#### Type Imports

**Before:**
```typescript
import type { Boundary, Coordinate } from '@app/ui'
```

**After:**
```typescript
import type { Boundary, Coordinate } from '@scaffald/tamagui-ui'
```

### 3. Update TypeScript Configuration

If you have custom TypeScript paths, update them:

**Before:**
```json
{
  "compilerOptions": {
    "paths": {
      "@app/ui": ["./packages/ui"],
      "@app/ui/*": ["./packages/ui/src/*"]
    }
  }
}
```

**After:**
```json
{
  "compilerOptions": {
    "paths": {
      "@scaffald/tamagui-ui": ["./packages/neue-ui"]
    }
  }
}
```

### 4. Update Tamagui Config Type Declarations

**Before:**
```typescript
// types.d.ts
import type { config } from '@app/ui'

export type Conf = typeof config

declare module '@app/ui' {
  interface TamaguiCustomConfig extends Conf {}
}
```

**After:**
```typescript
// types.d.ts
import type { config } from '@scaffald/tamagui-ui'

export type Conf = typeof config

declare module '@scaffald/tamagui-ui' {
  interface TamaguiCustomConfig extends Conf {}
}
```

## Component Mapping Reference

### Generic Components (No Change in Import Path)

These components are still imported from `@scaffald/tamagui-ui` (previously `@app/ui`):

- `Button`, `UIButton`
- `Card`, `CardStack`
- `Input`, `TextArea`
- `Breadcrumb`
- `Tab`, `TabGroup`
- `Sheet`, `Dialog`, `Modal`
- `Popover`
- `Table`
- `SearchSelect`, `SearchSelectOption`
- `ResponsiveSelect`
- `ToggleSwitch`
- `AddressAutocomplete`, `AddressForm`
- `MapContainer`, `MapPin`, `MapTooltip`
- `RichTextEditor`
- And all other generic components...

### Domain-Specific Components (New Import Paths)

| Old Import | New Import |
|------------|------------|
| `@app/ui` → `DashboardLayout` | `@app/core/components/layouts` → `DashboardLayout` |
| `@app/ui` → `ProfileLayout` | `@app/core/components/layouts` → `ProfileLayout` |
| `@app/ui` → `OfficeLayout` | `@app/core/components/layouts` → `OfficeLayout` |
| `@app/ui` → `AssessmentsLayout` | `@app/core/components/layouts` → `AssessmentsLayout` |
| `@app/ui` → `AssessmentsTabs` | `@app/core/components/navigation` → `AssessmentsTabs` |
| `@app/ui` → `ProfileTabs` | `@app/core/components/navigation` → `ProfileTabs` |
| `@app/ui` → `ImageUpload` | `@app/core/components/ui` → `ImageUpload` |
| `@app/ui` → `DataTable` | `@app/core/components/ui` → `DataTable` |
| `@app/ui` → `SoftSkillsRadarGrid` | `@app/core/components/ui` → `SoftSkillsRadarGrid` |
| `@app/ui` → `useBreadcrumbs` | `@app/core/hooks` → `useBreadcrumbs` |

## Common Issues and Solutions

### Issue: "Cannot find module '@app/ui'"

**Solution**: Update all imports to use `@scaffald/tamagui-ui` or the new `@app/core` paths.

### Issue: "Component not found in '@scaffald/tamagui-ui'"

**Solution**: Check if the component is domain-specific. If so, import it from `@app/core` instead.

### Issue: TypeScript errors after migration

**Solution**: 
1. Run `pnpm install` to update dependencies
2. Update `tsconfig.json` paths as shown above
3. Restart your TypeScript server

## Verification

After migration, verify:

1. ✅ All imports updated
2. ✅ No references to `@app/ui` remain
3. ✅ TypeScript compilation succeeds
4. ✅ Application builds successfully
5. ✅ Tests pass

## Need Help?

If you encounter issues during migration:

1. Check this guide for component mappings
2. Search the codebase for remaining `@app/ui` references
3. Review the component source to determine if it's generic or domain-specific

## Summary

- **Generic components**: Import from `@scaffald/tamagui-ui`
- **Domain-specific components**: Import from `@app/core/components/*` or `@app/core/hooks`
- **Legacy package**: `@app/ui` has been removed
- **New package**: `@scaffald/tamagui-ui` is now the source for all generic UI components

