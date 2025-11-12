# REQ-168 Deno Router Test Specifications

## Resume Upload (`resume.upload`)
- Valid PDF upload under 1MB returns success payload with decoded storage path.
- Rejects payload missing `fileData`, `fileName`, `fileSize`, or `mimeType` with `BAD_REQUEST`.
- Rejects files larger than 1MB with `BAD_REQUEST` message "File size exceeds 1MB limit".
- Rejects unsupported MIME types and verifies error message.
- Stores sanitized filename and timestamped path via `buildResumePath`.
- Handles Supabase storage upload errors by surfacing `INTERNAL_SERVER_ERROR`.
- Ensures decoded bytes length matches provided `fileSize`.

## Resume Parse (`resume.parse`)
- Requires authenticated user (middleware check).
- Rejects unknown resume ID or missing storage record with `NOT_FOUND`.
- Downloads stored file and extracts text path based on MIME type (`extractResumeText`).
- When OpenAI returns JSON payload, response matches `parsedResumeSchema`.
- Handles fenced JSON, raw JSON, and malformed payload (invokes fallback error record).
- When OpenAI times out or throws, returns error array with raw text when available and `success: true`.
- Ensures skills mapping uses CSI/O*NET helpers and dedupes names (mock search).
- Logs and truncates large resume text without throwing.

## Wizard State (`resume.getWizardState` / `resume.saveSection` / `resume.updateProgress`)
- `getWizardState` returns persisted record with parsed data and errors.
- Returns default state when wizard row missing (auto-seeded on upload).
- `saveSection` validates section input, persists section payload respecting merge strategy (`replace`, `append`, `keepExisting`).
- When `mergeStrategy.mode` missing, defaults to `replace`.
- `saveSection` increments `completedSteps` with dedupe and stamps `updated_at`.
- Rejects invalid merge strategy value with `BAD_REQUEST`.
- Ensures array sections append vs replace behavior (experience, education, skills, certifications).
- `updateProgress` clamps `currentStep` and sorts `completedSteps` array.
- Prevents regression where skipping section removes previously completed steps.

## Has Uploaded (`resume.hasUploaded`)
- Requires auth (existing test covers unauthorized case).
- Returns `hasUploaded: true` when `resume_uploads` row exists for user.
- Reflects false when bucket entry deleted (uses left join on wizard state).

## Helper Functions
- `stripDataUrlPrefix` handles data URLs and raw base64.
- `decodeBase64File` throws `BAD_REQUEST` on malformed base64.
- `sanitizeFileName` strips unsafe characters and truncates >255 chars.
- `buildResumePath` generates ISO timestamp and sanitized filename.
- `extractJsonPayloadFromOpenAI` handles fenced, object, array, and substring JSON scenarios.
