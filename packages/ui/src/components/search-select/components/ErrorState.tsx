import { AlertTriangle } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { Button, SizableText, YStack } from 'tamagui'

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
    <YStack p="$4" gap="$3" items="center" bg="$red3" rounded="$4" aria-live="assertive">
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
