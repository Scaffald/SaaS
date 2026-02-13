import { ExternalLink, Link as LinkIcon, Upload, X } from 'lucide-react-native'
import { type ChangeEvent, useState } from 'react'
import { Button, Card, Input, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface CertificationProofCardProps {
  certificationTitle: string
  proofType?: 'file' | 'url' | null
  proofValue?: string | null
  onSaveProof: (type: 'file' | 'url', value: string) => Promise<void>
  onRemoveProof?: () => Promise<void>
  onClose: () => void
}

/**
 * Card for adding/editing certification proof (file or URL)
 * Displayed in right column when user clicks "Add Proof"
 */
export function CertificationProofCard({
  certificationTitle,
  proofType,
  proofValue,
  onSaveProof,
  onRemoveProof,
  onClose,
}: CertificationProofCardProps) {
  const [mode, setMode] = useState<'file' | 'url'>(proofType || 'url')
  const [urlInput, setUrlInput] = useState(proofValue || '')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        await onSaveProof('file', base64)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return
    setUploading(true)
    try {
      await onSaveProof('url', urlInput)
    } catch (error) {
      console.error('URL save error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card padding="md" elevation="sm" style={{ borderWidth: 1, borderColor: '$gray6' }}>
      <Stack gap={16}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Add Proof</Text>
          <Button size="xs" circular chromeless onPress={onClose}>
            <X size="lg" />
          </Button>
        </Row>

        <Text color="$gray11">{certificationTitle}</Text>

        <Row gap={8}>
          <Button
            style={{ flex: 1 }}
            variant="outline"
            onPress={() => setMode('url')}
            color={mode === 'url' ? 'primary' : undefined}
          >
            Link URL
          </Button>
          <Button
            style={{ flex: 1 }}
            variant="outline"
            onPress={() => setMode('file')}
            color={mode === 'file' ? 'primary' : undefined}
          >
            Upload File
          </Button>
        </Row>

        {mode === 'url' ? (
          <Stack gap={12}>
            <Input
              placeholder="https://example.com/certificate.pdf"
              value={urlInput}
              onChangeText={setUrlInput}
            />
            <Button
              onPress={handleUrlSave}
              disabled={!urlInput.trim() || uploading}
            >
              <Row gap={8} align="center">
                <LinkIcon size="lg" />
                <Text>{uploading ? 'Saving...' : 'Save Link'}</Text>
              </Row>
            </Button>
          </Stack>
        ) : (
          <Stack gap={12}>
            <Button
              onPress={() => document.getElementById('cert-file-input')?.click()}
              disabled={uploading}
            >
              <Row gap={8} align="center">
                <Upload size="lg" />
                <Text>{uploading ? 'Uploading...' : 'Choose File'}</Text>
              </Row>
            </Button>
            <input
              id="cert-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Text color="$gray11" style={{ textAlign: 'center' }}>
              Accepted formats: PDF, JPG, PNG
            </Text>
          </Stack>
        )}

        {proofValue && (
          <Stack gap={8} style={{ paddingTop: 12, borderTopWidth: 1, borderColor: '$gray6' }}>
            <Text>Current Proof</Text>
            <Row gap={8} style={{ alignItems: 'center' }}>
              <Button
                size="sm"
                style={{ flex: 1 }}
                variant="outline"
                onPress={() => proofType === 'url' && window.open(proofValue, '_blank')}
              >
                <Row gap={8} align="center">
                  <ExternalLink size="lg" />
                  <Text size="sm">{proofType === 'url' ? 'View Link' : 'View File'}</Text>
                </Row>
              </Button>
              {onRemoveProof && (
                <Button
                  size="sm"
                  variant="outline"
                  color="error"
                  onPress={onRemoveProof}
                  disabled={uploading}
                >
                  Remove
                </Button>
              )}
            </Row>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
