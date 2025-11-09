# REQ-83 · Profile Completion Wizard & Resume Import

## Context
- Requirement: Profile Completion Wizard with Behavioral Nudges and Data Import
- Current scope adjustments:
  - LinkedIn integration deferred
  - Behavioral nudge system & analytics deferred
  - Focused on wizard flow, weighted scoring, resume/PDF import, JSON intake, security & accessibility checks

## Objectives
- Guide users through a multi-step profile completion wizard after prerequisites
- Persist in-progress wizard state to enable resume capability and autosave
- Introduce weighted completion scoring to surface milestone thresholds
- Allow data ingestion from resumes (PDF/DOCX) and structured JSON exports
- Ensure new flows are secure, accessible, and covered by QA gates

## Deliverables & Plan Alignment

### 1. Foundations & Data Modeling
- [setup-migration] Create Supabase migration (`008_profile_wizard.sql`) adding JSONB columns for wizard progress & import metadata
- [scoring-engine] Update completion router logic (`packages/supabase/functions/trpc/routers/profile/completion.router.ts`) with weighted scoring, milestone flags; sync hook consumers

### 2. Wizard & Completion APIs
- [wizard-router] New tRPC router (`profile/profileWizard.router.ts`) exposing `getProgress`, `saveStep`, `complete`
- [completion-api] Extend profile completion router with enriched status, dismiss tracking, benefit calculations backed by new persistence

### 3. Resume & JSON Imports (LinkedIn deferred)
- [resume-parser] `profile.import.parseResume` endpoint handling PDF/DOCX upload, text extraction, optional OpenAI LLM structuring (`packages/core/integrations/resumeParser/*`)
- [json-import] Validation & confirm endpoints using shared schemas (`packages/core/schemas/profileImport.ts`)
- [import-persistence] Store parsed payloads, user selections, audit metadata via import endpoints leveraging new columns

### 4. Frontend Wizard Experience
- [wizard-shell] `ProfileWizard.tsx` container managing step navigation, autosave, timers (Tamagui primitives)
- [wizard-steps] Modular step components under `packages/core/features/profile/wizard/steps/`
- [wizard-modal] Dashboard modal (`apps/expo/app/dashboard/_layout.tsx`) launching wizard, exposing resume/JSON import, recording dismissals

### 5. Quality, Security, Accessibility
- [security-review] Threat modeling + backend tests (`packages/supabase/functions/trpc/__tests__/profile-wizard.spec.ts`)
- [accessibility-pass] Keyboard/ARIA review with automated checks (`pnpm ui:check`, component tests)
- [release-readiness] `pnpm check`, `pnpm build`, targeted integration tests, manual QA checklist + API validation instructions

## Open Questions / Follow-Ups
- Behavioral nudges, analytics instrumentation, and ghost-profile enforcement to be revisited in separate scope.
- Resume parsing defaults to OpenAI API; alternative extraction strategies can be evaluated during implementation if latency/cost becomes an issue.
