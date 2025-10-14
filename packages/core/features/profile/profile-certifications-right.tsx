import { useState } from 'react'
import { YStack, Text, H4, Card, XStack, Button, Input, ScrollView } from 'tamagui'
import {
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Upload,
} from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { getStorageUrl } from '@app/core/utils/supabase/storage'

interface UserCertification {
  id: string
  certification_id: string
  credential_url: string | null
  certificate_file_path: string | null
  catalog: {
    title: string
    description: string | null
  }
}

interface CertificationTree {
  depth0: UserCertification[]
  depth1ByParent: Record<string, UserCertification[]>
  depth2ByParent: Record<string, UserCertification[]>
}

/**
 * Profile Certifications Right Component
 * Displays all checked certifications with proof management
 */
export function ProfileCertificationsRight() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({})

  const { data: certTree, refetch: refetchTree } =
    api.profile.certifications.getUserCertificationTree.useQuery()

  const updateProof = api.profile.certifications.updateCertificationProof.useMutation({
    onSuccess: () => refetchTree(),
  })

  const removeCert = api.profile.certifications.toggleSpecificCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  // Get all depth 2 certifications (the ones with checkboxes)
  const allDepth2Certs: UserCertification[] = []
  if (certTree) {
    const typedTree = certTree as unknown as CertificationTree
    const depth2ByParent = typedTree.depth2ByParent || {}
    for (const items of Object.values(depth2ByParent)) {
      if (Array.isArray(items)) {
        allDepth2Certs.push(...items)
      }
    }
  }

  const toggleExpand = (certId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(certId)) {
        next.delete(certId)
      } else {
        next.add(certId)
      }
      return next
    })
  }

  const handleFileSelect = (userCertId: string, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [userCertId]: file }))
  }

  const handleSaveFile = async (userCertId: string) => {
    const file = selectedFiles[userCertId]
    if (!file) return

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await updateProof.mutateAsync({
        user_certification_id: userCertId,
        proof_type: 'file',
        certificate_file: base64,
        file_name: file.name,
        content_type: file.type,
      })
      setSelectedFiles((prev) => ({ ...prev, [userCertId]: null }))
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const handleSaveUrl = async (userCertId: string) => {
    const url = urlInputs[userCertId]
    if (!url) return

    try {
      await updateProof.mutateAsync({
        user_certification_id: userCertId,
        proof_type: 'url',
        credential_url: url,
      })
      setUrlInputs((prev) => ({ ...prev, [userCertId]: '' }))
    } catch (error) {
      console.error('Error saving URL:', error)
    }
  }

  const handleRemove = async (userCert: UserCertification) => {
    const confirmed = confirm(`Remove ${userCert.catalog.title}?`)
    if (!confirmed) return

    try {
      await removeCert.mutateAsync({
        certification_id: userCert.certification_id,
        parent_id: userCert.certification_id, // This will be the depth 1 category
        checked: false,
      })
    } catch (error) {
      console.error('Error removing certification:', error)
    }
  }

  if (allDepth2Certs.length === 0) {
    return (
      <DashboardWidget>
        <YStack gap="$4" alignItems="center" paddingTop="$8">
          <Award size={48} color="$color11" />
          <YStack gap="$2" alignItems="center">
            <H4>Your Certifications</H4>
            <Text color="$color11">Check certifications on the left to add them here</Text>
          </YStack>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <H4>Your Certifications</H4>

        <ScrollView height={700}>
          <YStack gap="$3">
            {allDepth2Certs.map((cert) => {
              const isExpanded = expandedCards.has(cert.id)
              const hasProof = !!(cert.credential_url || cert.certificate_file_path)

              return (
                <Card key={cert.id} p="$0" bordered>
                  {/* Header - Always Visible */}
                  <XStack
                    p="$3"
                    gap="$3"
                    items="center"
                    pressStyle={{ bg: '$backgroundHover' }}
                    cursor="pointer"
                    onPress={() => toggleExpand(cert.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={20} color="$color11" />
                    ) : (
                      <ChevronRight size={20} color="$color11" />
                    )}

                    <YStack flex={1} gap="$1">
                      <Text fontWeight="600">{cert.catalog.title}</Text>
                      {hasProof && (
                        <Text fontSize="$2" color="$green10">
                          ✓ Proof added
                        </Text>
                      )}
                    </YStack>

                    <XStack gap="$2">
                      {hasProof && (
                        <Button
                          size="$2"
                          chromeless
                          icon={<ExternalLink size={16} />}
                          onPress={(e) => {
                            e.stopPropagation()
                            const url =
                              cert.credential_url ||
                              getStorageUrl('certifications', cert.certificate_file_path)
                            if (url) window.open(url, '_blank')
                          }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="$2"
                        chromeless
                        icon={<Trash2 size={16} />}
                        onPress={(e) => {
                          e.stopPropagation()
                          handleRemove(cert)
                        }}
                        theme="red"
                      >
                        Remove
                      </Button>
                    </XStack>
                  </XStack>

                  {/* Expanded Content - File Upload & URL */}
                  {isExpanded && (
                    <YStack p="$3" pt="$0" gap="$4" borderTopWidth={1} borderColor="$borderColor">
                      {/* File Upload */}
                      <YStack gap="$2">
                        <Text fontWeight="600" fontSize="$3">
                          Upload Certificate
                        </Text>
                        <XStack gap="$2" alignItems="center">
                          <Button
                            flex={1}
                            icon={<Upload size={16} />}
                            onPress={() => {
                              // Trigger file input
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = '.pdf,.jpg,.jpeg,.png'
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                handleFileSelect(cert.id, file || null)
                              }
                              input.click()
                            }}
                            theme={selectedFiles[cert.id] ? 'active' : undefined}
                          >
                            {selectedFiles[cert.id] ? selectedFiles[cert.id]?.name : 'Choose File'}
                          </Button>
                          {selectedFiles[cert.id] && (
                            <Button
                              icon={<Upload size={16} />}
                              onPress={() => handleSaveFile(cert.id)}
                              disabled={updateProof.isLoading}
                            >
                              Upload
                            </Button>
                          )}
                        </XStack>
                        {cert.certificate_file_path && (
                          <Text fontSize="$2" color="$color11">
                            Current: {cert.certificate_file_path.split('/').pop()}
                          </Text>
                        )}
                      </YStack>

                      {/* URL Input */}
                      <YStack gap="$2">
                        <Text fontWeight="600" fontSize="$3">
                          Or Add URL
                        </Text>
                        <XStack gap="$2">
                          <Input
                            flex={1}
                            placeholder="https://..."
                            value={urlInputs[cert.id] || ''}
                            onChangeText={(text) =>
                              setUrlInputs((prev) => ({ ...prev, [cert.id]: text }))
                            }
                          />
                          <Button
                            icon={<ExternalLink size={16} />}
                            onPress={() => handleSaveUrl(cert.id)}
                            disabled={!urlInputs[cert.id] || updateProof.isLoading}
                          >
                            Save
                          </Button>
                        </XStack>
                        {cert.credential_url && (
                          <Text fontSize="$2" color="$color11">
                            Current: {cert.credential_url}
                          </Text>
                        )}
                      </YStack>
                    </YStack>
                  )}
                </Card>
              )
            })}
          </YStack>
        </ScrollView>
      </YStack>
    </DashboardWidget>
  )
}
