import { memo, useMemo } from 'react'
import { Button, Card, Checkbox, Text, Row, Stack } from '@unicornlove/beyond-ui'

import type { DocumentDraft } from '../hooks/useBackgroundCheckForm'

interface DocumentChecklistStepProps {
  requiredDocuments: string[] | undefined
  documents: DocumentDraft[]
  onToggleDocument: (documentType: string, provided: boolean) => void
  onContinue: () => void
}

export const DocumentChecklistStep = memo(function DocumentChecklistStep({
  requiredDocuments,
  documents,
  onToggleDocument,
  onContinue,
}: DocumentChecklistStepProps) {
  const fulfilledDocuments = useMemo(() => {
    return new Set(documents.map((doc) => doc.documentType))
  }, [documents])

  const allDocumentsProvided =
    requiredDocuments && requiredDocuments.length > 0
      ? requiredDocuments.every((doc) => fulfilledDocuments.has(doc))
      : true

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text color="$gray11">Upload required documents</Text>
        <Text color="$gray11">
          Provide clear copies of each requested document. Depending on your package, this might
          include government ID, SSN card, or driving history.
        </Text>
      </Stack>

      <Stack gap={12} flex={1}>
        {requiredDocuments?.length ? (
          requiredDocuments.map((docType) => {
            const isChecked = fulfilledDocuments.has(docType)
            return (
              <Card
                key={docType}
                bordered
                borderRadius={16}
                padding="sm"
                backgroundColor={isChecked ? '$green3' : '$color2'}
              >
                <Row align="center" gap={12}>
                  <Checkbox
                    size="md"
                    checked={isChecked}
                    onChange={(checked) => onToggleDocument(docType, Boolean(checked))}
                  >
                    <Checkbox.Indicator />
                  </Checkbox>
                  <Stack gap={4} flex={1}>
                    <Text color="$gray11">{docType.replace(/_/g, ' ')}</Text>
                    <Text color="$gray11">
                      Upload a clear photo or PDF of your {docType.replace(/_/g, ' ')}.
                    </Text>
                  </Stack>
                </Row>
              </Card>
            )
          })
        ) : (
          <Card bordered borderRadius={16} padding="sm" backgroundColor="$color2">
            <Text color="$gray11">No documents are required for this package.</Text>
          </Card>
        )}
      </Stack>

      <Button size="md" color="primary" disabled={!allDocumentsProvided} onPress={onContinue}>
        Continue
      </Button>
    </Stack>
  )
})
