import { useToastController } from '@tamagui/toast'
import { Alert, Platform } from 'react-native'

/**
 * Safe toast hook that handles React Native platform differences
 * 
 * Wraps Tamagui's toast controller to gracefully handle cases where
 * window.addEventListener is not available (React Native).
 * 
 * Falls back to React Native Alert on native platforms if toast fails.
 */
export function useSafeToast() {
  const toast = useToastController()

  const show = (
    title: string,
    options?: {
      message?: string
      duration?: number
      type?: 'error' | 'success' | 'info'
    }
  ) => {
    // Check if we're on native platform and window is not available
    const isNative = Platform.OS !== 'web'
    const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function'

    // On native platforms, use Alert directly if window is not available
    if (isNative && !hasWindow) {
      const message = options?.message
        ? `${title}: ${options.message}`
        : title
      Alert.alert(title, message)
      return
    }

    // Try to use toast, but catch any errors
    try {
      toast.show(title, options)
    } catch (error) {
      // Handle case where window.addEventListener is not available (React Native)
      if (
        error instanceof TypeError &&
        (error.message.includes('window.addEventListener') ||
          error.message.includes('window is not defined') ||
          error.message.includes('is not a function'))
      ) {
        // Fallback to React Native Alert on native platforms
        if (Platform.OS !== 'web') {
          const message = options?.message
            ? `${title}: ${options.message}`
            : title
          Alert.alert(title, message)
        } else {
          // On web, log the error but don't crash
          console.error('Toast error:', error)
          console.error(`Toast: ${title}`, options?.message)
        }
      } else {
        // Re-throw unexpected errors
        throw error
      }
    }
  }

  return { show, hide: toast.hide, currentToast: toast.currentToast }
}

