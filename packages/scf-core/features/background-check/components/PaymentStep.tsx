import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import { memo, useEffect } from 'react'
import { Button, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  useEffect(() => {
    if (payment.paidBy !== 'worker') {
      onUpdatePayment({ paidBy: 'worker' })
    }
  }, [onUpdatePayment, payment.paidBy])

  const canCreateSession = Boolean(payment.costCents && selectedPackage)

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Payment & Authorization</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Pay for your screening securely with Stripe. Charges are non-refundable and required
          before we can submit your background check.
        </Text>
      </Stack>

      <Stack gap={8} style={{ backgroundColor: colors.bg[t].muted }} padding="md" borderRadius={16}>
        <Text style={{ color: colors.text[t].secondary }}>Total Due</Text>
        <Text style={{ color: colors.text[t].secondary }}>{formatCurrency(payment.costCents)}</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Package: {selectedPackage?.display_name ?? 'Select a package to continue'}
        </Text>
      </Stack>

      {submitError && (
        <Stack style={{ backgroundColor: t === 'dark' ? colors.error[900] : colors.error[50] }} padding="sm" borderRadius={12}>
          <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>{submitError.message}</Text>
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
