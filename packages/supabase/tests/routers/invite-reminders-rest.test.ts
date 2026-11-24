/// <reference lib="deno.ns" />

/**
 * #1397: the one reminder per email invite, and "your friend joined" /
 * "set up their profile" notifications for the inviter.
 *
 * Reminders: _shared/invites/reminders.ts driven directly against the local
 * database, with NevarMail replaced by a recording fake (a third-party
 * service from here). Notifications: through the real api — POST
 * /v1/invites/claim and POST /v1/prerequisites/complete.
 *
 *   cd packages/supabase
 *   deno test --allow-all --no-check --config tests/deno.json tests/routers/invite-reminders-rest.test.ts
 * (BGC_TEST_API_BASE=http://127.0.0.1:8000/v1 to run the api standalone.)
 */
import { assert, assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { disposePersonas, getPersonas } from '../shared/personas.ts'
import { createAdminClient, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL } from '../shared/setup.ts'
import { processDueReminders } from '../../functions/_shared/invites/reminders.ts'
import { NevarMailError } from '../../functions/_shared/nevarmail.ts'

const REST_BASE = Deno.env.get('BGC_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const DAY = 86_400_000
const rand = () => crypto.randomUUID().slice(0, 8)
const code = () => `r${rand()}${rand()}`.slice(0, 12)

async function call(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(`${REST_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, text }
}

function fakeMail(refuse: Record<string, string> = {}) {
  const sent: Array<{ to: string; subject?: string; emailType?: string; text?: string }> = []
  const client = {
    send: async (input: { to: string; subject?: string; emailType?: string; text?: string }) => {
      const code = refuse[input.to]
      if (code) throw new NevarMailError(`refused: ${code}`, code === 'DAILY_RAMP_CAP' ? 429 : 422, code)
      sent.push(input)
      return { id: `em_${rand()}`, messageId: null, status: 'sent', provider: 'fake', sentAt: null }
    },
  }
  // deno-lint-ignore no-explicit-any
  return { sent, mail: { client: client as any, useCaseId: 'uc-test' } }
}

Deno.test({
  name: 'invite reminders (#1397) - one per due email invite, never twice, never phones or joined people',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const personas = await getPersonas()
    const { userA, userB } = personas
    const emailB = (userB as unknown as { email: string }).email.toLowerCase()
    const admin = createAdminClient()
    const db = admin.schema('core')
    const now = new Date()
    const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString()
    const ahead = new Date(now.getTime() + 20 * DAY).toISOString()
    await db.from('users').update({ display_name: 'Riley Inviter' }).eq('id', userA.id)

    const base = { inviter_id: userA.id, kind: 'targeted', status: 'pending', source: 'test', expires_at: ahead }
    const rows = {
      due: { ...base, channel: 'email', invitee_email: `due-${rand()}@example.test`, invitee_name: 'Sam Due', referral_code: code(), email_sent_at: ago(6), personal_message: 'Come work with us' },
      tooNew: { ...base, channel: 'email', invitee_email: `new-${rand()}@example.test`, referral_code: code(), email_sent_at: ago(2) },
      reminded: { ...base, channel: 'email', invitee_email: `rem-${rand()}@example.test`, referral_code: code(), email_sent_at: ago(9), reminder_sent_at: ago(4) },
      accepted: { ...base, channel: 'email', status: 'accepted', invitee_email: `acc-${rand()}@example.test`, referral_code: code(), email_sent_at: ago(9) },
      expired: { ...base, channel: 'email', invitee_email: `exp-${rand()}@example.test`, referral_code: code(), email_sent_at: ago(9), expires_at: ago(1) },
      phone: { ...base, channel: 'sms_self', invitee_phone: '+15550104499', referral_code: code() },
      member: { ...base, channel: 'email', invitee_email: emailB, referral_code: code(), email_sent_at: ago(7) },
      suppressed: { ...base, channel: 'email', invitee_email: `sup-${rand()}@example.test`, referral_code: code(), email_sent_at: ago(8) },
    }
    const ids: Record<string, string> = {}
    try {
      for (const [k, row] of Object.entries(rows)) {
        const { data, error } = await db.from('generic_invitations').insert(row).select('id').single()
        assertEquals(error, null, `${k}: ${error?.message}`)
        ids[k] = data?.id
      }

      // No email configured: nothing sent, nothing stamped.
      const off = await processDueReminders(admin, null, { now, baseUrl: 'https://scaffald.test' })
      assert(off.deferred >= 3 && off.sent === 0, JSON.stringify(off))
      const { data: unstamped } = await db.from('generic_invitations').select('reminder_sent_at').eq('id', ids.due).single()
      assertEquals(unstamped?.reminder_sent_at, null)

      const { sent, mail } = fakeMail({ [rows.suppressed.invitee_email]: 'RECIPIENT_SUPPRESSED' })
      const first = await processDueReminders(admin, mail, { now, baseUrl: 'https://scaffald.test' })
      const ours = sent.filter((s) => Object.values(rows).some((r) => 'invitee_email' in r && r.invitee_email === s.to))
      assertEquals(ours.map((s) => s.to), [rows.due.invitee_email], 'only the due invite is reminded')
      assertEquals(ours[0].emailType, 'marketing')
      assertEquals(ours[0].subject, 'Reminder: Riley Inviter invited you to Scaffald')
      assert(ours[0].text?.startsWith('Hi Sam,'), ours[0].text)
      assert(ours[0].text?.includes('Come work with us'))
      assert(ours[0].text?.includes(`https://scaffald.test/i/${rows.due.referral_code}`))
      assert(first.sent >= 1 && first.closed >= 2, JSON.stringify(first))

      const { data: after } = await db.from('generic_invitations').select('id, reminder_sent_at').in('id', Object.values(ids))
      const stamped = new Set((after ?? []).filter((r) => r.reminder_sent_at).map((r) => r.id))
      assert(stamped.has(ids.due), 'sent → stamped')
      assert(stamped.has(ids.member), 'joined meanwhile → stamped, not sent')
      assert(stamped.has(ids.suppressed), 'suppressed → stamped, not retried')
      for (const k of ['tooNew', 'accepted', 'expired', 'phone']) assert(!stamped.has(ids[k]), `${k} untouched`)

      const second = fakeMail()
      await processDueReminders(admin, second.mail, { now, baseUrl: 'https://scaffald.test' })
      assertEquals(second.sent.filter((s) => s.to === rows.due.invitee_email).length, 0, 'never twice')

      // A later day, the "too new" one is due; the daily cap defers it without stamping.
      const later = new Date(now.getTime() + 4 * DAY)
      const capped = fakeMail({ [rows.tooNew.invitee_email]: 'DAILY_RAMP_CAP' })
      const capRun = await processDueReminders(admin, capped.mail, { now: later, baseUrl: 'https://scaffald.test' })
      assertEquals(capRun.stoppedBy, 'send_limit')
      const { data: deferred } = await db.from('generic_invitations').select('reminder_sent_at').eq('id', ids.tooNew).single()
      assertEquals(deferred?.reminder_sent_at, null, 'a capped send is retried tomorrow')
    } finally {
      await db.from('generic_invitations').delete().eq('inviter_id', userA.id)
      await disposePersonas()
    }
  },
})

Deno.test({
  name: 'referral notifications (#1397) - the inviter hears when a friend joins and when they finish onboarding',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const personas = await getPersonas()
    const { userA, userB } = personas
    const admin = createAdminClient()
    const db = admin.schema('core')
    try {
      await db.from('users').update({ display_name: 'Riley Inviter' }).eq('id', userA.id)
      const inviteCode = code()
      const { error } = await db.from('generic_invitations').insert({
        inviter_id: userA.id,
        kind: 'targeted',
        channel: 'sms_self',
        status: 'pending',
        source: 'test',
        invitee_phone: '+15550104498',
        invitee_name: 'Jo Friend',
        referral_code: inviteCode,
        expires_at: new Date(Date.now() + 20 * DAY).toISOString(),
      })
      assertEquals(error, null)

      const claim = await call('POST', '/invites/claim', userB.token, { code: inviteCode })
      assertEquals(claim.body?.claimed, true, claim.text)

      const joined = await db.from('notifications').select('type, title, cta_url, metadata')
        .eq('user_id', userA.id).eq('type', 'referral.joined')
      assertEquals(joined.data?.length, 1, JSON.stringify(joined))
      assertEquals(joined.data?.[0].title, 'Jo joined Scaffald')
      assertEquals(joined.data?.[0].cta_url, '/dashboard/invite')

      const { data: industry } = await db.from('industries').select('id').limit(1).single()
      const complete = await call('POST', '/prerequisites/complete', userB.token, {
        first_name: 'Jo',
        last_name: 'Friend',
        address: { street: '1 Main St', city: 'Lake', state: 'MI', zip: '48632', country: 'US' },
        user_types: ['worker'],
        industry_id: industry?.id,
        accepts_privacy_policy: true,
        accepts_terms_of_service: true,
      })
      assertEquals(complete.status, 200, complete.text)

      const { data: attribution } = await db.from('referral_attributions').select('onboarded_at').eq('user_id', userB.id).single()
      assert(attribution?.onboarded_at, 'onboarded_at stamped')
      const onboarded = await db.from('notifications').select('title').eq('user_id', userA.id).eq('type', 'referral.onboarded')
      assertEquals(onboarded.data?.length, 1, JSON.stringify(onboarded))
      assert(onboarded.data?.[0].title.endsWith('set up their profile'), onboarded.data?.[0].title)

      // Completing again changes nothing and notifies nobody twice.
      await call('POST', '/prerequisites/complete', userB.token, {
        first_name: 'Jo',
        last_name: 'Friend',
        address: { street: '1 Main St', city: 'Lake', state: 'MI', zip: '48632', country: 'US' },
        user_types: ['worker'],
        industry_id: industry?.id,
        accepts_privacy_policy: true,
        accepts_terms_of_service: true,
      })
      const again = await db.from('notifications').select('id').eq('user_id', userA.id).eq('type', 'referral.onboarded')
      assertEquals(again.data?.length, 1)

      // Onboarding without any invite behind it is untouched.
      const own = await call('POST', '/prerequisites/complete', userA.token, {
        first_name: 'Riley',
        last_name: 'Inviter',
        address: { street: '1 Main St', city: 'Lake', state: 'MI', zip: '48632', country: 'US' },
        user_types: ['worker'],
        industry_id: industry?.id,
        accepts_privacy_policy: true,
        accepts_terms_of_service: true,
      })
      assertEquals(own.status, 200, own.text)
    } finally {
      await db.from('notifications').delete().eq('user_id', userA.id).in('type', ['referral.joined', 'referral.onboarded'])
      await db.from('referral_attributions').delete().in('user_id', [userA.id, userB.id])
      await db.from('generic_invitations').delete().eq('inviter_id', userA.id)
      await disposePersonas()
    }
  },
})
