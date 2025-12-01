import { api } from '@app/core/utils/api'
import { Dialog } from '@unicornlove/ui'
import { Download, X } from '@tamagui/lucide-icons'
import { Button, Card, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

type TransactionReceiptModalProps = {
  transactionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionReceiptModal({
  transactionId,
  open,
  onOpenChange,
}: TransactionReceiptModalProps) {
  const receiptQuery = api.payments.generateReceipt.useQuery(
    { transactionId },
    {
      enabled: open && Boolean(transactionId),
    }
  )

  const handleDownloadReceipt = () => {
    // TODO: Generate PDF receipt
    // For now, we'll just log the receipt data
    if (receiptQuery.data) {
      const receiptText = `
RECEIPT
Receipt Number: ${receiptQuery.data.receiptNumber}
Date: ${new Date(receiptQuery.data.date).toLocaleDateString()}
Organization: ${receiptQuery.data.organizationName}
Amount: ${receiptQuery.data.amount}
Type: ${receiptQuery.data.transactionType}
Status: ${receiptQuery.data.status}
Stripe Payment Intent: ${receiptQuery.data.stripePaymentIntentId}
      `.trim()

      const blob = new Blob([receiptText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${receiptQuery.data.receiptNumber}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width="90%"
          style={{ maxWidth: 600 }}
        >
          <Dialog.Title>Transaction Receipt</Dialog.Title>
          <Dialog.Description>View and download receipt for this transaction.</Dialog.Description>

          {receiptQuery.isLoading ? (
            <YStack alignItems="center" paddingVertical="$6" gap="$3">
              <Spinner size="large" />
              <Text color="$color10">Loading receipt…</Text>
            </YStack>
          ) : receiptQuery.error ? (
            <Card padding="$4" backgroundColor="$red2" borderColor="$red6" borderWidth={1}>
              <Text color="$red11">Failed to load receipt: {receiptQuery.error.message}</Text>
            </Card>
          ) : receiptQuery.data ? (
            <YStack gap="$4">
              <Card
                padding="$4"
                backgroundColor="$color2"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <YStack gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$5" fontWeight="700">
                      {receiptQuery.data.receiptNumber}
                    </Text>
                    <Text fontSize="$4" fontWeight="600" color="$green11">
                      {receiptQuery.data.amount}
                    </Text>
                  </XStack>
                  <YStack gap="$2">
                    <XStack justifyContent="space-between">
                      <Text color="$color10">Date:</Text>
                      <Text>{new Date(receiptQuery.data.date).toLocaleString()}</Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="$color10">Organization:</Text>
                      <Text>{receiptQuery.data.organizationName}</Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="$color10">Type:</Text>
                      <Text>{receiptQuery.data.transactionType}</Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="$color10">Status:</Text>
                      <Text fontWeight="600">{receiptQuery.data.status}</Text>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Text color="$color10">Payment Intent:</Text>
                      <Text fontSize="$2" style={{ fontFamily: 'monospace' }}>
                        {receiptQuery.data.stripePaymentIntentId}
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>
              </Card>

              <XStack gap="$2" justifyContent="flex-end">
                <Button
                  size="$4"
                  variant="outlined"
                  icon={Download}
                  onPress={handleDownloadReceipt}
                >
                  Download Receipt
                </Button>
                <Button size="$4" variant="outlined" icon={X} onPress={() => onOpenChange(false)}>
                  Close
                </Button>
              </XStack>
            </YStack>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
