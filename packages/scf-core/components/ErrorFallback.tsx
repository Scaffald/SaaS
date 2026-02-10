import { ROUTES } from '@scf/core/constants/routes'
import { Home, RefreshCcw } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Button, Paragraph, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    onReset()
    router.replace(ROUTES.DASHBOARD.path)
  }

  return (
    <Stack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$5"
      paddingHorizontal="$4"
      paddingVertical="$6"
    >
      <Stack gap="$3" alignItems="center" style={{ maxWidth: 480 }} width="100%">
        <Text fontSize="$9" fontWeight="700" style={{ textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Paragraph color="$color11" style={{ textAlign: 'center' }}>
          We have been notified of the problem and are working on a fix. You can try again or head
          back to the dashboard.
        </Paragraph>
      </Stack>

      {__DEV__ && error ? (
        <Stack
          width="100%"
          backgroundColor="$red2"
          borderColor="$red6"
          borderWidth={1}
          paddingHorizontal="$4"
          paddingVertical="$3"
          gap="$2"
          style={{ borderRadius: 12 }}
        >
          <Text fontSize="$3" color="$red11" style={{ fontFamily: 'monospace' }}>
            {error.message}
          </Text>
        </Stack>
      ) : null}

      <Row gap="$3">
        <Button theme="blue" icon={RefreshCcw} onPress={onReset}>
          Try Again
        </Button>
        <Button variant="outlined" icon={Home} onPress={handleGoHome}>
          Go to Dashboard
        </Button>
      </Row>
    </Stack>
  )
}
