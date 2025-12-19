import { XStack, YStack, Text, styled, Spinner } from '@unicornlove/ui'
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

export type AIProcessingState = 'analyzing' | 'processing' | 'complete' | 'error'

interface AIProcessingIndicatorProps {
  state: AIProcessingState
  message?: string
  progress?: number // 0-100
}

const Container = styled(YStack, {
  name: 'AIProcessingIndicator',
  padding: '$4',
  borderRadius: '$md',
  borderWidth: 1,

  variants: {
    state: {
      analyzing: {
        backgroundColor: '$blue2',
        borderColor: '$blue6',
      },
      processing: {
        backgroundColor: '$blue2',
        borderColor: '$blue6',
      },
      complete: {
        backgroundColor: '$green2',
        borderColor: '$green6',
      },
      error: {
        backgroundColor: '$red2',
        borderColor: '$red6',
      },
    },
  } as const,
})

const ProgressBar = styled(YStack, {
  name: 'ProgressBar',
  width: '100%',
  backgroundColor: '$backgroundHover',
  borderRadius: '$10',
  height: 8,
  overflow: 'hidden',
})

const ProgressFill = styled(YStack, {
  name: 'ProgressFill',
  height: 8,
  backgroundColor: '$blue9',
  borderRadius: '$10',
  transition: 'width 300ms',
})

export default function AIProcessingIndicator({
  state,
  message,
  progress,
}: AIProcessingIndicatorProps) {
  const getDefaultMessage = () => {
    switch (state) {
      case 'analyzing':
        return 'AI analyzing...'
      case 'processing':
        return 'AI processing...'
      case 'complete':
        return 'Analysis complete'
      case 'error':
        return 'Analysis failed, please retry'
    }
  }

  const displayMessage = message || getDefaultMessage()

  return (
    <Container state={state}>
      <XStack alignItems="center" gap="$3">
        {state === 'analyzing' && (
          <YStack position="relative" width={20} height={20}>
            <Sparkles size={20} color="currentColor" />
            <YStack position="absolute" top={0} left={0}>
              <Spinner size="small" color="$blue9" />
            </YStack>
          </YStack>
        )}
        {state === 'processing' && <Spinner size="small" color="$blue9" />}
        {state === 'complete' && <CheckCircle size={20} color="currentColor" />}
        {state === 'error' && <AlertCircle size={20} color="currentColor" />}

        <YStack flex={1} gap="$2">
          <Text
            fontSize="$2"
            fontWeight="500"
            color={state === 'complete' ? '$green11' : state === 'error' ? '$red11' : '$blue11'}
          >
            {displayMessage}
          </Text>
          {state === 'processing' && progress !== undefined && (
            <ProgressBar>
              <ProgressFill width={`${progress}%`} />
            </ProgressBar>
          )}
        </YStack>
      </XStack>
    </Container>
  )
}
