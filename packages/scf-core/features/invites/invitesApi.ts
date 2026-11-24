/**
 * The two /v1/invites calls the landing page and the claim need (#1395).
 *
 * Raw fetch rather than the SDK: the SDK has no invites resource yet (it
 * arrives with the in-app inviting work, #1398), and the claim runs before the
 * SDK providers matter. Same base URL and headers the SDK uses.
 */
import { getSupabaseAnonKey, getSupabaseApiBaseUrl } from '../../utils/supabase/api-base-url'

export interface InvitePreview {
  kind: 'link' | 'targeted'
  inviter: { firstName: string; avatarUrl: string | null }
}

export type ClaimResult =
  | { claimed: true; referrer: { firstName: string } }
  | { claimed: false; reason: string }

/** Thrown for a failure worth retrying later (network, 5xx); a 4xx is an answer. */
export class InviteRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message)
    this.name = 'InviteRequestError'
  }
}

function headers(token?: string): Record<string, string> {
  const anonKey = getSupabaseAnonKey()
  return {
    'Content-Type': 'application/json',
    ...(anonKey ? { apikey: anonKey } : {}),
    ...(token || anonKey ? { Authorization: `Bearer ${token ?? anonKey}` } : {}),
  }
}

/** The public preview: inviter first name and avatar, or null when the code is unknown or expired. */
export async function fetchInvitePreview(
  code: string,
  fetchImpl: typeof fetch = fetch
): Promise<InvitePreview | null> {
  const res = await fetchImpl(
    `${getSupabaseApiBaseUrl()}/v1/invites/${encodeURIComponent(code)}/preview`,
    { headers: headers() }
  )
  if (res.status === 404) return null
  if (!res.ok) throw new InviteRequestError(`preview failed (${res.status})`, res.status >= 500)
  return (await res.json()) as InvitePreview
}

/**
 * Attributes the signed-in user to an invite. With no code, the server looks
 * for an email invite sent to the user's own address.
 */
export async function claimInvite(
  token: string,
  opts: { code?: string; landedAt?: string } = {},
  fetchImpl: typeof fetch = fetch
): Promise<ClaimResult> {
  let res: Response
  try {
    res = await fetchImpl(`${getSupabaseApiBaseUrl()}/v1/invites/claim`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        ...(opts.code ? { code: opts.code } : {}),
        ...(opts.landedAt ? { landedAt: opts.landedAt } : {}),
      }),
    })
  } catch (e) {
    throw new InviteRequestError(`claim failed: ${(e as Error).message}`, true)
  }
  if (res.status === 404) return { claimed: false, reason: 'invalid_code' }
  if (!res.ok)
    throw new InviteRequestError(
      `claim failed (${res.status})`,
      res.status >= 500 || res.status === 401
    )
  return (await res.json()) as ClaimResult
}
