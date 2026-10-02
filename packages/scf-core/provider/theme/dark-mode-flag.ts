/**
 * The one switch that decides whether this build may render dark.
 *
 * Dark mode has been hard-off since 78caa00b ("feat: force light mode and hide
 * theme toggle", 2026-04-21), by a single line in `useThemeSetting`:
 *
 *   const resolvedTheme = 'light' as 'light' | 'dark'
 *
 * Everything else in the stack already worked — the provider resolves a
 * preference, persists it, stamps `data-theme` on `<html>`, and bridges to
 * `@scaffald/ui`'s ThemeProvider as a controlled prop. That one line
 * short-circuited all of it, which is why three earlier attempts at a dark
 * smoke pass produced light screenshots labelled "dark"
 * (scripts/audit/smoke-authed.mjs says so at length).
 *
 * Part 1 of #833 restores the resolution behind this flag. Part 2 (#840) fixes
 * what the audit finds and removes the gate.
 *
 * ## Why an env flag and not `__DEV__`
 *
 * `__DEV__` would be convenient — false in release builds, so production could
 * not go dark by accident. But it would also flip every developer's app to
 * follow their OS appearance from the next `pnpm web`, with no one having asked
 * for that, and a half-audited palette is a bad thing to discover by surprise
 * in the middle of unrelated work. An explicit opt-in costs one line in `.env`
 * and makes "am I looking at dark on purpose?" answerable.
 *
 * ## Reading it
 *
 * `EXPO_PUBLIC_*` is inlined by Expo at build time, so this must stay a
 * literal, statically-analysable member expression — no destructuring, no
 * computed key, no helper that takes the name as an argument. Written any other
 * way it reads `undefined` in a bundle and the flag silently never turns on.
 *
 * Because it is inlined, a web server or native build has to be *started* with
 * the flag set; exporting it into an already-running process does nothing:
 *
 *   EXPO_PUBLIC_DARK_MODE=1 pnpm web
 */
export function isDarkModeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_DARK_MODE === '1'
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
