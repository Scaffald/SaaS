/**
 * Server-only data access for the public, crawlable routes.
 *
 * Imported from route `loader`/`generateMetadata` exports, which Metro strips
 * out of the client bundle — keep client-side code out of this file.
 *
 * Requests go straight to the REST API with the anon key (the same
 * unauthenticated path `ScaffaldProviderFromSession` falls back to) rather than
 * through the SDK, so this stays dependency-free and runs on any server runtime.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const SITE_ORIGIN = process.env.EXPO_PUBLIC_URL || 'https://scaffald.com'

/** Fetch abort budget. Keeps a slow API from stalling the whole page render. */
const TIMEOUT_MS = 5000

export type ProfileVisibility = {
  work_experience: boolean
  education: boolean
  skills: boolean
  certifications: boolean
  reviews: boolean
  contact_info: boolean
}

export type PublicProfile = {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  current_position: string | null
  /** Section visibility, so the server render already honours hidden sections. */
  visibility?: ProfileVisibility | null
}

export type PublicJob = {
  id: string
  title: string
  slug: string
  description: unknown
  employment_type: string | null
  location: string | null
  pay_range_min_cents: number | null
  pay_range_max_cents: number | null
  pay_range_type: string | null
  status: string
  created_at: string
  updated_at: string
  organization: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
  } | null
}

export const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

/**
 * @param envelope whether the endpoint wraps its payload in `{ data }`. Most do;
 *   the SDK-facing ones (e.g. /v1/profiles/slug/{slug}) return it at the top
 *   level because the SDK hands its callers the response body verbatim.
 */
async function getFromApi<T>(path: string, envelope = true): Promise<T | null> {
  if (!SUPABASE_URL || !ANON_KEY) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/api${path}`, {
      headers: {
        // Kong requires the apikey header on every request
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body = await res.json()
    if (!envelope) return (body as T) ?? null
    return (body as { data?: T }).data ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Resolves against /v1/profiles/slug/{slug} — the same endpoint the client-side
 * `useProfileBySlug` query uses — so SSR and hydration agree once a user's
 * vanity slug diverges from their username. That route also falls back to a
 * username match, so it stays a superset of /v1/profiles/{username}.
 */
export async function fetchPublicProfileBySlug(
  slug: string | string[] | undefined
): Promise<PublicProfile | null> {
  const resolved = firstParam(slug)
  if (!resolved) return null
  return getFromApi<PublicProfile>(`/v1/profiles/slug/${encodeURIComponent(resolved)}`, false)
}

export async function fetchPublicJobBySlug(
  slug: string | string[] | undefined
): Promise<PublicJob | null> {
  const resolved = firstParam(slug)
  if (!resolved) return null
  return getFromApi<PublicJob>(`/v1/jobs/slug/${encodeURIComponent(resolved)}`)
}

/** Flattens TipTap/ProseMirror JSON (or a plain string) into indexable text. */
export function extractPlainText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object') {
    const node = content as { text?: string; content?: unknown[] }
    if (node.text) return node.text
    if (Array.isArray(node.content)) return node.content.map(extractPlainText).join(' ')
  }
  return ''
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`
}
