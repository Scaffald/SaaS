# Unified Card System Documentation

## Overview

A comprehensive, DRY card component system built in `packages/ui/src/components/cards/` that provides consistent design patterns, selection states, and reusable components across the application.

## Architecture

### Base Components

#### SelectableCard
Core reusable card with:
- ✅ Selection states (optional)
- ✅ Hover and press effects
- ✅ Animations
- ✅ Consistent theming
- ✅ Flexible composition

**Location**: `packages/ui/src/components/cards/SelectableCard.tsx`

#### CardHeader
Standardized header with title, subtitle, icon, and badge support.

**Location**: `packages/ui/src/components/cards/CardHeader.tsx`

#### CardMetadata
Displays metadata rows with icons (location, experience, etc.).

**Location**: `packages/ui/src/components/cards/CardMetadata.tsx`

#### CardBadges
Renders badges/chips with overflow handling.

**Location**: `packages/ui/src/components/cards/CardBadges.tsx`

#### CardActions
Action buttons section for CTAs.

**Location**: `packages/ui/src/components/cards/CardActions.tsx`

### Domain-Specific Cards

#### ProfileCard
**Purpose**: Display worker/candidate profile information

**Location**: `packages/ui/src/components/cards/ProfileCard.tsx`

**Features**:
- Selection states with blue highlighting
- Score badges
- Skills and certifications
- Experience, rate, location metadata
- Profile badges (verified, top-rated, etc.)

**Usage**:
```tsx
import { ProfileCard } from '@app/ui'

<ProfileCard
  id="profile-1"
  name="John Doe"
  title="Senior Engineer"
  score={95}
  experienceYears={8}
  hourlyRate={125}
  locationLabel="San Francisco, CA"
  badges={[
    { id: '1', label: 'Certified', tone: 'success' }
  ]}
  skills={['React', 'TypeScript']}
  certifications={['AWS', 'OSHA']}
  isSelected={selectedId === "profile-1"}
  onSelect={setSelectedId}
/>
```

**Replaces**:
- `ResultCard` in `/dashboard/discover/map`
- `ResultCard` in `/dashboard/discover/workers`

#### OrganizationCard
**Purpose**: Display organization/employer information

**Location**: `packages/ui/src/components/cards/OrganizationCard.tsx`

**Features**:
- Selection states
- Industry badges
- Location and employee count
- Optional "View Details" action

**Usage**:
```tsx
import { OrganizationCard } from '@app/ui'

<OrganizationCard
  id="org-1"
  name="Acme Corp"
  industry="Technology"
  address={{ city: "San Francisco", state: "CA" }}
  employeeCount={500}
  isSelected={selected === "org-1"}
  onSelect={setSelected}
  onViewDetails={() => router.push('/org/1')}
/>
```

**Replaces**:
- `OrganizationCard` on map right rail
- `EmployerCard` on `/dashboard/discover/employers`

#### JobCard
**Purpose**: Display job listing information

**Location**: `packages/ui/src/components/cards/JobCard.tsx`

**Features**:
- Optional selection states
- Organization name with icon
- Employment type and remote options
- Pay range display
- Posted date (relative time)
- Certifications and skills badges
- "Applied" status indicator
- "View Details" action

**Usage**:
```tsx
import { JobCard } from '@app/ui'

<JobCard
  id="job-1"
  title="Senior Engineer"
  organization={{ id: '1', name: 'Acme Corp', slug: 'acme' }}
  location="San Francisco, CA"
  employmentType="full_time"
  remoteOption="hybrid"
  payRangeMin={12000000}
  payRangeMax={18000000}
  payRangeType="salary"
  hasApplied={false}
  onViewDetails={() => router.push('/jobs/1')}
/>
```

**Replaces**:
- `InternalJobCard` on `/dashboard/discover/jobs`
- `ExternalJobCard` on `/dashboard/discover/jobs`

## Design Benefits

### DRY Improvements
✅ Single source of truth for card styling  
✅ Shared selection/hover/animation logic  
✅ Consistent spacing tokens and theming  
✅ Reusable metadata/badge patterns  

### Type Safety
✅ Strong TypeScript typing throughout  
✅ No `any` types (strategic `@ts-expect-error` for Tamagui limitations only)  
✅ Proper interfaces for all props  

### Cross-Platform
✅ Works on web, iOS, and Android  
✅ Consistent behavior across platforms  
✅ Proper ref forwarding for scroll-to functionality  

## Migration Guide

### Step 1: Import New Cards
```tsx
// Old
import { ResultCard } from '../components/ResultCard'

// New
import { ProfileCard } from '@app/ui'
```

### Step 2: Update Props
Map old prop names to new standardized props:

```tsx
// Old ResultCard
<ResultCard
  profile={profile}
  isSelected={isSelected}
  onSelect={onSelect}
/>

// New ProfileCard
<ProfileCard
  id={profile.id}
  name={profile.name}
  title={profile.title}
  score={profile.score}
  experienceYears={profile.experienceYears}
  hourlyRate={profile.hourlyRate}
  locationLabel={profile.locationLabel}
  badges={profile.badges}
  certifications={profile.certifications}
  skills={profile.skills}
  isSelected={isSelected}
  onSelect={onSelect}
/>
```

### Step 3: Remove Old Components
After migration is complete:
- Delete old card files
- Update imports across codebase
- Run tests

## Implementation Status

### ✅ Completed
- [x] Base card system (SelectableCard + sub-components)
- [x] ProfileCard variant
- [x] OrganizationCard variant  
- [x] JobCard variant
- [x] Type definitions
- [x] Export configuration

### 🚧 In Progress
- [ ] ApplicationCard variant (for kanban board)
- [ ] Refactor discover pages to use new cards
- [ ] Refactor office pages to use new cards
- [ ] Remove old card components
- [ ] Update tests

### 📋 Remaining Work

#### Phase 1: Create ApplicationCard
For use in the kanban board at `/office/applications`

#### Phase 2: Refactor Pages
1. `/dashboard/discover/map` - Use ProfileCard
2. `/dashboard/discover/workers` - Use ProfileCard
3. `/dashboard/discover/employers` - Use OrganizationCard
4. `/dashboard/discover/jobs` - Use JobCard
5. `/office/applications` - Use ApplicationCard

#### Phase 3: Clean Up
1. Remove `ResultCard.tsx`
2. Remove old `OrganizationCard.tsx`
3. Remove `EmployerCard.tsx`
4. Remove `InternalJobCard.tsx`
5. Remove `ExternalJobCard.tsx`
6. Update all imports

## API Reference

### SelectableCard Props
```typescript
interface SelectableCardProps {
  id: string
  isSelected?: boolean
  onPress?: () => void
  disabled?: boolean
  selection?: SelectionConfig
  padding?: SpaceTokens
  gap?: SpaceTokens
  children?: ReactNode
}
```

### SelectionConfig
```typescript
interface SelectionConfig {
  enabled: boolean
  selectedBorderColor?: ColorTokens
  selectedBgColor?: ColorTokens
  selectedTextColor?: ColorTokens
  selectedShadow?: string
}
```

### CardHeader Props
```typescript
interface CardHeaderProps {
  title: string
  subtitle?: string | ReactNode
  icon?: ReactNode
  badge?: ReactNode
  isSelected?: boolean
}
```

### CardMetadata Props
```typescript
interface CardMetadataProps {
  items: MetadataItem[]
  isSelected?: boolean
  maxItems?: number
}

interface MetadataItem {
  key: string
  icon: ReactNode
  label: string
  color?: ColorTokens
}
```

### CardBadges Props
```typescript
interface CardBadgesProps {
  badges: BadgeConfig[]
  isSelected?: boolean
  maxVisible?: number
}

interface BadgeConfig {
  key: string
  label: string
  bg?: ColorTokens | string
  color?: ColorTokens | string
  icon?: ReactNode
}
```

### CardActions Props
```typescript
interface CardActionsProps {
  actions: ActionButton[]
  isSelected?: boolean
}

interface ActionButton {
  label: string
  onPress: () => void
  theme?: string
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}
```

## Best Practices

### 1. Use Composition
Build complex cards by composing base components:
```tsx
<SelectableCard>
  <CardHeader title="..." />
  <CardMetadata items={[...]} />
  <CardBadges badges={[...]} />
  <CardActions actions={[...]} />
</SelectableCard>
```

### 2. Consistent Selection States
Always use the same selection pattern:
```tsx
selection={{
  enabled: true,
  selectedBorderColor: '$blue9',
  selectedBgColor: '$blue9',
  selectedShadow: '0 4px 8px rgba(59, 130, 246, 0.2)',
}}
```

### 3. Forward Refs Properly
For scroll-to functionality:
```tsx
const CardVariant = forwardRef<TamaguiElement, Props>((props, ref) => {
  return <SelectableCard ref={ref} {...props} />
})
```

### 4. Handle Optional Data Gracefully
Always check for data before rendering sections:
```tsx
{metadataItems.length > 0 && (
  <CardMetadata items={metadataItems} />
)}
```

## Troubleshooting

### Tamagui Color Type Issues
Use strategic `@ts-expect-error` comments for color prop issues:
```tsx
// @ts-expect-error - Tamagui type limitations with string union
bg={badge.bg ?? '$blue10'}
```

### Selection Not Working
Ensure `selection.enabled` is true:
```tsx
selection={{ enabled: true }}
```

### Styling Not Applied
Check that you're using Tamagui tokens:
```tsx
// Good
padding="$3"
gap="$2"

// Bad  
padding="12px"
gap="8px"
```

## Future Enhancements

1. **Animation variants**: Add more animation presets
2. **Theme variations**: Support light/dark mode better
3. **Accessibility**: Enhanced keyboard navigation
4. **Performance**: Virtualization for large lists
5. **Storybook**: Add component stories for documentation

## Related Documentation

- [Tamagui Properties](/.cursor/rules/tamagui-properties.mdc)
- [UI Development Standards](/.cursor/rules/ui-development.mdc)
- [TypeScript Typing Standards](/.cursor/rules/typescript-typing.mdc)
