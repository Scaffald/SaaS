import { captureException, captureMessage } from '@scf/core/utils/sentry'
import { Button, Text, Stack } from '@scaffald/ui'

/**
 * Test buttons for verifying Sentry integration
 *
 * Usage:
 * ```tsx
 * import { SentryTestButtons } from '@scf/core/components/SentryTestButtons'
 *
 * // In a development or debug screen
 * <SentryTestButtons />
 * ```
 *
 * These buttons should only be used in development builds and removed before production.
 */
export function SentryTestButtons() {
  const testJSError = () => {
    try {
      throw new Error('Test JavaScript Error - Sentry Integration Test')
    } catch (error) {
      captureException(error as Error, {
        testType: 'javascript_error',
        environment: 'test',
      })
      console.log('[Sentry Test] JavaScript error captured')
    }
  }

  const testMessage = () => {
    captureMessage('Test Sentry Message - Info Level', 'info')
    console.log('[Sentry Test] Info message captured')
  }

  const testWarning = () => {
    captureMessage('Test Sentry Warning - Something might be wrong', 'warning')
    console.log('[Sentry Test] Warning message captured')
  }

  const testCriticalError = () => {
    captureMessage('Test Sentry Critical Error - System failure', 'error')
    console.log('[Sentry Test] Error message captured')
  }

  const testUnhandledError = () => {
    // This will be caught by the error boundary
    throw new Error('Unhandled Test Error - Should be caught by ErrorBoundary')
  }

  return (
    <Stack gap={12} padding={16}>
      <Text>Sentry Integration Tests</Text>
      <Text color="$gray11">
        Use these buttons to verify Sentry is capturing errors correctly. Check your Sentry
        dashboard after clicking.
      </Text>

      <Stack gap={8} marginTop={12}>
        <Button onPress={testJSError} color="primary">
          Test JS Error (Handled)
        </Button>

        <Button onPress={testMessage} color="success">
          Test Info Message
        </Button>

        <Button onPress={testWarning} color="primary">
          Test Warning Message
        </Button>

        <Button onPress={testCriticalError} color="error">
          Test Critical Error
        </Button>

        <Button onPress={testUnhandledError} color="error" variant="ghost">
          Test Unhandled Error (Crashes Component)
        </Button>
      </Stack>

      <Text color="$gray10" marginTop={12}>
        ⚠️ Remove these test buttons before production deployment
      </Text>
    </Stack>
  )
}
