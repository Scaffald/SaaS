import { YStack, XStack, Text, Spinner, Separator } from 'tamagui'
import { DashboardWidget, EmptyState, Heading, LoadingState, spacing, UIButton } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { Linking } from 'react-native'
import { Award, CheckCircle } from '@tamagui/lucide-icons'
import type { ProfileWidgetProps } from './types'
import { formatDate } from '../utils/date-formatting'

interface UserCertification {
  id: string
  name: string
  issuing_organization: string | null
  issue_date: string | null
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
  does_not_expire: boolean | null
}

/**
 * CertificationsWidget
 * Displays user's professional certifications
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function CertificationsWidget({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  const router = useRouter()
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = api.profile.widgets.getCertifications.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading certifications..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load certifications</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <Button
            variant="primary"
            size="small"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </YStack>
      </DashboardWidget>
    )
  }

  const certifications = data || []
  const showCompact = variant === 'compact'

  // Helper to check if certification is expired
  const isExpired = (cert: UserCertification): boolean => {
    if (cert.does_not_expire) return false
    if (!cert.expiration_date) return false
    return new Date(cert.expiration_date) < new Date()
  }

  // Separate active and expired certifications
  const activeCerts = certifications.filter((cert: UserCertification) => !isExpired(cert))
  const expiredCerts = certifications.filter((cert: UserCertification) => isExpired(cert))

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Certifications</Heading>
          {showEdit && (
            <UIButton
              variant="outlined"
              size="$2"
              onPress={() => router.push('/dashboard/profile/certifications')}
            >
              Edit
            </UIButton>
          )}
        </XStack>

        {certifications.length === 0 ? (
          <EmptyState
            icon={<Award />}
            title="No certifications added yet"
            description="Add your professional certifications and licenses"
            action={
              showEdit ? (
                <UIButton
                  variant="primary"
                  onPress={() => router.push('/dashboard/profile/certifications')}
                >
                  Add Certification
                </UIButton>
              ) : undefined
            }
          />
        ) : (
          <YStack gap="$4">
            {/* Active Certifications */}
            {activeCerts.length > 0 && (
              <YStack gap="$3">
                {activeCerts
                  .slice(0, showCompact ? 3 : undefined)
                  .map((cert: UserCertification, index: number) => (
                    <YStack key={cert.id} gap="$2">
                      {/* Certification Name & Organization */}
                      <YStack gap="$1">
                        <XStack gap="$2" items="center">
                          <Text fontSize="$4" fontWeight="600">
                            {cert.name}
                          </Text>
                          <XStack
                            bg="$blue2"
                            px="$2"
                            py="$0.5"
                            rounded="$2"
                            borderWidth={1}
                            borderColor="$blue7"
                          >
                            <CheckCircle size={12} color="$blue11" />
                            <Text color="$blue11" fontSize="$1" fontWeight="600" ml="$1">
                              Active
                            </Text>
                          </XStack>
                        </XStack>
                        {cert.issuing_organization && (
                          <Text fontSize="$3" color="$color11">
                            {cert.issuing_organization}
                          </Text>
                        )}
                      </YStack>

                      {/* Dates */}
                      <XStack gap="$4" flexWrap="wrap">
                        {cert.issue_date && (
                          <YStack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Issued
                            </Text>
                            <Text fontSize="$2">{formatDate(cert.issue_date)}</Text>
                          </YStack>
                        )}
                        {!cert.does_not_expire && cert.expiration_date && (
                          <YStack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Expires
                            </Text>
                            <Text fontSize="$2">{formatDate(cert.expiration_date)}</Text>
                          </YStack>
                        )}
                        {cert.does_not_expire && (
                          <YStack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Validity
                            </Text>
                            <Text fontSize="$2">No Expiration</Text>
                          </YStack>
                        )}
                      </XStack>

                      {/* Credential Details */}
                      {!showCompact && (cert.credential_id || cert.credential_url) && (
                        <XStack gap="$4" flexWrap="wrap">
                          {cert.credential_id && (
                            <YStack gap="$1">
                              <Text fontSize="$2" color="$color10">
                                Credential ID
                              </Text>
                              <Text fontSize="$2">{cert.credential_id}</Text>
                            </YStack>
                          )}
                          {cert.credential_url && (
                            <YStack gap="$1">
                              <Text fontSize="$2" color="$color10">
                                Verification
                              </Text>
                              <Text
                                fontSize="$2"
                                color="$blue7"
                                textDecorationLine="underline"
                                cursor="pointer"
                                hoverStyle={{ color: '$blue8' }}
                                onPress={() => Linking.openURL(cert.credential_url || '')}
                              >
                                View Certificate →
                              </Text>
                            </YStack>
                          )}
                        </XStack>
                      )}

                      {/* Separator */}
                      {index < activeCerts.length - 1 && <Separator my="$2" />}
                    </YStack>
                  ))}
              </YStack>
            )}

            {/* Expired Certifications (collapsed by default, only in full variant) */}
            {!showCompact && expiredCerts.length > 0 && (
              <YStack gap="$3">
                <Text fontSize="$3" fontWeight="600" color="$color11">
                  Expired ({expiredCerts.length})
                </Text>
                {expiredCerts.slice(0, 2).map((cert: UserCertification) => (
                  <YStack key={cert.id} gap="$1" opacity={0.6}>
                    <XStack gap="$2" items="center">
                      <Text fontSize="$3" fontWeight="600">
                        {cert.name}
                      </Text>
                      <XStack
                        bg="$color3"
                        px="$2"
                        py="$0.5"
                        rounded="$2"
                        borderWidth={1}
                        borderColor="$color6"
                      >
                        <Text color="$color10" fontSize="$1" fontWeight="600">
                          Expired
                        </Text>
                      </XStack>
                    </XStack>
                    {cert.issuing_organization && (
                      <Text fontSize="$2" color="$color11">
                        {cert.issuing_organization}
                      </Text>
                    )}
                  </YStack>
                ))}
              </YStack>
            )}

            {/* Show More link for compact view */}
            {showCompact && certifications.length > 3 && (
              <Text
                color="$blue7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$blue8' }}
                pressStyle={{ color: '$blue9' }}
                onPress={() => router.push('/dashboard/profile/certifications')}
              >
                View all {certifications.length} certifications →
              </Text>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
