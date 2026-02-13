import { Text, Stack } from '@unicornlove/beyond-ui'
import { Card } from '@unicornlove/beyond-ui'

type PaymentIntentFormProps = {
  clientSecret?: string
  amountCents: number
  description?: string
  submitLabel?: string
  disabled?: boolean
  onSuccess?: (paymentIntentId: string) => void | Promise<void>
}

export function PaymentIntentForm({ amountCents }: PaymentIntentFormProps) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100)

  return (
    <Card padding={16} backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={1}>
      <Stack gap={8}>
        <Text color="$yellow12">
          Web payment required
        </Text>
        <Text color="$yellow11">
          Payments must currently be completed in the web experience. Please switch to the browser
          to pay {amount}.
        </Text>
      </Stack>
    </Card>
  )
}
