/**
 * LoadingState – loading indicator with optional message
 * Use for async operations in progress.
 */

import { Stack } from '../Layout'
import { Spinner } from '../Spinner'
import { Paragraph } from '../Typography'
import { spacing } from '../../tokens/spacing'
import type { LoadingStateProps } from './States.types'

export function LoadingState({
  message,
  size = 'md',
  fullScreen = false,
}: LoadingStateProps) {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'

  const containerStyle = fullScreen
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: spacing[6],
        minHeight: 200,
      }
    : { padding: spacing[6], minHeight: 200 }

  return (
    <Stack
      flex={fullScreen ? 1 : undefined}
      align="center"
      justify="center"
      gap={spacing[4]}
      style={containerStyle}
    >
      <Spinner size={spinnerSize} color="primary" />
      {message && (
        <Paragraph align="center" color="secondary" weight="medium">
          {message}
        </Paragraph>
      )}
    </Stack>
  )
}
