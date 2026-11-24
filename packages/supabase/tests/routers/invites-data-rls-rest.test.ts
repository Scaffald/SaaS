/**
 * Migration 396 (#1392): worker invites, referral attribution and newsletter
 * double opt-in, checked straight through PostgREST against the local DB.
 *
 * The point of most of these is what a signed-in user can NOT do: 221 let any
 * user insert invitations as themselves and update any row they were party
 * to, so a referral could be faked without the api function. After 396 the
 * api function (service role) is the only writer.
 *
 *   cd packages/supabase
 *   deno test --allow-all --no-check --config tests/deno.json tests/routers/invites-data-rls-rest.test.ts
 */

import { assert, assertEquals } from '../shared/assert.ts'
import { type Persona, disposePersonas, getPersonas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'

function rest(persona: Persona, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('apikey', TEST_SUPABASE_ANON_KEY)
  headers.set('Authorization', `Bearer ${persona.token}`)
  headers.set(init.method && init.method !== 'GET' ? 'Content-Profile' : 'Accept-Profile', 'core')
  if (init.body) headers.set('Content-Type', 'application/json')
  return fetch(`${TEST_SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
}

async function rows(persona: Persona, path: string): Promise<{ status: number; data: unknown[] }> {
  const res = await rest(persona, path)
  const body = await res.text()
  return { status: res.status, data: res.ok ? JSON.parse(body) : [] }
}

const denied = (status: number) => status === 401 || status === 403

Deno.test({
  name: 'invites data (#1392) - codes, write lockdown, read scoping, constraints',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const personas = await getPersonas()
    const { userA, userB, anon } = personas
    const admin = createAdminClient().schema('core')
    const invitationIds: string[] = []
    try {
      // --- referral codes -------------------------------------------------------
      const { data: users, error: usersError } = await admin
        .from('users')
        .select('id, referral_code')
        .in('id', [userA.id, userB.id])
      assertEquals(usersError, null)
      assertEquals(users?.length, 2, 'both fresh users have a core.users row')
      for (const u of users!) assert(/^[a-hjkmnp-z2-9]{8}$/.test(u.referral_code), `code format: ${u.referral_code}`)
      assert(users![0].referral_code !== users![1].referral_code, 'codes differ')
      const codeA = users!.find((u) => u.id === userA.id)!.referral_code

      const rename = await rest(userA, `users?id=eq.${userA.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ referral_code: 'clay' }),
        headers: { Prefer: 'return=minimal' },
      })
      assert(!rename.ok, `a user must not rename their own code (got ${rename.status})`)
      const { data: after } = await admin.from('users').select('referral_code').eq('id', userA.id).single()
      assertEquals(after?.referral_code, codeA)

      // --- invitations: only the api function writes --------------------------
      const insert = await rest(userA, 'generic_invitations', {
        method: 'POST',
        body: JSON.stringify({ inviter_id: userA.id, invitee_email: 'friend@example.test' }),
      })
      assert(denied(insert.status), `user insert should be denied, got ${insert.status}`)

      const { data: seeded, error: seedError } = await admin
        .from('generic_invitations')
        .insert([
          { inviter_id: userA.id, invitee_email: 'a-friend@example.test', kind: 'targeted', channel: 'email', source: 'test' },
          { inviter_id: userB.id, invitee_phone: '+15555550123', kind: 'targeted', channel: 'sms_self', source: 'test' },
        ])
        .select('id, inviter_id')
      assertEquals(seedError, null)
      invitationIds.push(...seeded!.map((r) => r.id))
      const inviteA = seeded!.find((r) => r.inviter_id === userA.id)!.id
      const inviteB = seeded!.find((r) => r.inviter_id === userB.id)!.id

      const accept = await rest(userA, `generic_invitations?id=eq.${inviteA}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
        headers: { Prefer: 'return=minimal' },
      })
      assert(denied(accept.status), `inviter update should be denied, got ${accept.status}`)
      const { data: stillPending } = await admin.from('generic_invitations').select('status').eq('id', inviteA).single()
      assertEquals(stillPending?.status, 'pending')

      // --- invitations: reads -------------------------------------------------
      assertEquals((await rows(userA, `generic_invitations?id=eq.${inviteA}`)).data.length, 1, 'inviter reads own')
      assertEquals((await rows(userA, `generic_invitations?id=eq.${inviteB}`)).data.length, 0, "not another's")
      assertEquals((await rows(userB, `generic_invitations?id=eq.${inviteA}`)).data.length, 0, 'unclaimed invitee sees nothing')
      assert(denied((await rows(anon, 'generic_invitations?limit=1')).status), 'anon denied')

      await admin.from('generic_invitations').update({ invitee_user_id: userB.id }).eq('id', inviteA)
      assertEquals((await rows(userB, `generic_invitations?id=eq.${inviteA}`)).data.length, 1, 'claimed invitee reads it')

      // --- invitations: constraints -------------------------------------------
      const noContact = await admin.from('generic_invitations').insert({ inviter_id: userA.id, kind: 'targeted' })
      assert(noContact.error, 'a targeted invite needs an email or a phone')
      const badPhone = await admin.from('generic_invitations').insert({ inviter_id: userA.id, invitee_phone: '555-0123' })
      assert(badPhone.error, 'phones are E.164')
      const badChannel = await admin
        .from('generic_invitations')
        .insert({ inviter_id: userA.id, invitee_email: 'x@example.test', channel: 'twilio' })
      assert(badChannel.error, 'channel is one of the known values')
      const link = await admin
        .from('generic_invitations')
        .insert({ inviter_id: userA.id, kind: 'link', channel: 'share' })
        .select('id')
        .single()
      assertEquals(link.error, null, 'a link invite needs no contact')
      invitationIds.push(link.data!.id)

      // --- referral_attributions ---------------------------------------------
      const selfRef = await admin
        .from('referral_attributions')
        .insert({ user_id: userA.id, referrer_id: userA.id, referral_code: codeA })
      assert(selfRef.error, 'nobody refers themselves')
      const attr = await admin
        .from('referral_attributions')
        .insert({ user_id: userB.id, referrer_id: userA.id, invitation_id: inviteA, referral_code: codeA })
      assertEquals(attr.error, null)

      assertEquals((await rows(userA, `referral_attributions?user_id=eq.${userB.id}`)).data.length, 1, 'referrer reads it')
      assertEquals((await rows(userB, `referral_attributions?user_id=eq.${userB.id}`)).data.length, 1, 'referred user reads it')
      assert(denied((await rows(anon, 'referral_attributions?limit=1')).status), 'anon denied')
      const forge = await rest(userB, 'referral_attributions', {
        method: 'POST',
        body: JSON.stringify({ user_id: userB.id, referrer_id: userA.id, referral_code: codeA }),
      })
      assert(denied(forge.status), `users cannot write attributions, got ${forge.status}`)

      // --- newsletter_signups -------------------------------------------------
      const email = `nl-${crypto.randomUUID().slice(0, 8)}@example.test`
      const upper = await admin.from('newsletter_signups').insert({ email: email.toUpperCase() })
      assert(upper.error, 'emails are stored normalised')
      const signup = await admin.from('newsletter_signups').insert({ email, source: 'test' }).select('confirm_token, status').single()
      assertEquals(signup.error, null)
      assert(/^[0-9a-f]{64}$/.test(signup.data!.confirm_token), 'a 64-hex confirm token by default')
      assertEquals(signup.data!.status, 'pending')
      assert(denied((await rows(userA, 'newsletter_signups?limit=1')).status), 'users denied')
      assert(denied((await rows(anon, 'newsletter_signups?limit=1')).status), 'anon denied')
      await admin.from('newsletter_signups').delete().eq('email', email)
    } finally {
      await admin.from('referral_attributions').delete().in('user_id', [userA.id, userB.id])
      if (invitationIds.length) await admin.from('generic_invitations').delete().in('id', invitationIds)
      await disposePersonas()
    }
  },
})
