import AsyncStorage from '@react-native-async-storage/async-storage'

const SESSION_ID_KEY = '@scaffald:session_id'

/**
 * Get or create a session ID for tracking user interactions
 * Session ID is stored in AsyncStorage and persists across app restarts
 * until the app is closed or the storage is cleared
 */
export async function getOrCreateSessionId(): Promise<string> {
  try {
    // Try to get existing session ID
    const existingSessionId = await AsyncStorage.getItem(SESSION_ID_KEY)
    if (existingSessionId) {
      return existingSessionId
    }

    // Generate new session ID (UUID v4 format)
    const newSessionId = generateUUID()
    await AsyncStorage.setItem(SESSION_ID_KEY, newSessionId)
    return newSessionId
  } catch (error) {
    // If AsyncStorage fails, generate a temporary session ID
    // This won't persist but will at least work for the current session
    console.warn('Failed to access AsyncStorage for session ID:', error)
    return generateUUID()
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Simplified UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Clear the session ID (useful for testing or logout)
 */
export async function clearSessionId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_ID_KEY)
  } catch (error) {
    console.warn('Failed to clear session ID:', error)
  }
}
