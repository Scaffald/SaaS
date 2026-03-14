export type MapPinCategory = 'worker' | 'organization' | 'job'

/**
 * Pin colors for map markers — aligned with brand primary (teal) palette.
 *
 * Worker:       primary teal (brand color)
 * Organization: warm purple (complementary)
 * Job:          warm amber/gold (from warning palette)
 */
export const PIN_COLORS = {
  light: {
    worker: '#1d7282',       // primary.500 — brand teal
    organization: '#7c3aed', // violet — slightly warmer purple
    job: '#d4942a',          // warning.400 — warm amber
  },
  dark: {
    worker: '#3fb5c7',       // primary.300
    organization: '#a78bfa', // violet light
    job: '#e8ae4a',          // warning.300 — warm gold
  },
} as const

/**
 * Simple pin colors for non-theme contexts
 */
export const PIN_COLORS_FLAT: Record<string, string> = {
  Individual: '#1d7282',   // primary.500
  Organization: '#7c3aed', // violet
  Job: '#d4942a',          // warning.400
  unavailable: '#b84f3b',  // error.500
}
