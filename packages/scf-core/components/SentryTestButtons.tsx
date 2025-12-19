import { captureException, captureMessage } from '@scf/core/utils/sentry'
import { Button, Text, YStack } from '@unicornlove/ui'

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
    <YStack gap="$3" padding="$4">
      <Text fontSize="$6" fontWeight="bold">
        Sentry Integration Tests
      </Text>
      <Text fontSize="$3" color="$gray11">
        Use these buttons to verify Sentry is capturing errors correctly.
        Check your Sentry dashboard after clicking.
      </Text>

      <YStack gap="$2" marginTop="$3">
        <Button onPress={testJSError} theme="blue">
          Test JS Error (Handled)
        </Button>

        <Button onPress={testMessage} theme="success">
          Test Info Message
        </Button>

        <Button onPress={testWarning} theme="info">
          Test Warning Message
        </Button>

        <Button onPress={testCriticalError} theme="error">
          Test Critical Error
        </Button>

        <Button onPress={testUnhandledError} theme="error" chromeless>
          Test Unhandled Error (Crashes Component)
        </Button>
      </YStack>

      <Text fontSize="$2" color="$gray10" marginTop="$3">
        ⚠️ Remove these test buttons before production deployment
      </Text>
    </YStack>
  )
}

