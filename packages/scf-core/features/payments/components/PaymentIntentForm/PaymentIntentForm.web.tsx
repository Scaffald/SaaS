import { Button, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { PaymentIntent, StripeElementsOptions } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useMemo, useState } from 'react'
import { Card } from '@unicornlove/beyond-ui'

import { useStripeConfig } from '../../hooks/useStripeConfig'

type PaymentIntentFormProps = {
  clientSecret: string
  amountCents: number
  description?: string
  submitLabel?: string
  onSuccess: (paymentIntentId: string, intent?: PaymentIntent | null) => void | Promise<void>
  disabled?: boolean
}

export function PaymentIntentForm(props: PaymentIntentFormProps) {
  const { clientSecret, amountCents } = props
  const config = useStripeConfig(Boolean(clientSecret))

  const stripePromise = useMemo(() => {
    if (!config.publishableKey) return null
    return loadStripe(config.publishableKey)
  }, [config.publishableKey])

  const options: StripeElementsOptions | null = useMemo(() => {
    if (!clientSecret) return null
    return {
      clientSecret,
      appearance: {
        theme: 'flat',
        labels: 'floating',
        variables: {
          colorText: 'hsl(206,6%,25%)',
          colorDanger: 'hsl(359,72%,55%)',
          borderRadius: '8px',
        },
      },
    }
  }, [clientSecret])

  if (config.isLoading || !options || !stripePromise) {
    return (
      <Card padding="$3" backgroundColor="$color2" borderColor="$borderColor" borderWidth={1}>
        <Text fontSize="$3" color="$color11">
          Preparing secure payment form…
        </Text>
      </Card>
    )
  }

  if (!config.publishableKey) {
    return (
      <Card padding="$3" backgroundColor="$red2" borderColor="$red6" borderWidth={1}>
        <Text color="$red11">
          Stripe publishable key is missing. Contact support to configure payments.
        </Text>
      </Card>
    )
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      <PaymentIntentFormInner {...props} amountCents={amountCents} testMode={config.testMode} />
    </Elements>
  )
}

type InnerProps = PaymentIntentFormProps & {
  testMode: boolean
}

function PaymentIntentFormInner({
  amountCents,
  description,
  submitLabel = 'Pay now',
  onSuccess,
  disabled,
  testMode,
}: InnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    []
  )

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setIsSubmitting(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message ?? 'Unable to confirm payment. Try again.')
      setIsSubmitting(false)
      return
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
    ) {
      await onSuccess(paymentIntent.id, paymentIntent)
    } else {
      setErrorMessage('Payment did not complete. Please try again.')
      setIsSubmitting(false)
    }
  }

  const amountLabel = currencyFormatter.format(amountCents / 100)

  return (
    <Card padding="$4" borderColor="$borderColor" borderWidth={1} gap="$3">
      <Stack gap="$1">
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" fontWeight="600">
            Charge amount
          </Text>
          <Text fontSize="$5" fontWeight="700">
            {amountLabel}
          </Text>
        </Row>
        {description ? (
          <Text fontSize="$3" color="$color11">
            {description}
          </Text>
        ) : null}
        {testMode && (
          <Text fontSize="$2" color="$orange11">
            Stripe test mode is active. Use test card numbers only.
          </Text>
        )}
      </Stack>

      <PaymentElement />

      {errorMessage ? (
        <Card padding="$3" backgroundColor="$red2" borderColor="$red6" borderWidth={1}>
          <Row gap="$2" alignItems="center">
            <Text color="$red11" fontSize="$3" flex={1}>
              {errorMessage}
            </Text>
          </Row>
        </Card>
      ) : null}

      <Button
        size="$4"
        theme="blue"
        disabled={disabled || isSubmitting || !stripe || !elements}
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <Row gap="$2" alignItems="center">
            <Spinner size="small" color="white" />
            <Text>Processing…</Text>
          </Row>
        ) : (
          submitLabel
        )}
      </Button>
    </Card>
  )
}
