import { memo } from 'react'
import { Button, RadioGroup, Text, XStack, YStack } from 'tamagui'

import type { BackgroundCheckPaidBy, PaymentDetails } from '../hooks/useBackgroundCheckForm'

interface PaymentStepProps {
  payment: PaymentDetails
  onUpdatePayment: (updates: Partial<PaymentDetails>) => void
  onComplete: () => void
}

const PAYMENT_OPTIONS: Array<{ value: BackgroundCheckPaidBy; label: string; description: string }> =
  [
    { value: 'worker', label: 'Worker (You)', description: 'You will cover the background check.' },
    {
      value: 'organization',
      label: 'Organization',
      description: 'The hiring organization will cover the cost.',
    },
    { value: 'platform', label: 'Platform', description: 'Platform sponsored screening.' },
  ]

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export const PaymentStep = memo(function PaymentStep({
  payment,
  onUpdatePayment,
  onComplete,
}: PaymentStepProps) {
  const handlePaymentSelection = (value: BackgroundCheckPaidBy) => {
    onUpdatePayment({ paidBy: value })
  }

  const completePayment = () => {
    onUpdatePayment({ status: 'succeeded' })
    onComplete()
  }

  return (
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Payment & Authorization
        </Text>
        <Text fontSize="$3" color="$color11">
          Confirm the payment method for your screening. Any applicable charges will be processed
          securely.
        </Text>
      </YStack>

      <YStack gap="$2" bg="$color2" p="$4" rounded="$4">
        <Text fontSize="$2" color="$color11">
          Total Due
        </Text>
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          {formatCurrency(payment.costCents)}
        </Text>
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="bold" color="$color12">
          Who is covering the cost?
        </Text>
        <RadioGroup
          value={payment.paidBy}
          onValueChange={(value: BackgroundCheckPaidBy) => handlePaymentSelection(value)}
        >
          <YStack gap="$3">
            {PAYMENT_OPTIONS.map((option) => (
              <XStack key={option.value} items="flex-start" gap="$3">
                <RadioGroup.Item value={option.value} size="$4">
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
                <YStack gap="$1" flex={1}>
                  <Text fontSize="$3" color="$color12" fontWeight="bold">
                    {option.label}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    {option.description}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </RadioGroup>
      </YStack>

      <Button
        size="$4"
        theme="blue"
        onPress={completePayment}
      >
        Confirm & Continue
      </Button>
    </YStack>
  )
})
