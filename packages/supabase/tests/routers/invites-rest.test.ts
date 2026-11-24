/// <reference lib="deno.ns" />

/**
 * /v1/invites (#1393): real api function, real local database.
 *
 * Email sending depends on NevarMail being configured for the api function:
 *   - CI's stack has no NEVARMAIL_* secrets, so email contacts come back
 *     `failed: email_not_configured` and nothing is stored for them.
 *   - Locally, run the api function standalone with NEVARMAIL_BASE_URL pointed
 *     at a stub (any address containing "suppressed" answers
 *     RECIPIENT_SUPPRESSED) and set INVITES_TEST_NEVARMAIL=1 here to assert
 *     the sent path instead:
 *
 *       BGC_TEST_API_BASE=http://127.0.0.1:8000/v1 INVITES_TEST_NEVARMAIL=1 \
 *         deno test --allow-all --no-check --config tests/deno.json tests/routers/invites-rest.test.ts
 *
 * The NevarMail webhook's invite mapping (webhooks/email/nevarmail-events.ts)
 * is exercised directly against the database at the end.
 */
import { assert, assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { disposePersonas, getPersonas } from '../shared/personas.ts'
import { createAdminClient, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL } from '../shared/setup.ts'
import { applyInviteEvent } from '../../functions/webhooks/email/nevarmail-events.ts'

const REST_BASE = Deno.env.get('BGC_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const NEVARMAIL = Deno.env.get('INVITES_TEST_NEVARMAIL') === '1'

// deno-lint-ignore no-explicit-any
type Json = any

async function call(method: string, path: string, token: string | null, body?: unknown) {
  const res = await fetch(`${REST_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token ?? TEST_SUPABASE_ANON_KEY}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: Json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { status: res.status, body: json, text }
}

const rand = () => crypto.randomUUID().slice(0, 8)
const randomPhone = () => `(555) 01${Math.floor(Math.random() * 10)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
const codeOf = (link: string) => link.split('/i/')[1]

Deno.test({
  name: 'invites REST (#1393) - send, skip rules, list, link, preview, claim, limits, webhook mapping',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const personas = await getPersonas()
    const { userA, userB, office } = personas
    const emailA = (userA as unknown as { email: string }).email
    const emailB = (userB as unknown as { email: string }).email
    const admin = createAdminClient().schema('core')
    try {
      // --- auth and validation ------------------------------------------------
      assertEquals((await call('POST', '/invites', null, { contacts: [{ phone: '5555550100' }] })).status, 401)
      assertEquals((await call('POST', '/invites', userA.token, { contacts: [] })).status, 400)
      assertEquals(
        (await call('POST', '/invites', userA.token, { contacts: [{ phone: '5555550100' }], source: 'admin' })).status,
        400,
        'unknown source',
      )

      // --- one request, every outcome ----------------------------------------
      const phone = randomPhone()
      const fresh = `invitee-${rand()}@example.test`
      const suppressed = `suppressed-${rand()}@example.test`
      const sent = await call('POST', '/invites', userA.token, {
        contacts: [
          { name: 'Sam', phone },
          { email: emailB.toUpperCase() },
          { email: emailA },
          { name: 'nobody' },
          { name: 'Pat', email: fresh },
          { email: suppressed },
        ],
        message: 'Come work with us',
        source: 'app',
      })
      assertEquals(sent.status, 200, sent.text)
      const r = sent.body.results
      assertEquals(r.map((x: Json) => x.index), [0, 1, 2, 3, 4, 5])

      assertEquals(r[0].status, 'ready')
      assert(r[0].phone.startsWith('+1555'), r[0].phone)
      assert(r[0].smsUrl.startsWith(`sms:${r[0].phone}?&body=`), r[0].smsUrl)
      assert(r[0].shareText.includes('Come work with us'))
      const phoneCode = codeOf(r[0].link)
      assert(/^[a-z0-9]{12}$/.test(phoneCode), r[0].link)

      assertEquals(r[1], { index: 1, status: 'skipped', reason: 'member' })
      assertEquals(r[2], { index: 2, status: 'skipped', reason: 'self' })
      assertEquals(r[3], { index: 3, status: 'skipped', reason: 'invalid' })

      if (NEVARMAIL) {
        assertEquals(r[4].status, 'sent')
        assertEquals(r[5], { index: 5, status: 'skipped', reason: 'suppressed' })
        const { data: row } = await admin.from('generic_invitations')
          .select('channel, nevarmail_email_id, email_sent_at').eq('id', r[4].invitationId).single()
        assertEquals(row?.channel, 'email')
        assert(row?.nevarmail_email_id, 'the NevarMail id is stored for webhooks')
        assert(row?.email_sent_at)
      } else {
        assertEquals(r[4], { index: 4, status: 'failed', reason: 'email_not_configured' })
        assertEquals(r[5], { index: 5, status: 'failed', reason: 'email_not_configured' })
      }
      const { count: unsent } = await admin.from('generic_invitations')
        .select('id', { count: 'exact', head: true }).eq('invitee_email', suppressed)
      assertEquals(unsent, 0, 'nothing is stored for an email that was not sent')

      // --- re-inviting ---------------------------------------------------------
      const again = await call('POST', '/invites', userA.token, { contacts: [{ phone }] })
      assertEquals(again.body.results[0], { index: 0, status: 'skipped', reason: 'recently_invited' })
      // Another inviter is not blocked by A's invite.
      const byB = await call('POST', '/invites', userB.token, { contacts: [{ phone }] })
      assertEquals(byB.body.results[0].status, 'ready')

      // --- list and link -------------------------------------------------------
      const listA = await call('GET', '/invites', userA.token)
      assertEquals(listA.status, 200)
      assert(listA.body.invites.some((i: Json) => i.id === r[0].invitationId))
      assert(!listA.body.invites.some((i: Json) => i.id === byB.body.results[0].invitationId), "not B's")
      assert(listA.body.counts.invited >= 1)

      const link = await call('GET', '/invites/link', userA.token)
      assertEquals(link.status, 200)
      const { data: userRowA } = await admin.from('users').select('referral_code').eq('id', userA.id).single()
      assertEquals(link.body.code, userRowA!.referral_code)
      assert(link.body.link.endsWith(`/i/${userRowA!.referral_code}`))
      assertEquals((await call('GET', '/invites/link', null)).status, 401)

      // --- preview (public) ----------------------------------------------------
      const personal = await call('GET', `/invites/${link.body.code}/preview`, null)
      assertEquals(personal.status, 200, personal.text)
      assertEquals(personal.body.kind, 'link')
      assert(typeof personal.body.inviter.firstName === 'string')
      const targeted = await call('GET', `/invites/${phoneCode}/preview`, null)
      assertEquals(targeted.body.kind, 'targeted')
      assert(!targeted.text.includes(r[0].phone.slice(2)), 'the preview never shows the invitee')
      assertEquals(Object.keys(targeted.body.inviter).sort(), ['avatarUrl', 'firstName'])
      assertEquals((await call('GET', '/invites/nosuchcode234/preview', null)).status, 404)
      assertEquals((await call('GET', '/invites/..%2F..%2Fx/preview', null)).status, 404)

      // --- claim -----------------------------------------------------------------
      assertEquals((await call('POST', '/invites/claim', userA.token, { code: link.body.code })).body, {
        claimed: false,
        reason: 'self',
      })
      const oldMember = await call('POST', '/invites/claim', office.token, { code: link.body.code })
      assertEquals(oldMember.body, { claimed: false, reason: 'not_new' }, 'existing members do not credit anyone')

      const claim = await call('POST', '/invites/claim', userB.token, { code: phoneCode.toUpperCase() })
      assertEquals(claim.status, 200, claim.text)
      assertEquals(claim.body.claimed, true)
      const { data: accepted } = await admin.from('generic_invitations')
        .select('status, invitee_user_id, accepted_at').eq('id', r[0].invitationId).single()
      assertEquals(accepted?.status, 'accepted')
      assertEquals(accepted?.invitee_user_id, userB.id)
      const { data: attribution } = await admin.from('referral_attributions')
        .select('referrer_id, invitation_id').eq('user_id', userB.id).single()
      assertEquals(attribution, { referrer_id: userA.id, invitation_id: r[0].invitationId })
      assertEquals((await call('POST', '/invites/claim', userB.token, { code: phoneCode })).body, {
        claimed: false,
        reason: 'already_attributed',
      })
      // An already-attributed user is answered before the code is looked at; an
      // unknown code is 404 for someone without an attribution.
      assertEquals((await call('POST', '/invites/claim', userB.token, { code: 'nosuchcode234' })).body.reason, 'already_attributed')
      assertEquals((await call('POST', '/invites/claim', office.token, { code: 'nosuchcode234' })).status, 404)

      const listAfter = await call('GET', '/invites', userA.token)
      assertEquals(listAfter.body.invites.find((i: Json) => i.id === r[0].invitationId).status, 'joined')
      assertEquals(listAfter.body.counts.joined, 1)

      // --- daily limit -----------------------------------------------------------
      const { count: soFar } = await admin.from('generic_invitations')
        .select('id', { count: 'exact', head: true }).eq('inviter_id', userA.id)
      const filler = Array.from({ length: 200 - (soFar ?? 0) }, () => ({
        inviter_id: userA.id,
        kind: 'link',
        channel: 'share',
        source: 'test',
      }))
      const { error: fillError } = await admin.from('generic_invitations').insert(filler)
      assertEquals(fillError, null)
      const capped = await call('POST', '/invites', userA.token, { contacts: [{ phone: randomPhone() }] })
      assertEquals(capped.body.results[0], { index: 0, status: 'skipped', reason: 'daily_limit' })

      // --- NevarMail webhook → invite tracking ----------------------------------
      const emailId = `em_${rand()}`
      const { data: tracked } = await admin.from('generic_invitations').insert({
        inviter_id: userB.id,
        invitee_email: `tracked-${rand()}@example.test`,
        channel: 'email',
        source: 'test',
        nevarmail_email_id: emailId,
      }).select('id').single()
      const base = { project_id: 'p', campaign_send_id: null, recipient: 'x', send_mode: 'live' }
      const service = createAdminClient()

      const clicked = await applyInviteEvent(service, {
        ...base,
        type: 'email.clicked',
        email_id: emailId,
        occurred_at: '2026-11-23T10:00:00.000Z',
      })
      assertEquals(clicked, { matched: true, invitationId: tracked!.id, changed: ['email_clicked_at', 'email_opened_at'] })
      const opened = await applyInviteEvent(service, {
        ...base,
        type: 'email.opened',
        email_id: emailId,
        occurred_at: '2026-11-23T11:00:00.000Z',
      })
      assertEquals(opened.matched && opened.changed, [], 'the first open time is kept')
      await applyInviteEvent(service, {
        ...base,
        type: 'email.bounced',
        email_id: emailId,
        occurred_at: '2026-11-23T12:00:00.000Z',
        reason: '5.1.1',
      })
      const { data: afterEvents } = await admin.from('generic_invitations')
        .select('status, email_opened_at, email_clicked_at, metadata').eq('id', tracked!.id).single()
      assertEquals(new Date(afterEvents!.email_opened_at).toISOString(), '2026-11-23T10:00:00.000Z')
      assertEquals(new Date(afterEvents!.email_clicked_at).toISOString(), '2026-11-23T10:00:00.000Z')
      assertEquals(afterEvents!.metadata.delivery_failure.reason, '5.1.1')
      assertEquals(afterEvents!.status, 'pending', 'a bounce leaves the invite usable another way')
      assertEquals(
        await applyInviteEvent(service, { ...base, type: 'email.opened', email_id: 'em_unknown', occurred_at: '' }),
        { matched: false },
      )
    } finally {
      await admin.from('referral_attributions').delete().in('user_id', [userA.id, userB.id])
      await admin.from('generic_invitations').delete().in('inviter_id', [userA.id, userB.id])
      await disposePersonas()
    }
  },
})
