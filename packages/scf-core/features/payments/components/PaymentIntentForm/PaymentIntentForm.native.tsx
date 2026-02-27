import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Card } from '@scaffald/ui'

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
    <Card
      padding="md"
      style={{
        backgroundColor: theme === "light" ? colors.yellow[50] : colors.yellow[900],
        borderColor: theme === "light" ? colors.yellow[300] : colors.yellow[700],
      }}
      borderWidth={1}
    >
      <Stack gap={8}>
        <Text style={{ color: colors.text[theme].primary }}>Web payment required</Text>
        <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>
          Payments must currently be completed in the web experience. Please switch to the browser
          to pay {amount}.
        </Text>
      </Stack>
    </Card>
  )
}
