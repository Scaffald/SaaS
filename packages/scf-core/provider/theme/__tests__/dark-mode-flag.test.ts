import { describe, expect, it } from 'vitest'
import { isDarkModeEnabled, isLightOnlySurface, resolveThemePreference } from '../dark-mode-flag'

/**
 * The gate, tested without React.
 *
 * Dark mode was hard-off for five months because of one line in
 * `useThemeSetting` that no test covered. The gate that replaced it is open
 * now (#840); the preference resolution it fed is what matters here.
 */
describe('isDarkModeEnabled', () => {
  it('is on — dark ships (#840); the env flag that gated #833 is gone', () => {
    expect(isDarkModeEnabled()).toBe(true)
  })
})

describe('resolveThemePreference', () => {
  describe('with the gate closed', () => {
    it('renders light whatever the preference says', () => {
      for (const preference of ['dark', 'light', 'system', null, undefined]) {
        expect(resolveThemePreference(preference, 'dark', false)).toBe('light')
      }
    })
  })

  describe('with the gate open', () => {
    it('honours an explicit preference over the system theme', () => {
      expect(resolveThemePreference('dark', 'light', true)).toBe('dark')
      expect(resolveThemePreference('light', 'dark', true)).toBe('light')
    })

    it('follows the system theme for "system"', () => {
      expect(resolveThemePreference('system', 'dark', true)).toBe('dark')
      expect(resolveThemePreference('system', 'light', true)).toBe('light')
    })

    it('treats a missing preference as "system"', () => {
      expect(resolveThemePreference(null, 'dark', true)).toBe('dark')
      expect(resolveThemePreference(undefined, 'dark', true)).toBe('dark')
    })

    it('never returns "system", which the tokens have no palette for', () => {
      // The line this replaced fell back to `context.current ?? 'system'`, so a
      // null systemTheme could hand 'system' back as a resolved theme. There is
      // no colors.bg.system, so the first lookup would have read undefined.
      for (const systemTheme of [null, undefined] as const) {
        expect(resolveThemePreference('system', systemTheme, true)).toBe('light')
        expect(resolveThemePreference(null, systemTheme, true)).toBe('light')
      }
    })

    it('ignores an unrecognised preference rather than passing it through', () => {
      expect(resolveThemePreference('sepia', 'dark', true)).toBe('dark')
      expect(resolveThemePreference('sepia', 'light', true)).toBe('light')
    })
  })

  it('resolves dark with no third argument — the gate is open by default', () => {
    expect(resolveThemePreference('dark', 'dark')).toBe('dark')
    expect(resolveThemePreference('system', 'dark')).toBe('dark')
  })
})

describe('isLightOnlySurface', () => {
  it('treats the root index route as light-only — that is the landing page', () => {
    // expo-router reports `[]` for `/`.
    expect(isLightOnlySurface([])).toBe(true)
  })

  it('covers the whole (public) group, not just the marketing screens', () => {
    // (public) also holds public profiles, jobs, reviews and teams, and its
    // _layout mounts MarketingNav above every one of them (#953).
    expect(isLightOnlySurface(['(public)'])).toBe(true)
    expect(isLightOnlySurface(['(public)', 'terms'])).toBe(true)
    expect(isLightOnlySurface(['(public)', 'jobs', '[slug]'])).toBe(true)
    expect(isLightOnlySurface(['(public)', 'users', '[id]'])).toBe(true)
  })

  it('leaves the app proper alone', () => {
    for (const group of ['(protected)', '(admin)', '(auth)']) {
      expect(isLightOnlySurface([group]), group).toBe(false)
      expect(isLightOnlySurface([group, 'dashboard']), group).toBe(false)
    }
  })

  it('matches on the group, not on a path substring', () => {
    // A route merely named "public" somewhere deeper is not the group.
    expect(isLightOnlySurface(['(protected)', 'public'])).toBe(false)
    expect(isLightOnlySurface(['public'])).toBe(false)
  })
})
