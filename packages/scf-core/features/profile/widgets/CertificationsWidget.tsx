import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} from '@unicornlove/beyond-ui'
import { Award, CheckCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Linking } from 'react-native'
import { Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { formatDate } from '../utils/date-formatting'
import type { ProfileWidgetProps } from './types'

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
  const { data, isLoading, error, refetch, isFetching } =
    api.profile.widgets.getCertifications.useQuery(
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
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load certifications</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <Button
            variant="primary"
            size="$2"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
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
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Certifications</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        {certifications.length === 0 ? (
          <EmptyState
            icon={<Award />}
            title="No certifications added yet"
            description="Add your professional certifications and licenses"
            action={
              showEdit ? (
                <Button
                  variant="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)}
                >
                  Add Certification
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack gap="$4">
            {/* Active Certifications */}
            {activeCerts.length > 0 && (
              <Stack gap="$3">
                {activeCerts
                  .slice(0, showCompact ? 3 : undefined)
                  .map((cert: UserCertification, index: number) => (
                    <Stack key={cert.id} gap="$2">
                      {/* Certification Name & Organization */}
                      <Stack gap="$1">
                        <Row gap="$2" alignItems="center">
                          <Text fontSize="$4" fontWeight="600">
                            {cert.name}
                          </Text>
                          <Row
                            backgroundColor="$blue2"
                            paddingHorizontal="$2"
                            paddingVertical="$0.5"
                            borderRadius="$2"
                            borderWidth={1}
                            borderColor="$blue7"
                          >
                            <CheckCircle size={12} color="$blue11" />
                            <Text color="$blue11" fontSize="$1" fontWeight="600" marginLeft="$1">
                              Active
                            </Text>
                          </Row>
                        </Row>
                        {cert.issuing_organization && (
                          <Text fontSize="$3" color="$color11">
                            {cert.issuing_organization}
                          </Text>
                        )}
                      </Stack>

                      {/* Dates */}
                      <Row gap="$4" flexWrap="wrap">
                        {cert.issue_date && (
                          <Stack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Issued
                            </Text>
                            <Text fontSize="$2">{formatDate(cert.issue_date)}</Text>
                          </Stack>
                        )}
                        {!cert.does_not_expire && cert.expiration_date && (
                          <Stack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Expires
                            </Text>
                            <Text fontSize="$2">{formatDate(cert.expiration_date)}</Text>
                          </Stack>
                        )}
                        {cert.does_not_expire && (
                          <Stack gap="$1">
                            <Text fontSize="$2" color="$color10">
                              Validity
                            </Text>
                            <Text fontSize="$2">No Expiration</Text>
                          </Stack>
                        )}
                      </Row>

                      {/* Credential Details */}
                      {!showCompact && (cert.credential_id || cert.credential_url) && (
                        <Row gap="$4" flexWrap="wrap">
                          {cert.credential_id && (
                            <Stack gap="$1">
                              <Text fontSize="$2" color="$color10">
                                Credential ID
                              </Text>
                              <Text fontSize="$2">{cert.credential_id}</Text>
                            </Stack>
                          )}
                          {cert.credential_url && (
                            <Stack gap="$1">
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
                            </Stack>
                          )}
                        </Row>
                      )}

                      {/* Separator */}
                      {index < activeCerts.length - 1 && <Separator marginVertical="$2" />}
                    </Stack>
                  ))}
              </Stack>
            )}

            {/* Expired Certifications (collapsed by default, only in full variant) */}
            {!showCompact && expiredCerts.length > 0 && (
              <Stack gap="$3">
                <Text fontSize="$3" fontWeight="600" color="$color11">
                  Expired ({expiredCerts.length})
                </Text>
                {expiredCerts.slice(0, 2).map((cert: UserCertification) => (
                  <Stack key={cert.id} gap="$1" opacity={0.6}>
                    <Row gap="$2" alignItems="center">
                      <Text fontSize="$3" fontWeight="600">
                        {cert.name}
                      </Text>
                      <Row
                        backgroundColor="$color3"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        borderWidth={1}
                        borderColor="$color6"
                      >
                        <Text color="$color10" fontSize="$1" fontWeight="600">
                          Expired
                        </Text>
                      </Row>
                    </Row>
                    {cert.issuing_organization && (
                      <Text fontSize="$2" color="$color11">
                        {cert.issuing_organization}
                      </Text>
                    )}
                  </Stack>
                ))}
              </Stack>
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
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)}
              >
                View all {certifications.length} certifications →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
