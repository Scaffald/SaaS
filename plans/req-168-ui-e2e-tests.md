# REQ-168 UI & E2E Test Specifications

## Vitest (Components & Hooks)
- **`useResumeWizard` hook**
  - Initializes `currentIndex` from persisted wizard state and clamps extremes.
  - `saveSection` mutation payload includes merge strategy and advances to next step.
  - `skipSection` marks current step complete, updates progress order, and navigates.
  - Respects `parsedData` and `errors` return shapes from API.
- **`ResumeWizard` component**
  - Renders 7-step `ProgressIndicator` with active and completed states.
  - Displays parsed general info, employment data, and merge strategy toggles.
  - When `errors` contain section entry, shows raw text alert and manual entry prompt.
  - `Save & Continue` invokes hook handler with form data and disables buttons while saving.
  - `Skip` triggers confirmation toast and executes `skipSection`.
  - `Previous` restores saved form state (general/employment) and selections for lists.
  - Merge comparison view honours `append` default when existing records present.
  - Cancel flow emits confirmation dialog and keeps persisted data on reopen.
- **CTA Visibility Components** (`ResumeImportWidget`, `ResumeUploadButton`, dashboard surfaces)
  - Widget shown when `hasUploaded` false and hidden when true.
  - Profile general screen always renders "Import from Resume" button regardless of state.
  - Upload modal error handling: shows file type/size errors and OpenAI disabled notice.
- **Utility Presentation**
  - `ProgressIndicator` renders labels, current step highlight, and completion checkmarks.
  - `MergeComparisonView` lists existing vs incoming entries and emits strategy change events.

## Playwright End-to-End
1. **Initial Upload Happy Path**
   - Start at dashboard; widget visible.
   - Upload valid PDF; observe uploading/parsing toasts; wizard launches at step 1.
   - User accepts parsed general info, saves through each step, reaches review and confirms.
   - After completion, dashboard widget hidden and profile data populated.
2. **Validation Failures**
   - Attempt to upload >1MB file -> expect size error toast; ensure wizard does not open.
   - Attempt to upload `.txt` -> expect MIME error.
3. **Parsing Error Handling**
   - Mock OpenAI timeout to trigger friendly error; allow retry to succeed on second attempt.
   - Within wizard, simulate section error (skills) to verify raw text + manual entry option.
4. **Skip and Resume Flow**
   - Upload resume, skip education step, exit wizard.
   - Reopen wizard later; assert it resumes at first incomplete step and skipped step marked complete.
5. **Merge Mode**
   - Seed profile data, re-upload resume.
   - Verify side-by-side comparison, adjust merge strategies, ensure existing data retained after finish.
6. **Cancel Flow Persistence**
   - Start wizard, modify general info, cancel; reopen and confirm saved edits persist.
7. **CTA Regression**
   - Ensure profile general page retains "Import from Resume" button across sessions and after completion.

## Test Utilities & Fixtures
- Provide sample PDF/Word buffers with deterministic parsed output.
- OpenAI mock to return structured JSON, partial errors, and timeout exceptions.
- Supabase storage stub for upload/download lifecycle in Playwright (API mocking via route handlers).
- Shared helper to seed wizard state and profile data via Supabase Admin API for e2e setups.
