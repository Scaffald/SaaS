import { memo, useMemo } from 'react'
import { Button, Card, Checkbox, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

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
        <Text style={{ color: colors.text[t].secondary }}>Upload required documents</Text>
        <Text style={{ color: colors.text[t].secondary }}>
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
                radius="lg"
                padding="sm"
                style={{
                  backgroundColor: isChecked
                    ? (t === 'dark' ? colors.green[900] : colors.green[50])
                    : colors.bg[t].muted,
                }}
              >
                <Row align="center" gap={12}>
                  <Checkbox
                    size="md"
                    checked={isChecked}
                    onChange={(checked) => onToggleDocument(docType, Boolean(checked))}
                    labelElement={
                      <Stack gap={4} flex={1}>
                        <Text style={{ color: colors.text[t].secondary }}>{docType.replace(/_/g, ' ')}</Text>
                        <Text style={{ color: colors.text[t].secondary }}>
                          Upload a clear photo or PDF of your {docType.replace(/_/g, ' ')}.
                        </Text>
                      </Stack>
                    }
                  />
                </Row>
              </Card>
            )
          })
        ) : (
          <Card bordered radius="lg" padding="sm" style={{ backgroundColor: colors.bg[t].muted }}>
            <Text style={{ color: colors.text[t].secondary }}>No documents are required for this package.</Text>
          </Card>
        )}
      </Stack>

      <Button size="md" color="primary" disabled={!allDocumentsProvided} onPress={onContinue}>
        Continue
      </Button>
    </Stack>
  )
})
