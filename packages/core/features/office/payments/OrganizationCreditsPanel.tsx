import { api } from '@app/core/utils/api'
import { CreditCard, DollarSign, Plus } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Button, Card, Input, Spinner, Text, XStack, YStack } from 'tamagui'

type OrganizationCreditsPanelProps = {
  organizationId: string
}

const formatCurrency = (cents: number, currency = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export function OrganizationCreditsPanel({ organizationId }: OrganizationCreditsPanelProps) {
  const toast = useToastController()
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const creditsQuery = api.payments.getAccountCredits.useQuery(
    { organizationId },
    {
      enabled: Boolean(organizationId),
      staleTime: 30_000,
    }
  )

  const ledgerQuery = api.payments.getCreditLedger.useQuery(
    { organizationId, limit: 10 },
    {
      enabled: Boolean(organizationId),
      staleTime: 30_000,
    }
  )

  const depositMutation = api.payments.depositCredits.useMutation({
    onSuccess: () => {
      toast.show('Credits deposited', {
        message: 'Your account credits have been updated successfully.',
      })
      creditsQuery.refetch()
      ledgerQuery.refetch()
      setShowDepositForm(false)
      setDepositAmount('')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show('Failed to deposit credits', {
        message,
        type: 'error',
      })
    },
  })

  const _handleDepositSubmit = async (_paymentIntentId: string) => {
    const amountCents = Math.round(Number.parseFloat(depositAmount) * 100)
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.show('Invalid amount', {
        message: 'Please enter a valid amount greater than zero.',
        type: 'error',
      })
      return
    }

    // The PaymentIntentForm will handle the payment, but we need to trigger
    // the deposit after payment succeeds. For now, we'll use the webhook
    // to handle this automatically when the payment succeeds.
    // The depositCredits endpoint creates the PaymentIntent and records it.
    // The webhook should handle the credit deposit when payment succeeds.
  }

  const credits = creditsQuery.data
  const isLoading = creditsQuery.isLoading

  if (isLoading) {
    return (
      <Card bordered padding="$4">
        <YStack gap="$3" items="center" py="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading account credits…</Text>
        </YStack>
      </Card>
    )
  }

  return (
    <Card bordered padding="$4" gap="$3">
      <XStack justify="space-between" items="center">
        <YStack>
          <Text fontSize="$5" fontWeight="600">
            Account Credits
          </Text>
          <Text color="$color10" fontSize="$2">
            Pre-funded balance for automatic payments
          </Text>
        </YStack>
        {!showDepositForm && (
          <Button size="$3" theme="blue" icon={Plus} onPress={() => setShowDepositForm(true)}>
            Add Credits
          </Button>
        )}
      </XStack>

      {/* Balance Display */}
      <Card p="$4" bg="$color2" borderColor="$borderColor" borderWidth={1}>
        <XStack gap="$3" items="center">
          <DollarSign size={32} color="$green11" />
          <YStack flex={1}>
            <Text fontSize="$2" color="$color10">
              Current Balance
            </Text>
            <Text fontSize="$6" fontWeight="700" color="$green11">
              {formatCurrency(credits?.balanceCents ?? 0, credits?.currency)}
            </Text>
          </YStack>
        </XStack>
      </Card>

      {showDepositForm ? (
        <YStack gap="$3">
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="600">
              Deposit Amount
            </Text>
            <Input
              placeholder="0.00"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
              size="$4"
            />
            <Text fontSize="$2" color="$color10">
              Enter the amount you want to add to your account credits.
            </Text>
          </YStack>
          <XStack gap="$2">
            <Button
              size="$4"
              variant="outlined"
              onPress={() => {
                setShowDepositForm(false)
                setDepositAmount('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="$4"
              theme="blue"
              icon={CreditCard}
              onPress={() => {
                const amountCents = Math.round(Number.parseFloat(depositAmount) * 100)
                if (Number.isNaN(amountCents) || amountCents <= 0) {
                  toast.show('Invalid amount', {
                    message: 'Please enter a valid amount greater than zero.',
                    type: 'error',
                  })
                  return
                }
                depositMutation.mutate({
                  organizationId,
                  amountCents,
                })
              }}
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? 'Processing…' : 'Continue to Payment'}
            </Button>
          </XStack>
        </YStack>
      ) : (
        <>
          {/* Recent Transactions */}
          {ledgerQuery.data && ledgerQuery.data.items.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Recent Transactions
              </Text>
              <YStack gap="$1">
                {ledgerQuery.data.items
                  .slice(0, 5)
                  .map(
                    (entry: {
                      id: string
                      description?: string | null
                      transactionType: string
                      createdAt: string
                      amountCents: number
                      direction: 'credit' | 'debit'
                      currency?: string
                    }) => (
                      <XStack
                        key={entry.id}
                        justify="space-between"
                        items="center"
                        p="$2"
                        bg="$color2"
                        rounded="$2"
                      >
                        <YStack flex={1}>
                          <Text fontSize="$3" fontWeight="500">
                            {entry.description ?? entry.transactionType}
                          </Text>
                          <Text fontSize="$2" color="$color10">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </Text>
                        </YStack>
                        <Text
                          fontSize="$4"
                          fontWeight="600"
                          color={entry.direction === 'credit' ? '$green11' : '$red11'}
                        >
                          {entry.direction === 'credit' ? '+' : '-'}
                          {formatCurrency(entry.amountCents, entry.currency)}
                        </Text>
                      </XStack>
                    )
                  )}
              </YStack>
            </YStack>
          )}
        </>
      )}
    </Card>
  )
}
