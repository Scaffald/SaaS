import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isDarkModeEnabled, isLightOnlySurface, resolveThemePreference } from '../dark-mode-flag'

/**
 * The gate, tested without React.
 *
 * Dark mode was hard-off for five months because of one line in
 * `useThemeSetting` that no test covered. Both halves of what replaced it are
 * exercised here: the flag read, and the preference resolution.
 */
describe('isDarkModeEnabled', () => {
  const original = process.env.EXPO_PUBLIC_DARK_MODE

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_DARK_MODE
    else process.env.EXPO_PUBLIC_DARK_MODE = original
  })

  it('is off when the flag is unset — the production default', () => {
    delete process.env.EXPO_PUBLIC_DARK_MODE
    expect(isDarkModeEnabled()).toBe(false)
  })

  it('is on for exactly "1"', () => {
    process.env.EXPO_PUBLIC_DARK_MODE = '1'
    expect(isDarkModeEnabled()).toBe(true)
  })

  it('is off for other truthy-looking values', () => {
    // Deliberately strict. A flag that accepts 'true', 'yes' and '0' invites
    // "I set it and nothing happened" — one spelling, documented in one place.
    for (const value of ['true', 'TRUE', 'yes', 'on', '0', '', ' 1']) {
      process.env.EXPO_PUBLIC_DARK_MODE = value
      expect(isDarkModeEnabled(), `value ${JSON.stringify(value)}`).toBe(false)
    }
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

  it('reads the live flag when the third argument is omitted', () => {
    const original = process.env.EXPO_PUBLIC_DARK_MODE
    try {
      delete process.env.EXPO_PUBLIC_DARK_MODE
      expect(resolveThemePreference('dark', 'dark')).toBe('light')
      process.env.EXPO_PUBLIC_DARK_MODE = '1'
      expect(resolveThemePreference('dark', 'dark')).toBe('dark')
    } finally {
      if (original === undefined) delete process.env.EXPO_PUBLIC_DARK_MODE
      else process.env.EXPO_PUBLIC_DARK_MODE = original
    }
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
