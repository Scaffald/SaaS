# Unified Design System: Forsured + Scaffald

**Date:** 2025-12-15
**Status:** Approved
**Goal:** Single source of truth for all styling via `@unicornlove/ui`

## Overview

Consolidate styling between Scaffald (Expo) and Forsured (Vite/web) so that:
- Visual consistency is maintained across both apps
- Style changes are made once and propagate everywhere
- All styling uses Tamagui tokens from `@unicornlove/ui`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   @unicornlove/ui                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Themes    │  │   Tokens    │  │   Components    │  │
│  │ scaffald-   │  │ colors,     │  │ Button, Card,   │  │
│  │ theme.ts    │  │ spacing,    │  │ Modal, Input,   │  │
│  │             │  │ typography  │  │ Badge, Tabs...  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Scaffald (Expo)    │      │  Forsured (Vite)     │
│                      │      │                      │
│  - App-specific      │      │  - App-specific      │
│    screens/features  │      │    screens/features  │
│  - No local CSS      │      │  - No local CSS      │
│  - All Tamagui       │      │  - All Tamagui       │
└──────────────────────┘      └──────────────────────┘
```

**Key principles:**
- All color tokens, spacing, typography defined once in `@unicornlove/ui`
- Both apps import and use the same theme configuration
- App-specific components live in their respective apps, but use shared tokens
- No CSS files for styling (only minimal global resets)

## Components to Consolidate into `@unicornlove/ui`

### From `forsured-web/src/components/Common/`

| Component | Reason |
|-----------|--------|
| `Modal` | Generic pattern, useful in both apps |
| `Card` | Layout primitive |
| `Badge` | Status indicators |
| `DataTable` | Data display pattern |
| `EmptyState` | Empty state pattern |
| `Input` | Already re-exports, ensure full implementation |
| `Select` | Form control |
| `Textarea` | Form control |
| `IconButton` | Action button variant |
| `SkeletonLoader` | Loading state |
| `StatusBadge` | Status display |

### From `forsured-web/src/ui/`

| Component | Reason |
|-----------|--------|
| `Tabs` | Navigation pattern |
| `Radio` | Form control |
| `Progress` | Progress indicator |
| `Checkbox` | Form control |
| `Switch` | Toggle control |
| `Avatar` | User display |
| `Alert` | Feedback pattern |
| `Accordion` | Disclosure pattern |
| `Breadcrumbs` | Navigation |
| `Divider` | Layout element |
| `Tooltip` | Help text |

### Keep in forsured-web (app-specific)

- `ComplianceScore`, `ForsuredLogo`, `TaskSeverityBadge`, `AIProcessingIndicator`
- All dashboard/feature-specific components

## Migration Strategy for `className` Usages

Forsured-web has 446+ `className` usages that need conversion to Tamagui.

### Pattern 1: Typography classes
```tsx
// Before
<h1 className="text-2xl font-bold text-text-primary">Title</h1>

// After
<Text fontSize="$8" fontWeight="700" color="$color12">Title</Text>
```

### Pattern 2: Layout/spacing classes
```tsx
// Before
<div className="flex items-center gap-4 p-6">

// After
<XStack alignItems="center" gap="$4" padding="$6">
```

### Pattern 3: Background/border classes
```tsx
// Before
<div className="bg-white rounded-lg border border-gray-200">

// After
<YStack backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
```

### Pattern 4: Responsive classes
```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// After - Tamagui media queries
<XStack flexWrap="wrap" $md={{ flexDirection: 'row' }}>
  <YStack width="100%" $md={{ width: '50%' }} $lg={{ width: '33%' }}>
```

### Migration order (by priority)
1. Pages/screens (Start, Signup, Dashboard) - high visibility
2. `src/ui/` components - shared patterns
3. `src/components/Common/` - before moving to shared package
4. Feature components - lowest priority, migrate as touched

## CSS Elimination

### What stays in `index.css` (~15 lines)
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
```

### What gets deleted
- All `--color-*` CSS custom properties (438 → 15 lines)
- All utility classes
- Theme-specific variables

## Token Mapping Reference

| CSS Variable | Tamagui Token |
|--------------|---------------|
| `--color-blue-500` | `$blue9` |
| `--color-text-primary` | `$color12` |
| `--color-text-secondary` | `$color11` |
| `--color-background` | `$background` |
| `--color-border` | `$borderColor` |

## Validation Approach

1. **Visual regression** - Screenshot key pages before/after migration
2. **Component storybook** - Verify shared components render correctly
3. **Build verification** - Both apps build without CSS errors
4. **Manual QA** - Walk through main user flows in forsured-web

## Implementation Phases

### Phase 1: Foundation
- Audit existing `@unicornlove/ui` exports
- Add missing Tamagui tokens if needed
- Set up component export structure

### Phase 2: Component Migration
- Move reusable components from forsured-web to `@unicornlove/ui`
- Update imports in forsured-web
- Verify components work in both apps

### Phase 3: CSS-to-Tamagui Migration
- Convert `className` usages file-by-file
- Follow migration priority order
- Test each converted file

### Phase 4: CSS Cleanup
- Remove unused CSS from `index.css`
- Verify no CSS-dependent styling remains
- Final visual QA

## Success Criteria

- [ ] All reusable components live in `@unicornlove/ui`
- [ ] Zero `className` usages for styling in forsured-web (except third-party)
- [ ] `index.css` reduced to ~15 lines (fonts + reset only)
- [ ] Both apps build successfully
- [ ] Visual parity maintained (no regressions)
