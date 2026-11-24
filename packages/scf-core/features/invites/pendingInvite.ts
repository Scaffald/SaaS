/**
 * The invite code a visitor arrived with (#1395), kept until their first
 * signed-in session can claim it.
 *
 * Why storage and not the magic link: the sign-in email links to
 * `{{ .SiteURL }}/auth/confirm` (email-templates/magic_link.html), which
 * always lands on Home, so nothing in the URL survives the round trip. The
 * code waits here instead: localStorage on web (survives the email opening a
 * new tab), AsyncStorage on native. An email invite opened on ANOTHER device
 * is covered server-side: a claim with no code matches an invite sent to the
 * user's own address.
 *
 * Key names avoid "auth", "session", "supabase" and "sb-": clearAllAuthStorage
 * deletes every key containing those, and this must survive a sign-out that
 * happens before sign-up.
 */
import { kvStorage } from '../../utils/platform'

const PENDING_KEY = 'scaffald.pending-invite'
const INVITED_BY_KEY = 'scaffald.invited-by'
const CHECKED_PREFIX = 'scaffald.invite-checked.'

/** A pending code is worth claiming for this long (targeted invites expire at 30 days). */
export const PENDING_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface PendingInvite {
  code: string
  landedAt: string
}

const CODE_RE = /^[a-z0-9]{6,32}$/

export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toLowerCase()
  return code && CODE_RE.test(code) ? code : null
}

export async function storePendingInvite(rawCode: string, now = new Date()): Promise<boolean> {
  const code = normalizeInviteCode(rawCode)
  if (!code) return false
  const value: PendingInvite = { code, landedAt: now.toISOString() }
  await kvStorage.set(PENDING_KEY, JSON.stringify(value))
  return true
}

export async function readPendingInvite(now = new Date()): Promise<PendingInvite | null> {
  const raw = await kvStorage.get(PENDING_KEY)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<PendingInvite>
    const code = normalizeInviteCode(value.code)
    const landed = value.landedAt ? Date.parse(value.landedAt) : Number.NaN
    if (!code || Number.isNaN(landed) || now.getTime() - landed > PENDING_INVITE_TTL_MS) {
      await kvStorage.remove(PENDING_KEY)
      return null
    }
    return { code, landedAt: new Date(landed).toISOString() }
  } catch {
    await kvStorage.remove(PENDING_KEY)
    return null
  }
}

export function clearPendingInvite(): Promise<void> {
  return kvStorage.remove(PENDING_KEY)
}

/** Who invited this user, once a claim succeeds; onboarding greets with it. */
export async function storeInvitedBy(firstName: string): Promise<void> {
  await kvStorage.set(INVITED_BY_KEY, JSON.stringify({ firstName: firstName.slice(0, 60) }))
}

export async function readInvitedBy(): Promise<string | null> {
  const raw = await kvStorage.get(INVITED_BY_KEY)
  if (!raw) return null
  try {
    const name = (JSON.parse(raw) as { firstName?: unknown }).firstName
    return typeof name === 'string' && name.trim() ? name.trim() : null
  } catch {
    return null
  }
}

export function clearInvitedBy(): Promise<void> {
  return kvStorage.remove(INVITED_BY_KEY)
}

/** Whether this device already asked the server about this user's invites. */
export async function wasInviteChecked(userId: string): Promise<boolean> {
  return (await kvStorage.get(CHECKED_PREFIX + userId)) === '1'
}

export function markInviteChecked(userId: string): Promise<void> {
  return kvStorage.set(CHECKED_PREFIX + userId, '1')
}
