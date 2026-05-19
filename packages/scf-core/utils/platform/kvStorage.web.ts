import type { KVStorage } from './kvStorage'

function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    // Some browser modes (e.g. third-party-cookies-blocked iframes) throw on access.
    return null
  }
}

export const kvStorage: KVStorage = {
  get: (key) => Promise.resolve(safeLocalStorage()?.getItem(key) ?? null),
  set: (key, value) => {
    safeLocalStorage()?.setItem(key, value)
    return Promise.resolve()
  },
  remove: (key) => {
    safeLocalStorage()?.removeItem(key)
    return Promise.resolve()
  },
  clear: () => {
    safeLocalStorage()?.clear()
    return Promise.resolve()
  },
  getSync: (key) => safeLocalStorage()?.getItem(key) ?? null,
}
