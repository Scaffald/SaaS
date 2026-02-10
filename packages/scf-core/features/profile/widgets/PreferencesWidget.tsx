import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget, Heading, LoadingState, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

/**
 * PreferencesWidget
 * Displays user's work preferences and employment settings
 * **PROTECTED**: Only shows for viewing own profile
 *
 * @param showEdit - Show edit button for own profile
 */
export function PreferencesWidget({ showEdit = false }: { showEdit?: boolean }) {
  const router = useRouter()
  const { data, isLoading, error } = api.profile.widgets.getPreferences.useQuery(undefined, {
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
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load preferences</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$color11">No preferences data available</Text>
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
        <Row justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Work Preferences</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        <Stack gap="$4">
          {/* Availability */}
          {data.availability && typeof data.availability === 'string' && (
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Availability
              </Text>
              <Text fontSize="$3" color="$color11" textTransform="capitalize">
                {data.availability.replace('_', ' ')}
              </Text>
            </Stack>
          )}

          {/* Career Level */}
          {data.career_level && typeof data.career_level === 'string' && (
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Career Level
              </Text>
              <Text fontSize="$3" color="$color11" textTransform="capitalize">
                {data.career_level.replace('_', ' ')}
              </Text>
            </Stack>
          )}

          {/* Compensation */}
          {data.hourly_rate_cents && (
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Hourly Rate
              </Text>
              <Text fontSize="$3" color="$color11">
                {formatCurrency(data.hourly_rate_cents)}
              </Text>
            </Stack>
          )}

          {/* Work Locations */}
          {data.preferred_work_locations &&
            Array.isArray(data.preferred_work_locations) &&
            data.preferred_work_locations.length > 0 && (
              <Stack gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  Preferred Locations
                </Text>
                <Row gap="$2" flexWrap="wrap">
                  {data.preferred_work_locations.map((location: string) => (
                    <Row
                      key={location}
                      backgroundColor="$blue2"
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$blue7"
                    >
                      <Text fontSize="$2" color="$blue11">
                        {location}
                      </Text>
                    </Row>
                  ))}
                </Row>
              </Stack>
            )}

          {/* Travel Preferences */}
          {(data.open_to_travel || data.travel_distance_miles) && (
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Travel
              </Text>
              <Row gap="$2" alignItems="center">
                <Text fontSize="$3" color="$color11">
                  {data.open_to_travel ? 'Willing to travel' : 'Not willing to travel'}
                </Text>
                {data.travel_distance_miles && (
                  <Text fontSize="$3" color="$color10">
                    • Up to {data.travel_distance_miles} miles
                  </Text>
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
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Work Authorization
              </Text>
              <Stack gap="$1">
                {data.us_resident !== null && (
                  <Text fontSize="$3" color="$color11">
                    {data.us_resident ? '✓' : '✗'} US Resident
                  </Text>
                )}
                {data.us_passport !== null && (
                  <Text fontSize="$3" color="$color11">
                    {data.us_passport ? '✓' : '✗'} US Passport
                  </Text>
                )}
                {data.authorized_countries &&
                  Array.isArray(data.authorized_countries) &&
                  data.authorized_countries.length > 0 && (
                    <Text fontSize="$3" color="$color11">
                      Authorized: {formatArray(data.authorized_countries)}
                    </Text>
                  )}
              </Stack>
            </Stack>
          )}

          {/* Driver's Licenses */}
          {data.drivers_license_classes &&
            Array.isArray(data.drivers_license_classes) &&
            data.drivers_license_classes.length > 0 && (
              <Stack gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  Driver's Licenses
                </Text>
                <Row gap="$2" flexWrap="wrap">
                  {data.drivers_license_classes.map((license: string) => (
                    <Row
                      key={license}
                      backgroundColor="$blue2"
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$blue7"
                    >
                      <Text fontSize="$2" color="$blue11" fontWeight="600">
                        Class {license}
                      </Text>
                    </Row>
                  ))}
                </Row>
              </Stack>
            )}

          {/* Veteran Status */}
          {(data.veteran !== null || data.military_status) && (
            <Stack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Military Service
              </Text>
              <Stack gap="$1">
                {data.veteran !== null && (
                  <Text fontSize="$3" color="$color11">
                    {data.veteran ? 'Veteran' : 'Not a veteran'}
                  </Text>
                )}
                {data.military_status && typeof data.military_status === 'string' && (
                  <Text fontSize="$3" color="$color11" textTransform="capitalize">
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
