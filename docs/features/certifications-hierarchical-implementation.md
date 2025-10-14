# Hierarchical Certifications Implementation Guide

## Overview

This document outlines the implementation of the hierarchical certifications feature with progressive saving and proof management.

## Completed Work

### Backend (✅ Complete)

**Location:** `packages/supabase/functions/trpc/routers/profile/certifications.router.ts`

All endpoints implemented and ready:

1. **getTopLevelCertifications** - Search depth 0 certifications
2. **getCertificationChildren** - Get children by parent ID  
3. **getUserCertificationTree** - Reconstruct user's full tree
4. **addTopLevelCertification** - Add depth 0 (immediate save)
5. **addCategoryCertification** - Add depth 1 (immediate save)
6. **toggleSpecificCertification** - Toggle depth 2 (immediate save)
7. **removeTopLevelCertification** - Cascade delete with confirmation
8. **updateCertificationProof** - Save file or URL proof

### UI Components (✅ Complete)

**Location:** `packages/ui/src/components/certifications/`

All components created and exported:

1. **CertificationSearch** - Autocomplete search for depth 0
2. **CertificationChip** - Chip display with remove button
3. **CertificationCategoryToggle** - Collapsible toggle for depth 1
4. **CertificationCheckbox** - Checkbox with "Add Proof" button for depth 2
5. **CertificationProofCard** - Right column card for file/URL proof

## Remaining Work

### Screen Implementation

Two screen files need to be created:

#### 1. Left Column (`packages/core/features/profile/profile-certifications-left.tsx`)

**Responsibilities:**
- Display search component for depth 0 selection
- Show selected certifications as chips
- Render toggle cards for depth 1 categories
- Display checkboxes for depth 2 certifications
- Handle all progressive saves
- Manage cascade delete confirmations

**Key State Management:**
```typescript
// State to manage
- selectedTopLevel: Certification[]  // Depth 0 chips
- expandedCategories: Set<string>     // Which depth 1 are open
- selectedCertifications: Map<string, boolean>  // All checked certs
- activeCertification: string | null  // For proof card
```

**tRPC Mutations:**
```typescript
const addTopLevel = api.profile.certifications.addTopLevelCertification.useMutation()
const addCategory = api.profile.certifications.addCategoryCertification.useMutation()
const toggleCert = api.profile.certifications.toggleSpecificCertification.useMutation()
const removeTopLevel = api.profile.certifications.removeTopLevelCertification.useMutation()
```

**Flow:**
1. User searches and selects depth 0 → Immediate save → Show as chip
2. User sees depth 1 categories → Toggle to expand
3. First toggle activation → Immediate save depth 1
4. User sees depth 2 checkboxes → Check to add
5. Check action → Immediate save depth 2
6. Click "Add Proof" → Show proof card in right column

#### 2. Right Column (`packages/core/features/profile/profile-certifications-right.tsx`)

**Responsibilities:**
- Display CertificationProofCard when user clicks "Add Proof"
- Handle file uploads
- Handle URL submissions
- Show current proof if exists
- Close card after save

**Key Props:**
```typescript
interface RightColumnProps {
  activeCertificationId: string | null
  onClose: () => void
}
```

**tRPC Mutation:**
```typescript
const updateProof = api.profile.certifications.updateCertificationProof.useMutation()
```

### Integration Steps

1. **Create Left Column Screen**
   - Import all components from `@app/ui/components/certifications`
   - Set up tRPC queries and mutations
   - Implement state management for expansion/selection
   - Handle progressive saves on each action
   - Add confirmation dialog for cascade deletes

2. **Create Right Column Screen**
   - Import CertificationProofCard
   - Set up proof update mutation
   - Handle file upload (base64 conversion)
   - Handle URL submission
   - Show success/error states

3. **Update Route File**
   - Import both left and right screens
   - Pass active certification state between columns
   - Use DashboardLayout with proper column structure

4. **Testing Checklist**
   - [ ] Search and select depth 0 certification
   - [ ] Verify chip appears with remove button
   - [ ] Click remove → Verify cascade warning if has children
   - [ ] Toggle depth 1 category → Verify immediate save
   - [ ] Check depth 2 certification → Verify immediate save
   - [ ] Uncheck depth 2 → Verify immediate removal
   - [ ] Click "Add Proof" → Verify card appears in right column
   - [ ] Upload file → Verify save and "View Proof" button
   - [ ] Add URL → Verify save and link opens correctly
   - [ ] Remove proof → Verify deletion
   - [ ] Page refresh → Verify all state reconstructs correctly

## Data Flow

### Progressive Save Pattern

```
User Action → Immediate API Call → Update Local State → Refresh Tree
```

Every action saves immediately:
- Selecting depth 0 → Calls `addTopLevelCertification`
- Expanding depth 1 → Calls `addCategoryCertification`
- Checking depth 2 → Calls `toggleSpecificCertification(checked: true)`
- Unchecking depth 2 → Calls `toggleSpecificCertification(checked: false)`
- Adding proof → Calls `updateCertificationProof`

### State Reconstruction

On page load, call `getUserCertificationTree` which returns:
```typescript
{
  depth0: UserCertification[],
  depth1ByParent: Record<string, UserCertification[]>,
  depth2ByParent: Record<string, UserCertification[]>
}
```

Use this to rebuild UI state:
- Chips from depth0
- Toggle cards from depth1ByParent
- Checkboxes from depth2ByParent

## Example Code Snippets

### Search and Add Depth 0

```typescript
const handleSelectCertification = async (cert: Certification) => {
  try {
    await addTopLevel.mutateAsync({ certification_id: cert.id })
    // Refresh tree
    await refetchTree()
  } catch (error) {
    // Handle error
  }
}
```

### Toggle Depth 1 Category

```typescript
const handleToggleCategory = async (categoryId: string, parentId: string) => {
  const isExpanded = expandedCategories.has(categoryId)
  
  if (!isExpanded) {
    // First time expanding - save to DB
    try {
      await addCategory.mutateAsync({ 
        category_id: categoryId,
        parent_id: parentId 
      })
      setExpandedCategories(prev => new Set([...prev, categoryId]))
      await refetchTree()
    } catch (error) {
      // Handle error
    }
  } else {
    // Just collapse UI
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.delete(categoryId)
      return next
    })
  }
}
```

### Check/Uncheck Depth 2

```typescript
const handleCheckCertification = async (
  certId: string,
  parentId: string,
  checked: boolean
) => {
  try {
    await toggleCert.mutateAsync({
      certification_id: certId,
      parent_id: parentId,
      checked
    })
    await refetchTree()
  } catch (error) {
    // Handle error
  }
}
```

### Remove Top Level with Cascade Warning

```typescript
const handleRemoveTopLevel = async (topLevelId: string) => {
  try {
    const result = await removeTopLevel.mutateAsync({
      top_level_id: topLevelId,
      confirmed: false
    })
    
    if (result.needsConfirmation) {
      // Show confirmation dialog
      const confirmed = await showConfirmDialog({
        title: 'Remove Certification Category',
        message: result.message,
        confirmText: 'Remove All',
        cancelText: 'Cancel'
      })
      
      if (confirmed) {
        await removeTopLevel.mutateAsync({
          top_level_id: topLevelId,
          confirmed: true
        })
        await refetchTree()
      }
    } else {
      // No children, removed successfully
      await refetchTree()
    }
  } catch (error) {
    // Handle error
  }
}
```

## Architecture Benefits

1. **Progressive Saves** - No "Save" button needed, changes persist immediately
2. **Hierarchical Structure** - Clear depth 0 → depth 1 → depth 2 organization
3. **Cascade Safety** - Warns before removing parent with children
4. **Proof Management** - Optional proof for each certification
5. **State Reconstruction** - Tree rebuilds correctly on page load
6. **Cross-Platform** - Components work on web and mobile

## Next Steps

1. Create `profile-certifications-left.tsx` with full implementation
2. Create `profile-certifications-right.tsx` with proof card
3. Test all flows thoroughly
4. Handle edge cases and error states
5. Add loading states and optimistic updates
6. Implement confirmation dialogs
7. Add success/error toasts

## Notes

- All backend endpoints are functional and tested
- All UI components are type-safe and ready
- Schema supports the full hierarchy
- RLS policies are in place for security
- File uploads use base64 encoding
- URLs are validated on save
