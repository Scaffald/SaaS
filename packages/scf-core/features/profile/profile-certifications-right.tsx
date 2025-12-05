import { api } from '@scf/core/utils/api'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { Button, DashboardWidget } from '@unicornlove/ui'
import {
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Upload,
} from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Card, H4, Input, ScrollView, Text, XStack, YStack } from '@unicornlove/ui'
import { useProfileCertificationsHighlight } from './profile-certifications-highlight-context'

interface UserCertification {
  id: string
  certification_id: string
  credential_url: string | null
  certificate_file_path: string | null
  catalog: {
    title: string
    description: string | null
    depth: number
  }
}

interface CertificationTree {
  depth0: UserCertification[]
  depth1ByParent: Record<string, UserCertification[]>
  depth2ByParent: Record<string, UserCertification[]>
}

/**
 * Profile Certifications Right Component
 * Displays all certifications at all depth levels with proof management
 */
export function ProfileCertificationsRight() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({})
  const { highlights: recentlyChangedCerts } = useProfileCertificationsHighlight()

  const { data: certTree, refetch: refetchTree } =
    api.profile.certifications.getUserCertificationTree.useQuery()

  const updateProof = api.profile.certifications.updateCertificationProof.useMutation({
    onSuccess: () => refetchTree(),
  })

  const removeCert = api.profile.certifications.toggleSpecificCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  // Get all certifications at all depth levels
  const getAllCertifications = (): {
    depth0: UserCertification[]
    depth1: UserCertification[]
    depth2: UserCertification[]
  } => {
    const typedTree = certTree as unknown as CertificationTree | undefined
    if (!typedTree) {
      return { depth0: [], depth1: [], depth2: [] }
    }

    const depth0 = typedTree.depth0 || []
    const depth1: UserCertification[] = []
    const depth2: UserCertification[] = []

    // Flatten depth 1 certifications
    for (const items of Object.values(typedTree.depth1ByParent || {})) {
      if (Array.isArray(items)) {
        depth1.push(...items)
      }
    }

    // Flatten depth 2 certifications
    for (const items of Object.values(typedTree.depth2ByParent || {})) {
      if (Array.isArray(items)) {
        depth2.push(...items)
      }
    }

    return { depth0, depth1, depth2 }
  }

  const { depth0, depth1, depth2 } = getAllCertifications()
  const allCerts = [...depth0, ...depth1, ...depth2]

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

  if (allCerts.length === 0) {
    return (
      <DashboardWidget>
        <YStack gap="$4" alignItems="center" paddingTop="$8">
          <Award size={48} color="$color11" />
          <YStack gap="$2" alignItems="center">
            <H4>Your Certifications</H4>
            <Text color="$color11">Search and add certifications on the left</Text>
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
          <YStack gap="$4">
            {/* Depth 0 - Top Level Categories */}
            {depth0.length > 0 && (
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4" color="$blue11">
                  Top-Level Categories
                </Text>
                {depth0.map((cert) => {
                  const changeStatus = recentlyChangedCerts[cert.certification_id]
                  return (
                    <Card
                      key={cert.id}
                      padding="$3"
                      bordered
                      animation="quick"
                      backgroundColor={
                        changeStatus === 'added'
                          ? '$green2'
                          : changeStatus === 'removed'
                            ? '$red2'
                            : '$color1'
                      }
                      borderColor={
                        changeStatus === 'added'
                          ? '$green7'
                          : changeStatus === 'removed'
                            ? '$red7'
                            : '$borderColor'
                      }
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack flex={1} gap="$1">
                          <XStack gap="$2" alignItems="center">
                            <Text fontWeight="600">{cert.catalog.title}</Text>
                            <Text
                              fontSize="$1"
                              color="$blue9"
                              backgroundColor="$blue2"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius="$2"
                            >
                              Top Level
                            </Text>
                          </XStack>
                          {cert.catalog.description && (
                            <Text fontSize="$2" color="$color11">
                              {cert.catalog.description}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                      {changeStatus === 'added' && (
                        <Text marginTop="$2" fontSize="$2" color="$green11">
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  )
                })}
              </YStack>
            )}

            {/* Depth 1 - Categories */}
            {depth1.length > 0 && (
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4" color="$green11">
                  Sub-Categories
                </Text>
                {depth1.map((cert) => {
                  const changeStatus = recentlyChangedCerts[cert.certification_id]
                  return (
                    <Card
                      key={cert.id}
                      padding="$3"
                      bordered
                      animation="quick"
                      backgroundColor={
                        changeStatus === 'added'
                          ? '$green2'
                          : changeStatus === 'removed'
                            ? '$red2'
                            : '$color1'
                      }
                      borderColor={
                        changeStatus === 'added'
                          ? '$green7'
                          : changeStatus === 'removed'
                            ? '$red7'
                            : '$borderColor'
                      }
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack flex={1} gap="$1">
                          <XStack gap="$2" alignItems="center">
                            <Text fontWeight="600">{cert.catalog.title}</Text>
                            <Text
                              fontSize="$1"
                              color="$green9"
                              backgroundColor="$green2"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius="$2"
                            >
                              Category
                            </Text>
                          </XStack>
                          {cert.catalog.description && (
                            <Text fontSize="$2" color="$color11">
                              {cert.catalog.description}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                      {changeStatus === 'added' && (
                        <Text marginTop="$2" fontSize="$2" color="$green11">
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  )
                })}
              </YStack>
            )}

            {/* Depth 2 - Specific Certifications */}
            {depth2.length > 0 && (
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4" color="$purple11">
                  Specific Certifications
                </Text>
                {depth2.map((cert) => {
                  const isExpanded = expandedCards.has(cert.id)
                  const hasProof = !!(cert.credential_url || cert.certificate_file_path)
                  const changeStatus = recentlyChangedCerts[cert.certification_id]

                  return (
                    <Card
                      key={cert.id}
                      padding="$0"
                      bordered
                      animation="quick"
                      backgroundColor={
                        changeStatus === 'added'
                          ? '$green2'
                          : changeStatus === 'removed'
                            ? '$red2'
                            : undefined
                      }
                      borderColor={
                        changeStatus === 'added'
                          ? '$green7'
                          : changeStatus === 'removed'
                            ? '$red7'
                            : '$borderColor'
                      }
                    >
                      {/* Header - Always Visible */}
                      <XStack
                        padding="$3"
                        gap="$3"
                        alignItems="center"
                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                        cursor="pointer"
                        onPress={() => toggleExpand(cert.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={20} color="$color11" />
                        ) : (
                          <ChevronRight size={20} color="$color11" />
                        )}

                        <YStack flex={1} gap="$1">
                          <XStack gap="$2" alignItems="center" flexWrap="wrap">
                            <Text fontWeight="600">{cert.catalog.title}</Text>
                            <Text
                              fontSize="$1"
                              color="$purple9"
                              backgroundColor="$purple2"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius="$2"
                            >
                              Certification
                            </Text>
                          </XStack>
                          {hasProof && (
                            <Text fontSize="$2" color="$green10">
                              ✓ Proof added
                            </Text>
                          )}
                          {changeStatus === 'added' && (
                            <Text fontSize="$2" color="$green11">
                              ✓ Added to profile
                            </Text>
                          )}
                          {changeStatus === 'removed' && (
                            <Text fontSize="$2" color="$red11">
                              Removed from profile
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
                            theme="error"
                          >
                            Remove
                          </Button>
                        </XStack>
                      </XStack>

                      {/* Expanded Content - File Upload & URL */}
                      {isExpanded && (
                        <YStack
                          padding="$3"
                          paddingTop="$0"
                          gap="$4"
                          borderTopWidth={1}
                          borderColor="$borderColor"
                        >
                          {/* File Upload */}
                          <YStack gap="$2">
                            <Text fontWeight="600" fontSize="$3">
                              Upload Certificate
                            </Text>
                            <XStack gap="$2" style={{ alignItems: 'center' }}>
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
                                backgroundColor={selectedFiles[cert.id] ? '$blue9' : undefined}
                              >
                                {selectedFiles[cert.id]
                                  ? selectedFiles[cert.id]?.name
                                  : 'Choose File'}
                              </Button>
                              {selectedFiles[cert.id] && (
                                <Button
                                  icon={<Upload size={16} />}
                                  onPress={() => handleSaveFile(cert.id)}
                                  disabled={updateProof.isPending}
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
                                variant="primary"
                                icon={<ExternalLink size={16} />}
                                onPress={() => handleSaveUrl(cert.id)}
                                disabled={!urlInputs[cert.id] || updateProof.isPending}
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
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </DashboardWidget>
  )
}
