import { api } from '@scf/core/utils/api'
import { CreditCard, DollarSign, Plus } from 'lucide-react-native'
import { useToast , useThemeContext} from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, Card, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
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
      <Card bordered padding="md">
        <Stack gap={12} align="center" paddingVertical={16}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading account credits…</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card bordered padding="md" gap={12}>
      <Row justify="space-between" align="center">
        <Stack>
          <Text>Account Credits</Text>
          <Text style={{ color: colors.text[theme].secondary }}>Pre-funded balance for automatic payments</Text>
        </Stack>
        {!showDepositForm && (
          <Button size="sm" color="primary" iconStart={Plus} onPress={() => setShowDepositForm(true)}>
            Add Credits
          </Button>
        )}
      </Row>

      {/* Balance Display */}
      <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }} borderColor={colors.border[theme].default} borderWidth={1}>
        <Row gap={12} align="center">
          <DollarSign size={32} style={{ color: colors.text[theme].success }} />
          <Stack flex={1}>
            <Text style={{ color: colors.text[theme].secondary }}>Current Balance</Text>
            <Text style={{ color: colors.text[theme].success }}>
              {formatCurrency(credits?.balanceCents ?? 0, credits?.currency)}
            </Text>
          </Stack>
        </Row>
      </Card>

      {showDepositForm ? (
        <Stack gap={12}>
          <Stack gap={8}>
            <Text>Deposit Amount</Text>
            <Input
              placeholder="0.00"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
              size="md"
            />
            <Text style={{ color: colors.text[theme].secondary }}>Enter the amount you want to add to your account credits.</Text>
          </Stack>
          <Row gap={8}>
            <Button
              size="md"
              variant="outline"
              onPress={() => {
                setShowDepositForm(false)
                setDepositAmount('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="md"
              color="primary"
              iconStart={CreditCard}
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
            <Stack gap={8}>
              <Text>Recent Transactions</Text>
              <Stack gap={4}>
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
                        justify="space-between"
                        align="center"
                        padding="xs"
                        style={{ backgroundColor: colors.bg[theme].subtle }}
                        borderRadius={8}
                      >
                        <Stack flex={1}>
                          <Text>{entry.description ?? entry.transactionType}</Text>
                          <Text style={{ color: colors.text[theme].secondary }}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
                        </Stack>
                        <Text style={{ color: entry.direction === 'credit' ? colors.text[theme].success : colors.text[theme].error }}>
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
