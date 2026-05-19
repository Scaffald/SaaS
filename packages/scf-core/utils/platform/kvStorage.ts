/**
 * Cross-platform key/value storage.
 *
 * Web: synchronous `localStorage` under the hood, wrapped in async API for
 *   symmetry with native.
 * Native: `AsyncStorage` from `@react-native-async-storage/async-storage`.
 *
 * All methods are async. Callers that need synchronous reads on web should
 * use `kvStorage.getSync` (web-only escape hatch — undefined on native).
 *
 * NOT for auth tokens or anything sensitive — use `expo-secure-store` on
 * native for credentials.
 */

export interface KVStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  /** Synchronous read; returns null on native. */
  getSync(key: string): string | null
}

export const kvStorage: KVStorage = {
  get: () => Promise.resolve(null),
  set: () => Promise.resolve(),
  remove: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getSync: () => null,
}
