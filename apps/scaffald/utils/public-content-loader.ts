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

export type PublicProfile = {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  current_position: string | null
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

async function getFromApi<T>(path: string): Promise<T | null> {
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
    const body = (await res.json()) as { data?: T }
    return body.data ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * NOTE: the API exposes public profiles at /v1/profiles/{username}; there is no
 * /v1/profiles/slug/{slug} route despite the SDK calling one. Vanity slugs
 * currently match usernames, so this resolves correctly today.
 */
export async function fetchPublicProfileBySlug(
  slug: string | string[] | undefined
): Promise<PublicProfile | null> {
  const resolved = firstParam(slug)
  if (!resolved) return null
  return getFromApi<PublicProfile>(`/v1/profiles/${encodeURIComponent(resolved)}`)
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
