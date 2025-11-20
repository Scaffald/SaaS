import { useStripeConfig } from '@app/core/features/payments/hooks/useStripeConfig'
import { api } from '@app/core/utils/api'
import { Button, Spinner, Text, XStack, YStack } from '@app/ui'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { SetupIntent } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useToastController } from '@tamagui/toast'
import { useMemo, useState } from 'react'
import { Card } from 'tamagui'

type SetupIntentFormProps = {
  organizationId: string
  onSuccess: () => void
  onCancel: () => void
}

export function SetupIntentForm({ organizationId, onSuccess, onCancel }: SetupIntentFormProps) {
  const toast = useToastController()
  const config = useStripeConfig(true)

  const createSetupIntentMutation = api.payments.createSetupIntent.useMutation()

  const stripePromise = useMemo(() => {
    if (!config.publishableKey) return null
    return loadStripe(config.publishableKey)
  }, [config.publishableKey])

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const handleInitialize = async () => {
    setIsInitializing(true)
    try {
      const result = await createSetupIntentMutation.mutateAsync({
        organizationId,
      })
      setClientSecret(result.clientSecret)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize payment form'
      toast.show('Error', { message, type: 'error' })
    } finally {
      setIsInitializing(false)
    }
  }

  const options = useMemo(() => {
    if (!clientSecret) return null
    return {
      clientSecret,
      appearance: {
        theme: 'flat' as const,
        labels: 'floating' as const,
        variables: {
          colorText: 'hsl(206,6%,25%)',
          colorDanger: 'hsl(359,72%,55%)',
          borderRadius: '8px',
        },
      },
    }
  }, [clientSecret])

  if (config.isLoading || !stripePromise) {
    return (
      <Card p="$3" bg="$color2" borderColor="$borderColor" borderWidth={1}>
        <Text fontSize="$3" color="$color11">
          Preparing secure payment form…
        </Text>
      </Card>
    )
  }

  if (!config.publishableKey) {
    return (
      <Card p="$3" bg="$red2" borderColor="$red6" borderWidth={1}>
        <Text color="$red11">
          Stripe publishable key is missing. Contact support to configure payments.
        </Text>
      </Card>
    )
  }

  if (!clientSecret) {
    return (
      <YStack gap="$3">
        <Text fontSize="$4" fontWeight="600">
          Add Payment Method
        </Text>
        <Text color="$color11" fontSize="$3">
          Click the button below to securely add a payment method for this organization.
        </Text>
        {config.testMode && (
          <Text fontSize="$2" color="$orange11">
            Stripe test mode is active. Use test card numbers only.
          </Text>
        )}
        <XStack gap="$2">
          <Button size="$4" theme="blue" onPress={handleInitialize} disabled={isInitializing}>
            {isInitializing ? (
              <XStack gap="$2" items="center">
                <Spinner size="small" color="white" />
                <Text>Initializing…</Text>
              </XStack>
            ) : (
              'Continue'
            )}
          </Button>
          <Button size="$4" variant="outlined" onPress={onCancel}>
            Cancel
          </Button>
        </XStack>
      </YStack>
    )
  }

  if (!options) {
    return null
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      <SetupIntentFormInner
        organizationId={organizationId}
        onSuccess={onSuccess}
        onCancel={onCancel}
        testMode={config.testMode}
      />
    </Elements>
  )
}

type InnerProps = SetupIntentFormProps & {
  testMode: boolean
}

function SetupIntentFormInner({ organizationId, onSuccess, onCancel, testMode }: InnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const savePaymentMethodMutation = api.payments.savePaymentMethod.useMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setIsSubmitting(true)
    setErrorMessage(null)

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message ?? 'Unable to confirm setup. Try again.')
      setIsSubmitting(false)
      return
    }

    if (setupIntent && setupIntent.status === 'succeeded' && setupIntent.payment_method) {
      try {
        await savePaymentMethodMutation.mutateAsync({
          organizationId,
          paymentMethodId:
            typeof setupIntent.payment_method === 'string'
              ? setupIntent.payment_method
              : setupIntent.payment_method.id,
        })
        await onSuccess()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save payment method'
        setErrorMessage(message)
        setIsSubmitting(false)
      }
    } else {
      setErrorMessage('Setup did not complete. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card p="$4" borderColor="$borderColor" borderWidth={1} gap="$3">
      <YStack gap="$1">
        <Text fontSize="$4" fontWeight="600">
          Add Payment Method
        </Text>
        {testMode && (
          <Text fontSize="$2" color="$orange11">
            Stripe test mode is active. Use test card numbers only.
          </Text>
        )}
      </YStack>

      <PaymentElement />

      {errorMessage ? (
        <Card p="$3" bg="$red2" borderColor="$red6" borderWidth={1}>
          <XStack gap="$2" items="center">
            <Text color="$red11" fontSize="$3" flex={1}>
              {errorMessage}
            </Text>
          </XStack>
        </Card>
      ) : null}

      <XStack gap="$2">
        <Button
          size="$4"
          theme="blue"
          disabled={isSubmitting || !stripe || !elements}
          onPress={handleSubmit}
          flex={1}
        >
          {isSubmitting ? (
            <XStack gap="$2" items="center">
              <Spinner size="small" color="white" />
              <Text>Saving…</Text>
            </XStack>
          ) : (
            'Save Payment Method'
          )}
        </Button>
        <Button size="$4" variant="outlined" onPress={onCancel}>
          Cancel
        </Button>
      </XStack>
    </Card>
  )
}
