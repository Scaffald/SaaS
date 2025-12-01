import { AlertTriangle } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { SizableText, YStack } from 'tamagui'
import { Button } from '../../buttons/Button'

interface ErrorStateProps {
  message?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: ReactNode
}

export const ErrorState = ({
  message = 'Something went wrong',
  description = 'Please try searching again in a moment.',
  onRetry,
  retryLabel = 'Retry',
  icon,
}: ErrorStateProps) => {
  return (
    <YStack
      padding="$4"
      gap="$3"
      alignItems="center"
      backgroundColor="$red3"
      borderRadius="$4"
      aria-live="assertive"
    >
      {icon ?? <AlertTriangle size={28} color="$red10" aria-hidden={true} />}
      <SizableText fontSize="$4" fontWeight="700" color="$red11" style={{ textAlign: 'center' }}>
        {message}
      </SizableText>
      <SizableText fontSize="$2" color="$red11" style={{ textAlign: 'center' }}>
        {description}
      </SizableText>
      {onRetry ? (
        <Button onPress={onRetry} variant="outlined" borderColor="$red9">
          {retryLabel}
        </Button>
      ) : null}
    </YStack>
  )
}
