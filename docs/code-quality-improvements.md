# Code Quality Improvements Plan

## Status: In Progress

This document tracks our gradual improvements to linting and type safety settings.

## Phase 1: Completed ✅

### TypeScript Strict Checks - PARTIALLY ROLLED BACK
**Date:** 2025-01-11

**Changes Made:**
- Added `noUncheckedIndexedAccess: true` (REVERTED - too many errors)
- Added `noImplicitOverride: true` (REVERTED - needs assessment)
- Added `noPropertyAccessFromIndexSignature: true` (REVERTED - too many errors)

**Result:** These settings flagged 100+ errors across the codebase. Requires significant refactoring.

### Biome Import Type Enforcement ✅
**Date:** 2025-01-11

**Changes Made:**
- Enabled `useImportType: "warn"` in biome.json

**Result:** No issues found - this change is safe and provides benefits for tree-shaking.

## Phase 3: Route Constants Type Safety ✅
**Date:** 2025-01-11

**Changes Made:**
- Refactored `packages/core/constants/routes.ts` to use flat structure with proper typing
- Created `RouteBuilder` helper for dynamic route generation
- Replaced all `?.fullPath || '/fallback'` patterns with direct `.path` access
- Updated 14+ files to use new route constants structure
- Eliminated all string literal route paths in navigation code

**Files Updated:**
- `packages/core/constants/routes.ts` - Complete rewrite with type-safe structure
- `packages/core/features/office/office-universities-list.tsx`
- `packages/core/features/office/office-jobs-list.tsx`
- `packages/core/features/office/office-users-list.tsx`
- `apps/expo/app/office/universities/[id]/edit.tsx`
- `packages/core/features/discover/components/WorkerPreviewModal.tsx`
- `packages/core/features/auth/components/MagicLinkPending.tsx`
- `packages/core/utils/auth/useProtectedRoute.ts`
- `packages/core/provider/auth/AuthStateChangeHandler.ts`
- `apps/expo/app/office/index.tsx`
- `apps/expo/app/index.tsx`
- `packages/core/features/drawer/config.ts`
- `packages/core/features/drawer/utils.ts`
- `packages/core/features/drawer/DrawerHeader.tsx`

**Benefits:**
- ✅ Full type safety for all routes
- ✅ Autocomplete support in IDEs
- ✅ Compile-time route validation
- ✅ No more optional chaining or fallback strings
- ✅ Single source of truth for routes
- ✅ Helper functions for dynamic routes (e.g., `RouteBuilder.officeJobsEdit(id)`)

**Result:** All route references are now type-safe with zero runtime overhead. No TypeScript errors.

## Phase 2: Recommended Next Steps
## Phase 4: noImplicitOverride + Non-Null Assertions ✅
**Date:** 2025-01-11

**Changes Made:**
- Added `noImplicitOverride: true` to `tsconfig.base.json`
- Changed `noNonNullAssertion: "off"` to `"warn"` in `biome.json`
- Ran audit and found 13 instances of non-null assertions
- Auto-fixed 6 instances in `AttachmentsStep.tsx`

**Results:**
- ✅ `noImplicitOverride` enabled - No errors! Project already follows this pattern
- ✅ Non-null assertions: Reduced from 13 to 7 (6 fixed automatically)
- ✅ Created detailed audit document at `docs/non-null-assertions-audit.md`

**Remaining Work:**
- 7 non-null assertions to fix manually:
  - 2 in office edit pages (route params)
  - 2 in geocoding provider (env variables)
  - 2 in onboarding components (refs/state)
  - 1 in theme provider (configuration)

**Benefits:**
- Compile-time method override safety
- Runtime null-safety instead of compile-time assertions
- Documented all remaining issues with clear fix strategies

## Phase 5: Recommended Next Steps

### Option A: Ultra-Gradual Approach (Recommended)
Start with the least disruptive changes:

1. **Keep only `useImportType: "warn"`** (already done)
2. **Add `noImplicitOverride: true`** - Likely minimal impact
3. **Run `pnpm lint:fix`** to auto-fix import types
4. **Monitor for a week** before next change

### Option B: Targeted Strict Checks
Enable strict checks only for new code:

1. **Create separate tsconfig for new features**
2. **Gradually migrate existing code** package by package
3. **Use per-file overrides** for problematic areas

### Option C: Fix Current Issues First
Address the major error categories before adding more rules:

1. **Fix Routes Constants** (~50 errors)
   - Refactor `packages/core/constants/routes.ts`
   - Use proper typing instead of index signatures
   
2. **Fix Environment Variable Access** (~10 errors)
   - Add proper type declarations for process.env
   - Use bracket notation consistently
   
3. **Fix Application Form Types** (~100 errors)
   - Add proper interfaces for form data
   - Remove index signature usage

## Detailed Error Analysis

### TypeScript Errors Found

#### 1. noPropertyAccessFromIndexSignature (Most Common)
**Error:** `Property 'X' comes from an index signature, so it must be accessed with ['X']`

**Affected Files:**
- `packages/core/constants/routes.ts` - Routes object needs proper typing
- `app/styleguide/forms.tsx` - Environment variables
- `packages/core/features/applications/**` - Form data access

**Example:**
```typescript
// Current (causes error)
const route = ROUTES.dashboard.childrenArray

// Required fix
const route = ROUTES['dashboard'].childrenArray

// Better fix (recommended)
// Define proper interface without index signature
interface Routes {
  dashboard: RouteConfig;
  auth: RouteConfig;
  office: RouteConfig;
}
```

#### 2. noUncheckedIndexedAccess
**Error:** `Object is possibly 'undefined'`

**Affected Files:**
- Array access throughout codebase
- Object property access

**Example:**
```typescript
// Current (causes error)
const item = array[0]

// Required fix
const item = array[0] ?? defaultValue
// or
const item = array.at(0)
```

#### 3. Possible Undefined (from noUncheckedIndexedAccess)
**Error:** `'ROUTES.X' is possibly 'undefined'`

**Files:** Same as #1 above

## Recommended Configuration

### Conservative (Current)
```json
{
  "compilerOptions": {
    "strict": true,
    // Keep these disabled for now
    "noUncheckedIndexedAccess": false,
    "noImplicitOverride": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

### Biome (Current - Good)
```json
{
  "linter": {
    "rules": {
      "style": {
        "useImportType": "warn"  // ✅ Safe to keep
      }
    }
  }
}
```

## Future Phases

### Phase 3: Non-Null Assertions (Medium Impact)
- Enable `noNonNullAssertion: "warn"` in Biome
- Audit and refactor `!` assertions
- Estimated effort: 2-3 days

### Phase 4: React Hooks Dependencies (High Impact)
- Enable `useExhaustiveDependencies: "warn"`
- Review all React hooks
- Estimated effort: 1-2 weeks

### Phase 5: Remove File-Specific Exceptions
- Fix `packages/core/features/profile/profile-skills-left.tsx`
- Fix `packages/supabase/functions/_shared/client-types.ts`
- Remove overrides from biome.json

### Phase 6: Enable Remaining Strict Checks
- Revisit `noUncheckedIndexedAccess` after code refactoring
- Enable `noPropertyAccessFromIndexSignature` after routes refactor
- Consider `exactOptionalPropertyTypes`

## Metrics

- **Current TypeScript Errors:** 0 (with strict: true only)
- **Errors with All Strict Checks:** 100+
- **Auto-fixable Issues:** ~10 (import types)
- **Manual Fixes Required:** 90+

## Decision Points

### Should we proceed with stricter checks?

**Arguments For:**
- Catches real bugs (undefined access, array bounds)
- Better IDE autocomplete
- Forces better code patterns
- Industry best practice

**Arguments Against:**
- Significant refactoring effort required
- May slow down current development
- Some patterns are safe in practice
- Team velocity impact

### Recommendation
Take ultra-gradual approach (Option A):
1. Keep only the import type warning (already safe)
2. Add one strict check per month
3. Fix issues as they arise in new code
4. Gradually refactor existing code
5. Measure impact on development velocity

## Resources

- [TypeScript Handbook - Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Biome Linter Rules](https://biomejs.dev/linter/rules/)
- Project-specific rules: `.cursor/rules/typescript-typing.mdc`
