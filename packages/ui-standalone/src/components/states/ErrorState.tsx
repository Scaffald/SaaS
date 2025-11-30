import { AlertCircle } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { borderRadius } from '../../config/radii'
import { spacing } from '../../config/spacing'
import { typography } from '../../config/typography'
import { Button } from '../buttons/Button'

/**
 * ErrorState component props
 */
export interface ErrorStateProps {
  /** Icon to display (defaults to AlertCircle icon) */
  icon?: ReactNode
  /** Primary error message */
  title: string
  /** Optional detailed description */
  description?: string
  /** Error object or string for technical details */
  error?: Error | string
  /** Optional retry callback */
  retry?: () => void
  /** Custom retry button text */
  retryText?: string
}

/**
 * ErrorState - Error display component with retry functionality
 *
 * Use when operations fail and need to communicate errors to users.
 * Provides clear error messaging with optional retry action.
 *
 * Design Features:
 * - Red accent color for error prominence
 * - Centered layout with vertical stacking
 * - Optional technical error details in collapsible section
 * - Design token-based spacing and typography
 * - Primary retry button for recovery
 *
 * @example
 * ```tsx
 * // Basic error state
 * <ErrorState
 *   title="Failed to load data"
 *   description="We encountered an error while loading your data"
 *   retry={handleRetry}
 * />
 *
 * // With error details
 * <ErrorState
 *   title="Network Error"
 *   description="Unable to connect to the server"
 *   error={error}
 *   retry={handleRetry}
 *   retryText="Try Again"
 * />
 * ```
 */
export function ErrorState({
  icon,
  title,
  description,
  error,
  retry,
  retryText = 'Retry',
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      gap={spacing.md}
      p={spacing['2xl']}
      style={{ minHeight: 300 }}
    >
      {/* Icon */}
      <YStack items="center">{icon || <AlertCircle size={48} color="$red9" />}</YStack>

      {/* Title */}
      <Text
        fontSize={typography.xl}
        fontWeight={typography.fontWeightSemibold}
        color="$red10"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          fontSize={typography.base}
          color="$color11"
          style={{ textAlign: 'center', maxWidth: 400 }}
          lineHeight={typography.lineHeightRelaxed}
        >
          {description}
        </Text>
      )}

      {/* Technical error details */}
      {errorMessage && (
        <XStack
          bg="$red2"
          p={spacing.md}
          rounded={borderRadius.md}
          style={{ maxWidth: 500 }}
          borderWidth={1}
          borderColor="$red5"
        >
          <Text fontSize={typography.sm} color="$red11" style={{ fontFamily: 'monospace' }}>
            {errorMessage}
          </Text>
        </XStack>
      )}

      {/* Retry button */}
      {retry && (
        <YStack mt={spacing.md}>
          <Button variant="primary" onPress={retry}>
            {retryText}
          </Button>
        </YStack>
      )}
    </YStack>
  )
}
