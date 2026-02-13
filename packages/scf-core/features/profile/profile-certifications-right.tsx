import {
  useUserCertificationTree,
  useUpdateCertificationProofMutation,
  useToggleSpecificCertificationMutation,
} from '@scf/core/utils/profile-certifications-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { Button, DashboardWidget } from '@unicornlove/beyond-ui'
import {
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  Upload,
} from 'lucide-react-native'
import { useState } from 'react'
import { Card, H4, Input, ScrollView, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
  const queryClient = useQueryClient()

  const { data: certTree } = useUserCertificationTree()

  const updateProof = useUpdateCertificationProofMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'certifications', 'tree'] })
    },
  })

  const removeCert = useToggleSpecificCertificationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'certifications', 'tree'] })
    },
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
        <Stack gap={16} align="center" paddingTop={32}>
          <Award size={48} color="gray" />
          <Stack gap={8} align="center">
            <H4>Your Certifications</H4>
            <Text color="gray">Search and add certifications on the left</Text>
          </Stack>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        <H4>Your Certifications</H4>

        <ScrollView height={700}>
          <Stack gap={16}>
            {/* Depth 0 - Top Level Categories */}
            {depth0.length > 0 && (
              <Stack gap={8}>
                <Text color="$blue11">
                  Top-Level Categories
                </Text>
                {depth0.map((cert) => {
                  const changeStatus = recentlyChangedCerts[cert.certification_id]
                  return (
                    <Card
                      key={cert.id}
                      padding={12}
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
                      <Row justify="space-between" align="center">
                        <Stack flex={1} gap={4}>
                          <Row gap={8} align="center">
                            <Text>{cert.catalog.title}</Text>
                            <Text
                              color="$blue9"
                              backgroundColor="$blue2"
                              paddingHorizontal={8}
                              paddingVertical={2}
                              borderRadius={8}
                            >
                              Top Level
                            </Text>
                          </Row>
                          {cert.catalog.description && (
                            <Text color="gray">
                              {cert.catalog.description}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      {changeStatus === 'added' && (
                        <Text marginTop={8} color="$green11">
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  )
                })}
              </Stack>
            )}

            {/* Depth 1 - Categories */}
            {depth1.length > 0 && (
              <Stack gap={8}>
                <Text color="$green11">
                  Sub-Categories
                </Text>
                {depth1.map((cert) => {
                  const changeStatus = recentlyChangedCerts[cert.certification_id]
                  return (
                    <Card
                      key={cert.id}
                      padding={12}
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
                      <Row justify="space-between" align="center">
                        <Stack flex={1} gap={4}>
                          <Row gap={8} align="center">
                            <Text>{cert.catalog.title}</Text>
                            <Text
                              color="$green9"
                              backgroundColor="$green2"
                              paddingHorizontal={8}
                              paddingVertical={2}
                              borderRadius={8}
                            >
                              Category
                            </Text>
                          </Row>
                          {cert.catalog.description && (
                            <Text color="gray">
                              {cert.catalog.description}
                            </Text>
                          )}
                        </Stack>
                      </Row>
                      {changeStatus === 'added' && (
                        <Text marginTop={8} color="$green11">
                          ✓ Added to profile
                        </Text>
                      )}
                    </Card>
                  )
                })}
              </Stack>
            )}

            {/* Depth 2 - Specific Certifications */}
            {depth2.length > 0 && (
              <Stack gap={8}>
                <Text color="$purple11">
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
                      <Row
                        padding={12}
                        gap={12}
                        align="center"
                        pressStyle={{ backgroundColor: '$backgroundHover' }}
                        cursor="pointer"
                        onPress={() => toggleExpand(cert.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={20} color="gray" />
                        ) : (
                          <ChevronRight size={20} color="gray" />
                        )}

                        <Stack flex={1} gap={4}>
                          <Row gap={8} align="center" flexWrap="wrap">
                            <Text>{cert.catalog.title}</Text>
                            <Text
                              color="$purple9"
                              backgroundColor="$purple2"
                              paddingHorizontal={8}
                              paddingVertical={2}
                              borderRadius={8}
                            >
                              Certification
                            </Text>
                          </Row>
                          {hasProof && (
                            <Text color="$green10">
                              ✓ Proof added
                            </Text>
                          )}
                          {changeStatus === 'added' && (
                            <Text color="$green11">
                              ✓ Added to profile
                            </Text>
                          )}
                          {changeStatus === 'removed' && (
                            <Text color="$red11">
                              Removed from profile
                            </Text>
                          )}
                        </Stack>

                        <Row gap={8}>
                          {hasProof && (
                            <Button
                              size={8}
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
                            size={8}
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
                        </Row>
                      </Row>

                      {/* Expanded Content - File Upload & URL */}
                      {isExpanded && (
                        <Stack
                          padding={12}
                          paddingTop="$0"
                          gap={16}
                          borderTopWidth={1}
                          borderColor="$borderColor"
                        >
                          {/* File Upload */}
                          <Stack gap={8}>
                            <Text>
                              Upload Certificate
                            </Text>
                            <Row gap={8} style={{ alignItems: 'center' }}>
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
                            </Row>
                            {cert.certificate_file_path && (
                              <Text color="gray">
                                Current: {cert.certificate_file_path.split('/').pop()}
                              </Text>
                            )}
                          </Stack>

                          {/* URL Input */}
                          <Stack gap={8}>
                            <Text>
                              Or Add URL
                            </Text>
                            <Row gap={8}>
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
                            </Row>
                            {cert.credential_url && (
                              <Text color="gray">
                                Current: {cert.credential_url}
                              </Text>
                            )}
                          </Stack>
                        </Stack>
                      )}
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </ScrollView>
      </Stack>
    </DashboardWidget>
  )
}
