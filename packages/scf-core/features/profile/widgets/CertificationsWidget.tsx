import { ROUTES } from '@scf/core/constants/routes'
import { useCertificationsWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { Award, CheckCircle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Linking } from 'react-native'
import { Separator, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { formatDate } from '../utils/date-formatting'
import type { CertificationWidgetEntry } from '@scaffald/sdk'

type UserCertification = CertificationWidgetEntry

/**
 * CertificationsWidget
 * Displays user's professional certifications
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function CertificationsWidget() {
  const { theme } = useThemeContext()
  userId,
  showEdit = false,
  variant = 'full',: ProfileWidgetProps) {
  const router = useRouter()
  const { data, isLoading, error, refetch, isFetching } = useCertificationsWidget(
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
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].error }}>Failed to load certifications</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="primary"
            size="xs"
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
        <Row justify="space-between" align="center">
          <Heading variant="h4">Certifications</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="xs"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        {certifications.length === 0 ? (
          <EmptyState
            iconStart={<Award />}
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
          <Stack gap={16}>
            {/* Active Certifications */}
            {activeCerts.length > 0 && (
              <Stack gap={12}>
                {activeCerts
                  .slice(0, showCompact ? 3 : undefined)
                  .map((cert: UserCertification, index: number) => (
                    <Stack key={cert.id} gap={8}>
                      {/* Certification Name & Organization */}
                      <Stack gap={4}>
                        <Row gap={8} align="center">
                          <Text>{cert.name}</Text>
                          <Row
                            style={{ backgroundColor: colors.bg[theme].info }}
                            paddingHorizontal={8}
                            paddingVertical={2}
                            borderRadius={8}
                            borderWidth={1}
                            style={{ borderColor: colors.border[theme].info }}
                          >
                            <CheckCircle size="sm" style={{ color: colors.text[theme].info }} />
                            <Text style={{ color: colors.text[theme].info }} marginLeft={4}>
                              Active
                            </Text>
                          </Row>
                        </Row>
                        {cert.issuing_organization && (
                          <Text style={{ color: colors.text[theme].secondary }}>{cert.issuing_organization}</Text>
                        )}
                      </Stack>

                      {/* Dates */}
                      <Row gap={16} flexWrap="wrap">
                        {cert.issue_date && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Issued</Text>
                            <Text>{formatDate(cert.issue_date)}</Text>
                          </Stack>
                        )}
                        {!cert.does_not_expire && cert.expiration_date && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Expires</Text>
                            <Text>{formatDate(cert.expiration_date)}</Text>
                          </Stack>
                        )}
                        {cert.does_not_expire && (
                          <Stack gap={4}>
                            <Text style={{ color: colors.text[theme].secondary }}>Validity</Text>
                            <Text>No Expiration</Text>
                          </Stack>
                        )}
                      </Row>

                      {/* Credential Details */}
                      {!showCompact && (cert.credential_id || cert.credential_url) && (
                        <Row gap={16} flexWrap="wrap">
                          {cert.credential_id && (
                            <Stack gap={4}>
                              <Text style={{ color: colors.text[theme].secondary }}>Credential ID</Text>
                              <Text>{cert.credential_id}</Text>
                            </Stack>
                          )}
                          {cert.credential_url && (
                            <Stack gap={4}>
                              <Text style={{ color: colors.text[theme].secondary }}>Verification</Text>
                              <Text
                                style={{ color: colors.border[theme].info }}
                                textDecorationLine="underline"
                                cursor="pointer"
                                hoverStyle={{ color: colors.border[theme].info }}
                                onPress={() => Linking.openURL(cert.credential_url || '')}
                              >
                                View Certificate →
                              </Text>
                            </Stack>
                          )}
                        </Row>
                      )}

                      {/* Separator */}
                      {index < activeCerts.length - 1 && <Separator marginVertical={8} />}
                    </Stack>
                  ))}
              </Stack>
            )}

            {/* Expired Certifications (collapsed by default, only in full variant) */}
            {!showCompact && expiredCerts.length > 0 && (
              <Stack gap={12}>
                <Text style={{ color: colors.text[theme].secondary }}>Expired ({expiredCerts.length})</Text>
                {expiredCerts.slice(0, 2).map((cert: UserCertification) => (
                  <Stack key={cert.id} gap={4} opacity={0.6}>
                    <Row gap={8} align="center">
                      <Text>{cert.name}</Text>
                      <Row
                        backgroundColor={colors.bg[theme].muted}
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        borderWidth={1}
                        borderColor="$color6"
                      >
                        <Text style={{ color: colors.text[theme].secondary }}>Expired</Text>
                      </Row>
                    </Row>
                    {cert.issuing_organization && (
                      <Text style={{ color: colors.text[theme].secondary }}>{cert.issuing_organization}</Text>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}

            {/* Show More link for compact view */}
            {showCompact && certifications.length > 3 && (
              <Text
                style={{ color: colors.border[theme].info }}
                cursor="pointer"
                hoverStyle={{ color: colors.border[theme].info }}
                pressStyle={{ color: colors.bg[theme].primary }}
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
