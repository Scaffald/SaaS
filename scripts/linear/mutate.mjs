#!/usr/bin/env node
/**
 * Generic Linear mutation runner — applies a list of mutations
 * (comments, state moves, label adds, issue creates) in one pass.
 *
 * Mutations are defined inline below (`PLAN`). Pass --dry-run to preview
 * without making any changes.
 *
 * Usage:
 *   node scripts/linear/mutate.mjs --dry-run
 *   node scripts/linear/mutate.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const LINEAR_API = 'https://api.linear.app/graphql'

function loadKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY
  for (const path of [
    resolve(REPO_ROOT, '.env.production'),
    '/Users/clay/Development/UNI-Construct/.env.production',
  ]) {
    if (!existsSync(path)) continue
    const m = readFileSync(path, 'utf8').match(/^LINEAR_API_KEY=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const API_KEY = loadKey()
if (!API_KEY) { console.error('✗ LINEAR_API_KEY missing'); process.exit(1) }

const DRY = process.argv.includes('--dry-run')

async function gql(query, variables) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Linear ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

// ---------- v1.8.0 ship sync ----------
// Sweeping Linear state after PRs #326/#327/#328/#329 merged on 2026-05-30:
// - 12 fixed tickets → label v1.8.0, move to In Github, comment with PR ref
// - 3 false positives → close with explanation
// - Deferred ones stay in Triage with their [pre-audit] prefix; tagging each
//   with a comment so the next planner can find them by surface (SDK,
//   nit, OOS).

const FIX_COMMENT = (pr, summary) => `**Shipped — 2026-05-30**

Fixed and merged on \`main\` via PR [#${pr}](https://github.com/Unicorn/UNI-Construct/pull/${pr}). ${summary}

Moving to **In Github** + labeling \`v1.8.0\`. Will be promoted to **In TestFlight** when the \`app-v1.8.0\` cut ships.`

const FALSE_POSITIVE_COMMENT = (explanation) => `**Reviewed — 2026-05-30**

This finding from the v1.8.0 pre-audit is a **false positive**. ${explanation}

Closing as Done. No code change was needed.`

const DEFERRED_COMMENT = (reason) => `**Deferred from v1.8.0 — 2026-05-30**

This pre-audit finding is real but won't ship in v1.8.0: ${reason}

Leaving in Triage with the \`[pre-audit]\` prefix so the next release planner can re-evaluate scope.`

// ---------- Fix transitions ----------
// 12 tickets where the pre-audit finding was real and the fix shipped on main.
// Each gets a comment, the v1.8.0 label, and a state move Triage → In Github.

const FIXED = [
  { ticket: 'SC-100', pr: 328, summary: 'Application create / retrieve / update / withdraw now return unwrapped Application objects matching the SDK contract; useApplicationForm.createDraft no longer throws "no ID returned".' },
  { ticket: 'SC-101', pr: 328, summary: 'Ported POST /upload-url, /confirm-upload, GET + POST /:id/messages. Resume uploads and the recruiter message thread now work end-to-end (and the POST handler permits org owners + role_assignees, not just the applicant).' },
  { ticket: 'SC-105', pr: 329, summary: 'ApplicationWizard toasts on auto-save failure so users notice errors that previously only showed as a small status icon.' },
  { ticket: 'SC-110', pr: 327, summary: 'Onboarding now renders ToS + Privacy Policy checkboxes; both must be true to submit. Server enforces via z.literal(true), and GET /check.isComplete folds in hasAcceptedPrivacy + hasAcceptedTerms so legacy users get bounced back to the form.' },
  { ticket: 'SC-111', pr: 327, summary: 'Industries query exposes isError + refetch; the section renders a red error message with a Retry button instead of the misleading "No industries available" empty-state.' },
  { ticket: 'SC-114', pr: 326, summary: 'Migration 334 adds freeform name + issuing_organization columns. All 8 missing REST routes ported (add-category, toggle-specific, remove-top-level, update-proof, save, upload-file, delete-file, delete). The /save schema defaults is_active + verification_status to match the shared tRPC contract.' },
  { ticket: 'SC-115', pr: 326, summary: 'Cert tree flatten now preserves parent_id from the depth1ByParent / depth2ByParent map keys; handleRemove sends the correct parent_id to toggle-specific.' },
  { ticket: 'SC-117', pr: 326, summary: 'handleSaveFile / handleSaveUrl / handleRemove now toast with the real error message instead of silently console.error-ing.' },
  { ticket: 'SC-118', pr: 326, summary: 'CertificationProofCard wraps FileReader in a Promise so onloadend rejections propagate to the try/catch; adds toast feedback for both upload and URL save failures.' },
  { ticket: 'SC-120', pr: 329, summary: 'PATCH /office-jobs/:id now rejects any inbound organization_id change as 400. Was a privilege-escalation gap: existing-org access check ran but destination-org access did not.' },
  { ticket: 'SC-122', pr: 329, summary: 'office-jobs createJobBodySchema tightened to match the shared schema (.min(3) / .min(10) / .max(100) for title and description).' },
  { ticket: 'SC-125', pr: 329, summary: 'Removed a stray console.log("Selected job location:", address) from JobForm.' },
]

const FALSE_POSITIVES = [
  { ticket: 'SC-102', explanation: 'QuickApplyModal.tsx:130-138 already calls `setIsSubmitting(false)` in the mutation\'s `onError` handler, so the Submit button re-enables after a failure and users can retry. The pre-audit agent missed the onError flow.' },
  { ticket: 'SC-116', explanation: 'profile-certifications-left.tsx:294-305 already calls `failProfileSync()` in the catch block, so the sync UI state is correctly cleared on error. The pre-audit agent flagged the file/line but missed the existing handling.' },
  { ticket: 'SC-119', explanation: 'profile-certifications-left.tsx:531-568 already wraps `toggleCert.mutateAsync` in a try/catch with toast + failProfileSync. The pre-audit agent flagged the mutateAsync call site without noticing it was inside an existing try/catch.' },
]

const DEFERRED = [
  { ticket: 'SC-103', reason: 'Real bug (custom_application_questions hardcoded empty in ApplicationWizard:100). Requires the SDK Job type to expose the field, which means a submodule PR + tsup rebuild + pointer bump.' },
  { ticket: 'SC-104', reason: 'Real polish (getMyForJob silently returns null on any error). Lives in the SDK submodule.' },
  { ticket: 'SC-106', reason: 'Real polish (POST retries refused even with idempotency key). Lives in the SDK HTTP client submodule.' },
  { ticket: 'SC-107', reason: 'Real polish (STATUS_DB_TO_API mapping incomplete). Cosmetic API surface drift; low end-user impact.' },
  { ticket: 'SC-108', reason: 'Nit (webhook delivery failures only logged). Operational visibility — addressable when we wire alerting.' },
  { ticket: 'SC-109', reason: 'Nit (application create never attaches idempotency key). Paired with SC-106; lands when that ships.' },
  { ticket: 'SC-112', reason: 'Mostly-correct (onSubmit error feedback). The completeMutation.onError already toasts; refinement is cosmetic.' },
  { ticket: 'SC-113', reason: 'Nit (legal fields in form schema not in SDK CompletePrerequisitesParams). Pass-through works via structural typing; SDK alignment lands when the submodule updates.' },
  { ticket: 'SC-121', reason: 'Out-of-MVP per SC-13 — employer-side flow. Form fields (employment_type / remote_option / pay_range) are real gaps but the employer flow is not part of the mobile-first worker MVP for v1.8.0.' },
  { ticket: 'SC-123', reason: 'Polish (draft button validation drift). Code-quality refinement on the employer JobForm; low priority for v1.8.0.' },
  { ticket: 'SC-124', reason: 'Polish (unsafe handleSubmit cast). Code-quality refinement.' },
]

// ---------- (Legacy) Pre-audit findings — kept for reference, not in PLAN ----------
const _SC19_FINDINGS_LEGACY = [
  {
    title: 'POST /v1/applications response contract mismatch (wrapped { data })',
    severity: 'blocker',
    file: 'packages/supabase/functions/api/routes/applications.ts:413 vs packages/sdk/src/resources/applications.ts:170-171',
    fix: 'Either unwrap in SDK `create()` or change server POST to return the unwrapped `application` object (matches GET behavior).',
  },
  {
    title: 'Missing application API routes — upload-url, confirm-upload, messages',
    severity: 'blocker',
    file: 'packages/sdk/src/resources/applications.ts:230-269 (declared) vs packages/supabase/functions/api/routes/applications.ts (not implemented)',
    fix: 'Implement POST /v1/applications/upload-url, /confirm-upload, GET /:id/messages, POST /:id/messages — or remove SDK stubs if not MVP.',
    notes: 'Same class as v1.7.0 SC-91. Unported tRPC handlers.',
  },
  {
    title: 'QuickApplyModal cannot retry on submit failure — submit button locked',
    severity: 'blocker',
    file: 'packages/scf-core/features/applications/components/QuickApplyModal.tsx:116-138',
    fix: 'Re-enable Submit on error path, or add an explicit Retry control. Currently user must close + reopen the modal.',
  },
  {
    title: 'Custom application questions hardcoded empty — TODO never resolved',
    severity: 'blocker',
    file: 'packages/scf-core/features/applications/components/ApplicationWizard.tsx:100',
    fix: 'Populate from `job.custom_application_questions` returned by the job details API. Jobs with custom questions currently submit without them.',
  },
  {
    title: 'getMyForJob() swallows all errors, returns null — UI cannot distinguish "no app" from "API down"',
    severity: 'polish',
    file: 'packages/sdk/src/resources/applications.ts:199-207',
    fix: 'Let real 404s through (truly no application); re-throw or surface other errors instead of collapsing to null.',
  },
  {
    title: 'ApplicationWizard step navigation continues after save failure — silent data loss',
    severity: 'polish',
    file: 'packages/scf-core/features/applications/hooks/useApplicationForm.ts:245-251',
    fix: 'nextStep/previousStep should toast on auto-save failure and offer retry before advancing.',
  },
  {
    title: 'HTTP client refuses POST retries even when idempotencyKey is set',
    severity: 'polish',
    file: 'packages/sdk/src/http/client.ts:132-136',
    fix: 'Allow retries for POST when an idempotency key is provided (idempotent retry is safe).',
  },
  {
    title: 'STATUS_DB_TO_API mapping incomplete — non-mapped statuses leak through',
    severity: 'polish',
    file: 'packages/supabase/functions/api/routes/applications.ts:18-25',
    fix: 'Map all DB statuses (offer/interview/hired/...) or validate exhaustively at the boundary.',
  },
  {
    title: 'Webhook delivery failures logged only — no operator visibility',
    severity: 'nit',
    file: 'packages/supabase/functions/api/routes/applications.ts:891-910',
    fix: 'Surface webhook delivery status separately (202 + status endpoint, or alerting hook) so silent ATS-integration failures are visible.',
  },
  {
    title: 'Application create never attaches idempotency key — retries unsafe',
    severity: 'nit',
    file: 'packages/sdk/src/resources/applications.ts:170-171',
    fix: 'Generate a deterministic key from `job_id + user_id` and pass to `post()`. Unblocks the retry fix above.',
  },
]

const _SC20_FINDINGS_LEGACY = [
  {
    title: 'Onboarding accepts ToS / Privacy Policy without UI — legal/compliance gap',
    severity: 'blocker',
    file: 'apps/scaffald/app/(protected)/onboarding/index.tsx:145-146, packages/scf-core/features/prerequisites/config/prerequisites-schema.ts:59-60',
    fix: 'Render Checkboxes for both fields, .refine() they are true before submit. Currently the form defaults them to false and the server still records accepted_*_at timestamps.',
  },
  {
    title: 'Industries lookup error state not handled — UI shows "No industries available" on API failure',
    severity: 'polish',
    file: 'apps/scaffald/app/(protected)/onboarding/index.tsx:78-79, 378-408',
    fix: 'Check `industriesData.isError` alongside `isLoadingIndustries`; render error + retry instead of an empty state.',
  },
  {
    title: 'onSubmit error path has no user-visible feedback beyond console.error',
    severity: 'polish',
    file: 'apps/scaffald/app/(protected)/onboarding/index.tsx:160-169',
    fix: 'Verify completeMutation.onError actually shows a toast users can act on; add retry guidance.',
  },
  {
    title: 'Legal-acceptance fields in form schema not in SDK CompletePrerequisitesParams — silent strip',
    severity: 'nit',
    file: 'packages/scf-core/features/prerequisites/config/prerequisites-schema.ts:59-60 vs packages/sdk/src/resources/prerequisites.ts:104-109',
    fix: 'Pick one source of truth. Either add fields to SDK params, or move legal acceptance to a dedicated consent path.',
  },
]

const _SC21_FINDINGS_LEGACY = [
  {
    title: 'Cert API: 8 mutation routes called by UI not implemented in REST — all return 404',
    severity: 'blocker',
    file: 'packages/supabase/functions/api/routes/certifications.ts (missing): add-category, toggle-specific, remove-top-level, update-proof, save, upload-file, delete-file, delete',
    fix: 'Port from packages/supabase/functions/trpc/routers/profile/certifications.router.ts (lines 245-360). Same shape as v1.7.0 SC-91 fix.',
    notes: 'Largest single finding in the pre-audit. All cert editing is broken until these land.',
  },
  {
    title: 'Wrong parent_id passed to removeCert mutation — sends cert ID instead of parent',
    severity: 'blocker',
    file: 'packages/scf-core/features/profile/profile-certifications-right.tsx:179',
    fix: 'Compute actual parent ID from the cert tree (or pass null if top-level). The current code passes cert.certification_id as both certification_id and parent_id.',
  },
  {
    title: 'Sync state stuck "syncing" after custom cert save error — UI mismatch',
    severity: 'blocker',
    file: 'packages/scf-core/features/profile/profile-certifications-left.tsx:294-305',
    fix: 'Confirm failProfileSync() is called in the catch and that the sync store reflects it visually — currently the in-progress indicator persists.',
  },
  {
    title: 'Proof update handlers swallow errors — no toast, button locked',
    severity: 'blocker',
    file: 'packages/scf-core/features/profile/profile-certifications-right.tsx:151-153, 167-169, 182-184',
    fix: 'Add toast on catch and clear loading state so the user can retry.',
  },
  {
    title: 'CertificationProofCard upload/save errors not surfaced',
    severity: 'polish',
    file: 'packages/scf-core/components/certifications/CertificationProofCard.tsx:46-49, 58-62',
    fix: 'Pass toast prop down, show user-facing error on upload or save failure.',
  },
  {
    title: 'Cert toggle mutation has no error handling — silent failure on 404',
    severity: 'polish',
    file: 'packages/scf-core/features/profile/profile-certifications-left.tsx:539-548',
    fix: 'Wrap toggleCert.mutateAsync in try/catch with toast; especially important until the missing route above lands.',
  },
]

const _SC18_FINDINGS_LEGACY = [
  {
    title: 'PATCH /office-jobs allows reassigning a job to an org the user does not own',
    severity: 'blocker',
    file: 'packages/supabase/functions/api/routes/office-jobs.ts:419-421',
    fix: 'If input.organization_id is provided, verify the requester has admin access to that org before applying.',
    notes: 'Likely out-of-MVP per SC-13 (employer-side), but this is a privilege escalation — worth flagging for separate hardening pass.',
  },
  {
    title: 'Job posting form missing UI for employment_type, remote_option, pay_range',
    severity: 'blocker',
    file: 'packages/scf-core/features/office/components/JobForm.tsx (Details section missing fields stored in state)',
    fix: 'Add selectors for employment type + remote option, and pay range inputs. Critical for discovery filters.',
  },
  {
    title: 'Title/description length constraints drift between REST and shared schemas',
    severity: 'polish',
    file: 'packages/supabase/functions/api/routes/office-jobs.ts:221-222 vs packages/supabase/functions/api/routes/_shared/job-schemas.ts:20-22',
    fix: 'Use the shared schema constraints (.min(3) / .min(10)) in the REST endpoint instead of .min(1).',
  },
  {
    title: '"Save as draft" disable logic does not match server validation',
    severity: 'polish',
    file: 'packages/scf-core/features/office/components/JobForm.tsx:1277-1285',
    fix: 'Mirror server constraints in the button disable predicate so users do not click into a guaranteed-fail submission.',
  },
  {
    title: 'JobForm.handleSubmit casts a generic Record to mutation params type unsafely',
    severity: 'polish',
    file: 'packages/scf-core/features/office/components/JobForm.tsx:483',
    fix: 'Use a Zod-validated builder so missing required fields are caught at compile time, not at the server.',
  },
  {
    title: 'Debug console.log on every location selection — leaks into production',
    severity: 'nit',
    file: 'packages/scf-core/features/office/components/JobForm.tsx:960',
    fix: 'Remove, or wrap in `if (__DEV__) { ... }`.',
  },
]

// ---------- Plan ----------
// Each step has: kind + params. Resolved at runtime against fetched IDs.

// ---------- 2026-06-09 v1.9.0 scoping + v1.6.0/v1.1.0 release close ----------
// Planning the v1.9.0 release: a polish/correctness pass over the v1.8.0
// pre-audit findings still sitting in Triage. Each ticket gets a v1.9.0
// label, a scoping comment, and moves Triage → Todo.
//
// Same pass closes shipped tickets: v1.6.0 + v1.1.0 In TestFlight → Done.
//
// Re-runs are safe: add-label is idempotent in Linear's API; move-state on
// an already-moved ticket is a no-op; only the comment will duplicate.

const V190_SCOPE_COMMENT = `**Scoped to v1.9.0 — 2026-06-09**

Pulling this deferred v1.8.0 pre-audit finding into the v1.9.0 polish/correctness pass. Labeling \`v1.9.0\` and moving to **Todo**.

See [[SC-18]] / [[SC-19]] / [[SC-20]] for the audit parents.`

const V190_TICKETS = [
  // SC-19 apply-flow findings
  'SC-103', 'SC-104', 'SC-106', 'SC-107', 'SC-108', 'SC-109',
  // SC-20 profile/onboarding findings
  'SC-112', 'SC-113',
  // SC-18 job-posting findings
  'SC-121', 'SC-123', 'SC-124',
  // Dev-env bug surfaced 2026-06-02
  'SC-127',
]

const RELEASE_CLOSE_COMMENT = (version) => `**Released — 2026-06-09**

App Store release containing \`v${version}\` is live. Closing as Done.`

const V160_SHIPPED = ['SC-74', 'SC-82', 'SC-83', 'SC-84', 'SC-86', 'SC-87', 'SC-88', 'SC-89']
const V110_SHIPPED = ['SC-55', 'SC-53']

// ---------- 2026-06-09 SC-103/104/106/109/113/121 ship ----------
// PR #335 bumps @scaffald/sdk submodule to the v1.9.0 SDK batch
// (Scaffald/sdk#5) and wires up SC-103's client-side use of
// custom_application_questions. PR #336 adds the missing form
// controls for SC-121 (employment_type, remote_option, pay_range).

const SDK_BUMP_COMMENT = (summary) => `**Shipped — 2026-06-09**

Landed via SDK PR [Scaffald/sdk#5](https://github.com/Scaffald/sdk/pull/5) and downstream submodule-bump PR [#335](https://github.com/Unicorn/UNI-Construct/pull/335).

${summary}

Moving to **In Github** for the v1.9.0 cut.`

const SC103_SUMMARY =
  '\`Job.custom_application_questions\` is now exposed on the typed SDK surface (column has existed in core.jobs since migration 145; server returns it via select("*")). ApplicationWizard reads it through `useJobDetails(jobId).data?.custom_application_questions ?? []`, replacing the hardcoded empty array + TODO that previously dropped every per-job custom question on the floor.'

const SC104_SUMMARY =
  '`applications.getMyForJob` no longer collapses every error to `null`. 404 still maps to null (no application exists), but 500s / 401s / network errors propagate so the UI can render a real error state instead of an identical empty state.'

const SC106_SUMMARY =
  'HTTP client now retries POST when an `Idempotency-Key` is set — server dedupes, so the existing 408/429/5xx backoff is safe to extend. Same key is threaded through every retry attempt.'

const SC109_SUMMARY =
  '`applications.create` attaches a per-call `Idempotency-Key` (UUID via crypto.randomUUID with a Date+random fallback). Paired with the SC-106 retry change, a transient 5xx during application submission no longer risks a double-create.'

const SC113_SUMMARY =
  '`CompletePrerequisitesParams` now declares `accepts_privacy_policy` and `accepts_terms_of_service` (boolean). Server already enforces truthiness (z.literal(true) from SC-110); the SDK type was the only path that could silently strip them from a typed builder.'

const SC121_SHIPPED_COMMENT = `**Shipped — 2026-06-09**

Fixed via PR [#336](https://github.com/Unicorn/UNI-Construct/pull/336).

The JobForm carried \`employment_type\`, \`remote_option\`, \`pay_range_min_cents\`, \`pay_range_max_cents\`, \`pay_range_type\` in form state and the server's \`createJobBodySchema\` accepted them — but no UI control rendered them, so jobs always shipped with the fields null and worker-side discovery couldn't filter on them.

Added between Location and Minimum Scaffald Score: an Employment-type select, a Work-arrangement select, and a Pay-range row (min $ + max $ + type select). Cents stored in state, dollars shown. All enums match \`OfficeCreateJobParams\` exactly so the typed builder from SC-124 picks them up without casts.

Moving to **In Github** for the v1.9.0 cut.`

const V190_SHIPPED = [
  { ticket: 'SC-103', comment: SDK_BUMP_COMMENT(SC103_SUMMARY) },
  { ticket: 'SC-104', comment: SDK_BUMP_COMMENT(SC104_SUMMARY) },
  { ticket: 'SC-106', comment: SDK_BUMP_COMMENT(SC106_SUMMARY) },
  { ticket: 'SC-109', comment: SDK_BUMP_COMMENT(SC109_SUMMARY) },
  { ticket: 'SC-113', comment: SDK_BUMP_COMMENT(SC113_SUMMARY) },
  { ticket: 'SC-121', comment: SC121_SHIPPED_COMMENT },
]

// ---------- 2026-06-16 v1.11.0 scoping ----------
// Grouping the Worker MVP core-screen tickets under a new `v1.11.0` label per
// the release plan in docs/agents/handoffs/2026-06-16-v1.11.0-plan.md.
// Decisions (with @clay): feature-led on worker-MVP screens; clear all 33
// In-TestFlight issues (v1.7.0–v1.9.0) to Done before Phase 1 dev begins.
// SC-26 moves Triage → Todo; the rest already sit in Todo.
// Re-runs are safe: add-label is idempotent in Linear's API; move-state on an
// already-moved ticket is a no-op; only the comment duplicates.

const V1110_SCOPE_COMMENT = `**Scoped to v1.11.0 — 2026-06-16**

Grouping under the new \`v1.11.0\` release — Worker MVP core screens. Plan: \`docs/agents/handoffs/2026-06-16-v1.11.0-plan.md\` (supersedes the v1.10.0 design grouping).

**Gated on Phase 0:** every In-TestFlight issue (v1.7.0–v1.9.0) must be validated to **Done** before Phase 1 dev begins.`

// Design chain feeds the build: SC-33/SC-34/SC-36 (design) → SC-27/SC-26 (build).
// SC-128 (community QA) is parallel — no design dependency.
const V1110_TICKETS = ['SC-33', 'SC-34', 'SC-36', 'SC-27', 'SC-26', 'SC-128']

// ---------- 2026-06-16 v1.11.0 Phase-0 verification sweep ----------
// Code-level verification of all 33 In-TestFlight issues against `main` (three
// parallel agents, file:line traced), plus DB-level runtime checks for the
// profile P0 relation bugs (SC-91/92/93 confirmed live; migrations 331/334
// applied). 32 verified → Done. SC-99 held (acceptance not met).
// Basis is code + DB runtime, NOT device-QA on a TestFlight build — each
// comment says so. Re-runs duplicate comments only; state moves are no-ops.

const VERIFY_HEADER = `**Verified — 2026-06-16 — v1.11.0 Phase-0 sweep**

`
const VERIFY_FOOTER = `

Basis: source traced line-by-line on \`main\` (+ DB runtime checks where applicable). This is **code/DB-level verification, not device-QA against a TestFlight build**. Promoting to **Done** per the v1.11.0 Phase-0 gate.`

// ticket → one-line evidence
const VERIFIED = {
  // v1.7.0 profile cluster
  'SC-90': 'index.ts:134-147 — specific profile sub-routers (experience/employment/education/skills) mounted before the generic `/{username}` catch-all (kept last by design). Route-shadowing fixed.',
  'SC-91': 'skills.ts:1234-1343 — `POST /search-parents` implemented (calls `search_parent_skills` RPC). **Runtime:** RPC present in live DB.',
  'SC-92': 'skills.ts:968-1059 — multi-taxonomy handlers repointed to `core.user_skills` (taxonomy-filtered); the missing relation was intentionally NOT created. **Runtime:** `core.user_skills` present, `user_skills_multi_taxonomy` absent — confirms repoint. NOTE: ticket says "create the relation" — alternative fix; description should be amended.',
  'SC-93': 'Migration 331_user_profiles_view.sql creates `core.user_profiles` as a security_invoker view over `core.profile`; experience.ts:183 / education.ts:176 consume it. **Runtime:** view exists, queryable (71 rows), migration 331 applied — the exact 500 path resolves.',
  'SC-94': 'profiles.ts:41 — `GET /slug/history` static route registered before the `/{username}` catch-all.',
  'SC-95': 'profile-skills-context.tsx:215-220 re-throws (the `catch { return [] }` swallow is gone); `ProfileResultsPanel` isError/onRetry error states wired for Skills/Experience/Education/Employment.',
  'SC-96': 'Selected `taxonomies` now passed through at profile-skills-context.tsx:161-166 (was dropped); O*NET branch added in the route handler (skills.ts:1296-1327, queries `onet.occupation_data`). Functionally fixed — O*NET handled in route vs RPC per literal wording (alt fix).',
  'SC-97': 'ConnectionFollowButtons.tsx:44 self-guard (`isOwnProfile || !targetUserId` → null); header gates Connect/Follow on `!isOwnProfile`. Minor hooks-order smell noted, not a functional bug.',
  // v1.8.0 worker-flow cluster
  'SC-100': 'applications.ts — create/retrieve/update/withdraw return UNWRAPPED Application (L458/559/715/869); list/activity stay {data} as intended.',
  'SC-101': 'applications.ts — upload-url (L1185), confirm-upload (L1266), GET/POST messages (L1354/L1485); POST permits applicant | org owner | role_assignee.',
  'SC-105': 'useApplicationForm.ts:189 sets saveError; ApplicationWizard.tsx:117-131 toasts on auto-save failure (deduped via ref), in addition to the status icon.',
  'SC-110': 'onboarding/index.tsx:442-504 renders ToS + Privacy checkboxes; server `z.literal(true)` (prerequisites.ts:64-71); GET check.isComplete folds in both (L221-222).',
  'SC-111': 'onboarding/index.tsx:80-85 destructures isError+refetch; L400-412 renders error + Retry before the "No industries available" empty state.',
  'SC-114': 'Migration 334 adds name + issuing_organization; certifications.ts implements all 8 routes (add-category L437 … delete L1283).',
  'SC-115': 'profile-certifications-right.tsx:102-112 attaches parent_id from the tree map key; handleRemove L220-223 sends parent_id distinct from certification_id, with a missing-parent guard.',
  'SC-117': 'profile-certifications-right.tsx — handleSaveFile/SaveUrl/Remove toast on catch (L161/189/225); loading via mutation isPending (auto-clears).',
  'SC-118': 'CertificationProofCard.tsx:45-50 wraps FileReader in a Promise (onloadend→resolve / onerror→reject); toast on upload + URL-save failure; setUploading(false) in finally.',
  'SC-120': '**Security:** office-jobs.ts:406-418 — PATCH 400s on ANY `organization_id` change before any DB write; updateData never copies organization_id. Cross-org reassignment vector fully closed. Verified sound.',
  'SC-122': 'office-jobs.ts:225-229 — createJobBodySchema title `.min(3).max(100)`, description `.min(10)`.',
  'SC-125': 'JobForm.tsx — the debug `console.log("Selected job location:", …)` is gone (grep clean).',
  // v1.9.0 cluster
  'SC-103': 'sdk/resources/jobs.ts:41 exposes `custom_application_questions`; ApplicationWizard.tsx:107-111 reads it via `useJobDetails(jobId).data?.custom_application_questions ?? []` (hardcoded-empty + TODO gone).',
  'SC-104': 'sdk/resources/applications.ts:228-238 — getMyForJob maps only NotFoundError → null; all other errors throw.',
  'SC-106': 'sdk/http/client.ts:144-156 — POST retried when an Idempotency-Key is set (refused only when absent).',
  'SC-107': 'applications.ts:52-74 — STATUS_DB_TO_API / API_TO_DB are exhaustive Records over all 8 statuses; mapDbStatus guards drift.',
  'SC-108': 'applications.ts:935-963 — webhook failures persisted to `core.webhook_deliveries` (status/http_status/body/error) + structured error logs. Durable operator visibility (table, not in-product UI).',
  'SC-109': 'sdk/resources/applications.ts:189-195 — create attaches a per-call `generateIdempotencyKey()` UUID.',
  'SC-112': 'onboarding/index.tsx:88-107 — useCompletePrerequisites onError fires an error toast. NOTE: the onSubmit catch (L178) is still a bare console.error — redundant/harmless; a refactor dropping the hook onError would silently re-introduce the bug.',
  'SC-113': 'sdk/resources/prerequisites.ts:113-114 — CompletePrerequisitesParams declares accepts_privacy_policy + accepts_terms_of_service (boolean).',
  'SC-121': 'JobForm.tsx:1008-1101 — employment_type + remote_option selects, pay min/max inputs, pay_range_type select. Enums match OfficeCreateJobParams.',
  'SC-123': 'JobForm.tsx:465-468 `meetsDraftMinimums` (title≥3, desc≥10, org_id) drives disable at L1417 — mirrors server createJobBodySchema.',
  'SC-124': 'JobForm.tsx:470-496 typed `buildJobParams(asDraft): OfficeCreateJobParams` builder; the generic Record cast is gone.',
  'SC-127': 'seeds/008_seed-cross-org-demo.sql — ON CONFLICT targets backed by real constraints (applications job_id,user_id; connections; reviews partial idx; communities slug; …). **Runtime:** db-reset path unblocked, migrations 331/334 applied.',
}

const SC99_HELD = `**Verification — 2026-06-16 — held, acceptance not met**

PARTIAL. The stale README seed creds were documented (seeds/README.md), but the ticket's actual ask — **fold the CSI/skills reference seed into \`pnpm supa db reset\`** — was NOT done. A fresh \`db reset\` still yields empty CSI/skills taxonomy (reference data requires a separate \`pnpm supa:seed\`), which is the exact failure SC-99 targets and a runtime blocker for SC-91 skill search.

**Keeping In TestFlight.** Either do the fold, or amend acceptance to "document the two-step seed."`

// ---------- 2026-06-16 SC-128 community-flow fixes → In Progress ----------
const SC128_COMMENT = `**PR up — 2026-06-16**

All 7 findings addressed in PR [#353](https://github.com/Unicorn/UNI-Construct/pull/353) (\`fix/sc-128-community-flow\`, labeled v1.11.0):

1. Join button persisted → CommunityCard flips to a "Joined" pill; list tracks join state optimistically.
2. Title truncated → numberOfLines + flexShrink so it wraps.
3. No leave feedback → Leave/Join show pending state + error toasts.
4. Missing back button → added to the community detail screen.
5. Skill-tag search too narrow → substring match on name+description across the full taxonomy (generic tags included). **Runtime-verified**: \`plu\`→3, \`carp\`→2, \`elec\`→1 (were 0).
6. Image upload → normalize image/jpg → image/jpeg for the bucket allowlist. Storage path confirmed working server-side (200).
7. Post silently failed → create/submit now surface error toasts (the verified-member 403 was invisible). Backend gate is by design.

typecheck + affected build/test green. **Remaining:** manual QA click-through with a verified member, and confirm migration 317 (bucket/RLS) is applied in target envs. Moving to **In Progress**.`

const SC128_MERGED = `**Merged — 2026-06-16**

PR [#353](https://github.com/Unicorn/UNI-Construct/pull/353) squash-merged to \`main\` as \`75b1ebe42\`. All 7 findings fixed.

Verified before merge (CI is billing-blocked at the account level — jobs never start — so local was the gate): scf-core + supabase typecheck & lint clean; affected build + tests green; the 18 scf-core test failures are pre-existing and unrelated (branch touches only the 6 community files). Smoke-tested logged in as a seeded user: list + detail render, full title, back button works on in-app nav, member controls correct; #5 search runtime-verified (\`plu\`/\`carp\`/\`elec\` now return results).

Moving to **In Github**. Promote to In TestFlight with the next \`app-v1.11.0\` build. Remaining QA: click-through of join/leave/post-create transient states with a verified member.`

// ---------- 2026-06-16 SC-128 relabel → v1.10.3 patch ----------
// Decision: ship SC-128 (standalone community-flow fixes) as a 1.10.3 patch
// now rather than burn the v1.11.0 label, which stays for the worker-MVP
// feature batch (SC-26/27/33/34/36) once designs land.
const SC128_RELABEL = `**Re-scoped to v1.10.3 — 2026-06-16**

Shipping these community-flow fixes as a standalone **1.10.3 patch** rather than holding for the design-gated v1.11.0 feature batch. Relabeling v1.11.0 → v1.10.3; v1.11.0 stays reserved for SC-26/27/33/34/36.`

const PLAN = [
  { kind: 'add-label', issue: 'SC-128', label: 'v1.10.2' },
  { kind: 'remove-label', issue: 'SC-128', label: 'v1.10.3' },
]

// Previous PLAN (Phase-0 verification sweep) kept for reference.
const _PLAN_VERIFY_SNAPSHOT = [
  ...Object.entries(VERIFIED).flatMap(([ticket, evidence]) => [
    { kind: 'comment', issue: ticket, body: VERIFY_HEADER + evidence + VERIFY_FOOTER },
    { kind: 'move-state', issue: ticket, toState: 'Done' },
  ]),
  { kind: 'comment', issue: 'SC-99', body: SC99_HELD },
]

// Previous PLANs kept for reference.
const _PLAN_V1110_SCOPE_SNAPSHOT = [
  ...V1110_TICKETS.flatMap((ticket) => [
    { kind: 'comment', issue: ticket, body: V1110_SCOPE_COMMENT },
    { kind: 'add-label', issue: ticket, label: 'v1.11.0' },
  ]),
  { kind: 'move-state', issue: 'SC-26', toState: 'Todo' },
]
const _PLAN_V190_SHIP_SNAPSHOT = [
  ...V190_SHIPPED.flatMap(({ ticket, comment }) => [
    { kind: 'comment', issue: ticket, body: comment },
    { kind: 'move-state', issue: ticket, toState: 'In Github' },
  ]),
]

// Previous PLAN (v1.9.0 scoping + release close) kept for reference.
const _PLAN_V190_SCOPE_SNAPSHOT = [
  ...V190_TICKETS.flatMap((ticket) => [
    { kind: 'comment', issue: ticket, body: V190_SCOPE_COMMENT },
    { kind: 'add-label', issue: ticket, label: 'v1.9.0' },
    { kind: 'move-state', issue: ticket, toState: 'Todo' },
  ]),
  ...V160_SHIPPED.flatMap((ticket) => [
    { kind: 'comment', issue: ticket, body: RELEASE_CLOSE_COMMENT('1.6.0') },
    { kind: 'move-state', issue: ticket, toState: 'Done' },
  ]),
  ...V110_SHIPPED.flatMap((ticket) => [
    { kind: 'comment', issue: ticket, body: RELEASE_CLOSE_COMMENT('1.1.0') },
    { kind: 'move-state', issue: ticket, toState: 'Done' },
  ]),
]

// ---------- 2026-05-30 v1.8.0 ship sync (historical snapshot) ----------
// Sweeping Linear state after PRs #326/#327/#328/#329 merged on 2026-05-30.
// Kept for reference; the arrays above (FIXED/FALSE_POSITIVES/DEFERRED) drove
// the previous PLAN. Restored by re-wiring PLAN to the spread below.
const _PLAN_V180_SNAPSHOT = [
  ...FIXED.flatMap(({ ticket, pr, summary }) => [
    { kind: 'comment', issue: ticket, body: FIX_COMMENT(pr, summary) },
    { kind: 'add-label', issue: ticket, label: 'v1.8.0' },
    { kind: 'move-state', issue: ticket, toState: 'In Github' },
  ]),
  ...FALSE_POSITIVES.flatMap(({ ticket, explanation }) => [
    { kind: 'comment', issue: ticket, body: FALSE_POSITIVE_COMMENT(explanation) },
    { kind: 'move-state', issue: ticket, toState: 'Done' },
  ]),
  ...DEFERRED.map(({ ticket, reason }) => ({
    kind: 'comment', issue: ticket, body: DEFERRED_COMMENT(reason),
  })),
]

// ---------- Resolution ----------
async function resolveIssueId(identifier) {
  const data = await gql(
    `query($id: String!) { issue(id: $id) { id identifier state { name } } }`,
    { id: identifier },
  )
  return data.issue
}

async function resolveStateId(stateName) {
  const data = await gql(
    `query($n: String!) { workflowStates(filter: { name: { eq: $n } }) { nodes { id name team { key } } } }`,
    { n: stateName },
  )
  const node = data.workflowStates.nodes.find((s) => s.team.key === 'SC')
  if (!node) throw new Error(`State "${stateName}" not found on team SC`)
  return node.id
}

async function resolveLabelId(labelName) {
  const data = await gql(
    `query($n: String!) { issueLabels(filter: { name: { eq: $n } }) { nodes { id name team { key } } } }`,
    { n: labelName },
  )
  const node = data.issueLabels.nodes.find((l) => !l.team || l.team.key === 'SC')
  if (node) return node.id
  // Create it if missing.
  if (DRY) return `[would-create-label:${labelName}]`
  const teamData = await gql(`query { teams(filter: { key: { eq: "SC" } }) { nodes { id } } }`)
  const teamId = teamData.teams.nodes[0].id
  const create = await gql(
    `mutation($input: IssueLabelCreateInput!) { issueLabelCreate(input: $input) { issueLabel { id } } }`,
    { input: { name: labelName, teamId } },
  )
  return create.issueLabelCreate.issueLabel.id
}

async function resolveTeamId() {
  const data = await gql(`query { teams(filter: { key: { eq: "SC" } }) { nodes { id } } }`)
  return data.teams.nodes[0].id
}

// ---------- Execution ----------
async function exec(step) {
  if (step.kind === 'comment') {
    const issue = await resolveIssueId(step.issue)
    console.log(`  💬 comment on ${step.issue} (${issue?.state.name})`)
    if (DRY) return
    await gql(
      `mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }`,
      { input: { issueId: issue.id, body: step.body } },
    )
  } else if (step.kind === 'move-state') {
    const [issue, stateId] = await Promise.all([
      resolveIssueId(step.issue),
      resolveStateId(step.toState),
    ])
    console.log(`  ➡  move ${step.issue}: ${issue.state.name} → ${step.toState}`)
    if (DRY) return
    await gql(
      `mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success } }`,
      { id: issue.id, input: { stateId } },
    )
  } else if (step.kind === 'add-label') {
    const [issue, labelId] = await Promise.all([
      resolveIssueId(step.issue),
      resolveLabelId(step.label),
    ])
    console.log(`  🏷  label ${step.issue} += ${step.label}`)
    if (DRY) return
    await gql(
      `mutation($id: String!, $labelId: String!) { issueAddLabel(id: $id, labelId: $labelId) { success } }`,
      { id: issue.id, labelId },
    )
  } else if (step.kind === 'remove-label') {
    const [issue, labelId] = await Promise.all([
      resolveIssueId(step.issue),
      resolveLabelId(step.label),
    ])
    console.log(`  🏷  label ${step.issue} -= ${step.label}`)
    if (DRY) return
    await gql(
      `mutation($id: String!, $labelId: String!) { issueRemoveLabel(id: $id, labelId: $labelId) { success } }`,
      { id: issue.id, labelId },
    )
  } else if (step.kind === 'create-issue') {
    const [teamId, stateId] = await Promise.all([
      resolveTeamId(),
      resolveStateId(step.state),
    ])
    console.log(`  ✨ create: "${step.title}" (${step.state})`)
    if (DRY) return
    const result = await gql(
      `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }`,
      {
        input: {
          teamId,
          title: step.title,
          description: step.description,
          priority: step.priority,
          stateId,
        },
      },
    )
    console.log(`     → ${result.issueCreate.issue.identifier} ${result.issueCreate.issue.url}`)
  } else {
    throw new Error(`unknown kind: ${step.kind}`)
  }
}

async function main() {
  console.log(`  ${DRY ? 'DRY RUN — no changes' : 'EXECUTING — making changes to Linear'}`)
  console.log(`  ${PLAN.length} steps queued\n`)
  let ok = 0, failed = 0
  for (const step of PLAN) {
    try {
      await exec(step)
      ok++
    } catch (err) {
      console.error(`  ✗ ${step.kind} ${step.issue || step.title}: ${err.message}`)
      failed++
    }
  }
  console.log(`\n  ${ok} ok, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => { console.error(`✗ ${err.message}`); process.exit(1) })
