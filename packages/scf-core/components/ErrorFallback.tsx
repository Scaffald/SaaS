import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { Home, RefreshCcw } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button, Text, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors, spacing } from '@unicornlove/beyond-ui/tokens'

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const router = useRouter()
  const { theme } = useThemeContext()

  const handleGoHome = () => {
    onReset()
    router.replace(ROUTES.DASHBOARD.path)
  }

  return (
    <Stack
      flex={1}
      justify="center"
      align="center"
      gap={spacing[8]}
      paddingHorizontal={spacing[6]}
      paddingVertical={spacing[10]}
      style={{
        backgroundColor: colors.bg[theme].default,
      }}
    >
      {/* Logo */}
      <Stack align="center">
        <ScaffaldLogo width={120} height={120} showWordmark={false} />
      </Stack>

      {/* Error Message */}
      <Stack gap={spacing[4]} align="center" style={{ maxWidth: 520 }}>
        <Text
          size="2xl"
          weight="bold"
          color={colors.text[theme].primary}
          style={{ textAlign: 'center' }}
        >
          Something went wrong
        </Text>
        <Text
          size="md"
          color={colors.text[theme].secondary}
          style={{ textAlign: 'center', lineHeight: 24 }}
        >
          We've been notified of this issue and are working on a fix. Try refreshing the page or
          return to the dashboard.
        </Text>
      </Stack>

      {/* Dev Error Details */}
      {__DEV__ && error ? (
        <Stack
          style={{
            maxWidth: 600,
            width: '100%',
            backgroundColor: colors.bg[theme].errorSubtle,
            borderColor: colors.border[theme].error,
            borderWidth: 1,
            borderRadius: 12,
            padding: spacing[4],
          }}
        >
          <Stack gap={spacing[2]}>
            <Text
              size="sm"
              weight="semibold"
              style={{
                fontFamily: 'monospace',
                color: colors.text[theme].error,
              }}
            >
              Error Details (Development Only):
            </Text>
            <Text
              size="sm"
              style={{
                fontFamily: 'monospace',
                lineHeight: 20,
                color: colors.text[theme].error,
              }}
            >
              {error.message}
            </Text>
            {error.stack ? (
              <Text
                size="xs"
                color={colors.text[theme].tertiary}
                style={{
                  fontFamily: 'monospace',
                  lineHeight: 18,
                  maxHeight: 200,
                  overflow: 'hidden',
                }}
              >
                {error.stack.split('\n').slice(0, 5).join('\n')}
              </Text>
            ) : null}
          </Stack>
        </Stack>
      ) : null}

      {/* Action Buttons */}
      <Row gap={12}>
        <Button variant="filled" color="primary" iconStart={RefreshCcw} onPress={onReset}>
          Try Again
        </Button>
        <Button variant="outline" color="gray" iconStart={Home} onPress={handleGoHome}>
          Go to Dashboard
        </Button>
      </Row>
    </Stack>
  )
}
