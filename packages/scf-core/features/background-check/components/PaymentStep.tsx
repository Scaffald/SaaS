import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import { memo, useEffect } from 'react'
import { Button, Text, Stack } from '@unicornlove/beyond-ui'

import type { PaymentDetails } from '../hooks/useBackgroundCheckForm'

type PaymentSessionState = {
  backgroundCheckId: string
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

interface PaymentStepProps {
  payment: PaymentDetails
  selectedPackage?: { display_name?: string | null } | null
  onUpdatePayment: (updates: Partial<PaymentDetails>) => void
  paymentSession: PaymentSessionState | null
  isCreatingSession: boolean
  isConfirmingPayment: boolean
  submitError: Error | null
  onCreatePaymentSession: () => Promise<unknown>
  onPaymentSuccess: (paymentIntentId: string) => Promise<void> | void
}

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export const PaymentStep = memo(function PaymentStep({
  payment,
  selectedPackage,
  onUpdatePayment,
  paymentSession,
  isCreatingSession,
  isConfirmingPayment,
  submitError,
  onCreatePaymentSession,
  onPaymentSuccess,
}: PaymentStepProps) {
  useEffect(() => {
    if (payment.paidBy !== 'worker') {
      onUpdatePayment({ paidBy: 'worker' })
    }
  }, [onUpdatePayment, payment.paidBy])

  const canCreateSession = Boolean(payment.costCents && selectedPackage)

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text color="$gray11">Payment & Authorization</Text>
        <Text color="$gray11">
          Pay for your screening securely with Stripe. Charges are non-refundable and required
          before we can submit your background check.
        </Text>
      </Stack>

      <Stack gap={8} backgroundColor="$color2" padding="md" borderRadius={16}>
        <Text color="$gray11">Total Due</Text>
        <Text color="$gray11">{formatCurrency(payment.costCents)}</Text>
        <Text color="$gray11">
          Package: {selectedPackage?.display_name ?? 'Select a package to continue'}
        </Text>
      </Stack>

      {submitError && (
        <Stack backgroundColor="$red3" padding="sm" borderRadius={12}>
          <Text color="$red11">{submitError.message}</Text>
        </Stack>
      )}

      {!paymentSession && (
        <Button
          size="md"
          color="primary"
          disabled={!canCreateSession || isCreatingSession || isConfirmingPayment}
          onPress={() => onCreatePaymentSession()}
        >
          {isCreatingSession ? 'Preparing payment form…' : 'Continue to secure payment'}
        </Button>
      )}

      {paymentSession && (
        <PaymentIntentForm
          clientSecret={paymentSession.clientSecret}
          amountCents={paymentSession.amountCents}
          description={`Background check: ${selectedPackage?.display_name ?? 'Selected package'}`}
          submitLabel={isConfirmingPayment ? 'Processing…' : 'Pay & start screening'}
          disabled={isConfirmingPayment}
          onSuccess={(paymentIntentId) => onPaymentSuccess(paymentIntentId)}
        />
      )}
    </Stack>
  )
})
