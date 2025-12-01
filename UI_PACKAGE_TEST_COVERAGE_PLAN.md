# @unicornlove/ui Package - Path to 100% Test Coverage

## Executive Summary

**Goal**: Achieve 100% test coverage for the @unicornlove/ui component library

**Current State**:
- **Components**: 116 component files (`.tsx`)
- **Existing Tests**: 7 test files (6% coverage)
- **Gap**: 109 components without comprehensive test coverage
- **Linting Status**: 4 errors (React hook violations, `any` types)

---

## Phase 1: Fix Linting & TypeScript Issues (Foundation)

### 1.1 Fix React Hook Violations (2 files)

**Files with hook issues**:
- `src/components/FormWrapper.native.tsx` - Hook called in try-catch (conditional)
- `src/components/maps/MapContainer.native.tsx` - Hook called after early return

**Approach**:
- Restructure to move hooks before conditionals
- Ensure hooks called unconditionally at top level
- Reference patterns from previous linting cleanup

**Status**: ❌ Not started

---


---

### 1.3 Fix Remaining `any` Types

**Files**:
- `src/components/maps/MapContainer.tsx:1131` - Canvas type cast
- `src/components/maps/types.ts:21` - Generic data type

**Approach**:
- Replace with proper TypeScript types (`Record<string, unknown>`, specific interfaces)
- Update mapbox integration typing

**Status**: ❌ Not started

---

## Phase 2: Test Infrastructure Setup (Enablement)

### 2.1 Review Existing Test Utilities

**Available**: Centralized test helpers in `tests/infrastructure/vitest/helpers/`
- `tamagui-setup.tsx` - Tamagui provider
- `form-setup.tsx` - React Hook Form provider
- `test-utils.tsx` - Enhanced render with providers
- `tamagui-complete.tsx` - Comprehensive Tamagui mocks

**Task**: Document and ensure they work with UI package tests

**Status**: ✅ Available

---

### 2.2 Update UI Package Test Setup

**File**: `packages/ui/vitest.setup.ts`

**Current setup**: Basic Tamagui mock setup

**Needed**:
- Import centralized test utilities
- Add missing mock providers (React Query, Router if needed)
- Configure environment variables for tests
- Add custom matchers if needed

**Status**: ❌ Not started

---

## Phase 3: Test Coverage Strategy

### 3.1 Component Categorization

**Category 1: Utility/Helper Components (High Priority)**
- Text, View, Stack variants (Buttons, Chips, Cards)
- Badge, Skeleton, Loading states
- Simple typography components
- **Est. Files**: ~30
- **Est. Tests**: 2-3 per component
- **Effort**: LOW (simple props, no complex logic)

**Category 2: Interactive Components (Medium Priority)**
- Forms (Input, Select, Checkbox, RadioGroup)
- Address/Location components
- Tabs, Accordion, Navigation
- **Est. Files**: ~35
- **Est. Tests**: 3-5 per component
- **Effort**: MEDIUM (event handling, state, validation)

**Category 3: Complex Components (Lower Priority - Start Later)**
- Maps (MapContainer) - requires Mapbox mocking
- Charts (SkillsChart) - requires canvas mocking
- Kanban, Table - requires complex data structures
- Search/Select with gestures - requires RN gesture mocking
- **Est. Files**: ~20
- **Est. Tests**: 5+ per component
- **Effort**: HIGH (external dependencies, complex UX)

**Category 4: Hooks (Medium Priority)**
- Custom hooks (useSearch, useDebounce, useFilePicker, etc.)
- **Est. Files**: ~15
- **Est. Tests**: 3-4 per hook
- **Effort**: MEDIUM (state logic, effects)

**Category 5: Already Tested (Exclude)**
- `src/components/buttons/__tests__/`
- `src/components/chips/__tests__/`
- `src/components/cards/__tests__/`
- `src/components/navigation/__tests__/`
- `src/components/address/__tests__/`
- `src/components/maps/__tests__/`
- `src/components/states/__tests__/`
- **Status**: ✅ Already have tests

---

## Phase 4: Test Writing Plan

### 4.1 Testing Approach

**Pattern**: Vitest + React Testing Library + Test Utilities

```typescript
// Example test structure
import { render } from '@/tests/infrastructure/vitest/helpers/test-utils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders with default props', () => {
    const { getByText } = render(<MyComponent />)
    expect(getByText('Expected Text')).toBeDefined()
  })

  it('handles interactions correctly', async () => {
    const { getByRole } = render(<MyComponent />)
    // Test interactions
  })

  it('applies correct styles', () => {
    const { container } = render(<MyComponent variant="primary" />)
    // Test styling via data-testid or className
  })
})
```

### 4.2 Coverage Goals by Category

| Category | Files | Target Tests | Priority | Est. Time |
|----------|-------|--------------|----------|-----------|
| Utility Components | 30 | 2-3 each (60-90) | HIGH | 15-20h |
| Interactive Components | 35 | 3-5 each (105-175) | HIGH | 25-30h |
| Hooks | 15 | 3-4 each (45-60) | MEDIUM | 10-15h |
| Complex Components | 20 | 5+ each (100+) | MEDIUM | 20-30h |
| **TOTAL** | **100** | **310-525** | - | **70-95h** |

---

## Phase 5: Execution Roadmap

### Week 1: Foundation (Linting & Setup)
1. ✅ Fix FormWrapper.native.tsx hook issue
2. ✅ Fix MapContainer.native.tsx hook issue
4. ✅ Fix remaining `any` types
5. ✅ Update vitest.setup.ts with centralized utilities

### Week 2-3: Utility Components (Highest ROI)
1. Create test files for all utility/helper components
2. Implement 2-3 tests per component
3. Aim for 60+ tests covering simple components
4. **Target Coverage**: ~40% overall

### Week 4-5: Interactive Components
1. Create test files for forms, inputs, selects
2. Test event handling, state changes, validation
3. Create tests for navigation, tabs, accordion
4. **Target Coverage**: ~70% overall

### Week 6: Hooks
1. Create test files for all custom hooks
2. Test hook behavior, dependencies, effects
3. Use Vitest's hooks utilities for mocking

### Week 7-8: Complex Components
1. Create Mapbox mocks
2. Test maps component with various scenarios
3. Test charts with mock data
4. Test table with complex data structures
5. Test search with filtering/pagination

### Week 9: Polish & Optimization
1. Achieve target coverage metrics
2. Review test quality and maintainability
3. Fix any flaky tests
4. Document testing patterns

---

## Phase 6: Implementation Strategy

### 6.1 Testing Patterns by Component Type

**Utility Components**:
```typescript
// tests: rendering, prop variations, styling
describe('Button', () => {
  it('renders with different sizes', () => { })
  it('applies correct colors', () => { })
  it('handles disabled state', () => { })
})
```

**Interactive Components**:
```typescript
// tests: rendering, user interactions, state updates
describe('TextInput', () => {
  it('accepts user input', async () => { })
  it('validates input', async () => { })
  it('calls onChange handler', async () => { })
  it('handles focus/blur', async () => { })
})
```

**Hooks**:
```typescript
// tests: hook behavior, dependencies, side effects
describe('useSearch', () => {
  it('filters results on query change', async () => { })
  it('debounces search', async () => { })
  it('cleans up on unmount', () => { })
})
```

**Complex Components**:
```typescript
// tests: mocked dependencies, complex interactions
describe('MapContainer', () => {
  it('renders map with markers', async () => { })
  it('handles marker clicks', async () => { })
  it('updates on prop changes', async () => { })
})
```

### 6.2 Mock Strategy

**External Dependencies to Mock**:
- `mapbox-gl` - Provide mock for MapContainer
- `react-native-gesture-handler` - Already available
- `react-native` - Aliased to `react-native-web`
- `expo-constants` - Already mocked
- API calls - Use MSW or vi.mock()

**Existing Mocks** (in `src/components/__mocks__/`):
- Review and use existing mocks
- Create additional mocks as needed

---

## Phase 7: Quality Metrics

### Coverage Targets
- **Branch Coverage**: 85%+
- **Function Coverage**: 95%+
- **Statement Coverage**: 95%+

### Test Quality
- ✅ Each test validates one behavior
- ✅ Descriptive test names
- ✅ No implementation details tested (use Testing Library best practices)
- ✅ Proper setup/teardown
- ✅ Async handling done correctly

### Excluded from Coverage
- `.storybook/` - Storybook stories
- `**/*.d.ts` - Type definitions
- `src/tamagui.config.ts` - Configuration

---

## Phase 8: Risks & Mitigations

### Risk 1: Mapbox Integration Testing
**Challenge**: Mapbox requires canvas/webGL
**Mitigation**: Use comprehensive mocks, test behavior not implementation

### Risk 2: React Native Components
**Challenge**: Some components use RN-specific APIs
**Mitigation**: Use react-native-web aliases, test behavior not implementation

### Risk 3: Gesture/Animation Testing
**Challenge**: Complex gesture patterns hard to test
**Mitigation**: Test outcomes not internals, use queryByTestId for effects

### Risk 4: Time Constraint
**Challenge**: 70-95h is significant effort
**Mitigation**: Prioritize utility components first (highest ROI), accept phased approach

---

## Phase 9: Success Criteria

✅ **Definition of Done**:
- [ ] All 4 linting errors fixed
- [ ] All TypeScript errors resolved
- [ ] 310+ test cases written
- [ ] All tests passing
- [ ] No test flakiness
- [ ] Documentation updated
- [ ] Pre-commit validation passes

---

## Next Steps

1. **Immediately** (Today):
   - Fix 4 linting errors in FormWrapper.native.tsx and MapContainer.native.tsx

2. **Short Term** (This week):
   - Set up test infrastructure
   - Create tests for utility components (Button, Text, Card, Chip, etc.)

3. **Medium Term** (Next 2 weeks):
   - Create tests for interactive components (Forms, Inputs, Navigation)
   - Create tests for custom hooks

4. **Long Term** (Over time):
   - Create tests for complex components (Maps, Charts, Kanban, Table)
   - Achieve 95%+ coverage

---

## Files to Test (Complete List)

### Utility Components (Highest Priority)
- src/components/Breadcrumb.tsx
- src/components/Badge.tsx
- src/components/CardBadges.tsx
- src/components/Heading.tsx
- src/components/Paragraph.tsx
- src/components/Divider.tsx
- src/components/Empty.tsx
- src/components/Icon.tsx
- src/components/Image.tsx
- src/components/Link.tsx
- src/components/Separator.tsx
- src/components/Spacer.tsx
- src/components/Stack.tsx
- src/components/Text.tsx
- src/components/View.tsx
- src/components/skeletons/SkeletonBox.tsx
- src/components/skeletons/SkeletonCircle.tsx
- src/components/states/*.tsx (Loading, Error, Success, etc.)
- src/components/typography/*.tsx

### Interactive Components (Medium Priority)
- src/components/buttons/*.tsx
- src/components/chips/*.tsx
- src/components/cards/*.tsx
- src/components/navigation/*.tsx
- src/components/date-picker/*.tsx
- src/components/dialog/*.tsx
- src/components/popovers/*.tsx
- src/components/sheets/*.tsx
- src/components/search-select/*.tsx
- src/components/table/*.tsx

### Hooks (Medium Priority)
- src/components/address/hooks/*.ts
- src/components/search-select/hooks/*.ts
- src/components/date-picker/hooks/*.ts
- Custom utility hooks

### Complex Components (Lower Priority)
- src/components/maps/MapContainer.tsx
- src/components/charts/SkillsChart.tsx
- src/components/kanban/*.tsx
- src/components/cookie-consent/*.tsx
- src/components/image-picker/*.tsx
- src/components/FormWrapper.tsx

---

## References

- **Test Utilities**: `/tests/infrastructure/vitest/helpers/`
- **Mocks**: `/tests/infrastructure/vitest/mocks/` and `src/components/__mocks__/`
- **Config**: `packages/ui/vitest.config.ts`, `packages/ui/vitest.setup.ts`
- **Testing Library Docs**: https://testing-library.com/react
- **Vitest Docs**: https://vitest.dev/

---

**Created**: December 1, 2025
**Status**: READY FOR EXECUTION
**Estimated Duration**: 70-95 hours (2-3 weeks with focused effort)
**Priority**: HIGH (enables component confidence and prevents regressions)
