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

// ---------- 2026-06-01 prod hotfix: communities PostgREST schema drift ----------
// File a single ticket recording the prod 500-error fix on Communities endpoints.
// Triage 2026-06-01 found prod's PostgREST `db_schema` was missing `community`,
// while dev/preview both had it. PATCHed via Management API; verified by direct
// PostgREST query + `/api/v1/communities/posts/published?limit=5` returning 200.
// No code change; pure config drift. Filed directly as Done.

const COMMUNITIES_POSTGREST_BODY = `**Symptom:** \`app.scaffald.com\` returned 500 on every Communities API call: \`GET /api/v1/communities/posts/published\`, \`GET /api/v1/communities/my\`, \`GET /api/v1/communities/reputation/me\`. Triaged 2026-06-01 from prod console errors.

**Root cause:** Prod PostgREST's \`db_schema\` and \`db_extra_search_path\` did not include \`community\`, while dev and preview both did. The \`community\` schema and its 11 tables existed on prod (restored at some point after the [2026-05-25 schema-drift audit](https://github.com/Unicorn/UNI-Construct/blob/main/docs/agents/audits/2026-05-25-supabase-schema-drift-extended.md)), but PostgREST refused to serve them because the schema was not exposed. Edge-function handlers calling \`supabase.schema("community").from(...)\` got back 500s.

**Before / after:**

\`\`\`
prod (before):  db_schema = "auth,public,core,storage,data,onet,engagement"
prod (after):   db_schema = "auth,public,core,storage,data,onet,engagement,community"

prod (before):  db_extra_search_path = "public,core,data,onet,engagement"
prod (after):   db_extra_search_path = "public,core,data,onet,engagement,community"
\`\`\`

**Fix:** \`PATCH https://api.supabase.com/v1/projects/qmfmpcyxsihhfttvqpbw/postgrest\` with the updated values. PostgREST restarted and started serving the schema.

**Verified live:**
- Direct PostgREST: \`GET /rest/v1/communities?select=id,slug\` with \`Accept-Profile: community\` returns the 3 seeded communities (cosmetology, electrical, plumbing) ✓
- Edge function: \`GET /functions/v1/api/v1/communities/posts/published?limit=5\` returns \`{"data":[],"next_cursor":null}\` (200) ✓

**Followup:**
- The 2026-05-25 audit's planned ticket "Restore community schema on prod" is **obsolete** — schema is intact.
- Remaining audit findings still stand: engagement rollups missing on prod (§D), search_path hardening (SC-69), \`cms.welcome_slides\` orphan (§E).

🤖 Triaged and patched by Claude Code on 2026-06-01.`

const PLAN = [
  {
    kind: 'create-issue',
    title: 'Prod PostgREST not exposing `community` schema (3-endpoint 500s)',
    description: COMMUNITIES_POSTGREST_BODY,
    priority: 1, // Urgent
    state: 'Done', // already patched live
  },
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
