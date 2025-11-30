import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { DashboardWidget, Heading, LoadingState, spacing, UIButton } from '@scaffald/tamagui-ui'
import { useRouter } from 'expo-router'
import { Text, XStack, YStack } from 'tamagui'

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
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load preferences</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$color11">No preferences data available</Text>
        </YStack>
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
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Work Preferences</Heading>
          {showEdit && (
            <UIButton
              variant="outlined"
              size="$2"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.path)}
            >
              Edit
            </UIButton>
          )}
        </XStack>

        <YStack gap="$4">
          {/* Availability */}
          {data.availability && typeof data.availability === 'string' && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Availability
              </Text>
              <Text fontSize="$3" color="$color11" textTransform="capitalize">
                {data.availability.replace('_', ' ')}
              </Text>
            </YStack>
          )}

          {/* Career Level */}
          {data.career_level && typeof data.career_level === 'string' && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Career Level
              </Text>
              <Text fontSize="$3" color="$color11" textTransform="capitalize">
                {data.career_level.replace('_', ' ')}
              </Text>
            </YStack>
          )}

          {/* Compensation */}
          {data.hourly_rate_cents && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Hourly Rate
              </Text>
              <Text fontSize="$3" color="$color11">
                {formatCurrency(data.hourly_rate_cents)}
              </Text>
            </YStack>
          )}

          {/* Work Locations */}
          {data.preferred_work_locations &&
            Array.isArray(data.preferred_work_locations) &&
            data.preferred_work_locations.length > 0 && (
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  Preferred Locations
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {data.preferred_work_locations.map((location: string) => (
                    <XStack
                      key={location}
                      bg="$blue2"
                      px="$3"
                      py="$1.5"
                      rounded="$3"
                      borderWidth={1}
                      borderColor="$blue7"
                    >
                      <Text fontSize="$2" color="$blue11">
                        {location}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            )}

          {/* Travel Preferences */}
          {(data.open_to_travel || data.travel_distance_miles) && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Travel
              </Text>
              <XStack gap="$2" items="center">
                <Text fontSize="$3" color="$color11">
                  {data.open_to_travel ? 'Willing to travel' : 'Not willing to travel'}
                </Text>
                {data.travel_distance_miles && (
                  <Text fontSize="$3" color="$color10">
                    • Up to {data.travel_distance_miles} miles
                  </Text>
                )}
              </XStack>
            </YStack>
          )}

          {/* Work Authorization */}
          {(data.us_resident !== null ||
            data.us_passport !== null ||
            (data.authorized_countries &&
              Array.isArray(data.authorized_countries) &&
              data.authorized_countries.length > 0)) && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Work Authorization
              </Text>
              <YStack gap="$1">
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
              </YStack>
            </YStack>
          )}

          {/* Driver's Licenses */}
          {data.drivers_license_classes &&
            Array.isArray(data.drivers_license_classes) &&
            data.drivers_license_classes.length > 0 && (
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  Driver's Licenses
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {data.drivers_license_classes.map((license: string) => (
                    <XStack
                      key={license}
                      bg="$blue2"
                      px="$3"
                      py="$1.5"
                      rounded="$3"
                      borderWidth={1}
                      borderColor="$blue7"
                    >
                      <Text fontSize="$2" color="$blue11" fontWeight="600">
                        Class {license}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            )}

          {/* Veteran Status */}
          {(data.veteran !== null || data.military_status) && (
            <YStack gap="$2">
              <Text fontWeight="600" fontSize="$3">
                Military Service
              </Text>
              <YStack gap="$1">
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
              </YStack>
            </YStack>
          )}
        </YStack>
      </YStack>
    </DashboardWidget>
  )
}
