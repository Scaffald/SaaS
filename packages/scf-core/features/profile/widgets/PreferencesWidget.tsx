import { ROUTES } from '@scf/core/constants/routes'
import { usePreferencesWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { Button, DashboardWidget, Heading, LoadingState, spacing } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { useRouter } from 'expo-router'
import { Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'

/**
 * PreferencesWidget
 * Displays user's work preferences and employment settings
 * **PROTECTED**: Only shows for viewing own profile
 *
 * @param showEdit - Show edit button for own profile
 */
export function PreferencesWidget() {
  const { theme } = useThemeContext()
{ showEdit = false }: { showEdit?: boolean }) {
  const router = useRouter()
  const { data, isLoading, error } = usePreferencesWidget({
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading preferences..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].error }}>Failed to load preferences</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].secondary }}>No preferences data available</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Helper to format arrays
  const formatArray = (arr: string[] | null | undefined): string => {
    if (!arr || arr.length === 0) return 'Not specified'
    return arr.join(', ')
  }

  // Helper to format currency
  const formatCurrency = (cents: number | null | undefined): string => {
    if (!cents) return 'Not specified'
    return `$${(cents / 100).toFixed(2)}/hr`
  }

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Heading variant="h4">Work Preferences</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="xs"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        <Stack gap={16}>
          {/* Availability */}
          {data.availability && typeof data.availability === 'string' && (
            <Stack gap={8}>
              <Text>Availability</Text>
              <Text style={{ color: colors.text[theme].secondary }} textTransform="capitalize">
                {data.availability.replace('_', ' ')}
              </Text>
            </Stack>
          )}

          {/* Career Level */}
          {data.career_level && typeof data.career_level === 'string' && (
            <Stack gap={8}>
              <Text>Career Level</Text>
              <Text style={{ color: colors.text[theme].secondary }} textTransform="capitalize">
                {data.career_level.replace('_', ' ')}
              </Text>
            </Stack>
          )}

          {/* Compensation */}
          {data.hourly_rate_cents && (
            <Stack gap={8}>
              <Text>Hourly Rate</Text>
              <Text style={{ color: colors.text[theme].secondary }}>{formatCurrency(data.hourly_rate_cents)}</Text>
            </Stack>
          )}

          {/* Work Locations */}
          {data.preferred_work_locations &&
            Array.isArray(data.preferred_work_locations) &&
            data.preferred_work_locations.length > 0 && (
              <Stack gap={8}>
                <Text>Preferred Locations</Text>
                <Row gap={8} flexWrap="wrap">
                  {data.preferred_work_locations.map((location: string) => (
                    <Row
                      key={location}
                      style={{ backgroundColor: colors.bg[theme].info }}
                      paddingHorizontal={12}
                      paddingVertical={6}
                      borderRadius={12}
                      borderWidth={1}
                      style={{ borderColor: colors.border[theme].info }}
                    >
                      <Text style={{ color: colors.text[theme].info }}>{location}</Text>
                    </Row>
                  ))}
                </Row>
              </Stack>
            )}

          {/* Travel Preferences */}
          {(data.open_to_travel || data.travel_distance_miles) && (
            <Stack gap={8}>
              <Text>Travel</Text>
              <Row gap={8} align="center">
                <Text style={{ color: colors.text[theme].secondary }}>
                  {data.open_to_travel ? 'Willing to travel' : 'Not willing to travel'}
                </Text>
                {data.travel_distance_miles && (
                  <Text style={{ color: colors.text[theme].secondary }}>• Up to {data.travel_distance_miles} miles</Text>
                )}
              </Row>
            </Stack>
          )}

          {/* Work Authorization */}
          {(data.us_resident !== null ||
            data.us_passport !== null ||
            (data.authorized_countries &&
              Array.isArray(data.authorized_countries) &&
              data.authorized_countries.length > 0)) && (
            <Stack gap={8}>
              <Text>Work Authorization</Text>
              <Stack gap={4}>
                {data.us_resident !== null && (
                  <Text style={{ color: colors.text[theme].secondary }}>{data.us_resident ? '✓' : '✗'} US Resident</Text>
                )}
                {data.us_passport !== null && (
                  <Text style={{ color: colors.text[theme].secondary }}>{data.us_passport ? '✓' : '✗'} US Passport</Text>
                )}
                {data.authorized_countries &&
                  Array.isArray(data.authorized_countries) &&
                  data.authorized_countries.length > 0 && (
                    <Text style={{ color: colors.text[theme].secondary }}>Authorized: {formatArray(data.authorized_countries)}</Text>
                  )}
              </Stack>
            </Stack>
          )}

          {/* Driver's Licenses */}
          {data.drivers_license_classes &&
            Array.isArray(data.drivers_license_classes) &&
            data.drivers_license_classes.length > 0 && (
              <Stack gap={8}>
                <Text>Driver's Licenses</Text>
                <Row gap={8} flexWrap="wrap">
                  {data.drivers_license_classes.map((license: string) => (
                    <Row
                      key={license}
                      style={{ backgroundColor: colors.bg[theme].info }}
                      paddingHorizontal={12}
                      paddingVertical={6}
                      borderRadius={12}
                      borderWidth={1}
                      style={{ borderColor: colors.border[theme].info }}
                    >
                      <Text style={{ color: colors.text[theme].info }}>Class {license}</Text>
                    </Row>
                  ))}
                </Row>
              </Stack>
            )}

          {/* Veteran Status */}
          {(data.veteran !== null || data.military_status) && (
            <Stack gap={8}>
              <Text>Military Service</Text>
              <Stack gap={4}>
                {data.veteran !== null && (
                  <Text style={{ color: colors.text[theme].secondary }}>{data.veteran ? 'Veteran' : 'Not a veteran'}</Text>
                )}
                {data.military_status && typeof data.military_status === 'string' && (
                  <Text style={{ color: colors.text[theme].secondary }} textTransform="capitalize">
                    Status: {data.military_status.replace('_', ' ')}
                  </Text>
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
