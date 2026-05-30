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

// ---------- Pre-audit ticket builders ----------
// Phase B of the v1.8.0 worker-flow repair sweep. See
// docs/agents/handoffs/2026-05-30-v1.8.0-plan.md.
//
// Each finding gets filed in Triage with title `[pre-audit/SC-XX] …` so
// Phase D can find them and promote/close in a single batch.
//
// Severity → Linear priority:  blocker=2 (high), polish=3 (medium), nit=4 (low).
// We don't use priority 1 (urgent) here — pre-audit findings aren't urgent
// until Phase D approves them.

const SEV_PRIORITY = { blocker: 2, polish: 3, nit: 4 }

function preAuditIssue(sourceTicket, finding) {
  const { title, severity, file, fix, notes } = finding
  return {
    kind: 'create-issue',
    title: `[pre-audit/${sourceTicket}] ${title}`,
    description: `**Source:** Phase B pre-audit for [${sourceTicket}](https://linear.app/scaffald/issue/${sourceTicket.toLowerCase()}). See [v1.8.0 plan](https://github.com/Unicorn/UNI-Construct/blob/main/docs/agents/handoffs/2026-05-30-v1.8.0-plan.md).

**Severity:** \`${severity}\`
**File:** \`${file}\`
**Fix:** ${fix}${notes ? `\n\n**Notes:** ${notes}` : ''}

This is a draft from the code-level pre-audit. It will be promoted to a real \`v1.8.0\` fix ticket in Phase D once Boris's manual audit confirms scope, or closed if it's out of MVP per [SC-13](https://linear.app/scaffald/issue/sc-13).`,
    priority: SEV_PRIORITY[severity],
    state: 'Triage',
  }
}

const PREAUDIT_DROP_COMMENT = (sourceTicket, findings) => `**Phase B pre-audit drop — 2026-05-30**

Code-level pre-audit of this flow produced ${findings.length} finding${findings.length === 1 ? '' : 's'}, filed as draft tickets in Triage with prefix \`[pre-audit/${sourceTicket}]\`. Each has a file:line ref and a 1-line fix suggestion.

Severity breakdown:
${['blocker', 'polish', 'nit'].map((sev) => {
  const n = findings.filter((f) => f.severity === sev).length
  return n > 0 ? `- ${n} × \`${sev}\`` : null
}).filter(Boolean).join('\n')}

These are **inputs to your manual audit**, not replacements. Validate / extend / dispute as you walk the flow. SC-22 consolidates everything for the Phase D scope cut.

Plan doc: \`docs/agents/handoffs/2026-05-30-v1.8.0-plan.md\``

// ---------- Findings ----------
const SC19_FINDINGS = [
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

const SC20_FINDINGS = [
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

const SC21_FINDINGS = [
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

const SC18_FINDINGS = [
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
const PLAN = [
  // Pre-audit ticket drops, grouped by source audit ticket.
  ...SC19_FINDINGS.map((f) => preAuditIssue('SC-19', f)),
  { kind: 'comment', issue: 'SC-19', body: PREAUDIT_DROP_COMMENT('SC-19', SC19_FINDINGS) },

  ...SC20_FINDINGS.map((f) => preAuditIssue('SC-20', f)),
  { kind: 'comment', issue: 'SC-20', body: PREAUDIT_DROP_COMMENT('SC-20', SC20_FINDINGS) },

  ...SC21_FINDINGS.map((f) => preAuditIssue('SC-21', f)),
  { kind: 'comment', issue: 'SC-21', body: PREAUDIT_DROP_COMMENT('SC-21', SC21_FINDINGS) },

  ...SC18_FINDINGS.map((f) => preAuditIssue('SC-18', f)),
  { kind: 'comment', issue: 'SC-18', body: PREAUDIT_DROP_COMMENT('SC-18', SC18_FINDINGS) },
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
