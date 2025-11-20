import { AlertCircle, Check } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Spinner, Text, XStack, YStack } from 'tamagui'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveStatusIndicatorProps {
  /** Current save status */
  status: SaveStatus
  /** Timestamp of last successful save */
  lastSavedAt?: Date | null
  /** Error message to display when status is 'error' */
  error?: string
  /** Duration in milliseconds to auto-hide success state (default: 3000) */
  autoHideDuration?: number
}

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

/**
 * SaveStatusIndicator Component
 *
 * Displays real-time save state with timestamp for auto-save sections.
 * Provides visual feedback during save operations and shows when data was last saved.
 *
 * @example
 * ```tsx
 * <SaveStatusIndicator
 *   status={isSaving ? 'saving' : 'saved'}
 *   lastSavedAt={lastSaveTime}
 *   error={saveError}
 * />
 * ```
 */
export function SaveStatusIndicator({
  status,
  lastSavedAt,
  error,
  autoHideDuration = 3000,
}: SaveStatusIndicatorProps) {
  const [showSavedState, setShowSavedState] = useState(false)
  const [relativeTime, setRelativeTime] = useState<string>('')

  // Update relative time every 60 seconds
  useEffect(() => {
    if (!lastSavedAt) {
      setRelativeTime('')
      return
    }

    const updateTime = () => {
      setRelativeTime(formatRelativeTime(lastSavedAt))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [lastSavedAt])

  // Auto-hide saved state after duration
  useEffect(() => {
    if (status === 'saved') {
      setShowSavedState(true)
      const timer = setTimeout(() => {
        setShowSavedState(false)
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
    setShowSavedState(false)
  }, [status, autoHideDuration])

  // Don't render anything in idle state without timestamp
  if (status === 'idle' && !lastSavedAt) {
    return null
  }

  return (
    <YStack gap="$1" items="flex-end">
      {status === 'saving' && (
        <XStack gap="$2" items="center">
          <Spinner size="small" color="$color11" />
          <Text fontSize="$2" color="$color11">
            Saving...
          </Text>
        </XStack>
      )}

      {status === 'saved' && showSavedState && (
        <XStack gap="$2" items="center">
          <Check size={16} color="$green9" />
          <Text fontSize="$2" color="$green9" fontWeight="600">
            Saved
          </Text>
        </XStack>
      )}

      {status === 'error' && (
        <XStack gap="$2" items="center">
          <AlertCircle size={16} color="$red9" />
          <Text fontSize="$2" color="$red9">
            {error || 'Failed to save'}
          </Text>
        </XStack>
      )}

      {lastSavedAt && relativeTime && (
        <Text fontSize="$1" color="$color10">
          Last saved: {relativeTime}
        </Text>
      )}
    </YStack>
  )
}
