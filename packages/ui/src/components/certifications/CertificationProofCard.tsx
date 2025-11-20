import { ExternalLink, Link as LinkIcon, Upload, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Card, Input, Text, XStack, YStack } from 'tamagui'

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <Card p="$4" bordered>
      <YStack gap="$4">
        <XStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text fontWeight="600" fontSize="$5">
            Add Proof
          </Text>
          <Button size="$2" circular chromeless icon={X} onPress={onClose} />
        </XStack>

        <Text fontSize="$3" color="$color11">
          {certificationTitle}
        </Text>

        <XStack gap="$2">
          <Button
            flex={1}
            variant="outlined"
            onPress={() => setMode('url')}
            theme={mode === 'url' ? 'blue' : undefined}
          >
            Link URL
          </Button>
          <Button
            flex={1}
            variant="outlined"
            onPress={() => setMode('file')}
            theme={mode === 'file' ? 'blue' : undefined}
          >
            Upload File
          </Button>
        </XStack>

        {mode === 'url' ? (
          <YStack gap="$3">
            <Input
              placeholder="https://example.com/certificate.pdf"
              value={urlInput}
              onChangeText={setUrlInput}
            />
            <Button
              onPress={handleUrlSave}
              disabled={!urlInput.trim() || uploading}
              icon={LinkIcon}
            >
              {uploading ? 'Saving...' : 'Save Link'}
            </Button>
          </YStack>
        ) : (
          <YStack gap="$3">
            <Button
              onPress={() => document.getElementById('cert-file-input')?.click()}
              disabled={uploading}
              icon={Upload}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
            <input
              id="cert-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Text fontSize="$2" color="$color11" style={{ textAlign: 'center' }}>
              Accepted formats: PDF, JPG, PNG
            </Text>
          </YStack>
        )}

        {proofValue && (
          <YStack gap="$2" pt="$3" borderTopWidth={1} borderColor="$borderColor">
            <Text fontSize="$3" fontWeight="600">
              Current Proof
            </Text>
            <XStack gap="$2" style={{ alignItems: 'center' }}>
              <Button
                size="$2"
                flex={1}
                variant="outlined"
                icon={ExternalLink}
                onPress={() => proofType === 'url' && window.open(proofValue, '_blank')}
              >
                {proofType === 'url' ? 'View Link' : 'View File'}
              </Button>
              {onRemoveProof && (
                <Button
                  size="$2"
                  variant="outlined"
                  theme="error"
                  onPress={onRemoveProof}
                  disabled={uploading}
                >
                  Remove
                </Button>
              )}
            </XStack>
          </YStack>
        )}
      </YStack>
    </Card>
  )
}
