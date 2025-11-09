import { useRouter } from 'expo-router'
import { Home, RefreshCcw } from '@tamagui/lucide-icons'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    onReset()
    router.replace('/dashboard')
  }

  return (
    <YStack flex={1} justify="center" items="center" gap="$5" px="$4" py="$6">
      <YStack gap="$3" items="center" style={{ maxWidth: 480 }} width="100%">
        <Text fontSize="$9" fontWeight="700" style={{ textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Paragraph color="$color11" style={{ textAlign: 'center' }}>
          We have been notified of the problem and are working on a fix. You can try again or head
          back to the dashboard.
        </Paragraph>
      </YStack>

      {__DEV__ && error ? (
        <YStack
          width="100%"
          bg="$red2"
          borderColor="$red6"
          borderWidth={1}
          px="$4"
          py="$3"
          gap="$2"
          style={{ borderRadius: 12 }}
        >
          <Text fontSize="$3" color="$red11" style={{ fontFamily: 'monospace' }}>
            {error.message}
          </Text>
        </YStack>
      ) : null}

      <XStack gap="$3">
        <Button theme="blue" icon={RefreshCcw} onPress={onReset}>
          Try Again
        </Button>
        <Button variant="outlined" icon={Home} onPress={handleGoHome}>
          Go to Dashboard
        </Button>
      </XStack>
    </YStack>
  )
}

