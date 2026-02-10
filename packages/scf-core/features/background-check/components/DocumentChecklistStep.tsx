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
    <Stack gap="$4" flex={1}>
      <Stack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Upload required documents
        </Text>
        <Text fontSize="$3" color="$color11">
          Provide clear copies of each requested document. Depending on your package, this might
          include government ID, SSN card, or driving history.
        </Text>
      </Stack>

      <Stack gap="$3" flex={1}>
        {requiredDocuments?.length ? (
          requiredDocuments.map((docType) => {
            const isChecked = fulfilledDocuments.has(docType)
            return (
              <Card
                key={docType}
                bordered
                borderRadius="$4"
                padding="$3"
                backgroundColor={isChecked ? '$green3' : '$color2'}
              >
                <Row alignItems="center" gap="$3">
                  <Checkbox
                    size="$4"
                    checked={isChecked}
                    onCheckedChange={(checked) => onToggleDocument(docType, Boolean(checked))}
                  >
                    <Checkbox.Indicator />
                  </Checkbox>
                  <Stack gap="$1" flex={1}>
                    <Text fontSize="$4" fontWeight="bold" color="$color12">
                      {docType.replace(/_/g, ' ')}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      Upload a clear photo or PDF of your {docType.replace(/_/g, ' ')}.
                    </Text>
                  </Stack>
                </Row>
              </Card>
            )
          })
        ) : (
          <Card bordered borderRadius="$4" padding="$3" backgroundColor="$color2">
            <Text fontSize="$3" color="$color11">
              No documents are required for this package.
            </Text>
          </Card>
        )}
      </Stack>

      <Button size="$4" theme="blue" disabled={!allDocumentsProvided} onPress={onContinue}>
        Continue
      </Button>
    </Stack>
  )
})
