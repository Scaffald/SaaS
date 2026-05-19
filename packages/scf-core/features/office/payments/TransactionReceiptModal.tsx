import { useTransactionReceipt } from '@scf/core/utils/payments-sdk-hooks'
import { downloadFile } from '@scf/core/utils/platform'
import { Modal, ModalHeader, ModalContent, ModalActions, useThemeContext } from '@scaffald/ui'
import { Card, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const receiptQuery = useTransactionReceipt(transactionId, {
    enabled: open && Boolean(transactionId),
  })

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
      void downloadFile({ url, filename: `${receiptQuery.data.receiptNumber}.txt` })
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Modal visible={open} onClose={() => onOpenChange(false)} width="90%" style={{ maxWidth: 600 }}>
      <ModalHeader title="Transaction Receipt" description="View and download receipt for this transaction." />
      <ModalContent>
        {receiptQuery.isLoading ? (
          <Stack align="center" style={{ paddingVertical: 24 }} gap={12}>
            <Spinner variant="ios" size="lg" />
            <Text style={{ color: colors.text[theme].secondary }}>Loading receipt…</Text>
          </Stack>
        ) : receiptQuery.error ? (
          <Card
            padding="md"
            style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}
            borderColor={theme === "light" ? colors.error[300] : colors.error[700]}
            borderWidth={1}
          >
            <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
              Failed to load receipt: {receiptQuery.error.message}
            </Text>
          </Card>
        ) : receiptQuery.data ? (
          <Stack gap={16}>
            <Card
              padding="md"
              style={{ backgroundColor: colors.bg[theme].subtle }}
              borderColor={colors.border[theme].default}
              borderWidth={1}
            >
              <Stack gap={12}>
                <Row justify="space-between" align="center">
                  <Text>{receiptQuery.data.receiptNumber}</Text>
                  <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>
                    {receiptQuery.data.amount}
                  </Text>
                </Row>
                <Stack gap={8}>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary }}>Date:</Text>
                    <Text>{new Date(receiptQuery.data.date).toLocaleString()}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary }}>Organization:</Text>
                    <Text>{receiptQuery.data.organizationName}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary }}>Type:</Text>
                    <Text>{receiptQuery.data.transactionType}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary }}>Status:</Text>
                    <Text>{receiptQuery.data.status}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[theme].secondary }}>Payment Intent:</Text>
                    <Text style={{ fontFamily: 'monospace' }}>
                      {receiptQuery.data.stripePaymentIntentId}
                    </Text>
                  </Row>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        ) : null}
      </ModalContent>
      <ModalActions
        secondaryAction={{ label: 'Close', onPress: () => onOpenChange(false) }}
        primaryAction={receiptQuery.data ? {
          label: 'Download Receipt',
          onPress: handleDownloadReceipt,
        } : undefined}
      />
    </Modal>
  )
}
