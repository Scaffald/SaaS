import { api } from '@scf/core/utils/api'
import { CreditCard, Plus, Trash2 } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Button, Card, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
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
  const toast = useToastController()
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
      toast.show('Payment method removed', {
        message: 'The payment method has been removed successfully.',
      })
      paymentMethodQuery.refetch()
      setShowAddForm(false)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show('Failed to remove payment method', {
        message,
        type: 'error',
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
    toast.show('Payment method added', {
      message: 'The payment method has been saved successfully.',
    })
    paymentMethodQuery.refetch()
    setShowAddForm(false)
  }

  if (paymentMethodQuery.isLoading) {
    return (
      <Card bordered padding="$4">
        <YStack gap="$3" alignItems="center" paddingVertical="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading payment method…</Text>
        </YStack>
      </Card>
    )
  }

  return (
    <Card bordered padding="$4" gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="600">
          Payment Method
        </Text>
        {!showAddForm && !paymentMethod && (
          <Button size="$3" theme="blue" icon={Plus} onPress={() => setShowAddForm(true)}>
            Add Payment Method
          </Button>
        )}
      </XStack>

      {showAddForm ? (
        <YStack gap="$3">
          <SetupIntentForm
            organizationId={organizationId}
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </YStack>
      ) : paymentMethod ? (
        <YStack gap="$3">
          <XStack
            gap="$3"
            alignItems="center"
            padding="$3"
            backgroundColor="$color2"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <CreditCard size={24} color="$color11" />
            <YStack flex={1} gap="$1">
              <XStack gap="$2" alignItems="center">
                <Text fontWeight="600" fontSize="$4">
                  {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                </Text>
                {paymentMethod.isDefault && (
                  <Text fontSize="$2" color="$blue11" fontWeight="600">
                    Default
                  </Text>
                )}
              </XStack>
              <Text fontSize="$2" color="$color10">
                Expires {formatExpiry(paymentMethod.expMonth, paymentMethod.expYear)}
                {paymentMethod.billingName ? ` • ${paymentMethod.billingName}` : ''}
              </Text>
            </YStack>
            <Button
              size="$2"
              variant="outlined"
              icon={Trash2}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              borderColor="$red8"
              color="$red11"
            >
              Remove
            </Button>
          </XStack>
          <Button size="$3" variant="outlined" icon={Plus} onPress={() => setShowAddForm(true)}>
            Replace Payment Method
          </Button>
        </YStack>
      ) : (
        <YStack gap="$2" padding="$3" backgroundColor="$color2" borderRadius="$4">
          <Text color="$color11" fontSize="$3">
            No payment method on file
          </Text>
          <Text color="$color10" fontSize="$2">
            Add a payment method to enable automatic billing for this organization.
          </Text>
        </YStack>
      )}
    </Card>
  )
}
