/**
 * Dark mode ships (#840). The build flag that gated it through #833's audit
 * is gone; this stays as the one place a build could say otherwise, and so
 * the callers that asked it (the Appearance control, the resolver) keep one
 * question to ask.
 *
 * History, because three earlier attempts at a dark smoke pass produced
 * light screenshots labelled "dark": dark had been hard-off since 78caa00b
 * by a single cast in `useThemeSetting`, restored behind
 * `EXPO_PUBLIC_DARK_MODE=1` in #833 part 1, and opened here once every
 * screen had been looked at in both appearances.
 */
export function isDarkModeEnabled(): boolean {
  return true
}

/**
 * Resolve a stored preference to the theme that should render.
 *
 * Split out from the hook so it can be tested without React, and so the two
 * callers (the hook, and `useRootTheme`) cannot drift.
 *
 * Returns `'light'` for anything unresolvable. The line this replaces fell back
 * to `context.current ?? 'system'`, which could hand `'system'` back as a
 * resolved theme even though the type says `'light' | 'dark'` — the tokens have
 * no `colors.bg.system`, so that would have read `undefined` at the first
 * lookup.
 */
export function resolveThemePreference(
  preference: string | null | undefined,
  systemTheme: 'light' | 'dark' | null | undefined,
  enabled: boolean = isDarkModeEnabled()
): 'light' | 'dark' {
  if (!enabled) return 'light'
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  // 'system', null and undefined all mean "follow the OS".
  return systemTheme === 'dark' ? 'dark' : 'light'
}

/**
 * Route groups that render light regardless of the reader's theme.
 *
 * Decision (Clay, 2026-10-02) on #953: the marketing palette does not get a
 * dark counterpart. `features/marketing/theme.ts` is a deliberate fixed palette
 * — the file says so, and it is the one file pinned as an exception in the
 * literal-styling ratchet (#819) — so with dark on it rendered its light
 * surfaces on the app's near-black ground and produced a visible seam.
 *
 * The group, not just the five marketing screens. `(public)` also holds public
 * profiles, job pages, reviews and teams, and `(public)/_layout.tsx` mounts
 * `MarketingNav` above every one of them. A dark job page under a light-palette
 * nav is the same seam in a smaller frame, so the whole anonymous surface stays
 * light and the theme starts at the app proper.
 */
const LIGHT_ONLY_GROUP = '(public)'

/**
 * `segments` is what expo-router's `useSegments()` returns. The root index
 * route — `/`, the landing page — reports `[]`.
 *
 * Takes the segments rather than calling the hook so it can be tested without a
 * router, and so the one caller that needs it stays the only thing coupled to
 * routing.
 */
export function isLightOnlySurface(segments: readonly string[]): boolean {
  if (segments.length === 0) return true
  return segments[0] === LIGHT_ONLY_GROUP
}
