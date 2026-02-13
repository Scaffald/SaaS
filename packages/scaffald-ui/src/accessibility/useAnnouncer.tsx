/**
 * useAnnouncer hook
 * Manages screen reader announcements via aria-live regions
 *
 * Provides a way to announce dynamic content changes to assistive
 * technology users without visual indication.
 *
 * @example
 * ```tsx
 * import { useAnnouncer, AnnouncerProvider } from '@scaffald/ui'
 *
 * // Wrap your app with the provider
 * function App() {
 *   return (
 *     <AnnouncerProvider>
 *       <MyApp />
 *     </AnnouncerProvider>
 *   )
 * }
 *
 * // Use the hook in any component
 * function SaveButton() {
 *   const { announce } = useAnnouncer()
 *
 *   const handleSave = async () => {
 *     await saveData()
 *     announce('Changes saved successfully', 'polite')
 *   }
 *
 *   return <Button onPress={handleSave}>Save</Button>
 * }
 * ```
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import { View, Text, StyleSheet, Platform, AccessibilityInfo } from 'react-native'
import type { AriaLive } from './types'

export interface Announcement {
  id: string
  message: string
  priority: AriaLive
  timestamp: number
}

export interface AnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AriaLive) => void
  /** Clear all pending announcements */
  clearAnnouncements: () => void
  /** Current announcements queue */
  announcements: Announcement[]
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null)

// Generate unique ID for announcements
let announcementId = 0
function generateAnnouncementId(): string {
  return `announcement-${++announcementId}`
}

export interface AnnouncerProviderProps {
  children: ReactNode
  /** Duration to show announcement before clearing (ms) */
  clearDelay?: number
}

/**
 * Provider component that manages the live region for announcements
 */
export function AnnouncerProvider({
  children,
  clearDelay = 1000,
}: AnnouncerProviderProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([])
  }, [])

  const announce = useCallback(
    (message: string, priority: AriaLive = 'polite') => {
      // On native, use AccessibilityInfo
      if (Platform.OS !== 'web') {
        AccessibilityInfo.announceForAccessibility(message)
        return
      }

      // On web, update the live region
      const announcement: Announcement = {
        id: generateAnnouncementId(),
        message,
        priority,
        timestamp: Date.now(),
      }

      setAnnouncements((prev) => [...prev, announcement])

      // Clear after delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setAnnouncements((prev) =>
          prev.filter((a) => a.id !== announcement.id)
        )
      }, clearDelay)
    },
    [clearDelay]
  )

  const contextValue: AnnouncerContextValue = {
    announce,
    clearAnnouncements,
    announcements,
  }

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}
      {/* Live region for web - visually hidden but accessible */}
      {Platform.OS === 'web' && (
        <View
          style={styles.visuallyHidden}
          accessibilityRole="none"
          {...({ 'aria-live': 'polite', 'aria-atomic': 'true' } as Record<string, unknown>)}
        >
          {announcements.map((announcement) => (
            <Text
              key={announcement.id}
              {...({ 'aria-live': announcement.priority } as Record<string, unknown>)}
            >
              {announcement.message}
            </Text>
          ))}
        </View>
      )}
      {/* Assertive region for urgent announcements */}
      {Platform.OS === 'web' && (
        <View
          style={styles.visuallyHidden}
          accessibilityRole="none"
          {...({ 'aria-live': 'assertive', 'aria-atomic': 'true' } as Record<string, unknown>)}
        >
          {announcements
            .filter((a) => a.priority === 'assertive')
            .map((announcement) => (
              <Text key={announcement.id}>{announcement.message}</Text>
            ))}
        </View>
      )}
    </AnnouncerContext.Provider>
  )
}

/**
 * Hook to access the announcer functionality
 */
export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext)

  // If no provider, return a fallback that uses native API
  if (!context) {
    return {
      announce: (message: string) => {
        if (Platform.OS !== 'web') {
          AccessibilityInfo.announceForAccessibility(message)
        } else if (typeof window !== 'undefined') {
          // Fallback: create a temporary live region
          const liveRegion = document.createElement('div')
          liveRegion.setAttribute('aria-live', 'polite')
          liveRegion.setAttribute('aria-atomic', 'true')
          liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          `
          liveRegion.textContent = message
          document.body.appendChild(liveRegion)

          setTimeout(() => {
            document.body.removeChild(liveRegion)
          }, 1000)
        }
      },
      clearAnnouncements: () => {},
      announcements: [],
    }
  }

  return context
}

const styles = StyleSheet.create({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    borderWidth: 0,
  },
})
