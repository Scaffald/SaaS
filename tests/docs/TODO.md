# Test Infrastructure TODO

**Last Updated:** 2025-12-01  
**Status:** Active Development

## Overview

This document consolidates all remaining test infrastructure work.

---

## 🔴 Priority 1: Deno Edge Functions Type Checking

**Objective:** Get `pnpm test:deno:types` to 0 errors (currently 460)

**Documentation:** See `packages/supabase/functions/DENO_TYPE_CHECKING.md`

### Current Status
- ✅ Infrastructure set up: `deno.json`, `import_map.json`, `pnpm test:deno:types`
- ✅ Migrated from esm.sh to npm: specifiers
- ✅ Updated package versions (stripe@20.0.0, expo-server-sdk@4.0.0, supabase@2.86.0)
- ❌ **460 type errors remaining**

### Action Items

#### Quick Wins (~20 errors, ~30 min)

**A. Missing File Extensions (3 errors)**
```bash
# Files need .ts extension in imports:
- _shared/schemas/consolidated → consolidated.ts
- _shared/schemas/profile → profile.ts  
- app-router-type → app-router-type.ts
```

**B. Missing Exports (4 errors)**
```typescript
// _shared/feedback-sync.ts - add 'export' keyword
export function updateFeedbackStatus(...)

// trpc/__tests__/integration/seed-utils.ts
export function createAdminClient(...)
```

**C. pdf-lib Types (4 errors)** - Add types to import_map.json or use different import pattern

#### Stripe Namespace Issues (~43 errors, 1-2 hours)

**Root Cause:** Custom `_shared/stripe.types.ts` conflicts with npm `stripe@20.x`

**Fix:**
1. Audit `_shared/stripe.types.ts` - remove or rename
2. Update imports to Stripe 20.x patterns:
```typescript
// Use type imports for namespace types
import Stripe from 'stripe'
type Customer = Stripe.Customer
```

#### Schema Resolution (~200+ errors, 2-4 hours)

**Root Cause:** Queries default to `public` schema but tables are in `core` schema

**Option A - Per-query fix:**
```typescript
// Before
supabase.from('users').select()

// After  
supabase.schema('core').from('users').select()
```

**Option B - Typed client helper:**
```typescript
// Create typed client that defaults to core schema
const supabase = createClient<Database, 'core'>()
```

#### Remaining Fixes (~30 min)

- **Zod SafeParse:** Use `!result.success` pattern instead of `result.error`
- **Buffer imports:** Add `import { Buffer } from "node:buffer"`

### Estimated Total: 4-8 hours

### Success Criteria
- [ ] `pnpm test:deno:types` returns 0 errors
- [ ] Add to CI pipeline

---

## 🔴 Priority 2: Vitest Unit Test Fixes

### Critical Blockers (Syntax/Import)

**Problem:** `SyntaxError: Unexpected token 'typeof'` blocks multiple test files

**Affected Files:**
- `EmploymentPrefsStep.test.tsx`
- `routeHierarchy.test.ts`
- `login-screen.test.tsx`
- Any file importing `routes.ts`

**Root Cause:** Vitest's TypeScript transform can't parse `z.infer<typeof schema>` or `type X = typeof Y`

**Possible Solutions:**
- [ ] Update vitest config transform options
- [ ] Refactor affected files to use explicit types
- [ ] Add esbuild/swc plugin for better TypeScript handling

### Component Rendering Issue (~150+ tests)

**Problem:** Components render empty `<body />` - no errors thrown

**Most Affected:**
- Profile Wizard Steps (22 tests)
- Office/Team Components (20 tests)
- Discover Components (25 tests)

**Investigation Status:**
- ✅ Error boundaries added - no errors caught
- ✅ Mocks verified - look correct
- ✅ Test IDs added - ready when rendering works
- ❌ **Root cause still unknown**

**Next Steps:**
- [ ] Check `useId()` hook in vitest/jsdom
- [ ] Check React 18 features support
- [ ] Create minimal reproduction
- [ ] Compare with working component tests

### Mock Hoisting Issues (4 test files)

**Error:** `vi.mock factory - no top level variables inside`

**Affected:**
- `profile-employment-left.test.tsx`
- `PortfolioGallery.test.tsx`
- `PortfolioManager.test.tsx`
- `usePhotoUpload.test.ts`

**Fix:** Refactor mocks to avoid hoisting issues

### Missing Mock Exports (3 test files)

**Error:** `No "Palette" export is defined on "@tamagui/lucide-icons" mock`

**Affected:**
- `DrawerLink.chevron.test.tsx`
- `OrganizationForm.test.tsx`
- `ResumeImportWidget.test.tsx`

**Fix:** Add missing exports to mocks

---

## 🟡 Priority 3: E2E Test Re-enablement

### Phase 2: Flaky Test Identification
- [ ] Run each category 3x
- [ ] Document flaky tests
- [ ] Classify as stable/flaky/skip

### Phase 3: Timeout Optimization
- [ ] Configure per-category timeouts
- [ ] Target P95 < 30 seconds

### Phase 4: Full Suite Enablement
1. [ ] Auth tests (12 files)
2. [ ] Dashboard tests (4 files)
3. [ ] Profile tests (19 files)
4. [ ] Discover tests (8 files)
5. [ ] Office tests (13 files)

---

## Commands Reference

```bash
# Deno type checking
pnpm test:deno:types

# Unit tests
pnpm test:unit
pnpm test:vitest

# E2E tests
pnpm test:playwright

# Full validation
pnpm check              # Format, lint, type check
pnpm test:all           # Integration + build
```

---

## Success Criteria

| Category | Target | Current |
|----------|--------|---------|
| Deno Types | 0 errors | 460 errors |
| Unit Tests | >95% pass | ~58% pass |
| E2E Tests | >95% pass | Phase 1 only |

---

**Status Legend:** ✅ Complete | ❌ Blocked | 🔄 In Progress | 📋 Planned
