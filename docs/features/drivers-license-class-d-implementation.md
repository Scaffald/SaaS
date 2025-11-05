# Driver's License Class D Support - Implementation Plan

**Requirement**: REQ-35  
**Status**: Ready to Implement  
**Complexity**: 2/5 ⭐⭐  
**Readiness**: 5/5 🟢🟢🟢🟢🟢

## Overview

Add Class D (standard driver's license) support to the employment profile form with automatic selection behavior when users check the "I have a valid driver's license" toggle.

## Implementation Tasks

### Phase 1: Schema Updates (Foundation)

#### Task 1.1: Update Frontend Schema
**File**: `packages/core/features/profile/config/employment-schema.ts`

**Changes**:
1. Add "Class D" to `DRIVERS_LICENSE_OPTIONS` array (after "Class C", before "CDL A")
2. Add "Class D" to the Zod enum in `drivers_license_classes` schema

**Location**:
- Line 92-100: Update `DRIVERS_LICENSE_OPTIONS` constant
- Line 29-41: Update Zod enum array

#### Task 1.2: Update Backend Schema - profile.ts
**File**: `packages/supabase/functions/_shared/schemas/profile.ts`

**Changes**:
1. Add "Class D" to the Zod enum in `drivers_license_classes` (line 84-96)

**Location**:
- Line 86-94: Update enum array

#### Task 1.3: Update Backend Schema - consolidated.ts
**File**: `packages/supabase/functions/_shared/schemas/consolidated.ts`

**Changes**:
1. Add "Class D" to `DRIVERS_LICENSE_OPTIONS` constant (line 80-88)
2. Note: The input schema uses `z.array(z.string()).optional()` which is less strict, but we should still update the constant for consistency

**Location**:
- Line 80-88: Update `DRIVERS_LICENSE_OPTIONS` constant

### Phase 2: UI Implementation (Auto-Selection Logic)

#### Task 2.1: Implement Auto-Selection Logic
**File**: `packages/core/features/profile/components/EmploymentSection.tsx`

**Changes**:
1. Update `onCheckedChange` handler (line 309-315) to auto-select Class D when toggle is checked
2. Update description text (line 307) to explain auto-selection behavior
3. Reorder checkboxes to position Class D after Class C
4. Update Class D label to include "(standard driver's license)" text
5. Fix text display logic to handle Class D label correctly

**Current Code** (lines 309-315):
```typescript
onCheckedChange={(checked) => {
  if (readOnly) return
  setIsExpanded(checked)
  if (!checked) {
    field.onChange([])
  }
}}
```

**New Code**:
```typescript
onCheckedChange={(checked) => {
  if (readOnly) return
  setIsExpanded(checked)
  if (checked) {
    // Auto-select Class D when toggle is checked
    field.onChange(["Class D"])
  } else {
    field.onChange([])
  }
}}
```

#### Task 2.2: Update Description Text
**Location**: Line 307

**Current**:
```typescript
description="Select all license classes that apply"
```

**New**:
```typescript
description="Class D (standard license) is automatically selected. Add any additional classes below."
```

#### Task 2.3: Reorder License Options
**Location**: Line 319 (in `DRIVERS_LICENSE_OPTIONS.map`)

**Current Order**:
- Class M, Class A, Class B, Class C, CDL A, CDL B, CDL C

**New Order** (via updated constant):
- Class M, Class A, Class B, Class C, **Class D**, CDL A, CDL B, CDL C

#### Task 2.4: Update Class D Label Display
**Location**: Line 348

**Current**:
```typescript
Class {license}
```

**New**:
```typescript
{license === "Class D" 
  ? "Class D (standard driver's license)"
  : `Class ${license}`
}
```

**Note**: This handles the display correctly since "Class D" already includes "Class", but CDL classes need the "Class" prefix.

### Phase 3: Database Migration

#### Task 3.1: Create Migration File
**File**: `packages/supabase/migrations/009_add_class_d_drivers_license.sql`

**Purpose**: Update existing users who have indicated they have a driver's license but have no specific class selected to default to Class D.

**SQL**:
```sql
-- Migration: Add Class D default for existing users with empty license classes
-- Date: 2025-11-05
-- Purpose: Set Class D (standard driver's license) as default for users who
--          previously checked "I have a license" but didn't specify a class

BEGIN;

-- Update users with empty or null license classes to include Class D
-- This assumes users who checked "I have a license" but didn't specify
-- a class have the standard Class D license
UPDATE core.user_private
SET drivers_license_classes = ARRAY['Class D']::text[]
WHERE (drivers_license_classes = ARRAY[]::text[] OR drivers_license_classes IS NULL)
  AND EXISTS (
    -- Only update if user has some employment data (indicates they've used the form)
    SELECT 1 FROM core.user_private up
    WHERE up.id = core.user_private.id
    AND (
      up.preferred_work_locations IS NOT NULL
      OR up.travel_distance_miles IS NOT NULL
      OR up.hourly_rate IS NOT NULL
    )
  );

-- Log the number of affected rows
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Migration updated % users with Class D default', affected_count;
END $$;

COMMIT;
```

**Note**: The migration is conservative - it only updates users who have other employment data, indicating they've used the form. This prevents updating users who haven't touched the employment section.

### Phase 4: Testing & Validation

#### Task 4.1: Manual Testing Checklist
- [ ] New user: Check toggle → Class D auto-selected
- [ ] New user: Can add additional classes (e.g., Class M)
- [ ] New user: Can remove Class D and keep other classes
- [ ] New user: Uncheck toggle → all classes cleared
- [ ] New user: Re-check toggle → Class D auto-selected again
- [ ] Existing user: Verify migration updated empty license classes
- [ ] Form submission: Verify Class D is accepted by backend
- [ ] UI display: Verify Class D label shows "(standard driver's license)"
- [ ] Multi-select: Verify multiple classes can be selected together

#### Task 4.2: Type Checking
```bash
pnpm typecheck
```

#### Task 4.3: Linting
```bash
pnpm check
```

#### Task 4.4: Build Verification
```bash
pnpm build
```

## File Modification Summary

### Files to Modify:
1. ✅ `packages/core/features/profile/config/employment-schema.ts`
   - Update `DRIVERS_LICENSE_OPTIONS` array
   - Update Zod enum

2. ✅ `packages/supabase/functions/_shared/schemas/profile.ts`
   - Update Zod enum

3. ✅ `packages/supabase/functions/_shared/schemas/consolidated.ts`
   - Update `DRIVERS_LICENSE_OPTIONS` constant

4. ✅ `packages/core/features/profile/components/EmploymentSection.tsx`
   - Update auto-selection logic
   - Update description text
   - Update Class D label display

### Files to Create:
5. ✅ `packages/supabase/migrations/009_add_class_d_drivers_license.sql`
   - New migration file

## Implementation Order

1. **Schema Updates** (Tasks 1.1, 1.2, 1.3) - Foundation first
2. **UI Implementation** (Tasks 2.1, 2.2, 2.3, 2.4) - User-facing changes
3. **Database Migration** (Task 3.1) - Data updates
4. **Testing** (Task 4.1-4.4) - Validation

## Acceptance Criteria

✅ **Given** a user is editing their employment profile  
**When** they check "I have a valid driver's license"  
**Then** Class D is automatically added to their selected license classes

✅ **Given** a user has Class D auto-selected  
**When** they expand the license class options  
**Then** they see "Class D (standard driver's license)" checkbox checked

✅ **Given** a user wants to add additional license classes  
**When** they check other class checkboxes  
**Then** multiple classes can be selected simultaneously including Class D

✅ **Given** a user wants to remove Class D  
**When** they uncheck the Class D checkbox  
**Then** Class D is removed from their selection while other classes remain

✅ **Given** an existing user had "I have a valid driver's license" checked with no class specified  
**When** the migration runs  
**Then** their profile is updated to include Class D in their license classes

✅ **Given** a user submits the form with Class D selected  
**When** the backend validates the data  
**Then** Class D is accepted as a valid license class option

✅ **Given** a user views the license selection UI  
**When** they read the description text  
**Then** they see "Class D (standard license) is automatically selected. Add any additional classes below."

## Rollout Strategy

1. **Deploy schema updates** - Add Class D to all enums
2. **Deploy UI changes** - Auto-selection behavior
3. **Run migration** - Update existing user data
4. **Monitor** - Check for any issues or user feedback

## Notes

- **Backward Compatibility**: No breaking changes - only adding a new enum value
- **Data Migration**: Conservative approach - only updates users with other employment data
- **User Experience**: Auto-selection makes the form more intuitive for most users
- **Flexibility**: Users can still remove Class D if they only have commercial licenses

## Related Files Reference

- Frontend Schema: `packages/core/features/profile/config/employment-schema.ts`
- Frontend Component: `packages/core/features/profile/components/EmploymentSection.tsx`
- Backend Schema (profile): `packages/supabase/functions/_shared/schemas/profile.ts`
- Backend Schema (consolidated): `packages/supabase/functions/_shared/schemas/consolidated.ts`
- Migration Template: `packages/supabase/migrations/001_schema.sql`

