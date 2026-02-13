import { api } from '@scf/core/utils/api'
import { Dialog } from '@unicornlove/beyond-ui'
import { Download, X } from 'lucide-react-native'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
          gap={16}
          width="90%"
          style={{ maxWidth: 600 }}
        >
          <Dialog.Title>Transaction Receipt</Dialog.Title>
          <Dialog.Description>View and download receipt for this transaction.</Dialog.Description>

          {receiptQuery.isLoading ? (
            <Stack align="center" paddingVertical={24} gap={12}>
              <Spinner size="lg" />
              <Text color="gray">Loading receipt…</Text>
            </Stack>
          ) : receiptQuery.error ? (
            <Card padding={16} backgroundColor="$red2" borderColor="$red6" borderWidth={1}>
              <Text color="$red11">Failed to load receipt: {receiptQuery.error.message}</Text>
            </Card>
          ) : receiptQuery.data ? (
            <Stack gap={16}>
              <Card
                padding={16}
                backgroundColor="$color2"
                borderColor="$borderColor"
                borderWidth={1}
              >
                <Stack gap={12}>
                  <Row justify="space-between" align="center">
                    <Text>{receiptQuery.data.receiptNumber}</Text>
                    <Text color="$green11">{receiptQuery.data.amount}</Text>
                  </Row>
                  <Stack gap={8}>
                    <Row justify="space-between">
                      <Text color="gray">Date:</Text>
                      <Text>{new Date(receiptQuery.data.date).toLocaleString()}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text color="gray">Organization:</Text>
                      <Text>{receiptQuery.data.organizationName}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text color="gray">Type:</Text>
                      <Text>{receiptQuery.data.transactionType}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text color="gray">Status:</Text>
                      <Text>{receiptQuery.data.status}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text color="gray">Payment Intent:</Text>
                      <Text style={{ fontFamily: 'monospace' }}>
                        {receiptQuery.data.stripePaymentIntentId}
                      </Text>
                    </Row>
                  </Stack>
                </Stack>
              </Card>

              <Row gap={8} justify="flex-end">
                <Button size={16} variant="outline" icon={Download} onPress={handleDownloadReceipt}>
                  Download Receipt
                </Button>
                <Button size={16} variant="outline" icon={X} onPress={() => onOpenChange(false)}>
                  Close
                </Button>
              </Row>
            </Stack>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
