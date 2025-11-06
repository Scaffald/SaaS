/**
 * Clipboard Utility
 * 
 * Cross-platform clipboard functionality for copying text to clipboard
 * Supports both web (navigator.clipboard) and React Native (Clipboard API)
 */

import { Platform } from 'react-native'

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 * 
 * @example
 * const success = await copyToClipboard("https://example.com/u/john-doe")
 * if (success) {
 *   toast.show("Copied to clipboard!")
 * }
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    console.warn('copyToClipboard: Empty text provided')
    return false
  }

  try {
    if (Platform.OS === 'web') {
      // Web: Use navigator.clipboard API
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        return successful
      } catch (err) {
        document.body.removeChild(textArea)
        console.error('copyToClipboard: Fallback method failed', err)
        return false
      }
    } else {
      // React Native: Try to use Clipboard API
      // First try @react-native-clipboard/clipboard if available
      try {
        const Clipboard = await import('@react-native-clipboard/clipboard').then(
          (mod) => mod.default
        )
        await Clipboard.setString(text)
        return true
      } catch (importError) {
        // Fallback: Try expo-clipboard if available
        try {
          const Clipboard = await import('expo-clipboard')
          await Clipboard.setStringAsync(text)
          return true
        } catch (expoError) {
          console.error('copyToClipboard: No clipboard library available', {
            importError,
            expoError,
          })
          return false
        }
      }
    }
  } catch (error) {
    console.error('copyToClipboard: Error copying to clipboard', error)
    return false
  }
}

/**
 * Get text from clipboard (if needed in future)
 * 
 * @returns Promise that resolves to clipboard text or empty string
 */
export async function getFromClipboard(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      if (navigator.clipboard?.readText) {
        return await navigator.clipboard.readText()
      }
      return ''
    }

    try {
      const Clipboard = await import('@react-native-clipboard/clipboard').then(
        (mod) => mod.default
      )
      return await Clipboard.getString()
    } catch (importError) {
      try {
        const Clipboard = await import('expo-clipboard')
        return await Clipboard.getStringAsync()
      } catch (expoError) {
        console.error('getFromClipboard: No clipboard library available', {
          importError,
          expoError,
        })
        return ''
      }
    }
  } catch (error) {
    console.error('getFromClipboard: Error reading from clipboard', error)
    return ''
  }
}

