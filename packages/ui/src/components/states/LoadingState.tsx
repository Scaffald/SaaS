import { YStack, Text, Spinner } from 'tamagui'
import { spacing, typography } from '../../tokens/design-tokens'

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
  const spinnerSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'

  return (
    <YStack
      flex={fullScreen ? 1 : undefined}
      items="center"
      justify="center"
      gap={spacing.md}
      p={spacing.xl}
      minHeight={fullScreen ? '100vh' : 200}
      width={fullScreen ? '100vw' : undefined}
      position={fullScreen ? 'fixed' : 'relative'}
      t={fullScreen ? 0 : undefined}
      l={fullScreen ? 0 : undefined}
      r={fullScreen ? 0 : undefined}
      b={fullScreen ? 0 : undefined}
      bg={fullScreen ? '$background' : 'transparent'}
      zIndex={fullScreen ? 9999 : undefined}
    >
      {/* Spinner with teal color */}
      <Spinner size={spinnerSize} color="$teal7" />

      {/* Optional message */}
      {message && (
        <Text
          fontSize={size === 'large' ? typography.lg : typography.base}
          color="$color11"
          textAlign="center"
          fontWeight={typography.fontWeightMedium}
        >
          {message}
        </Text>
      )}
    </YStack>
  )
}
