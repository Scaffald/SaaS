import type { PostgrestError } from '@supabase/supabase-js'

type NotFoundErrorShape = {
  status?: number
  code?: string
  message?: string
  details?: string | null
}

const NOT_FOUND_CODES = new Set(['PGRST302', 'PGRST404', '42P01'])

export const isNotFoundPostgrestError = (error: unknown): error is PostgrestError => {
  if (!error || typeof error !== 'object') return false

  const candidate = error as NotFoundErrorShape

  if (candidate.status === 404) return true
  if (candidate.code && NOT_FOUND_CODES.has(candidate.code)) return true

  const normalized = `${candidate.message ?? ''} ${candidate.details ?? ''}`.toLowerCase()

  return normalized.includes('not found') || normalized.includes('does not exist')
}

export const wrapSupabaseError = <T extends PostgrestError>(error: T) =>
  Object.assign(new Error(error.message), error)
