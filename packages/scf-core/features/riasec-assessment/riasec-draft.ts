import type { RiasecScores } from '@scf/core/features/career-assessment/config/career-assessment-schema'

/**
 * RIASEC self-ratings as the user fills them in: each dimension is a 1–5
 * rating the user set, or null until they set it.
 *
 * The wizard used to start from `careerAssessmentDefaults` (every dimension
 * at 3) and count any 1–5 value as rated, so a fresh visit read "6 of 6
 * dimensions rated" with a full progress bar and the untouched defaults
 * could be submitted as the user's interests (#1173).
 */
export type RiasecDraft = { [K in keyof RiasecScores]: number | null }

export const RIASEC_DIMENSION_COUNT = 6

export function emptyRiasecDraft(): RiasecDraft {
  return {
    realistic: null,
    investigative: null,
    artistic: null,
    social: null,
    enterprising: null,
    conventional: null,
  }
}

function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
}

/** How many dimensions the user has rated. */
export function countRated(draft: RiasecDraft): number {
  return Object.values(draft).filter(isRating).length
}

/** The completed scores, or null while any dimension is still unset. */
export function completedScores(draft: RiasecDraft): RiasecScores | null {
  const values = Object.values(draft)
  if (values.length !== RIASEC_DIMENSION_COUNT || !values.every(isRating)) return null
  return draft as RiasecScores
}

/**
 * A draft from scores saved earlier. Anything missing or out of range stays
 * unset rather than being filled in.
 */
export function draftFromSaved(
  saved: Partial<Record<keyof RiasecScores, unknown>> | null | undefined
): RiasecDraft {
  const draft = emptyRiasecDraft()
  if (!saved) return draft
  for (const key of Object.keys(draft) as (keyof RiasecScores)[]) {
    const value = saved[key]
    draft[key] = isRating(value) ? value : null
  }
  return draft
}

/** Percentage for the progress bars. */
export function ratedPercent(draft: RiasecDraft): number {
  return Math.round((countRated(draft) / RIASEC_DIMENSION_COUNT) * 100)
}
