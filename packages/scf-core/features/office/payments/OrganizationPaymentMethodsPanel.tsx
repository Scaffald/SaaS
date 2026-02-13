import { api } from '@scf/core/utils/api'
import { CreditCard, Plus, Trash2 } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { SetupIntentForm } from './SetupIntentForm'

type OrganizationPaymentMethodsPanelProps = {
  organizationId: string
}

const formatCardBrand = (brand: string | null | undefined): string => {
  if (!brand) return 'Card'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

const formatExpiry = (month: number | null, year: number | null): string => {
  if (!month || !year) return ''
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

export function OrganizationPaymentMethodsPanel({
  organizationId,
}: OrganizationPaymentMethodsPanelProps) {
  const toast = useToast()
  const [showAddForm, setShowAddForm] = useState(false)

  const paymentMethodQuery = api.payments.getPaymentMethod.useQuery(
    { organizationId },
    {
      enabled: Boolean(organizationId),
      staleTime: 60_000,
    }
  )

  const deleteMutation = api.payments.deletePaymentMethod.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Payment method removed',
        message: 'The payment method has been removed successfully.',
      })
      paymentMethodQuery.refetch()
      setShowAddForm(false)
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Failed to remove payment method',
        variant: 'error',
      })
    },
  })

  const paymentMethod = paymentMethodQuery.data

  const handleDelete = () => {
    if (!paymentMethod?.id) return

    if (
      !confirm('Are you sure you want to remove this payment method? This action cannot be undone.')
    ) {
      return
    }

    deleteMutation.mutate({ organizationPaymentMethodId: paymentMethod.id })
  }

  const handleAddSuccess = () => {
    toast.show({
      title: 'Payment method added',
      message: 'The payment method has been saved successfully.',
    })
    paymentMethodQuery.refetch()
    setShowAddForm(false)
  }

  if (paymentMethodQuery.isLoading) {
    return (
      <Card bordered padding="md">
        <Stack gap={12} align="center" paddingVertical={16}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading payment method…</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card bordered padding="md" gap={12}>
      <Row justify="space-between" align="center">
        <Text>Payment Method</Text>
        {!showAddForm && !paymentMethod && (
          <Button size="sm" color="primary" icon={Plus} onPress={() => setShowAddForm(true)}>
            Add Payment Method
          </Button>
        )}
      </Row>

      {showAddForm ? (
        <Stack gap={12}>
          <SetupIntentForm
            organizationId={organizationId}
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </Stack>
      ) : paymentMethod ? (
        <Stack gap={12}>
          <Row
            gap={12}
            align="center"
            padding="sm"
            backgroundColor="$color2"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <CreditCard size={24} color="$gray11" />
            <Stack flex={1} gap={4}>
              <Row gap={8} align="center">
                <Text>
                  {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                </Text>
                {paymentMethod.isDefault && <Text color="$blue11">Default</Text>}
              </Row>
              <Text color="$gray11">
                Expires {formatExpiry(paymentMethod.expMonth, paymentMethod.expYear)}
                {paymentMethod.billingName ? ` • ${paymentMethod.billingName}` : ''}
              </Text>
            </Stack>
            <Button
              size="xs"
              variant="outline"
              icon={Trash2}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              borderColor="$red8"
              color="$red11"
            >
              Remove
            </Button>
          </Row>
          <Button size="sm" variant="outline" icon={Plus} onPress={() => setShowAddForm(true)}>
            Replace Payment Method
          </Button>
        </Stack>
      ) : (
        <Stack gap={8} padding="sm" backgroundColor="$color2" borderRadius={16}>
          <Text color="$gray11">No payment method on file</Text>
          <Text color="$gray11">
            Add a payment method to enable automatic billing for this organization.
          </Text>
        </Stack>
      )}
    </Card>
  )
}
