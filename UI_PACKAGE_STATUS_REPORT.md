# @unicornlove/ui Package - Status Report

**Generated**: December 1, 2025
**Focus Area**: Linting, TypeScript, and Test Coverage Analysis

---

## Executive Summary

The @unicornlove/ui package is nearly production-ready but has **4 critical issues** blocking 100% compliance and needs **comprehensive test coverage** (currently only 6% = 7 tests for 116 components).

### Quick Stats
- **Components**: 116 files (`.tsx`)
- **Existing Tests**: 7 test files (6% coverage)
- **Linting Errors**: 4 (React hooks violations, `any` types)
- **TypeScript Errors**: ~35 (styleguide components)
- **Test Gap**: 109 untested components
- **Status**: ⚠️ PARTIAL - Linting issues + missing test coverage

---

## 1. LINTING ISSUES (4 Errors)

### 1.1 React Hook Violations (2 errors)

#### Issue A: FormWrapper.native.tsx - Hook in Try-Catch Block

**File**: `src/components/FormWrapper.native.tsx`
**Line**: 18-20
**Error Type**: `useHookAtTopLevel`

```typescript
// ❌ CURRENT (WRONG)
const useHeaderHeight = () => {
  let headerHeight: number
  try {
    headerHeight = useHeaderHeightOG()  // ← Hook called conditionally
    _headerHeightError = false
  } catch (_error) {
    _headerHeightError = true
    headerHeight = 0
  }
  return headerHeight
}
```

**Problem**: React requires hooks to be called unconditionally at the component top level. Wrapping in try-catch violates this rule.

**Solution**: Call hook unconditionally, wrap the result handling in try-catch instead.

**Fix Complexity**: ⭐ LOW (straightforward refactor)

---

#### Issue B: MapContainer.native.tsx - Hook After Early Return

**File**: `src/components/maps/MapContainer.native.tsx`
**Line**: 66
**Error Type**: `useHookAtTopLevel`

```typescript
// ❌ CURRENT (WRONG)
if (!MapboxGL) {
  return (
    <Text>Loading...</Text>
  )
}

// Hook called after early return ❌
useEffect(() => {
  // ...
}, [isMapReady, onMapReady])
```

**Problem**: `useEffect` called after early return violates React hook rules.

**Solution**: Move `useEffect` call to before the early return (will be skipped by return, then hook called on next render).

**Fix Complexity**: ⭐ LOW (move hook to top level)

---

### 1.2 `any` Type Issues (2 errors)

#### Issue C: MapContainer.tsx - Canvas Type Cast

**File**: `src/components/maps/MapContainer.tsx`
**Line**: 1131
**Error Type**: `noExplicitAny`

```typescript
// ❌ CURRENT
map.addImage(imageId, canvas as any, { pixelRatio: 2 })
                               ^^^
```

**Problem**: Using `any` type disables type checking for canvas object.

**Solution**: Use proper type `HTMLCanvasElement | OffscreenCanvas | ImageData` or `Record<string, unknown>`

**Fix Complexity**: ⭐ LOW (determine correct type from mapbox-gl API)

---

#### Issue D: maps/types.ts - Generic Data Field

**File**: `src/components/maps/types.ts`
**Line**: 21
**Error Type**: `noExplicitAny`

```typescript
// ❌ CURRENT
export interface MapPin {
  id: string
  location: Location
  selected?: boolean
  data?: any  // ← Should be more specific
}
```

**Problem**: Generic `any` type for data field doesn't indicate what structure is expected.

**Solution**: Use `unknown` with type guard or specific interface like `Record<string, unknown>` or `MapPinData`

**Fix Complexity**: ⭐ LOW (replace with `unknown` or proper interface)

---

## 2. TYPESCRIPT ERRORS (~35 errors)

### 2.1 Styleguide Components - Type Compatibility Issues

**Files Affected**:
- `src/styleguide/components/Sidebar.tsx` (multiple errors)
- `src/styleguide/components/StyleguidePage.tsx` (multiple errors)
- `src/styleguide/components/TodoCallout.tsx` (multiple errors)

**Error Pattern**:
```typescript
// ❌ CURRENT
<YStack gap={10}>
  {children}  // ← Type error: children incompatible
</YStack>

// Error: Type '{ children: ReactNode }' is not assignable to type
// 'WithShorthands<WithThemeValues<StackStyleBase>>'
```

**Root Cause**: Tamagui v3 type system is strict about children prop vs style props

**Solution**: Review Tamagui v3 component API - children should be passed separately or component needs proper typing

**Fix Complexity**: ⭐⭐ MEDIUM (requires Tamagui API review)

---

### 2.2 Tamagui Config - AnimationDriver Type

**File**: `src/tamagui.config.ts`
**Line**: 21
**Error Type**: Type mismatch

```typescript
// ❌ Error
const tamaguiConfig = createTamagui(config)
// Type 'AnimationsType' is missing AnimationDriver properties
```

**Root Cause**: Config doesn't properly implement AnimationDriver interface

**Solution**: Verify Tamagui v3 config structure, update if needed

**Fix Complexity**: ⭐⭐ MEDIUM (config API review)

---

## 3. TEST COVERAGE (6% - CRITICAL)

### Current State
- **Total Components**: 116
- **Tested Components**: 7
- **Coverage Gap**: 109 components (94%)

### Existing Tests (7 files)
```
✓ src/components/buttons/__tests__/
✓ src/components/chips/__tests__/
✓ src/components/cards/__tests__/
✓ src/components/navigation/__tests__/
✓ src/components/address/__tests__/ + hooks
✓ src/components/maps/__tests__/
✓ src/components/states/__tests__/
```

### Components Without Tests (Organized by Priority)

**PRIORITY 1: Utility Components (30 files)**
- All text/display components (Heading, Paragraph, Text, etc.)
- All layout components (Stack, View, Divider, etc.)
- All simple visual components (Badge, Icon, Image, etc.)
- Skeletons and loading states

**PRIORITY 2: Interactive Components (35 files)**
- Form inputs (TextInput, Select, Checkbox, etc.)
- Dialog, Popovers, Sheets
- DatePicker components
- SearchSelect components
- Table component

**PRIORITY 3: Hooks (15 files)**
- Custom hooks in address, search-select, date-picker
- Utility hooks

**PRIORITY 4: Complex Components (20 files)**
- Maps (partially tested, needs more)
- Charts (SkillsChart)
- Kanban
- Image picker/cropper
- Cookie consent
- FormWrapper variants

---

## 4. PRIORITY ROADMAP

### Phase 1: Fix Linting Issues (1-2 hours)
```
[ ] Fix FormWrapper.native.tsx hook
[ ] Fix MapContainer.native.tsx hook
[ ] Replace canvas `any` with proper type
[ ] Replace data field `any` with `unknown`
```

**Impact**: ✅ 4/4 linting errors eliminated

---

### Phase 2: Fix TypeScript Errors (3-5 hours)
```
[ ] Update styleguide Sidebar.tsx typing
[ ] Update styleguide StyleguidePage.tsx typing
[ ] Update styleguide TodoCallout.tsx typing
[ ] Review/fix tamagui.config.ts
```

**Impact**: ✅ ~35 TypeScript errors eliminated

---

### Phase 3: Test Coverage Priority 1 (15-20 hours)
```
[ ] Create tests for 30 utility components
[ ] Target: 2-3 tests per component
[ ] Focus on: rendering, props, basic states
```

**Impact**: 📊 Coverage jumps to ~40%

---

### Phase 4: Test Coverage Priority 2 (25-30 hours)
```
[ ] Create tests for 35 interactive components
[ ] Target: 3-5 tests per component
[ ] Focus on: user interactions, state changes, validation
```

**Impact**: 📊 Coverage jumps to ~70%

---

### Phase 5: Test Coverage Priority 3 (10-15 hours)
```
[ ] Create tests for 15 custom hooks
[ ] Target: 3-4 tests per hook
[ ] Focus on: hook behavior, dependencies, effects
```

**Impact**: 📊 Coverage jumps to ~80%

---

### Phase 6: Test Coverage Priority 4 (20-30 hours)
```
[ ] Create tests for 20 complex components
[ ] Target: 5+ tests per component
[ ] Focus on: mocked dependencies, complex interactions
```

**Impact**: 📊 Coverage reaches 95%+

---

## 5. DETAILED ISSUE BREAKDOWN

### Linting Errors Details

| Error | File | Line | Type | Severity | Fix Time |
|-------|------|------|------|----------|----------|
| Hook in try-catch | FormWrapper.native.tsx | 18 | useHookAtTopLevel | 🔴 HIGH | 15 min |
| Hook after return | MapContainer.native.tsx | 66 | useHookAtTopLevel | 🔴 HIGH | 15 min |
| Canvas `any` | MapContainer.tsx | 1131 | noExplicitAny | 🟡 MEDIUM | 10 min |
| Data field `any` | maps/types.ts | 21 | noExplicitAny | 🟡 MEDIUM | 10 min |

---

### TypeScript Errors Details

| File | Error Count | Root Cause | Severity | Fix Time |
|------|-------------|-----------|----------|----------|
| Sidebar.tsx | ~10 | Tamagui v3 children typing | 🟡 MEDIUM | 30 min |
| StyleguidePage.tsx | ~10 | Tamagui v3 children typing | 🟡 MEDIUM | 30 min |
| TodoCallout.tsx | ~10 | Tamagui v3 children typing | 🟡 MEDIUM | 30 min |
| tamagui.config.ts | 5 | AnimationDriver config | 🟡 MEDIUM | 30 min |

---

### Test Coverage Gap

| Category | Files | Current Tests | Target Tests | Gap |
|----------|-------|----------------|--------------|-----|
| Utility Components | 30 | 0 | 60-90 | 60-90 |
| Interactive Components | 35 | 0 | 105-175 | 105-175 |
| Custom Hooks | 15 | 3 | 45-60 | 42-57 |
| Complex Components | 20 | 4 | 100+ | 96+ |
| **TOTALS** | **100** | **7** | **310-525** | **303-518** |

---

## 6. SUCCESS CRITERIA

### Linting Status: ✅ MUST FIX
- [ ] 0 errors (currently 4)
- [ ] 0 hook violations
- [ ] 0 `any` types (in component code, excluding infrastructure)

### TypeScript Status: ✅ MUST FIX
- [ ] 0 errors (currently ~35)
- [ ] All components type-safe
- [ ] Config files valid

### Test Coverage: 📊 TARGET 95%+
- [ ] 310+ test cases
- [ ] 95%+ line coverage
- [ ] 85%+ branch coverage
- [ ] All tests passing
- [ ] No flaky tests

---

## 7. ESTIMATED EFFORT

| Phase | Tasks | Estimated Time |
|-------|-------|-----------------|
| **Phase 1** | Fix linting (4 issues) | 1 hour |
| **Phase 2** | Fix TypeScript (~35 issues) | 3-4 hours |
| **Phase 3** | Test utility components | 15-20 hours |
| **Phase 4** | Test interactive components | 25-30 hours |
| **Phase 5** | Test hooks | 10-15 hours |
| **Phase 6** | Test complex components | 20-30 hours |
| **TOTAL** | All phases | **74-99 hours** |

---

## 8. RECOMMENDATIONS

### Immediate Actions (TODAY)
1. ✅ Fix 4 linting errors (1 hour)
2. ✅ Fix TypeScript errors (3-4 hours)
3. ✅ Commit all fixes (0.5 hour)

### This Week
1. Set up test infrastructure in UI package
2. Create test files for utility components
3. Aim for 40%+ coverage

### Next 2 Weeks
1. Complete tests for interactive components
2. Complete tests for custom hooks
3. Aim for 80%+ coverage

### Following Weeks
1. Complete tests for complex components
2. Polish and optimize tests
3. Achieve 95%+ coverage

---

## 9. TESTING STRATEGY

### Framework & Tools
- **Test Runner**: Vitest
- **Assertion Library**: Vitest built-in
- **Component Testing**: React Testing Library
- **Mocking**: vi.mock(), test utilities
- **Coverage**: v8 provider (already configured)

### Test Patterns
```typescript
// Utility Component
describe('Button', () => {
  it('renders with children', () => {})
  it('applies size variant', () => {})
  it('handles disabled state', () => {})
})

// Interactive Component
describe('TextInput', () => {
  it('accepts input', async () => {})
  it('calls onChange', async () => {})
  it('validates on blur', async () => {})
})

// Custom Hook
describe('useSearch', () => {
  it('filters on query change', async () => {})
  it('debounces', async () => {})
  it('cleans up', () => {})
})
```

---

## 10. CONCLUSION

**Current Status**: 🟡 PARTIAL (Linting issues + low test coverage)

**Path to 100%**: Clear, documented, and achievable with focused effort

**Total Effort**: 74-99 hours over 3-4 weeks

**Next Step**: Fix linting/TypeScript issues first, then systematically build test coverage starting with utility components

---

**For detailed implementation plan, see**: `UI_PACKAGE_TEST_COVERAGE_PLAN.md`
