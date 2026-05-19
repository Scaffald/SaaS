/**
 * Session-scoped key/value storage.
 *
 * Web: `window.sessionStorage` — cleared when the tab closes.
 * Native: in-memory module-level Map — cleared when the app process restarts.
 *
 * Both platforms reset on a "fresh app session" so this is the right home
 * for things like "show modal once per session" flags.
 *
 * For long-lived persistence (across app restarts) use `kvStorage` instead.
 */

export interface SessionKVStorage {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  clear(): void
}

export const sessionKvStorage: SessionKVStorage = {
  get: () => null,
  set: () => {},
  remove: () => {},
  clear: () => {},
}
