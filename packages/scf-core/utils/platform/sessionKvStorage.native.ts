import type { SessionKVStorage } from './sessionKvStorage'

const store = new Map<string, string>()

export const sessionKvStorage: SessionKVStorage = {
  get: (key) => store.get(key) ?? null,
  set: (key, value) => {
    store.set(key, value)
  },
  remove: (key) => {
    store.delete(key)
  },
  clear: () => {
    store.clear()
  },
}
