import { Text, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
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
  const { theme } = useThemeContext()
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100)

  return (
    <Card padding="md" style={{ backgroundColor: colors.bg[theme].warning, borderColor: colors.border[theme].warning }} borderWidth={1}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[theme].primary }}>Web payment required</Text>
        <Text style={{ color: colors.text[theme].warning }}>
          Payments must currently be completed in the web experience. Please switch to the browser
          to pay {amount}.
        </Text>
      </Stack>
    </Card>
  )
}
