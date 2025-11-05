# Worker and Employer Filter Toggle Clarity - Implementation Plan (REQ-12)

## Overview

**Requirement ID**: REQ-12  
**Status**: PLANNED  
**Complexity**: 2/5  
**Readiness**: 4/5  
**Assigned to**: mbernier@unicorn.love

This plan outlines the implementation of clear filter labels and functional dropdown behavior in the map filter panel to improve user understanding of what they're viewing.

## Problem Statement

The current filter panel on the discover map screen creates confusion:

1. **Ambiguous Label**: The "Workers" toggle label is unclear - users don't understand if it means "show workers" or "filter workers"
2. **Non-functional Dropdown**: The "Show" dropdown doesn't expand when clicked, leaving users confused about its purpose
3. **Unclear Relationship**: The relationship between the toggle switches and the dropdown is unclear

This confusion disrupts the discovery workflow and makes it difficult for users to understand what they're viewing on the map.

## Solution Overview

1. **Clear Label**: Replace ambiguous "Workers" label with explicit "Filter by: Workers / Employers" text
2. **Dropdown Investigation**: Determine if the dropdown should be functional or removed
3. **Consistent UI**: Ensure filter panel clearly indicates what type of markers are currently displayed
4. **Dynamic Label Updates**: Update label text based on current filter state

## Implementation Tasks

### Task 1: Investigate "Show" dropdown purpose and functionality

**Status**: PLANNED  
**Complexity**: 1/5  
**File**: `packages/core/features/discover/components/FilterPopup.tsx`

**Changes**:
- Review current implementation to understand dropdown's intended purpose
- Check if dropdown functionality exists but is broken, or was never implemented
- Determine if dropdown should filter results or if it's a vestigial UI element
- Document findings and decision on whether to implement or remove

**Implementation Steps**:
1. Review `FilterPopup.tsx` component structure
2. Check if there are any click handlers or state management for dropdown expansion
3. Review design documentation or tickets for original dropdown intent
4. Test current behavior: does clicking "Show" do anything?
5. Determine if dropdown should:
   - Filter by result types (Workers/Employers/Jobs) - already handled by toggles
   - Filter by additional criteria (e.g., availability, location, etc.)
   - Be removed entirely if redundant

**Code Reference**:
```118:127:packages/core/features/discover/components/FilterPopup.tsx
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Show
                      </Text>
                      {openSections.has('show') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('show') && (
```

**Expected Result**:
- Clear understanding of dropdown's intended purpose
- Decision on whether to implement functionality or remove element
- Documentation of investigation findings

---

### Task 2: Update filter label to be explicit and clear

**Status**: PLANNED  
**Complexity**: 1/5  
**File**: `packages/core/features/discover/components/FilterPopup.tsx`

**Changes**:
- Replace ambiguous "Workers" label with "Filter by: Workers"
- Update label dynamically based on active filters
- Ensure label clearly indicates what controls marker visibility
- Apply same pattern to "Organizations" and "Jobs" labels

**Implementation Steps**:
1. Update Workers toggle label from "Workers" to "Filter by: Workers"
2. Update Organizations toggle label to "Filter by: Organizations"
3. Update Jobs toggle label to "Filter by: Jobs"
4. Consider adding a section header above toggles: "Show on map:"
5. Ensure labels are accessible (proper ARIA labels)
6. Test label clarity with users if possible

**Code Reference**:
```130:144:packages/core/features/discover/components/FilterPopup.tsx
                    <YStack gap="$3" px="$3" py="$3">
                      {/* Workers Toggle */}
                      <XStack justify="space-between" items="center">
                        <Label htmlFor="workers-toggle" fontSize="$3">
                          Workers
                        </Label>
                        <Switch
                          id="workers-toggle"
                          size="$3"
                          checked={showWorkers}
                          onCheckedChange={onShowWorkersChange}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>
```

**Proposed Change**:
```typescript
<Label htmlFor="workers-toggle" fontSize="$3">
  Filter by: Workers
</Label>
```

**Alternative Approach** (Section Header):
```typescript
<YStack gap="$3" px="$3" py="$3">
  <Text fontSize="$3" fontWeight="600" mb="$2">
    Show on map:
  </Text>
  {/* Workers Toggle */}
  <XStack justify="space-between" items="center">
    <Label htmlFor="workers-toggle" fontSize="$3">
      Workers
    </Label>
    {/* ... */}
  </XStack>
```

**Expected Result**:
- Labels clearly indicate they control what appears on the map
- Users understand the relationship between toggles and map markers
- Consistent labeling across all three toggle switches

---

### Task 3: Implement or remove "Show" dropdown based on investigation

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 1  
**File**: `packages/core/features/discover/components/FilterPopup.tsx`

**Changes**:
- **If functional**: Implement dropdown functionality with appropriate filter options
- **If non-functional**: Remove dropdown UI element entirely
- Ensure no broken click handlers remain
- Simplify filter panel if dropdown is removed

**Implementation Steps** (if removing dropdown):
1. Remove "Show" accordion section button
2. Remove accordion state management for 'show' section
3. Remove conditional rendering of toggle section
4. Display toggles directly without accordion wrapper
5. Update component structure to be simpler
6. Remove unused imports (ChevronDown, ChevronRight if not used elsewhere)

**Implementation Steps** (if implementing functionality):
1. Determine what the dropdown should filter (investigate requirements)
2. Add dropdown options based on filtering needs
3. Implement selection state management
4. Connect dropdown selection to map filtering logic
5. Add proper ARIA labels and keyboard navigation
6. Test dropdown expansion and selection behavior

**Code Reference** (Current Accordion Structure):
```106:177:packages/core/features/discover/components/FilterPopup.tsx
                {/* Show Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('show')}
                    px="$3"
                    py="$2"
                    hoverStyle={{ bg: '$color3' }}
                    pressStyle={{ bg: '$color4' }}
                    rounded="$3"
                  >
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Show
                      </Text>
                      {openSections.has('show') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('show') && (
                    <YStack gap="$3" px="$3" py="$3">
                      {/* Toggles... */}
                    </YStack>
                  )}
                </YStack>
```

**Proposed Change** (if removing accordion):
```typescript
{/* Show on map section - no accordion needed */}
<YStack gap="$2" px="$3" py="$3">
  <Text fontSize="$3" fontWeight="600" mb="$2">
    Show on map:
  </Text>
  {/* Toggles directly displayed */}
  {/* ... */}
</YStack>
```

**Expected Result**:
- Dropdown is either functional or removed
- No broken UI elements remain
- Filter panel is clear and intuitive
- Simplified component structure if dropdown removed

---

### Task 4: Add dynamic label updates based on filter state

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 2  
**File**: `packages/core/features/discover/components/FilterPopup.tsx`

**Changes**:
- Update section header or labels to reflect current filter state
- Show active filter count or summary
- Provide visual feedback when filters are active
- Ensure labels update immediately when toggles change

**Implementation Steps**:
1. Calculate active filter count (how many types are visible)
2. Update section header to show active state:
   - "Show on map: Workers, Employers" (when both active)
   - "Show on map: Workers only" (when only workers active)
   - "Show on map: All" (when all three active)
3. Add visual indicator (e.g., badge) showing active filter count
4. Consider adding "Clear all" button when multiple filters active
5. Test label updates with various filter combinations

**Code Reference**:
```typescript
// Calculate active filters
const activeFilters = [
  showWorkers && 'Workers',
  showOrganizations && 'Organizations',
  showJobs && 'Jobs',
].filter(Boolean)

const activeFilterText = activeFilters.length === 3 
  ? 'All' 
  : activeFilters.join(', ')
```

**Expected Result**:
- Labels dynamically reflect current filter state
- Users can see at a glance what's currently shown on the map
- Visual feedback provides clear indication of active filters

---

### Task 5: Improve mobile responsiveness and accessibility

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 2, Task 3  
**File**: `packages/core/features/discover/components/FilterPopup.tsx`

**Changes**:
- Ensure labels are readable on mobile devices
- Add proper ARIA labels for screen readers
- Improve touch target sizes if needed
- Test keyboard navigation for all interactive elements

**Implementation Steps**:
1. Verify label text is readable on small screens (minimum 14px font size)
2. Add `aria-label` attributes to toggle switches
3. Add `aria-describedby` to connect labels with toggles
4. Ensure touch targets meet minimum 44x44px requirement
5. Test with screen reader (VoiceOver on iOS, TalkBack on Android)
6. Test keyboard navigation (Tab, Space, Enter keys)

**Code Reference**:
```typescript
<XStack justify="space-between" items="center">
  <Label 
    htmlFor="workers-toggle" 
    fontSize="$3"
    aria-label="Filter map to show workers"
  >
    Filter by: Workers
  </Label>
  <Switch
    id="workers-toggle"
    size="$3"
    checked={showWorkers}
    onCheckedChange={onShowWorkersChange}
    aria-label={showWorkers ? "Showing workers on map" : "Hiding workers on map"}
    accessibilityRole="switch"
    accessibilityState={{ checked: showWorkers }}
  >
    <Switch.Thumb animation="quick" />
  </Switch>
</XStack>
```

**Expected Result**:
- Filter panel is fully accessible
- Mobile users can easily interact with all controls
- Screen reader users receive clear announcements
- Keyboard navigation works correctly

---

## Technical Implementation Details

### Label Update Logic

```typescript
// Calculate display text based on active filters
const getFilterLabel = (
  showWorkers: boolean,
  showOrganizations: boolean,
  showJobs: boolean
): string => {
  const active: string[] = []
  if (showWorkers) active.push('Workers')
  if (showOrganizations) active.push('Organizations')
  if (showJobs) active.push('Jobs')
  
  if (active.length === 0) return 'None selected'
  if (active.length === 3) return 'All'
  return active.join(', ')
}
```

### Accordion Removal (if needed)

If the "Show" dropdown is determined to be non-functional and should be removed:

```typescript
// Remove accordion state
// const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set(['show']))
// const toggleSection = ... // Remove this function

// Simplify structure
<YStack gap="$2" px="$3" py="$3">
  <Text fontSize="$3" fontWeight="600" mb="$2">
    Show on map:
  </Text>
  {/* Toggles directly here */}
</YStack>
```

### Dynamic Section Header

```typescript
const activeFilterCount = [
  showWorkers,
  showOrganizations,
  showJobs,
].filter(Boolean).length

const sectionTitle = activeFilterCount === 3
  ? 'Show on map: All'
  : `Show on map: ${getFilterLabel(showWorkers, showOrganizations, showJobs)}`
```

---

## File Structure

### Modified Files
- `packages/core/features/discover/components/FilterPopup.tsx` - Update labels, implement/remove dropdown, improve accessibility
- `docs/features/worker-employer-filter-toggle-clarity-implementation-plan.md` - This file

### No New Files Required
- All changes are contained within existing FilterPopup component

---

## Testing Strategy

### Unit Tests
- Test label text rendering with different filter states
- Test toggle switch state changes
- Test label calculation logic

### Integration Tests
- Test filter panel opens and closes correctly
- Test toggle switches update map markers
- Test label updates when filters change
- Test dropdown behavior (if implemented) or absence (if removed)

### User Acceptance Tests
- Verify labels clearly indicate what they control
- Verify users understand relationship between toggles and map
- Verify dropdown is functional OR removed (no broken UI)
- Verify mobile users can easily interact with filters
- Verify screen reader announces filter states correctly

---

## Acceptance Criteria Checklist

### Label Clarity
- [ ] "Workers" label replaced with "Filter by: Workers" (or similar explicit text)
- [ ] "Organizations" label explicitly indicates it controls marker visibility
- [ ] "Jobs" label explicitly indicates it controls marker visibility
- [ ] All labels use consistent wording pattern

### Dropdown Functionality
- [ ] "Show" dropdown either expands with options OR is removed entirely
- [ ] If removed, no broken click handlers remain
- [ ] If implemented, dropdown filters work correctly
- [ ] No confusion about dropdown purpose

### Filter State Indication
- [ ] Labels or section header show current active filters
- [ ] Visual feedback when filters are active (optional enhancement)
- [ ] Clear indication of what's currently shown on map

### User Experience
- [ ] Users can easily understand what each toggle controls
- [ ] Switching toggles immediately updates map markers
- [ ] Filter panel is intuitive and doesn't require explanation
- [ ] Mobile users can interact with all controls easily

### Accessibility
- [ ] All toggles have proper ARIA labels
- [ ] Screen reader announces filter states correctly
- [ ] Keyboard navigation works for all interactive elements
- [ ] Touch targets meet minimum size requirements (44x44px)

---

## Dependencies

### Required Components
- `FilterPopup` - Existing component, no new dependencies
- `Switch` from Tamagui - Already in use
- `Label` from Tamagui - Already in use

### No External Dependencies
- All changes are UI-only, no API or backend changes required

---

## Rollout Strategy

1. **Phase 1**: Investigate dropdown purpose (Task 1)
2. **Phase 2**: Update filter labels (Task 2)
3. **Phase 3**: Implement or remove dropdown (Task 3)
4. **Phase 4**: Add dynamic label updates (Task 4)
5. **Phase 5**: Improve accessibility (Task 5)

**Testing**: Test after each phase to ensure no regressions

---

## Open Questions / Considerations

1. **Dropdown Purpose**: What was the original intent of the "Show" dropdown?
   - Should it filter by additional criteria beyond Workers/Employers/Jobs?
   - Is it redundant with the toggle switches?
   - Should it be removed or enhanced?

2. **Label Wording**: What exact wording is clearest?
   - "Filter by: Workers" vs "Show: Workers" vs "Display: Workers"
   - Should we use a section header instead of prefixing each label?
   - Consider user testing different phrasings

3. **Visual Feedback**: Should we add visual indicators for active filters?
   - Badge showing count of active filters
   - Highlighted section when filters are active
   - Summary text showing what's currently displayed

4. **Mobile UX**: Should filter panel behavior differ on mobile?
   - Bottom sheet vs popup?
   - Simplified layout for small screens?
   - Touch-optimized spacing?

---

## Notes

- This is primarily a UI/UX improvement with no backend changes required
- Changes should be backward compatible - existing functionality remains
- Consider gathering user feedback on label clarity before finalizing wording
- Test with real users to ensure confusion is resolved
- Document any design decisions made during dropdown investigation

