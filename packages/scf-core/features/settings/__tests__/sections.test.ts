import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  getSettingsSection,
  resolveSettingsSection,
} from '../sections'

describe('Settings sections (#1212)', () => {
  it('has the six tabs in order', () => {
    expect(SETTINGS_SECTIONS.map((section) => section.label)).toEqual([
      'Profile',
      'Appearance',
      'Notifications',
      'Privacy',
      'Apps',
      'Account',
    ])
  })

  it('opens the section the URL names', () => {
    expect(resolveSettingsSection({ section: 'notifications' })).toBe('notifications')
    expect(resolveSettingsSection({ section: ['apps', 'privacy'] })).toBe('apps')
  })

  it('opens the first tab for a missing or unknown section', () => {
    expect(resolveSettingsSection({})).toBe(DEFAULT_SETTINGS_SECTION)
    expect(resolveSettingsSection({ section: 'billing' })).toBe(DEFAULT_SETTINGS_SECTION)
  })

  it('opens Account after a provider-link round trip', () => {
    expect(resolveSettingsSection({ linked: 'success' })).toBe('account')
    // An explicit section still wins.
    expect(resolveSettingsSection({ linked: 'success', section: 'privacy' })).toBe('privacy')
  })

  it('gives every section a title and a tip', () => {
    for (const section of SETTINGS_SECTIONS) {
      expect(getSettingsSection(section.key).title.length).toBeGreaterThan(0)
      expect(getSettingsSection(section.key).tip.length).toBeGreaterThan(0)
    }
  })
})
