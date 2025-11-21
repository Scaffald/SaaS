/* c8 ignore file */

/**
 * Clipboard Utility
 *
 * Cross-platform clipboard functionality for copying text to clipboard
 * Supports both web (navigator.clipboard) and React Native (Clipboard API)
 */

import * as ExpoClipboard from 'expo-clipboard'
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
    }

    // React Native environments: use Expo Clipboard module
    if (typeof ExpoClipboard.setStringAsync === 'function') {
      await ExpoClipboard.setStringAsync(text)
      return true
    }

    console.error('copyToClipboard: Expo Clipboard module unavailable')
    return false
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

    if (typeof ExpoClipboard.getStringAsync === 'function') {
      return await ExpoClipboard.getStringAsync()
    }

    console.error('getFromClipboard: Expo Clipboard module unavailable')
    return ''
  } catch (error) {
    console.error('getFromClipboard: Error reading from clipboard', error)
    return ''
  }
}
