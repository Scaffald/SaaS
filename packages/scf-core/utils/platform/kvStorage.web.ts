import type { KVStorage } from './kvStorage'

function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    // Some browser modes (e.g. third-party-cookies-blocked iframes) throw on access.
    return null
  }
}

// `localStorage` write methods throw *synchronously* when the quota is
// exceeded or the storage backend is locked. The shared KVStorage contract
// returns a Promise, so consumers expect to handle failures via `.catch`.
// Wrap each mutating call so a sync throw becomes a rejected promise rather
// than crashing whichever effect triggered the write.
function safeCall<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn())
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)))
  }
}

export const kvStorage: KVStorage = {
  get: (key) => Promise.resolve(safeLocalStorage()?.getItem(key) ?? null),
  set: (key, value) => safeCall(() => safeLocalStorage()?.setItem(key, value)),
  remove: (key) => safeCall(() => safeLocalStorage()?.removeItem(key)),
  clear: () => safeCall(() => safeLocalStorage()?.clear()),
  getSync: (key) => safeLocalStorage()?.getItem(key) ?? null,
}
