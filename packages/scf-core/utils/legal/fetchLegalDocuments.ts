/**
 * Unauthenticated fetch of the currently-published legal document versions
 * (GET /v1/legal). Used by the public terms/privacy pages, which render for
 * logged-out users where no SDK client exists. Authenticated surfaces should
 * prefer the `legal` object on usePrerequisitesCheck() instead.
 */

import { getSupabaseAnonKey, getSupabaseApiBaseUrl } from '../supabase/api-base-url'

export type LegalDocType = 'terms_of_service' | 'privacy_policy'

export interface LegalDocumentInfo {
  doc_type: LegalDocType
  version: string
  effective_at: string
  url: string
  title: string | null
}

/**
 * Static fallback for when the API is unreachable — mirrors the values seeded
 * by migration 342. Display-only; never used for acceptance decisions (those
 * are always server-computed on /v1/prerequisites/check).
 */
export const LEGAL_DOCUMENTS_FALLBACK: LegalDocumentInfo[] = [
  {
    doc_type: 'terms_of_service',
    version: 'v1.0',
    effective_at: '2025-03-01T00:00:00Z',
    url: '/auth/terms',
    title: 'Terms of Service',
  },
  {
    doc_type: 'privacy_policy',
    version: 'v1.0',
    effective_at: '2025-03-01T00:00:00Z',
    url: '/auth/privacy',
    title: 'Privacy Policy',
  },
]

export async function fetchLegalDocuments(): Promise<LegalDocumentInfo[]> {
  const base = getSupabaseApiBaseUrl()
  if (!base) return LEGAL_DOCUMENTS_FALLBACK
  try {
    // The apikey header is required when the base URL points at Kong
    // (Supabase gateway) — same requirement as every other API call.
    const anonKey = getSupabaseAnonKey()
    const res = await fetch(`${base}/v1/legal`, {
      headers: anonKey ? { apikey: anonKey } : undefined,
    })
    if (!res.ok) return LEGAL_DOCUMENTS_FALLBACK
    const body = (await res.json()) as { documents?: LegalDocumentInfo[] }
    if (!body.documents || body.documents.length === 0) return LEGAL_DOCUMENTS_FALLBACK
    return body.documents
  } catch {
    return LEGAL_DOCUMENTS_FALLBACK
  }
}
