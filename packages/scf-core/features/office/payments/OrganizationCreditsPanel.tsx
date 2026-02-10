import { api } from '@scf/core/utils/api'
import { CreditCard, DollarSign, Plus } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, Card, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const toast = useToast()
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
      toast.show({
          title: 'Credits deposited',
          message: 'Your account credits have been updated successfully.',
        })
      creditsQuery.refetch()
      ledgerQuery.refetch()
      setShowDepositForm(false)
      setDepositAmount('')
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
          title: 'Failed to deposit credits',
          variant: 'error',
        })
    },
  })

  const _handleDepositSubmit = async (_paymentIntentId: string) => {
    const amountCents = Math.round(Number.parseFloat(depositAmount) * 100)
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.show({
          title: 'Invalid amount',
          message: 'Please enter a valid amount greater than zero.',
          variant: 'error',
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
        <Stack gap="$3" alignItems="center" paddingVertical="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading account credits…</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card bordered padding="$4" gap="$3">
      <Row justifyContent="space-between" alignItems="center">
        <Stack>
          <Text fontSize="$5" fontWeight="600">
            Account Credits
          </Text>
          <Text color="$color10" fontSize="$2">
            Pre-funded balance for automatic payments
          </Text>
        </Stack>
        {!showDepositForm && (
          <Button size="$3" theme="blue" icon={Plus} onPress={() => setShowDepositForm(true)}>
            Add Credits
          </Button>
        )}
      </Row>

      {/* Balance Display */}
      <Card padding="$4" backgroundColor="$color2" borderColor="$borderColor" borderWidth={1}>
        <Row gap="$3" alignItems="center">
          <DollarSign size={32} color="$green11" />
          <Stack flex={1}>
            <Text fontSize="$2" color="$color10">
              Current Balance
            </Text>
            <Text fontSize="$6" fontWeight="700" color="$green11">
              {formatCurrency(credits?.balanceCents ?? 0, credits?.currency)}
            </Text>
          </Stack>
        </Row>
      </Card>

      {showDepositForm ? (
        <Stack gap="$3">
          <Stack gap="$2">
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
          </Stack>
          <Row gap="$2">
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
                  toast.show({
          title: 'Invalid amount',
          message: 'Please enter a valid amount greater than zero.',
          variant: 'error',
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
          </Row>
        </Stack>
      ) : (
        <>
          {/* Recent Transactions */}
          {ledgerQuery.data && ledgerQuery.data.items.length > 0 && (
            <Stack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Recent Transactions
              </Text>
              <Stack gap="$1">
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
                      <Row
                        key={entry.id}
                        justifyContent="space-between"
                        alignItems="center"
                        padding="$2"
                        backgroundColor="$color2"
                        borderRadius="$2"
                      >
                        <Stack flex={1}>
                          <Text fontSize="$3" fontWeight="500">
                            {entry.description ?? entry.transactionType}
                          </Text>
                          <Text fontSize="$2" color="$color10">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </Text>
                        </Stack>
                        <Text
                          fontSize="$4"
                          fontWeight="600"
                          color={entry.direction === 'credit' ? '$green11' : '$red11'}
                        >
                          {entry.direction === 'credit' ? '+' : '-'}
                          {formatCurrency(entry.amountCents, entry.currency)}
                        </Text>
                      </Row>
                    )
                  )}
              </Stack>
            </Stack>
          )}
        </>
      )}
    </Card>
  )
}
