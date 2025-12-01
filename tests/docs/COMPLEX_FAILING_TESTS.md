# Most Complex Failing Tests

**Last Updated:** 2025-01-XX  
**Total Test Status:** 290 failed | 410 passed | 5 skipped (705 total)

## 🔴 Critical Blockers (Syntax/Import Errors)

These tests fail to even load due to syntax or import resolution errors:

### 1. **EmploymentPrefsStep.test.tsx** - Syntax Error
- **Error:** `SyntaxError: Unexpected token 'typeof'`
- **Impact:** Entire test file blocked
- **Complexity:** High - Likely TypeScript compilation issue
- **Priority:** 🔴 CRITICAL - Blocks all tests in file

### 2. **ApplicationWizard.test.tsx** - Import Resolution
- **Error:** `Failed to resolve import "@app/trpc/schemas" from "packages/supabase/client-types.ts"`
- **Impact:** Entire test file blocked
- **Complexity:** High - Module resolution/alias issue
- **Priority:** 🔴 CRITICAL - Blocks all tests in file

### 3. **Multiple Tests - Missing Mock Exports**
- **Error:** `No "Palette" export is defined on the "@tamagui/lucide-icons" mock`
- **Affected Files:**
  - `DrawerLink.chevron.test.tsx`
  - `OrganizationForm.test.tsx`
  - `ResumeImportWidget.test.tsx`
- **Complexity:** Medium - Missing mock exports
- **Priority:** 🟠 HIGH - Easy fix once identified

### 4. **Multiple Tests - vi.mock Hoisting Issues**
- **Error:** `There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside`
- **Affected Files:**
  - `profile-employment-left.test.tsx`
  - `PortfolioGallery.test.tsx`
  - `PortfolioManager.test.tsx`
  - `usePhotoUpload.test.ts`
- **Complexity:** High - Mock hoisting/initialization order
- **Priority:** 🟠 HIGH - Requires refactoring mocks

### 5. **useFeedbackSubmit.test.ts** - Reference Error
- **Error:** `ReferenceError: Cannot access 'getPendingFeedbackQueueMock' before initialization`
- **Complexity:** High - Mock initialization order issue
- **Priority:** 🟠 HIGH - Requires fixing mock order

---

## 🟠 Complex Component Tests (Empty Body Rendering)

These tests fail because components render empty `<body />` - affects ~150+ tests:

### 1. **Profile Wizard Steps** (~22 tests)
- **Files:**
  - `CertificationsStep.test.tsx` (11 tests)
  - `ExperienceStep.test.tsx` (11 tests)
  - `EducationStep.test.tsx` (multiple tests)
  - `GeneralInfoStep.test.tsx` (2 tests)
  - `EmploymentPrefsStep.test.tsx` (blocked by syntax error)
- **Complexity:** Very High - Root cause unknown
- **Dependencies:** Tamagui, tRPC hooks, form validation, date pickers
- **Priority:** 🔴 CRITICAL - Largest category of failures

### 2. **Profile Completion Components** (~10 tests)
- **Files:**
  - `MilestoneBadge.test.tsx` (4 tests)
  - `EnhancedProfileCompletionWidget.test.tsx` (multiple tests)
  - `ProfileCompletionModal.test.tsx` (multiple tests)
- **Complexity:** High - Complex state management, tRPC queries
- **Priority:** 🟠 HIGH

### 3. **Office Components** (~20 tests)
- **Files:**
  - `JobsKanbanBoard.test.tsx` (15 tests) - **Very Complex**
    - Drag & drop (DndKit)
    - Multiple status columns
    - Job grouping logic
    - Card interactions
    - Update callbacks
  - `JobForm.test.tsx` (20+ tests)
  - `OrganizationForm.test.tsx` (blocked by mock issue)
  - `TeamForm.test.tsx` (expo-linking native module issue)
- **Complexity:** Very High - Complex UI interactions, drag & drop
- **Priority:** 🟠 HIGH

### 4. **Discover Components** (~25 tests)
- **Files:**
  - `UserProfilePanel.test.tsx` (15 tests)
    - Conditional rendering
    - Loading states
    - Error states
    - Profile display (avatar, skills, location)
    - Navigation
    - Positioning
  - `MapSearchInput.test.tsx` (6 tests)
  - `WorkerPreviewModal.enhanced.test.tsx` (multiple tests)
- **Complexity:** High - Complex conditional logic, multiple states
- **Priority:** 🟠 HIGH

### 5. **Application Components** (~15 tests)
- **Files:**
  - `AttachmentsStep.test.tsx`
  - `CustomQuestionsStep.test.tsx`
  - `ProgressIndicator.test.tsx`
  - `QuickApplyModal.test.tsx`
  - `ReviewStep.test.tsx`
  - `SuccessStep.test.tsx`
- **Complexity:** Medium-High - Form validation, file uploads, multi-step flows
- **Priority:** 🟡 MEDIUM

### 6. **Profile Import Components** (~9 tests)
- **Files:**
  - `ImportReviewScreen.test.tsx` (9 tests)
    - Renders imported data sections
    - Item selection
    - Inline editing
    - Import confirmation
    - Parsing errors
    - Empty states
    - Loading/error states
- **Complexity:** High - Complex data transformation, editing logic
- **Priority:** 🟡 MEDIUM

### 7. **IPIP Assessment Components** (~10 tests)
- **Files:**
  - `IPIPAssessmentWizard.test.tsx`
  - `IPIPResultsPage.test.tsx`
  - `NarrativeView.test.tsx`
  - `ShareResults.test.tsx`
- **Complexity:** High - Complex scoring logic, wizard flows
- **Priority:** 🟡 MEDIUM

### 8. **Other Complex Components**
- **Files:**
  - `InquiryCommentThread.test.tsx` - Real-time comments
  - `DisputeForm.test.tsx` - File uploads, form validation
  - `TeamInvitationList.test.tsx` - List management
  - `TeamActivityFeed.test.tsx` - Activity feeds
  - `TeamAnalyticsSummary.test.tsx` - Analytics (blocked by styled mock)

---

## 🟡 Infrastructure/Environment Issues

### 1. **Storage/AsyncStorage Issues**
- **Files:**
  - `feedbackStorage.test.ts` - localStorage/AsyncStorage mocking
  - `useFeedbackContext.test.ts` - Device information mocking
- **Error:** `SecurityError: localStorage is not available for opaque origins`
- **Complexity:** Medium - Test environment setup
- **Priority:** 🟡 MEDIUM

### 2. **Native Module Issues**
- **Files:**
  - `TeamForm.test.tsx` - `expo-linking` native module
- **Error:** `TypeError: (0 , __vite_ssr_import_0__.requireNativeModule) is not a function`
- **Complexity:** Medium - Native module mocking
- **Priority:** 🟡 MEDIUM

### 3. **API/TRPC Client Tests**
- **Files:**
  - `api.test.ts` (3 tests) - TRPC client creation
- **Error:** Import resolution for `@app/trpc/schemas`
- **Complexity:** High - Module resolution
- **Priority:** 🟠 HIGH

---

## 📊 Summary by Complexity

### Very High Complexity (Requires Deep Investigation)
1. **Component Rendering (Empty Body)** - ~150+ tests
   - Root cause unknown
   - Affects multiple component categories
   - No errors thrown, components just don't render

2. **JobsKanbanBoard.test.tsx** - 15 tests
   - Drag & drop interactions
   - Complex state management
   - Multiple UI interactions

3. **ImportReviewScreen.test.tsx** - 9 tests
   - Complex data transformation
   - Inline editing logic
   - Multiple state management

### High Complexity (Requires Mock Refactoring)
1. **Syntax/Import Errors** - 5+ test files blocked
2. **vi.mock Hoisting Issues** - 4+ test files
3. **Missing Mock Exports** - 3+ test files
4. **UserProfilePanel.test.tsx** - 15 tests with complex conditional logic

### Medium Complexity (Standard Fixes)
1. **Storage/AsyncStorage mocking** - 2 test files
2. **Native module mocking** - 1 test file
3. **Application component tests** - ~15 tests

---

## 🎯 Recommended Fix Order

### Phase 1: Critical Blockers (Syntax/Import)
1. Fix `EmploymentPrefsStep.test.tsx` syntax error
2. Fix `@app/trpc/schemas` import resolution
3. Add missing mock exports (Palette, styled, etc.)
4. Fix vi.mock hoisting issues

### Phase 2: Root Cause Investigation
1. **Investigate component rendering (empty body)** - This is the #1 blocker
   - Affects 150+ tests
   - Once fixed, many tests will pass
   - May require React 18 feature investigation
   - May require test environment configuration

### Phase 3: Complex Component Tests
1. Fix JobsKanbanBoard tests (drag & drop)
2. Fix UserProfilePanel tests (conditional rendering)
3. Fix ImportReviewScreen tests (data transformation)
4. Fix IPIP Assessment tests (scoring logic)

### Phase 4: Infrastructure Issues
1. Fix storage/AsyncStorage mocking
2. Fix native module mocking
3. Fix remaining API/TRPC issues

---

## 📝 Notes

- **Component Rendering Issue:** This is the single largest category of failures (~150+ tests). All fixes for placeholders, buttons, and test IDs are in place and will work once rendering is fixed.

- **Syntax Errors:** These block entire test files and should be fixed first as they're likely quick wins.

- **Mock Issues:** Many failures are due to incomplete or incorrectly set up mocks. These can be fixed systematically.

- **Test Infrastructure:** Some failures are due to test environment limitations (localStorage, native modules) that need proper mocking.

