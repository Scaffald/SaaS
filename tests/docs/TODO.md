# Test Infrastructure TODO

**Last Updated:** 2025-12-01  
**Status:** Active Development

## Overview

This document consolidates all remaining test infrastructure work.

---

## 🟡 Priority 1: Deno Edge Functions Type Checking

**Objective:** Get `pnpm test:deno:types` to 0 errors (currently ~289)

**Documentation:** See `packages/supabase/functions/DENO_TYPE_CHECKING.md`

### Current Status
- ✅ Infrastructure set up: `deno.json`, `import_map.json`, `pnpm test:deno:types`
- ✅ Migrated from esm.sh to npm: specifiers
- ✅ Updated package versions (stripe@20.0.0, expo-server-sdk@4.0.0, supabase@2.86.0)
- ✅ Fixed missing `.ts` extensions (5 files)
- ✅ Fixed Database generic typing in tRPC context
- ✅ Fixed pdf-lib type declarations (2025-12-01)
- ✅ Fixed Zod SafeParse type patterns in `feedback-sync-retry/index.ts` (2025-12-01)
- ✅ Regenerated Supabase types (2025-12-01)
- ✅ Fixed team_member_audit_log references - converted to no-op (2025-12-01)
- ✅ Added `.schema('core')` to job-import queries (2025-12-01)  
- ✅ Added `.schema('onet')` to onet.router.ts getOccupation (2025-12-01)
- ✅ Excluded test files from Deno type check with find command (2025-12-01)
- ✅ Fixed `metadata` → `provider_reference` in background-check files (2025-12-01)
- 🔄 **~237 type errors remaining** (reduced from 289, 18% improvement)

### Completed Fixes (2025-12-01)

#### ✅ Missing File Extensions (5 files fixed)
```bash
# Files fixed with .ts extension:
- _shared/schemas/index.ts → profile.ts
- _shared/client-types.ts → app-router-type.ts, consolidated.ts
- _shared/types.ts → schemas/profile.ts
- app-router-type.ts → app-router-type-only.ts
- _shared/schemas/__tests__/uploadAvatarInputSchema.test.ts → consolidated.ts
```

#### ✅ Database Generic Typing (2 files fixed)
```typescript
// trpc/context.ts - Added Database import and typed Context
import type { Database } from "../_shared/database.types.ts";
export type Context = Awaited<ReturnType<typeof createTRPCContext>> & {
  supabaseAdmin?: ReturnType<typeof createClient<Database>>;
};

// trpc/middleware-roles.ts - Added Database generic to createClient
const serviceClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
```

#### ✅ Schema Selector Fixes (2 files fixed)
```typescript
// job-import/index.ts - Added .schema('core') to 5 queries
.schema('core').from('external_job_feeds')
.schema('core').from('industries')
.schema('core').from('external_jobs')

// trpc/routers/onet.router.ts - Added .schema('onet') to getOccupation
.schema('onet').from('occupation_data')
```

#### ✅ background-check metadata → provider_reference (3 files fixed)
The `background_checks` table has `provider_reference` column, not `metadata`.

```typescript
// _shared/background-check-status.ts
// Changed BACKGROUND_CHECK_BASE_COLUMNS from:
'..., metadata, ...'
// To:
'..., provider_reference, ...'

// background-check-webhook/index.ts
// Changed BackgroundCheckRecord type:
provider_reference?: unknown  // was: metadata?: unknown

// Changed code references:
typedCheck.provider_reference  // was: typedCheck.metadata
updates.provider_reference     // was: updates.metadata
```

#### ✅ Test File Exclusion from Deno Check
```bash
# Updated package.json test:deno:types command:
# Old: deno check **/*.ts
# New: find . -name '*.ts' -not -name '*.test.ts' -not -path './__tests__/*' -not -path './*/__tests__/*' -not -path './node_modules/*' -type f | xargs deno check

# Updated deno.json exclude patterns:
"exclude": [
  "node_modules",
  "_types/stripe.d.ts",
  "_shared/deno-ambient.d.ts",
  "**/*.test.ts",
  "**/__tests__/**"
]
```

### Files Modified This Session

| File | Change |
|------|--------|
| `_shared/pdf-lib.d.ts` | Created type declarations |
| `feedback-sync-retry/index.ts` | Fixed Zod SafeParse patterns |
| `_shared/team-audit-log.ts` | Converted to no-op |
| `packages/supabase/types.ts` | Regenerated types |
| `job-import/index.ts` | Added `.schema('core')` |
| `trpc/routers/onet.router.ts` | Added `.schema('onet')` |
| `_shared/background-check-status.ts` | Changed column list |
| `background-check-webhook/index.ts` | Changed metadata → provider_reference |
| `package.json` | Updated test:deno:types command |
| `functions/deno.json` | Added test file exclusions |

### Remaining Action Items

#### ✅ pdf-lib Types (4 errors) - FIXED

**Solution Applied:** Created proper type declarations in `_shared/pdf-lib.d.ts` with:
- `PDFDocument`, `PDFPage`, `PDFFont` classes
- `StandardFonts` enum
- Supporting interfaces for drawing options

#### ✅ Zod SafeParse Patterns (~15 errors) - PARTIALLY FIXED

**Solution Applied:** Fixed `feedback-sync-retry/index.ts` to use `parseResult.success === false` pattern and always call `safeParse()` directly.

**Still Affected:**
- Test files using safeParse assertions (these work in Vitest, may show errors in Deno check)

#### ✅ Removed Tables Still Referenced in Code - FIXED

**Problem (Resolved):** `team_member_audit_log` was dropped in migration 040.

**Solution Applied:** Converted `_shared/team-audit-log.ts` to a no-op that logs to console for observability. The function signature is preserved so callers don't need updates.

#### Remaining Type Issues (~237 errors)

**Categories:**
- TS2769: No overload matches (~50 errors) - missing tables, schema mismatches
- TS2339: Property does not exist (~100 errors) - most are `metadata` in background-checks.router.ts
- TS2345: Argument type mismatches (~45 errors)
- TS2589: Type instantiation excessively deep (~7 errors)
- TS2352: Type conversion errors (~15 errors)
- TS2322: Stripe API version mismatch (~4 errors)

#### Next Priority: background-checks.router.ts metadata cleanup

The `background-checks.router.ts` file still has ~15+ references to `.metadata` that need to be changed to `.provider_reference`. This is the single largest source of remaining errors.

#### TS2589 Type Instantiation (~7 errors)

**Error:** Type instantiation is excessively deep and possibly infinite

**Root Cause:** Complex Supabase query builder types with nested relations

**Workaround:** Add explicit type annotations or break up complex queries

### Estimated Total: 2-4 hours

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

### ✅ Mock Hoisting Issues (4 test files) - RESOLVED

**Error:** `vi.mock factory - no top level variables inside`

**Fixed Files:**
- ✅ `profile-employment-left.test.tsx` - uses dynamic imports after mocks
- ✅ `PortfolioGallery.test.tsx` - uses `vi.hoisted()`
- ✅ `PortfolioManager.test.tsx` - uses `vi.hoisted()`
- ✅ `usePhotoUpload.test.ts` - uses `vi.hoisted()`

**Fix Applied:** Refactored mocks using `vi.hoisted()` or dynamic imports

### ✅ Missing Mock Exports (3 test files) - RESOLVED

**Error:** `No "Palette" export is defined on "@tamagui/lucide-icons" mock`

**Fixed Files:**
- ✅ `DrawerLink.chevron.test.tsx` - has Palette export
- ✅ `OrganizationForm.test.tsx` - has Palette export
- ✅ `ResumeImportWidget.test.tsx` - has Palette export

**Fix Applied:** Added missing Palette export to `@tamagui/lucide-icons` mocks

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
| Deno Types | 0 errors | ~237 errors (was 289) |
| Unit Tests | >95% pass | ~58% pass |
| E2E Tests | >95% pass | Phase 1 only |

---

**Status Legend:** ✅ Complete | ❌ Blocked | 🔄 In Progress | 📋 Planned
