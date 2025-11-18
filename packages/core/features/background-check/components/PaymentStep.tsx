import { memo, useEffect } from 'react'
import { Button, Text, YStack } from 'tamagui'

import { PaymentIntentForm } from '@app/core/features/payments/components/PaymentIntentForm'

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
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Payment & Authorization
        </Text>
        <Text fontSize="$3" color="$color11">
          Pay for your screening securely with Stripe. Charges are non-refundable and required
          before we can submit your background check.
        </Text>
      </YStack>

      <YStack gap="$2" bg="$color2" p="$4" rounded="$4">
        <Text fontSize="$2" color="$color11">
          Total Due
        </Text>
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          {formatCurrency(payment.costCents)}
        </Text>
        <Text fontSize="$2" color="$color10">
          Package: {selectedPackage?.display_name ?? 'Select a package to continue'}
        </Text>
      </YStack>

      {submitError && (
        <YStack bg="$red3" p="$3" rounded="$3">
          <Text color="$red11">{submitError.message}</Text>
        </YStack>
      )}

      {!paymentSession && (
        <Button
          size="$4"
          theme="blue"
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
    </YStack>
  )
})
