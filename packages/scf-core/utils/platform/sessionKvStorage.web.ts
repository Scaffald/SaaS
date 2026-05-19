import type { SessionKVStorage } from './sessionKvStorage'

function safeSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export const sessionKvStorage: SessionKVStorage = {
  get: (key) => safeSessionStorage()?.getItem(key) ?? null,
  set: (key, value) => {
    safeSessionStorage()?.setItem(key, value)
  },
  remove: (key) => {
    safeSessionStorage()?.removeItem(key)
  },
  clear: () => {
    safeSessionStorage()?.clear()
  },
}
