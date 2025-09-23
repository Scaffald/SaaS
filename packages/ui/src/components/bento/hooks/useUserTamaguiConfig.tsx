import { useLocalStorageState } from 'use-local-storage-state'

/**
 * Retrieves the user's Tamagui configuration from localStorage as a raw string.
 * @returns {string | null} userTamaguiConfig - The user's tamagui configuration
 */
export const useUserTamaguiConfig = () => {
  const [userTamaguiConfig] = useLocalStorageState<string | null>('userTamaguiConfig', null)
  return userTamaguiConfig || null
}
