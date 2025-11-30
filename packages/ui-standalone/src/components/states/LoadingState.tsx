import { Spinner, Text, YStack } from 'tamagui'
import { spacing } from '../../config/spacing'
import { typography } from '../../config/typography'

/**
 * LoadingState component props
 */
export interface LoadingStateProps {
  /** Optional loading message */
  message?: string
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large'
  /** Whether to display in fullscreen mode */
  fullScreen?: boolean
}

/**
 * LoadingState - Loading indicator component with teal spinner
 *
 * Use to indicate asynchronous operations in progress.
 * Provides visual feedback with optional message.
 *
 * Design Features:
 * - Teal-colored spinner matching brand
 * - Three size variants (small, medium, large)
 * - Optional loading message
 * - Fullscreen mode for page-level loading
 * - Design token-based spacing and typography
 *
 * @example
 * ```tsx
 * // Basic loading state
 * <LoadingState message="Loading data..." />
 *
 * // Small inline loader
 * <LoadingState size="small" />
 *
 * // Fullscreen loading
 * <LoadingState
 *   message="Please wait..."
 *   size="large"
 *   fullScreen
 * />
 * ```
 */
export function LoadingState({ message, size = 'medium', fullScreen = false }: LoadingStateProps) {
  const spinnerSize = size === 'small' ? 'small' : 'large'
  const containerStyles = fullScreen
    ? {
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }
    : {
        minHeight: 200,
      }

  return (
    <YStack
      flex={fullScreen ? 1 : undefined}
      items="center"
      justify="center"
      gap={spacing.md}
      p={spacing.xl}
      bg={fullScreen ? '$background' : 'transparent'}
      style={containerStyles}
    >
      {/* Spinner with teal color */}
      <Spinner size={spinnerSize} color="$blue7" />

      {/* Optional message */}
      {message && (
        <Text
          fontSize={size === 'large' ? typography.lg : typography.base}
          color="$color11"
          style={{ textAlign: 'center' }}
          fontWeight={typography.fontWeightMedium}
        >
          {message}
        </Text>
      )}
    </YStack>
  )
}
