# Profile Two-Column Pattern

This document describes the standard two-column pattern for profile pages, designed to provide a consistent user experience across all profile sections (skills, education, certifications, experience).

## Pattern Overview

### Left Column (Input/Form)
- Search/filter controls
- Selection interface
- Configuration options (e.g., proficiency, dates)
- Action buttons (Add, Cancel)
- Inline form - no modals!

### Right Column (Results)
- List of saved items
- Card-based display with consistent styling
- Action buttons per item (Remove, Edit)
- Empty state when no items
- Loading state

## Reusable Components

### 1. ProfileFormPanel
Wrapper for left column input areas with consistent layout.

```tsx
import { ProfileFormPanel } from './components'

<ProfileFormPanel>
  <H4>Section Title</H4>
  <YStack gap="$4">
    {/* Form inputs and controls */}
  </YStack>
</ProfileFormPanel>
```

### 2. ProfileResultsPanel
Wrapper for right column results with built-in loading and empty states.

```tsx
import { ProfileResultsPanel } from './components'
import { Award } from '@tamagui/lucide-icons'

<ProfileResultsPanel
  title="Your Items"
  isLoading={isLoading}
  isEmpty={items.length === 0}
  emptyIcon={Award as React.ComponentType<{ size?: number; color?: string }>}
  emptyMessage="No items added yet. Use the form on the left to add your first item."
>
  <YStack gap="$3">
    {items.map(item => <ProfileResultCard key={item.id} {...item} />)}
  </YStack>
</ProfileResultsPanel>
```

### 3. ProfileResultCard
Individual item card with consistent styling and remove functionality.

```tsx
import { ProfileResultCard } from './components'

<ProfileResultCard
  onRemove={() => handleRemove(item.id)}
  removeDisabled={isRemoving}
>
  <YStack gap="$2">
    <Text fontWeight="600">{item.name}</Text>
    <Text color="$color11">{item.description}</Text>
  </YStack>
</ProfileResultCard>
```

### 4. InlineSkillSearch (Example)
Domain-specific inline components for complex workflows.

```tsx
import { InlineSkillSearch } from './components'

<InlineSkillSearch
  onSearchSkills={handleSearch}
  onSelectSkill={handleAdd}
  existingSkillIds={existingIds}
/>
```

## Implementation Guide

### Step 1: Create Left Column Component

```tsx
// profile-[section]-left.tsx
import { ProfileFormPanel } from './components'

export function Profile[Section]Left() {
  return (
    <ProfileFormPanel>
      <H4>[Section] Title</H4>
      
      {/* Your form inputs */}
      <YStack gap="$4">
        <Input placeholder="..." />
        <Button>Add</Button>
      </YStack>
    </ProfileFormPanel>
  )
}
```

### Step 2: Create Right Column Component

```tsx
// profile-[section]-right.tsx
import { ProfileResultsPanel, ProfileResultCard } from './components'
import { [Icon] } from '@tamagui/lucide-icons'

export function Profile[Section]Right() {
  const { data, isLoading } = useQuery()
  
  return (
    <ProfileResultsPanel
      title="Your [Items]"
      isLoading={isLoading}
      isEmpty={data?.length === 0}
      emptyIcon={[Icon] as React.ComponentType<{ size?: number; color?: string }>}
      emptyMessage="No items yet..."
    >
      <YStack gap="$3">
        {data?.map(item => (
          <ProfileResultCard
            key={item.id}
            onRemove={() => handleRemove(item.id)}
          >
            {/* Item content */}
          </ProfileResultCard>
        ))}
      </YStack>
    </ProfileResultsPanel>
  )
}
```

### Step 3: Wire Up in Page

```tsx
// apps/expo/app/dashboard/profile/[section]/index.tsx
import { Profile[Section]Left } from '@app/core/features/profile/profile-[section]-left'
import { Profile[Section]Right } from '@app/core/features/profile/profile-[section]-right'
import { DashboardLayout } from '@app/ui/src/components/layouts/DashboardLayout'

export default function Profile[Section]Page() {
  return (
    <DashboardLayout
      leftContent={<Profile[Section]Left />}
      rightContent={<Profile[Section]Right />}
    />
  )
}
```

## Complete Example: Skills Page

### Left Column (profile-skills-left.tsx)
```tsx
import { ProfileFormPanel, InlineSkillSearch } from './components'

export function ProfileSkillsLeft() {
  const handleSearch = async (query: string) => {
    // Search logic
  }
  
  const handleAdd = async (skillId: string, proficiency: number) => {
    // Add logic
  }
  
  return (
    <ProfileFormPanel>
      <H4>Skills & Expertise</H4>
      
      {/* Industry selector */}
      <Select />
      
      <Separator />
      
      {/* Inline search */}
      <InlineSkillSearch
        onSearchSkills={handleSearch}
        onSelectSkill={handleAdd}
        existingSkillIds={existingIds}
      />
    </ProfileFormPanel>
  )
}
```

### Right Column (profile-skills-right.tsx)
```tsx
import { ProfileResultsPanel, ProfileResultCard } from './components'

export function ProfileSkillsRight() {
  const { data: skills, isLoading } = api.profile.skillsMultiTaxonomy.getUserSkills.useQuery()
  
  return (
    <ProfileResultsPanel
      title="Your Skills"
      isLoading={isLoading}
      isEmpty={skills.length === 0}
      emptyIcon={Award as React.ComponentType<{ size?: number; color?: string }>}
      emptyMessage="No skills added yet."
    >
      <YStack gap="$3">
        {skills.map(skill => (
          <ProfileResultCard
            key={skill.id}
            onRemove={() => handleRemove(skill.id)}
          >
            <Text fontWeight="600">{skill.name}</Text>
            <Text>Proficiency: {skill.level}/5</Text>
          </ProfileResultCard>
        ))}
      </YStack>
    </ProfileResultsPanel>
  )
}
```

## Benefits

✅ **Consistent UX** - All profile sections follow the same pattern
✅ **No Modals** - Everything inline for better visibility
✅ **Better Space Usage** - Right column is functional, not just static text
✅ **DRY Code** - Reusable components reduce duplication
✅ **Parallel Workflow** - Users see results while adding items
✅ **Mobile Friendly** - Two-column layout handles responsive design
✅ **Easy Testing** - Consistent patterns make testing straightforward

## Migration Checklist

When refactoring an existing profile page:

- [ ] Create `profile-[section]-left.tsx` using ProfileFormPanel
- [ ] Create `profile-[section]-right.tsx` using ProfileResultsPanel
- [ ] Move form logic from modal to inline component
- [ ] Move saved items list to right column
- [ ] Remove modal components
- [ ] Test add/remove functionality
- [ ] Test empty states
- [ ] Test loading states
- [ ] Verify mobile responsiveness

## Common Patterns

### Search with Results
Left: Search input + results list
Right: Saved items

### Form with Preview
Left: Form inputs
Right: Saved entries with edit/remove

### Multi-step Selection
Left: Step-by-step selection (search → configure → add)
Right: Final saved items

### Autocomplete Selection
Left: Autocomplete input + selection
Right: Selected items with remove

## Notes

- Always use Tamagui components for consistency
- Keep loading/empty states in ProfileResultsPanel
- Use ProfileResultCard for consistent item styling
- Refetch right column data after mutations
- Use toast notifications for user feedback
- Handle errors gracefully with user-friendly messages
