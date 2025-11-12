# REQ-168 Acceptance Criteria → Test Layer Mapping

| Acceptance Criterion | Test Layer(s) | Notes |
| --- | --- | --- |
| Uploading a PDF under 1MB stores the file and triggers parsing | Deno router (resume.upload) integration; Playwright e2e | Mock Supabase storage upload in Deno; assert parse job enqueues; e2e verifies UI feedback |
| Uploading file >1MB shows "File size exceeds 1MB limit" error | Deno router validation unit; Vitest component (Upload modal); Playwright e2e | Ensure schema rejects payload; component renders toast; e2e covers user flow |
| Uploading invalid type (.txt) shows "Please upload a PDF or Word document" | Deno router validation unit; Vitest component; Playwright e2e | Validate MIME/type guard coverage |
| First-time users see dashboard import widget | Vitest component (widget visibility hook); Playwright e2e | Mock `resume.hasUploaded` false |
| After upload dashboard widget hidden | Vitest component state; Playwright regression (post-upload) | Use query invalidation to toggle |
| Profile > General always shows "Import from Resume" button | Vitest component snapshot; Playwright navigation check | |
| Successful parsing extracts all sections | Deno router parsing handler unit (OpenAI mock); Vitest hook (parsedData shape) | Use fixture resume payload |
| Skills map to CSI/O*NET taxonomy | Deno router unit (skills mapping helper); Vitest hook ensures data surfaces | Provide deterministic search mock |
| Section fails to parse exposes raw text with manual option | Vitest component test for error rendering; Playwright failure scenario | Simulate parse errors |
| Full parsing failure shows retryable error | Deno router error path; Playwright e2e (retry) | Force OpenAI timeout mock |
| Wizard shows 7-step progress indicator | Vitest component | Snapshot for `ProgressIndicator` |
| Field edits validate in real-time | Vitest component interaction | Use Testing Library with userEvent |
| Save & Continue persists and advances wizard | Vitest hook (mutation calls); Playwright wizard walkthrough | Mock `saveSection` responses |
| Skip discards section and advances | Vitest hook (skipSection); Playwright | |
| Previous shows saved data | Vitest component verifies state persistence | |
| Cancel keeps saved sections | Vitest component, verifying state after modal close reopen | |
| Re-upload enters merge mode with side-by-side comparison | Vitest component/hook for `hasExistingProfileData`; Playwright merge scenario | |
| Merge mode selection saves chosen data | Vitest hook verifying `mergeStrategy`; Deno router ensuring payload respected | |
| Manually added data not lost in merge | Vitest component ensures existing data appended; Deno router append strategy | |
| Section parse error shows raw text | Duplicate: see earlier; ensure Deno error surfaces | |
| No data found message display | Vitest component with empty parsed section | |
| Inline validation errors on save | Vitest component | |
| OpenAI timeout user message | Deno router error handling; Vitest component to show toast; Playwright overall | |
| Wizard resumes at last incomplete step | Vitest hook (initialIndex logic); Playwright resume session | |
| Completing all steps hides dashboard widget | Playwright end-to-end; Vitest widget state tests | |
| Progress indicator shows completed checkmarks | Vitest component | |
