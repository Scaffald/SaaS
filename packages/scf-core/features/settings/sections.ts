/**
 * The Settings screen's sections, in tab order, and which one a URL opens.
 *
 * Settings was six stacked sections in one untitled scroll (#1212). Each is
 * now a folder tab, picked by `?section=` so another screen can link straight
 * to one — /dashboard/notifications/settings redirects to the Notifications
 * tab, which makes this screen the one owner of notification preferences.
 */

export const SETTINGS_SECTIONS = [
  {
    key: 'profile',
    label: 'Profile',
    title: 'Public profile',
    tip: 'The address your public profile is shared at. Share it from the Share button on your profile.',
  },
  {
    key: 'appearance',
    label: 'Appearance',
    title: 'Appearance',
    tip: 'Light, dark, or whatever your device is set to. Changes apply straight away and are remembered on this device.',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    title: 'Notifications',
    tip: 'How and when we reach you. Your notifications themselves are in the inbox.',
  },
  {
    key: 'privacy',
    label: 'Privacy',
    title: 'Privacy & data',
    tip: 'Your data, export and deletion requests, privacy choices, and the people you have blocked.',
  },
  {
    key: 'apps',
    label: 'Apps',
    title: 'Authorized applications',
    tip: 'Apps that have access to your account. Revoke access at any time.',
  },
  {
    key: 'account',
    label: 'Account',
    title: 'Account',
    tip: 'The ways you sign in, and closing your account.',
  },
] as const

export type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number]['key']

export const DEFAULT_SETTINGS_SECTION: SettingsSectionKey = 'profile'

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function isSettingsSectionKey(value: unknown): value is SettingsSectionKey {
  return SETTINGS_SECTIONS.some((section) => section.key === value)
}

/**
 * The section a URL's params open. An unknown `section` falls back to the
 * first tab rather than an empty page. A provider-link round trip lands on
 * `?linked=…` (see useConnectedAccounts); its result shows under Account, so
 * that is where it opens.
 */
export function resolveSettingsSection(params: {
  section?: string | string[]
  linked?: string | string[]
}): SettingsSectionKey {
  const section = first(params.section)
  if (isSettingsSectionKey(section)) return section
  if (first(params.linked)) return 'account'
  return DEFAULT_SETTINGS_SECTION
}

export function getSettingsSection(key: SettingsSectionKey) {
  return SETTINGS_SECTIONS.find((section) => section.key === key) ?? SETTINGS_SECTIONS[0]
}
