/**
 * DocumentReviewStep - Document review with uploader information
 * Merge document review step
 * Merge workflow document review step
 *
 * Lists documents associated with the manual user with uploader info,
 * preview/download links, and acknowledgment checkbox.
 */
import { useState, useCallback } from 'react'
import { Stack, Row, Text, H2, Card } from '@unicornlove/beyond-ui'
import { FileText, Calendar, User, Download, ExternalLink, Check, Loader2 } from 'lucide-react'
import Button from '../Common/Button'

interface Document {
  id: string
  name: string
  uploadedBy: string
  uploadedAt: string
  fileType: string
  previewUrl?: string
}

interface DocumentReviewStepProps {
  documents: Document[]
  onComplete: () => void
  onBack: () => void
  isLoading?: boolean
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get file type icon color
 */
function getFileTypeColor(fileType: string): string {
  const typeColors: Record<string, string> = {
    pdf: 'var(--color-red-10)',
    doc: 'var(--color-blue-10)',
    docx: 'var(--color-blue-10)',
    xls: 'var(--color-green-10)',
    xlsx: 'var(--color-green-10)',
    image: 'var(--color-purple-10)',
    jpg: 'var(--color-purple-10)',
    jpeg: 'var(--color-purple-10)',
    png: 'var(--color-purple-10)',
  }
  return typeColors[fileType.toLowerCase()] || 'var(--color-text-muted)'
}

/**
 * Format file type for display
 */
function formatFileType(fileType: string): string {
  return fileType.toUpperCase()
}

export function DocumentReviewStep({
  documents,
  onComplete,
  onBack,
  isLoading = false,
}: DocumentReviewStepProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  // Handle acknowledgment toggle
  const handleAcknowledge = useCallback(() => {
    setAcknowledged((prev) => !prev)
  }, [])

  // Handle continue
  const handleContinue = useCallback(() => {
    if (documents.length === 0 || acknowledged) {
      onComplete()
    }
  }, [documents.length, acknowledged, onComplete])

  // If no documents, show simple message and continue
  if (documents.length === 0) {
    return (
      <Stack alignItems="center" gap={24}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={32} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <Stack alignItems="center" gap={8}>
          <H2 style={{ fontSize: 24, fontWeight: 700 }}>No Documents to Review</H2>
          <Text size="md" muted style={{ textAlign: 'center' }}>
            There are no documents associated with the manual account to transfer.
          </Text>
        </Stack>
        <Button variant="primary" onPress={onComplete} size="lg" disabled={isLoading}>
          {isLoading ? (
            <Row alignItems="center" gap={8}>
              <Loader2 size={16} className="animate-spin" />
              <span>Processing...</span>
            </Row>
          ) : (
            'Complete Merge'
          )}
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={24}>
      {/* Header */}
      <Stack gap={8}>
        <H2 style={{ fontSize: 28, fontWeight: 700 }}>Review Documents</H2>
        <Text size="md" muted>
          The following documents were uploaded for your manual profile. They will be transferred to
          your new account.
        </Text>
      </Stack>

      {/* Document count */}
      <Card
        style={{
          padding: 16,
          backgroundColor: 'var(--color-gray-2)',
          borderRadius: 12,
        }}
      >
        <Row alignItems="center" gap={12}>
          <FileText size={20} style={{ color: 'var(--color-text-muted)' }} />
          <Text size="sm" weight="medium">
            {documents.length} document{documents.length === 1 ? '' : 's'} will be transferred
          </Text>
        </Row>
      </Card>

      {/* Document list */}
      <Stack gap={12}>
        {documents.map((doc) => (
          <Card
            key={doc.id}
            style={{
              padding: 16,
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
            }}
          >
            <Row alignItems="flex-start" gap={16}>
              {/* File type icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: 'var(--color-gray-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={24} style={{ color: getFileTypeColor(doc.fileType) }} />
              </div>

              {/* Document info */}
              <Stack gap={8} style={{ flex: 1, minWidth: 0 }}>
                <Row alignItems="center" justifyContent="space-between" gap={8}>
                  <Text
                    size="md"
                    weight="semibold"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.name}
                  </Text>
                  <span
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 2,
                      paddingBottom: 2,
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 4,
                      backgroundColor: 'var(--color-gray-3)',
                      color: getFileTypeColor(doc.fileType),
                      flexShrink: 0,
                    }}
                  >
                    {formatFileType(doc.fileType)}
                  </span>
                </Row>

                <Row gap={16} style={{ flexWrap: 'wrap' }}>
                  <Row alignItems="center" gap={6}>
                    <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <Text size="sm" muted>
                      Uploaded by {doc.uploadedBy}
                    </Text>
                  </Row>

                  <Row alignItems="center" gap={6}>
                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <Text size="sm" muted>
                      {formatDate(doc.uploadedAt)}
                    </Text>
                  </Row>
                </Row>

                {/* Action buttons */}
                {doc.previewUrl && (
                  <Row gap={8} style={{ marginTop: 4 }}>
                    <a
                      href={doc.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--color-blue-10)',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={12} />
                      Preview
                    </a>
                    <a
                      href={doc.previewUrl}
                      download
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--color-blue-10)',
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={12} />
                      Download
                    </a>
                  </Row>
                )}
              </Stack>
            </Row>
          </Card>
        ))}
      </Stack>

      {/* Acknowledgment checkbox */}
      <Card
        onPress={handleAcknowledge}
        style={{
          padding: 16,
          cursor: 'pointer',
          backgroundColor: acknowledged ? 'var(--color-green-2)' : 'var(--color-background)',
          border: acknowledged ? '2px solid var(--color-green-8)' : '1px solid var(--color-border)',
          borderRadius: 12,
          transition: 'all 0.15s ease',
        }}
        role="checkbox"
        aria-checked={acknowledged}
      >
        <Row alignItems="flex-start" gap={12}>
          {/* Checkbox */}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: acknowledged ? 'none' : '2px solid var(--color-border)',
              backgroundColor: acknowledged ? 'var(--color-green-10)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {acknowledged && <Check size={14} color="white" strokeWidth={3} />}
          </div>

          <Stack gap={4} style={{ flex: 1 }}>
            <Text size="md" weight="medium">
              I acknowledge receipt of these documents
            </Text>
            <Text size="sm" muted>
              By checking this box, you confirm that you have reviewed the documents and agree to
              have them transferred to your account.
            </Text>
          </Stack>
        </Row>
      </Card>

      {/* Navigation buttons */}
      <Row gap={12} style={{ marginTop: 16 }}>
        <Button variant="ghost" onPress={onBack} disabled={isLoading} style={{ flex: 1 }}>
          Back
        </Button>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!acknowledged || isLoading}
          style={{ flex: 2 }}
        >
          {isLoading ? (
            <Row alignItems="center" gap={8}>
              <Loader2 size={16} className="animate-spin" />
              <span>Completing Merge...</span>
            </Row>
          ) : (
            'Complete Merge'
          )}
        </Button>
      </Row>
    </Stack>
  )
}

export default DocumentReviewStep
