# Office Test Suite - BrainGrid Task Breakdown

**Project**: SCF-Neue (Scaffald)
**Epic**: Office E2E Test Suite Stabilization
**Current Status**: 74% pass rate (46/62 tests) - NEEDS IMPROVEMENT
**Target**: 95% pass rate (84/88 tests)

---

## Task 1: Fix Kanban Modal Interaction Selectors

**Priority**: P0 (Critical Blocker)
**Effort**: 4 hours
**Complexity**: 3/5
**Readiness**: 5/5 (well-defined, ready to implement)

### Description
The Kanban board's rejection and hiring modal dialogs are not being detected by Playwright tests. Three tests are failing because the modal selector strategy doesn't match the actual component implementation.

### Root Cause Analysis
1. Modal component likely doesn't set `role="dialog"` or `role="alertdialog"` attributes
2. Test uses `.or()` selector fallback that isn't catching the actual modal
3. Wait strategy uses hardcoded `waitForTimeout(1000)` instead of proper wait conditions
4. Missing data-testid attributes on modal elements

### Acceptance Criteria
- [ ] All 3 modal interaction tests pass consistently
- [ ] Modal appears reliably after drag-and-drop operation
- [ ] Confirm button functional with proper data-testid
- [ ] Cancel button functional with proper data-testid
- [ ] Reason input field accessible with data-testid
- [ ] Tests use `waitFor({ state: 'visible' })` instead of fixed timeouts

### Implementation Tasks
1. Inspect modal component in browser DevTools during test execution
2. Locate modal component file (likely `packages/core/features/office-applications/`)
3. Add `data-testid="status-change-modal"` to modal root element
4. Add `data-testid="status-change-confirm-button"` to confirm button
5. Add `data-testid="status-change-cancel-button"` to cancel button
6. Add `data-testid="status-change-reason-input"` to reason textarea
7. Update `tests/helpers/kanban-helpers.ts` dragApplicationToColumn function
8. Replace `waitForTimeout(1000)` with `modal.waitFor({ state: 'visible' })`
9. Run tests in headed mode (`--headed`) to verify timing
10. Verify all 3 modal tests pass in both chromium and webkit

### Files to Modify
```
packages/core/features/office-applications/
  └── status-change-modal.tsx (or similar name)
tests/helpers/kanban-helpers.ts
tests/test-office-applications-kanban.spec.ts
```

### Testing Strategy
```bash
# Run specific modal tests
pnpm exec playwright test test-office-applications-kanban.spec.ts \
  --grep "modal" --headed

# Verify all Kanban tests
pnpm exec playwright test test-office-applications-kanban.spec.ts
```

### Success Metrics
- All 3 modal tests pass (100% pass rate for modal interactions)
- No flaky behavior across 5 consecutive test runs
- Test execution time remains under 20 seconds per test

---

## Task 2: Add data-testid Attributes to Job Form Components

**Priority**: P0 (Critical Blocker)
**Effort**: 6 hours
**Complexity**: 4/5
**Readiness**: 5/5

### Description
Job form tests are failing because form field components lack data-testid attributes. Eight tests cannot verify form structure, validation, or CRUD operations.

### Root Cause Analysis
1. UI components in `packages/ui/` don't have test automation attributes
2. Tests were written test-first (before implementation was complete)
3. Tamagui form components may not expose data-testid prop properly
4. Cross-platform wrappers (Tamagui) may interfere with attribute rendering

### Acceptance Criteria
- [ ] All 8 job form field tests pass
- [ ] Create job flow works end-to-end
- [ ] Edit job flow works end-to-end
- [ ] Form validation tests functional
- [ ] All required form fields have data-testid attributes
- [ ] Attribute naming follows convention: `{entity}-{field}-{type}`

### Required data-testid Attributes

#### Form Fields
```typescript
// Input fields
job-title-input
job-description-input
job-position-level-input
job-pay-min-input
job-pay-max-input

// Select/dropdown fields
job-organization-select
job-employment-type-select
job-remote-option-select
job-pay-type-select

// Action buttons
job-save-draft-button
job-publish-button
job-cancel-button
```

### Implementation Tasks
1. Locate job form components in `packages/core/features/office-jobs/`
2. Identify base form components in `packages/ui/src/components/form/`
3. Add data-testid prop to Tamagui Input component wrapper
4. Add data-testid prop to Tamagui Select component wrapper
5. Add data-testid prop to Tamagui Button component wrapper
6. Apply data-testid to create job form: `office-jobs-create-screen.tsx`
7. Apply data-testid to edit job form: `office-jobs-edit-screen.tsx`
8. Verify attributes render in browser DevTools
9. Run job tests to confirm all pass
10. Document data-testid convention in component guidelines

### Files to Modify
```
packages/core/features/office-jobs/
  ├── office-jobs-create-screen.tsx
  └── office-jobs-edit-screen.tsx
packages/ui/src/components/form/
  ├── input.tsx
  ├── select.tsx
  └── button.tsx
docs/ui-development-patterns.md (add testing section)
```

### Testing Strategy
```bash
# Run specific job form tests
pnpm exec playwright test test-office-jobs.spec.ts \
  --grep "should display all required form fields"

# Verify all job tests
pnpm exec playwright test test-office-jobs.spec.ts
```

### Success Metrics
- 15/15 job tests pass (100% pass rate)
- Form validation tests catch actual validation errors
- Create and edit flows complete without errors

---

## Task 3: Add data-testid Attributes to Organization Form Components

**Priority**: P1 (High Priority)
**Effort**: 4 hours
**Complexity**: 3/5
**Readiness**: 5/5

### Description
Organization form tests are failing due to missing data-testid attributes. Four tests cannot verify form structure and CRUD operations.

### Root Cause Analysis
Same as Task 2 - missing test automation attributes on form components.

### Acceptance Criteria
- [ ] All 4 organization form tests pass
- [ ] Create organization flow works end-to-end
- [ ] Edit organization flow works end-to-end
- [ ] Slug auto-generation test passes
- [ ] Form validation tests functional

### Required data-testid Attributes

#### Form Fields
```typescript
// Input fields
org-name-input
org-slug-input
org-logo-input

// Select fields
org-industry-select
org-visibility-select

// Action buttons
save-button
cancel-button

// List page buttons (dynamic)
org-edit-button-{id}
org-delete-button-{id}
```

### Implementation Tasks
1. Locate organization form components in `packages/core/features/office-organizations/`
2. Add data-testid to all form inputs (reuse base components from Task 2)
3. Add data-testid to action buttons
4. Add dynamic data-testid to list page edit/delete buttons
5. Verify slug auto-generation functionality works
6. Test create and edit flows end-to-end

### Files to Modify
```
packages/core/features/office-organizations/
  ├── office-organizations-create-screen.tsx
  ├── office-organizations-edit-screen.tsx
  └── office-organizations-list.tsx
```

### Testing Strategy
```bash
# Run organization tests
pnpm exec playwright test test-office-organizations.spec.ts

# Verify specific create flow
pnpm exec playwright test test-office-organizations.spec.ts \
  --grep "creates organization successfully"
```

### Success Metrics
- 23/24 organization tests pass (96% pass rate)
- Create and edit flows complete successfully
- Form validation catches duplicate slugs

---

## Task 4: Investigate and Fix Test Suite Interruption

**Priority**: P1 (High Priority)
**Effort**: 6 hours
**Complexity**: 4/5
**Readiness**: 3/5 (requires investigation)

### Description
Test suite is being interrupted with SIGTERM (exit code 144) after approximately 70 tests execute. This prevents running the full 88-test suite and may indicate resource issues or test isolation problems.

### Root Cause Analysis
Potential causes (requires investigation):
1. Manual interruption (Ctrl+C) during development
2. System-level timeout (CI/CD environment)
3. Resource constraints (memory leak, CPU overload)
4. Parallel worker conflicts (database connection exhaustion)
5. Test data pollution causing subsequent test failures

### Acceptance Criteria
- [ ] All 88 tests complete without interruption
- [ ] No SIGTERM signals during normal execution
- [ ] Test suite completes in under 5 minutes
- [ ] Resource usage remains stable (memory, CPU, DB connections)
- [ ] Tests can run in any order (isolation verified)

### Investigation Tasks
1. Run test suite with resource monitoring
   ```bash
   # Monitor resources during test execution
   top -pid $(pgrep -f playwright) &
   pnpm exec playwright test test-office-*.spec.ts
   ```
2. Check Playwright configuration timeouts
3. Review test cleanup hooks (afterEach, afterAll)
4. Analyze test data creation patterns
5. Check database connection pool limits
6. Test with different worker counts (1, 2, 4, 8)
7. Run tests in sequence (--workers=1) to isolate parallelization issues
8. Add logging to track test progression

### Implementation Tasks
1. Update `tests/playwright.config.ts`:
   - Review global timeout settings
   - Add fullyParallel: false for debugging
   - Configure retries: 1
2. Add cleanup in test `afterEach` hooks:
   - Delete test data created with TEST_ prefix
   - Reset database state if needed
3. Implement test data factories with guaranteed unique IDs
4. Add database transaction support (if possible)
5. Configure test isolation strategies

### Files to Modify
```
tests/playwright.config.ts
tests/helpers/office-test-data.ts
tests/test-office-*.spec.ts (add cleanup hooks)
tests/helpers/database-cleanup.ts (new file)
```

### Testing Strategy
```bash
# Run with single worker to isolate parallelization
pnpm exec playwright test test-office-*.spec.ts --workers=1

# Run with full parallelization
pnpm exec playwright test test-office-*.spec.ts --workers=4

# Run with debugging
DEBUG=pw:api pnpm exec playwright test test-office-*.spec.ts
```

### Success Metrics
- 88/88 tests execute to completion
- No interruptions across 3 consecutive full runs
- Memory usage remains under 2GB
- Test suite completes in under 6 minutes

---

## Task 5: Standardize Wait Strategies and Selector Patterns

**Priority**: P2 (Nice to Have)
**Effort**: 4 hours
**Complexity**: 2/5
**Readiness**: 5/5

### Description
Tests currently use hardcoded `waitForTimeout()` calls which make tests slower and less reliable. Replace with proper Playwright wait conditions.

### Root Cause Analysis
1. Tests written with quick-fix timeout approach
2. Lack of established wait strategy patterns
3. No documentation on preferred Playwright waiting methods

### Acceptance Criteria
- [ ] Zero `waitForTimeout` calls in test code (exceptions documented)
- [ ] All waits use proper conditions: `waitFor`, `waitForLoadState`, `waitForResponse`
- [ ] Tests run 20% faster (fewer unnecessary waits)
- [ ] Wait strategy documented in testing guide

### Wait Strategy Replacements

#### Before (Bad)
```typescript
await page.waitForTimeout(1000)
const modal = page.getByRole('dialog')
```

#### After (Good)
```typescript
const modal = page.getByRole('dialog')
await modal.waitFor({ state: 'visible', timeout: 5000 })
```

### Implementation Tasks
1. Audit all test files for `waitForTimeout` usage
2. Replace navigation waits with `waitForURL` or `waitForLoadState`
3. Replace element waits with `element.waitFor({ state: 'visible' })`
4. Replace API waits with `waitForResponse`
5. Document wait strategies in testing guide
6. Add ESLint rule to warn on `waitForTimeout` usage

### Files to Modify
```
tests/test-office-*.spec.ts (all test files)
tests/helpers/*.ts (helper functions)
docs/testing/playwright-best-practices.md (new)
.eslintrc.js (add rule)
```

### Testing Strategy
```bash
# Run all tests to verify no regressions
pnpm exec playwright test test-office-*.spec.ts

# Compare execution time before/after
time pnpm exec playwright test test-office-*.spec.ts
```

### Success Metrics
- Test suite runs 20% faster
- No flaky behavior introduced
- All tests pass consistently

---

## Task 6: Document Component Testing Standards

**Priority**: P2 (Nice to Have)
**Effort**: 3 hours
**Complexity**: 2/5
**Readiness**: 5/5

### Description
Create documentation for adding test automation attributes to UI components. Establish naming conventions and best practices.

### Acceptance Criteria
- [ ] Component testing guide published in docs/
- [ ] data-testid naming convention documented
- [ ] Examples for common component patterns
- [ ] Guidelines added to UI component development workflow

### Documentation Outline
```markdown
# Component Testing Standards

## data-testid Naming Convention
- Pattern: `{entity}-{field}-{type}`
- Examples:
  - Input: `user-email-input`
  - Button: `form-submit-button`
  - Select: `job-status-select`
  - List item: `job-card-{id}`

## Required Attributes by Component Type
- Forms: All inputs, selects, buttons
- Lists: Item containers, action buttons
- Modals: Root, confirm/cancel buttons, inputs
- Cards: Container, primary action button

## Cross-Platform Considerations
- Tamagui components: Pass data-testid through props
- React Native: Use testID prop
- Web: Use data-testid attribute

## Testing Checklist
- [ ] All interactive elements have data-testid
- [ ] Attribute renders in browser DevTools
- [ ] E2E test can select element reliably
- [ ] Naming follows convention
```

### Implementation Tasks
1. Create `docs/testing/component-testing-standards.md`
2. Add examples from job and organization forms
3. Document Tamagui-specific patterns
4. Add checklist to PR template
5. Link from main README

### Files to Create
```
docs/testing/component-testing-standards.md
docs/testing/playwright-best-practices.md
.github/pull_request_template.md (update)
```

### Success Metrics
- 100% of new components include data-testid attributes
- E2E test failures due to missing attributes reduced to zero
- Developer onboarding time reduced (clear standards)

---

## Summary: Task Prioritization

### Sprint 1 (Week 1) - Critical Path
**Total Effort**: 14 hours (2 days)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Task 1: Fix Kanban Modals | P0 | 4h | Unblocks critical business flow |
| Task 2: Job Form data-testid | P0 | 6h | Unblocks job management testing |
| Task 4: Test Interruption | P1 | 4h | Enables full suite execution |

**Expected Outcome**: 90% pass rate (79/88 tests)

### Sprint 2 (Week 2) - High Priority
**Total Effort**: 10 hours (1.5 days)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Task 3: Org Form data-testid | P1 | 4h | Completes CRUD testing |
| Task 5: Wait Strategies | P2 | 4h | Improves test reliability |
| Task 6: Documentation | P2 | 2h | Prevents future issues |

**Expected Outcome**: 95% pass rate (84/88 tests)

### Quality Gates

#### After Sprint 1 (Week 1)
- [ ] Pass rate ≥90% (79/88 tests)
- [ ] All P0 issues resolved
- [ ] Critical business flows verified

#### After Sprint 2 (Week 2)
- [ ] Pass rate ≥95% (84/88 tests)
- [ ] All P0 and P1 issues resolved
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## Estimated Timeline

```
Week 1:
  Day 1: Task 1 (Kanban modals) + Task 4 investigation
  Day 2: Task 2 (Job forms) + Task 4 implementation

Week 2:
  Day 3: Task 3 (Organization forms)
  Day 4: Task 5 (Wait strategies)
  Day 5: Task 6 (Documentation) + Regression testing
```

**Total Calendar Time**: 5 days
**Total Development Effort**: 24 hours

---

## BrainGrid Import Format

```json
{
  "requirement": {
    "title": "Office E2E Test Suite Stabilization",
    "description": "Improve test pass rate from 74% to 95% by fixing modal interactions, form selectors, and test isolation issues",
    "status": "PLANNED",
    "complexity": 4,
    "readiness": 5,
    "acceptance_criteria": [
      "95% test pass rate (84/88 tests passing)",
      "Zero flaky tests identified",
      "Full suite execution without interruption",
      "All P0 and P1 issues resolved",
      "Component testing standards documented"
    ]
  },
  "tasks": [
    {
      "title": "Fix Kanban Modal Interaction Selectors",
      "description": "Add data-testid attributes to modal components and fix wait strategies",
      "complexity": 3,
      "readiness": 5,
      "effort_hours": 4
    },
    {
      "title": "Add data-testid Attributes to Job Form Components",
      "description": "Add test automation attributes to all job form fields and buttons",
      "complexity": 4,
      "readiness": 5,
      "effort_hours": 6
    },
    {
      "title": "Add data-testid Attributes to Organization Form Components",
      "description": "Add test automation attributes to organization form fields",
      "complexity": 3,
      "readiness": 5,
      "effort_hours": 4
    },
    {
      "title": "Investigate and Fix Test Suite Interruption",
      "description": "Debug SIGTERM issue and implement test isolation strategies",
      "complexity": 4,
      "readiness": 3,
      "effort_hours": 6
    },
    {
      "title": "Standardize Wait Strategies and Selector Patterns",
      "description": "Replace waitForTimeout with proper Playwright wait conditions",
      "complexity": 2,
      "readiness": 5,
      "effort_hours": 4
    },
    {
      "title": "Document Component Testing Standards",
      "description": "Create comprehensive testing guide with data-testid conventions",
      "complexity": 2,
      "readiness": 5,
      "effort_hours": 3
    }
  ]
}
```
