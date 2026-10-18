/// <reference lib="deno.ns" />

/**
 * The account-deletion processor against the real database and storage (#1313).
 *
 * A deletion request used to be a 'pending' row nothing read. This drives
 * `_shared/account-deletion/process.ts` — exactly what the
 * `account-deletion-process` function runs — against a real seeded user, and
 * checks the outcome where it lives: auth, core tables, storage objects.
 *
 * Like payments-settlement.test.ts it speaks to Postgres, GoTrue and Storage
 * rather than to the `api` function, so it needs a migrated stack but no
 * function server. Every run is scoped to the requests it created (`ids`),
 * because the local database is shared. The confirmation email is the one
 * thing faked: Resend is a third party, and a test must not send mail.
 */

import { assert, assertEquals, assertExists } from 'std/assert'
import type { SupabaseClient } from '@supabase/supabase-js'

import { processDueDeletions, type SendEmail } from '../../functions/_shared/account-deletion/process.ts'
import { createAdminClient } from '../shared/setup.ts'

// deno-lint-ignore no-explicit-any
type AnyClient = any

const admin = createAdminClient() as SupabaseClient
const core = () => (admin as AnyClient).schema('core')
const RUN = crypto.randomUUID().slice(0, 8)
const PAST = new Date(Date.now() - 60_000).toISOString()

// Every user this file creates, so cleanup runs even when seeding fails.
const createdUsers: string[] = []

const sent: Array<{ to: string; subject: string }> = []
const fakeEmail: SendEmail = async ({ to, subject }) => {
  sent.push({ to, subject })
  return { sent: true }
}

async function must<T>(label: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function createUser(label: string): Promise<{ id: string; email: string }> {
  const email = `deletion-${label}-${RUN}@example.com`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: `p-${crypto.randomUUID()}`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`create ${label}: ${error?.message}`)
  createdUsers.push(data.user.id)
  return { id: data.user.id, email }
}

async function userExists(id: string): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(id)
  return !error && Boolean(data.user)
}

async function count(table: string, column: string, value: string): Promise<number> {
  const { count, error } = await core().from(table).select('*', { count: 'exact', head: true }).eq(column, value)
  if (count === null) throw new Error(`count ${table}.${column}: ${error?.message ?? 'null'}`)
  return count
}

async function objectsUnder(bucket: string, uid: string): Promise<string[]> {
  const { data, error } = await admin.storage.from(bucket).list(uid)
  if (error) throw new Error(`list ${bucket}/${uid}: ${error.message}`)
  return (data ?? []).map((o) => o.name)
}

async function upload(bucket: string, path: string, contentType: string) {
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, new Blob([new Uint8Array([37, 80, 68, 70])], { type: contentType }), { contentType, upsert: true })
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`)
}

async function requestDeletion(userId: string, scheduledFor?: string): Promise<string> {
  const row = await must(
    'account_deletions insert',
    core()
      .from('account_deletions')
      .insert({
        deleted_user_id: userId,
        requested_by_user_id: userId,
        deletion_type: 'worker',
        status: 'pending',
        ...(scheduledFor ? { scheduled_for: scheduledFor } : {}),
      })
      .select('id')
      .single()
  )
  return (row as { id: string }).id
}

async function readRequest(id: string) {
  return (await must(
    'account_deletions read',
    core().from('account_deletions').select('*').eq('id', id).single()
  )) as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Fixture: a worker with something in every category the deletion touches.
// ---------------------------------------------------------------------------

interface Seed {
  subject: { id: string; email: string }
  other: { id: string; email: string }
  organizationId: string
  taskId: string
  jobId: string
  paymentId: string
  backgroundCheckId: string
  auditId: string
  requestId: string
}

async function seed(): Promise<Seed> {
  const subject = await createUser('subject')
  const other = await createUser('other')
  const uid = subject.id

  const job = (await must('job', core().from('jobs').select('id').limit(1).single())) as { id: string }

  await must('profile', core().from('profile').upsert({ user_id: uid, first_name: 'Deletion', last_name: `Test ${RUN}` }))
  const csi = (await must(
    'csi skill',
    core().from('user_skills').select('csi_skill_id').eq('skill_taxonomy', 'csi').limit(1).single()
  )) as { csi_skill_id: string }
  await must(
    'skill',
    core().from('user_skills').insert({ user_id: uid, skill_taxonomy: 'csi', csi_skill_id: csi.csi_skill_id })
  )

  const application = (await must(
    'application',
    core().from('applications').insert({ job_id: job.id, user_id: uid, status: 'new' }).select('id').single()
  )) as { id: string }
  await must(
    'message',
    core().from('application_messages').insert({ application_id: application.id, author_user_id: uid, body: 'hello' })
  )
  const notification = (await must(
    'notification',
    core().from('notifications').insert({ user_id: uid, title: 'test', message: 'test' }).select('id').single()
  )) as { id: string }
  await must(
    'archived notification',
    core()
      .from('archived_notifications')
      .insert({ notification_id: notification.id, user_id: uid, payload: { title: 'test' } })
  )

  // The subject acting on SOMEONE ELSE's inquiry: the audit row survives the
  // delete, so its NOT NULL actor_id met ON DELETE SET NULL (#1313).
  const otherApplication = (await must(
    'other application',
    core().from('applications').insert({ job_id: job.id, user_id: other.id, status: 'new' }).select('id').single()
  )) as { id: string }
  const inquiry = (await must(
    'inquiry',
    core().from('application_inquiries').insert({ application_id: otherApplication.id, created_by: other.id }).select('id').single()
  )) as { id: string }
  const audit = (await must(
    'audit',
    core()
      .from('inquiry_audit_log')
      .insert({ inquiry_id: inquiry.id, event_type: 'comment_added', actor_id: uid })
      .select('id')
      .single()
  )) as { id: string }

  const check = (await must(
    'background check',
    core().from('background_checks').insert({ user_id: uid }).select('id').single()
  )) as { id: string }
  const payment = (await must(
    'payment',
    core()
      .from('payment_transactions')
      .insert({
        user_id: uid,
        stripe_payment_intent_id: `pi_deletion_${RUN}`,
        amount_cents: 2_500,
        transaction_type: 'background_check',
        background_check_id: check.id,
      })
      .select('id')
      .single()
  )) as { id: string }

  await upload('avatars', `${uid}/avatar.png`, 'image/png')
  await upload('resumes', `${uid}/resume.pdf`, 'application/pdf')
  await upload('background-check-documents', `${uid}/report.pdf`, 'application/pdf')

  // The blocker: a task the subject created in an organization (RESTRICT).
  const org = (await must(
    'org',
    core()
      .from('organizations')
      .insert({ name: `deletion-${RUN}`, slug: `deletion-${RUN}` })
      .select('id')
      .single()
  )) as { id: string }
  const task = (await must(
    'task',
    core()
      .from('tasks')
      .insert({ organization_id: org.id, title: 'blocker', created_by_user_id: uid })
      .select('id')
      .single()
  )) as { id: string }

  const requestId = await requestDeletion(uid, PAST)

  return {
    subject,
    other,
    organizationId: org.id,
    taskId: task.id,
    jobId: job.id,
    paymentId: payment.id,
    backgroundCheckId: check.id,
    auditId: audit.id,
    requestId,
  }
}

let fixture: Seed | null = null

Deno.test({
  name: 'Account deletion - a blocked request fails cleanly and writes nothing',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    fixture = await seed()
    const { subject, requestId } = fixture

    const summary = await processDueDeletions(admin, { ids: [requestId], sendEmail: fakeEmail })
    assertEquals(summary.claimed, 1)
    assertEquals(summary.results[0].status, 'failed')
    assert(summary.results[0].error?.includes('core.tasks (1)'), summary.results[0].error)

    const request = await readRequest(requestId)
    assertEquals(request.status, 'failed')
    assertEquals(request.attempts, 1)
    assertEquals(request.payment_data_anonymized, false)
    const log = request.compliance_log as { steps: Record<string, unknown>; blocked_by?: unknown[] }
    assertEquals(Object.keys(log.steps), [], 'no step ran')
    assertEquals(log.blocked_by, [{ table: 'tasks', count: 1 }])

    // Nothing about the person changed.
    assert(await userExists(subject.id), 'the auth user is still there')
    assertEquals(await count('profile', 'user_id', subject.id), 1)
    assertEquals(await count('user_skills', 'user_id', subject.id), 1)
    assertEquals(await count('archived_notifications', 'user_id', subject.id), 1)
    assertEquals(await count('payment_transactions', 'user_id', subject.id), 1)
    assertEquals(await count('background_checks', 'user_id', subject.id), 1)
    assertEquals(await objectsUnder('avatars', subject.id), ['avatar.png'])
    assertEquals(await objectsUnder('resumes', subject.id), ['resume.pdf'])
    assertEquals(sent.length, 0, 'no email for a deletion that did not happen')
  },
})

Deno.test({
  name: 'Account deletion - once the blocker is gone the request completes',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    assertExists(fixture, 'runs after the blocked case')
    const { subject, requestId } = fixture

    await must('remove blocker', core().from('tasks').delete().eq('id', fixture.taskId))

    // A failed request is retried no sooner than 12 hours later (the daily
    // run), so the run above could not have claimed it twice. Let a day pass.
    await must(
      'a day passes',
      core()
        .from('account_deletions')
        .update({ last_attempt_at: new Date(Date.now() - 86_400_000).toISOString() })
        .eq('id', requestId)
    )
    const tooSoon = await readRequest(requestId)
    assertEquals(tooSoon.status, 'failed')

    const summary = await processDueDeletions(admin, { ids: [requestId], sendEmail: fakeEmail })
    assertEquals(summary.claimed, 1)
    assertEquals(summary.results[0], { id: requestId, status: 'completed' })

    // The account and everything that cascades from it.
    assertEquals(await userExists(subject.id), false, 'the auth user is gone')
    assertEquals(await count('users', 'id', subject.id), 0)
    assertEquals(await count('profile', 'user_id', subject.id), 0)
    assertEquals(await count('user_skills', 'user_id', subject.id), 0)
    assertEquals(await count('applications', 'user_id', subject.id), 0)
    assertEquals(await count('application_messages', 'author_user_id', subject.id), 0)
    assertEquals(await count('notifications', 'user_id', subject.id), 0)
    // No foreign key — removed by account_deletion_purge_unlinked.
    assertEquals(await count('archived_notifications', 'user_id', subject.id), 0)

    // Files: gone, except the retained background-check report.
    assertEquals(await objectsUnder('avatars', subject.id), [])
    assertEquals(await objectsUnder('resumes', subject.id), [])
    assertEquals(await objectsUnder('background-check-documents', subject.id), ['report.pdf'])

    // Kept, detached from the person.
    const payment = (await must(
      'payment',
      core().from('payment_transactions').select('user_id').eq('id', fixture.paymentId).single()
    )) as { user_id: string | null }
    assertEquals(payment.user_id, null)
    const check = (await must(
      'check',
      core().from('background_checks').select('user_id').eq('id', fixture.backgroundCheckId).single()
    )) as { user_id: string | null }
    assertEquals(check.user_id, null)
    const audit = (await must(
      'audit',
      core().from('inquiry_audit_log').select('actor_id').eq('id', fixture.auditId).single()
    )) as { actor_id: string | null }
    assertEquals(audit.actor_id, null, 'the audit row survives with no actor')

    // The request row is kept as the record, with no link to the person.
    const request = await readRequest(requestId)
    assertEquals(request.status, 'completed')
    assertExists(request.completed_at)
    assertEquals(request.deleted_user_id, null)
    assertEquals(request.requested_by_user_id, null)
    assertEquals(request.payment_data_anonymized, true)
    assertEquals(request.error_message, null)
    const logText = JSON.stringify(request.compliance_log)
    assertEquals(logText.includes(subject.email), false, 'the compliance log holds no email')
    assertEquals(logText.includes(subject.id), false, 'the compliance log holds no user id')
    const steps = (request.compliance_log as { steps: Record<string, Record<string, unknown>> }).steps
    for (const step of [
      'payment_data_detached',
      'unlinked_rows_purged',
      'storage_removed',
      'references_released',
      'auth_user_deleted',
      'confirmation_email',
    ]) {
      assertExists(steps[step], `step ${step} is recorded`)
    }
    assertEquals(steps.storage_removed.objects, { avatars: 1, resumes: 1 })

    // Confirmation went to the address read before the account was deleted.
    assertEquals(sent, [{ to: subject.email, subject: 'Your Scaffald account has been deleted' }])
  },
})

Deno.test({
  name: 'Account deletion - a second run is a no-op',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    assertExists(fixture)
    const before = await readRequest(fixture.requestId)
    const summary = await processDueDeletions(admin, { ids: [fixture.requestId], sendEmail: fakeEmail })
    assertEquals(summary.claimed, 0)
    const after = await readRequest(fixture.requestId)
    assertEquals(after.updated_at, before.updated_at)
    assertEquals(sent.length, 1, 'no second email')
  },
})

Deno.test({
  name: 'Account deletion - nothing happens before scheduled_for (14-day grace)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const user = await createUser('grace')
    try {
      // No scheduled_for: the insert trigger sets it from the grace period.
      const id = await requestDeletion(user.id)
      const request = await readRequest(id)
      const days =
        (Date.parse(request.scheduled_for as string) - Date.parse(request.requested_at as string)) / 86_400_000
      assertEquals(days, 14)

      const summary = await processDueDeletions(admin, { ids: [id], sendEmail: fakeEmail })
      assertEquals(summary.claimed, 0)
      assert(await userExists(user.id), 'not deleted during the grace period')
      assertEquals((await readRequest(id)).status, 'pending')

      await must('cleanup request', core().from('account_deletions').delete().eq('id', id))
    } finally {
      await admin.auth.admin.deleteUser(user.id)
    }
  },
})

Deno.test({
  name: 'Account deletion - a request cancelled during the grace period is never carried out',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const user = await createUser('cancel')
    try {
      const id = await requestDeletion(user.id)
      // What POST /v1/account-deletion/cancel writes (covered over HTTP in
      // account-deletion-rest.test.ts), then the date passes.
      await must(
        'cancel',
        core()
          .from('account_deletions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), scheduled_for: PAST })
          .eq('id', id)
      )

      const summary = await processDueDeletions(admin, { ids: [id], sendEmail: fakeEmail })
      assertEquals(summary.claimed, 0)
      assert(await userExists(user.id), 'a cancelled request deletes nothing')

      await must('cleanup request', core().from('account_deletions').delete().eq('id', id))
    } finally {
      await admin.auth.admin.deleteUser(user.id)
    }
  },
})

Deno.test({
  name: 'Account deletion - cleanup',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // By what this run created, not by the fixture, so a seed that failed
    // half-way is cleaned up too.
    await core().from('payment_transactions').delete().eq('stripe_payment_intent_id', `pi_deletion_${RUN}`)
    await core().from('organizations').delete().eq('slug', `deletion-${RUN}`)
    for (const id of createdUsers) {
      for (const bucket of ['avatars', 'resumes', 'background-check-documents']) {
        const names = await objectsUnder(bucket, id).catch(() => [] as string[])
        if (names.length) await admin.storage.from(bucket).remove(names.map((n) => `${id}/${n}`))
      }
      await core().from('background_checks').delete().eq('user_id', id)
      await core().from('account_deletions').delete().eq('deleted_user_id', id)
      // Takes the other application, its inquiry and the audit row with it.
      if (await userExists(id)) await admin.auth.admin.deleteUser(id)
    }
    if (fixture) {
      await core().from('background_checks').delete().eq('id', fixture.backgroundCheckId)
      await core().from('account_deletions').delete().eq('id', fixture.requestId)
    }
  },
})
