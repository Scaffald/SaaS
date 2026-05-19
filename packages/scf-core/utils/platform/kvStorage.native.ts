import AsyncStorage from '@react-native-async-storage/async-storage'
import type { KVStorage } from './kvStorage'

export const kvStorage: KVStorage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
  getSync: () => null,
}
