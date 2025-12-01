# @unicornlove/ui Package - Action Checklist

**Status**: Ready for Implementation
**Created**: December 1, 2025

---

## PHASE 1: LINTING FIXES (Est. 1 hour)

### Task 1.1: Fix FormWrapper.native.tsx - Hook in Try-Catch

**File**: `packages/ui/src/components/FormWrapper.native.tsx`

**Current Code** (Lines 14-24):
```typescript
const useHeaderHeight = () => {
  let headerHeight: number
  try {
    headerHeight = useHeaderHeightOG()
    _headerHeightError = false
  } catch (_error) {
    _headerHeightError = true
    headerHeight = 0
  }
  return headerHeight
}
```

**Issue**: Hook called conditionally (inside try-catch)

**Fix**:
```typescript
let _headerHeightError = false

const useHeaderHeight = () => {
  let headerHeight: number
  try {
    headerHeight = useHeaderHeightOG()  // Called unconditionally
    _headerHeightError = false
  } catch (_error) {
    _headerHeightError = true
    headerHeight = 0
  }
  return headerHeight
}
```

**Steps**:
- [ ] Open FormWrapper.native.tsx
- [ ] Move `_headerHeightError` declaration outside `useHeaderHeight`
- [ ] Verify hook is called at top level before try-catch
- [ ] Run `pnpm lint` to verify fix
- **Time**: 10 min

---

### Task 1.2: Fix MapContainer.native.tsx - Hook After Early Return

**File**: `packages/ui/src/components/maps/MapContainer.native.tsx`

**Current Code** (Lines 40-70):
```typescript
// Early return at line 44-51
if (!MapboxGL) {
  return (
    <View>
      <Text>Loading...</Text>
    </View>
  )
}

// Hook called after early return (line 66)
useEffect(() => {
  if (!isMapReady || !onMapReady) {
    return
  }
  // ...
}, [isMapReady, onMapReady])
```

**Issue**: `useEffect` called after early return

**Fix**: Move `useEffect` to before the early return check

```typescript
// Move hook to top level BEFORE return
useEffect(() => {
  if (!isMapReady || !onMapReady) {
    return
  }
  // ...
}, [isMapReady, onMapReady])

// Now the early return can happen
if (!MapboxGL) {
  return (
    <View>
      <Text>Loading...</Text>
    </View>
  )
}
```

**Steps**:
- [ ] Open MapContainer.native.tsx
- [ ] Find `useEffect` at line 66
- [ ] Move it above the `if (!MapboxGL)` check
- [ ] Verify all hooks are at top level
- [ ] Run `pnpm lint` to verify fix
- **Time**: 10 min

---

### Task 1.3: Fix MapContainer.tsx - Canvas Type Cast

**File**: `packages/ui/src/components/maps/MapContainer.tsx`

**Current Code** (Line 1131):
```typescript
map.addImage(imageId, canvas as any, { pixelRatio: 2 })
```

**Issue**: Using `any` type

**Fix**: Use proper type from HTML Canvas API

```typescript
// Option 1: Use HTMLCanvasElement | OffscreenCanvas
map.addImage(
  imageId,
  canvas as HTMLCanvasElement | OffscreenCanvas,
  { pixelRatio: 2 }
)

// Option 2: Use Record<string, unknown>
map.addImage(
  imageId,
  canvas as Record<string, unknown>,
  { pixelRatio: 2 }
)
```

**Steps**:
- [ ] Open MapContainer.tsx
- [ ] Go to line 1131
- [ ] Check what `canvas` type is (should be HTMLCanvasElement)
- [ ] Replace `as any` with proper type
- [ ] Run `pnpm lint` to verify fix
- **Time**: 10 min

---

### Task 1.4: Fix maps/types.ts - Generic Data Type

**File**: `packages/ui/src/components/maps/types.ts`

**Current Code** (Lines 15-23):
```typescript
export interface MapPin {
  id: string
  location: Location
  selected?: boolean
  data?: any
}
```

**Issue**: Using `any` type for data

**Fix**: Use `unknown` or proper interface

```typescript
export interface MapPin {
  id: string
  location: Location
  selected?: boolean
  data?: unknown
}

// OR create a proper type:
export interface MapPinData {
  [key: string]: unknown
}

export interface MapPin {
  id: string
  location: Location
  selected?: boolean
  data?: MapPinData
}
```

**Steps**:
- [ ] Open maps/types.ts
- [ ] Find MapPin interface
- [ ] Replace `data?: any` with `data?: unknown`
- [ ] Run `pnpm lint` to verify fix
- **Time**: 10 min

---

## PHASE 2: TYPESCRIPT FIXES (Est. 3-4 hours)

### Task 2.1: Fix Styleguide Components - Tamagui v3 Typing

**Files Affected**:
- `src/styleguide/components/Sidebar.tsx` (~10 errors)
- `src/styleguide/components/StyleguidePage.tsx` (~10 errors)
- `src/styleguide/components/TodoCallout.tsx` (~10 errors)

**Root Issue**: Tamagui v3 strict component typing

**Research Steps**:
- [ ] Review Tamagui v3 documentation for component API
- [ ] Check if children should be passed separately
- [ ] Verify if components need TypeScript props type

**Typical Fix Pattern**:
```typescript
// ❌ WRONG
<YStack gap={10}>
  {children}
</YStack>

// ✅ CORRECT
<YStack gap="$3">
  {children}
</YStack>

// OR if children is a prop:
interface YStackProps {
  children?: ReactNode
  gap?: string
}
```

**Steps** (for each file):
- [ ] Open component file
- [ ] Review Tamagui v3 docs for component signature
- [ ] Fix typing issues one by one
- [ ] Run `pnpm check:type` to verify

**Estimated Time**:
- Sidebar.tsx: 30 min
- StyleguidePage.tsx: 30 min
- TodoCallout.tsx: 30 min
- **Total**: 90 min

---

### Task 2.2: Fix tamagui.config.ts - AnimationDriver Type

**File**: `src/tamagui.config.ts`

**Current Issue** (Line 21):
```typescript
const tamaguiConfig = createTamagui(config)
// Type error: AnimationsType not assignable to AnimationDriver
```

**Research Steps**:
- [ ] Check Tamagui v3 AnimationDriver interface
- [ ] Verify config structure
- [ ] Check if config needs additional properties

**Potential Fixes**:
```typescript
// Make sure animations are properly configured
const animations = {
  // ... animation definitions
} as const

const config = {
  animations,
  // ... other config
}

const tamaguiConfig = createTamagui(config)
```

**Steps**:
- [ ] Open tamagui.config.ts
- [ ] Review Tamagui v3 config documentation
- [ ] Add/update AnimationDriver properties
- [ ] Run `pnpm check:type` to verify
- **Time**: 30 min

---

## PHASE 3: VERIFICATION

### Task 3.1: Verify All Linting Issues Fixed

```bash
cd packages/ui
pnpm lint
```

**Expected Output**:
```
Checked 213 files in XXms. No fixes applied.
```

**Checkpoint**:
- [ ] 0 linting errors
- [ ] Biome check passes

---

### Task 3.2: Verify All TypeScript Issues Fixed

```bash
cd packages/ui
pnpm run check:type
```

**Expected Output**:
```
[No errors reported]
```

**Checkpoint**:
- [ ] 0 TypeScript errors
- [ ] Full type safety

---

### Task 3.3: Verify Full Package Passes Checks

```bash
cd packages/ui
pnpm format:fix && pnpm lint:fix && pnpm run check:type
```

**Checkpoint**:
- [ ] All checks pass
- [ ] No fixes needed
- [ ] Clean git status

---

## PHASE 4: COMMIT CHANGES

### Task 4.1: Stage and Commit Fixes

```bash
git add packages/ui/src/components/FormWrapper.native.tsx
git add packages/ui/src/components/maps/MapContainer.native.tsx
git add packages/ui/src/components/maps/MapContainer.tsx
git add packages/ui/src/components/maps/types.ts
git add packages/ui/src/styleguide/components/Sidebar.tsx
git add packages/ui/src/styleguide/components/StyleguidePage.tsx
git add packages/ui/src/styleguide/components/TodoCallout.tsx
git add packages/ui/src/tamagui.config.ts

git commit -m "fix(ui): resolve all linting and TypeScript errors

- Fix React hook violations in FormWrapper.native.tsx and MapContainer.native.tsx
- Replace 'any' types with proper typing in maps components
- Fix Tamagui v3 type compatibility in styleguide components
- Update tamagui config with proper AnimationDriver typing

Results:
- 0 linting errors (was 4)
- 0 TypeScript errors (was 35+)
- Full type safety across UI package

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Checkpoint**:
- [ ] Commit created successfully
- [ ] All changes captured
- [ ] Pre-commit checks pass

---

## PHASE 5: PREPARE FOR TEST COVERAGE

### Task 5.1: Review Test Infrastructure

**Verify available test utilities**:
```bash
ls -la tests/infrastructure/vitest/helpers/
ls -la tests/infrastructure/vitest/mocks/
```

**Checkpoint**:
- [ ] Tamagui setup available
- [ ] Form setup available
- [ ] Test utilities available
- [ ] Comprehensive mocks available

---

### Task 5.2: Review UI Package Test Config

**Verify vitest configuration**:
```bash
cat packages/ui/vitest.config.ts
cat packages/ui/vitest.setup.ts
```

**Checkpoint**:
- [ ] Test include patterns correct
- [ ] Coverage provider configured
- [ ] Setup files in place

---

### Task 5.3: Create Test Template

**Create test template** at `packages/ui/src/components/__tests__/TEMPLATE.test.tsx`:

```typescript
import { render } from '@/tests/infrastructure/vitest/helpers/test-utils'
import { COMPONENT_NAME } from '../COMPONENT_FILE'

describe('COMPONENT_NAME', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<COMPONENT_NAME />)
      expect(container).toBeDefined()
    })

    it('applies provided className', () => {
      const { container } = render(
        <COMPONENT_NAME data-testid="component" />
      )
      expect(container.querySelector('[data-testid="component"]')).toBeDefined()
    })
  })

  describe('Props', () => {
    // Test individual props
  })

  describe('Interactions', () => {
    // Test user interactions if applicable
  })

  describe('Accessibility', () => {
    // Test a11y features if applicable
  })
})
```

**Checkpoint**:
- [ ] Template created
- [ ] Team agrees on pattern
- [ ] Ready for mass test creation

---

## PHASE 6: START TEST COVERAGE (Priority 1)

### Task 6.1: Create Tests for Utility Components

**Components** (Pick 5-10 to start with):
- [ ] Button
- [ ] Text
- [ ] View
- [ ] Badge
- [ ] Chip
- [ ] Card
- [ ] Icon
- [ ] Image
- [ ] Divider
- [ ] Spacer

**For Each Component**:
1. [ ] Create `ComponentName.test.tsx` in appropriate `__tests__/` folder
2. [ ] Write 2-3 tests covering: rendering, props, variants
3. [ ] Run `pnpm test` to verify tests pass
4. [ ] Check coverage with `pnpm test:coverage`

**Example Command**:
```bash
# Create test file
touch packages/ui/src/components/__tests__/Button.test.tsx

# Run test
pnpm --filter ui test Button

# Check coverage
pnpm --filter ui test:coverage
```

**Success Criteria**:
- [ ] All tests pass
- [ ] Coverage > 0% (baseline)
- [ ] No test errors

---

## FINAL CHECKLIST

### ✅ Before Starting Test Coverage:
- [ ] Phase 1: All 4 linting errors fixed
- [ ] Phase 2: All ~35 TypeScript errors fixed
- [ ] Phase 3: All verification checks pass
- [ ] Phase 4: Changes committed
- [ ] Phase 5: Test infrastructure reviewed and ready
- [ ] Phase 6: First utility component tests started

### 📊 Success Metrics:
- [ ] `pnpm lint` - 0 errors
- [ ] `pnpm check:type` - 0 errors
- [ ] `pnpm test` - all tests pass
- [ ] Test coverage tracking configured
- [ ] Ready for comprehensive test expansion

---

## Timeline Estimate

| Phase | Tasks | Est. Time | Status |
|-------|-------|-----------|--------|
| **Phase 1** | Fix 4 linting issues | 50 min | 🔴 TODO |
| **Phase 2** | Fix ~35 TypeScript issues | 2-3 hours | 🔴 TODO |
| **Phase 3** | Verify fixes | 20 min | 🔴 TODO |
| **Phase 4** | Commit changes | 10 min | 🔴 TODO |
| **Phase 5** | Prepare for tests | 20 min | 🔴 TODO |
| **Phase 6+** | Test coverage expansion | 70-95 hours | 🔴 TODO |

**Total to Fix Issues**: ~4 hours
**Total to 100% Test Coverage**: 74-99 hours over 3-4 weeks

---

## Resources

- **Test Plan**: `UI_PACKAGE_TEST_COVERAGE_PLAN.md`
- **Status Report**: `UI_PACKAGE_STATUS_REPORT.md`
- **Test Utilities**: `tests/infrastructure/vitest/helpers/`
- **Tamagui Docs**: https://tamagui.dev/
- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react

---

**Status**: Ready for immediate action
**Next Step**: Start with Phase 1 (Linting Fixes) - should take ~1 hour
