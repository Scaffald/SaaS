import { YStack, Text, Spinner, H4 } from 'tamagui'
import { GraduationCap, Calendar, Award, MapPin } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { ProfileEmptyState } from './components'
import { formatDateRange } from './utils/date-formatting'
import { api } from '@app/core/utils/api'

/**
 * Profile Education Right Component
 * Displays saved education entries in the right column
 */
export function ProfileEducationRight() {
  // Query saved education data
  const educationQuery = api.profile.getEducation.useQuery()

  // Show loading state
  if (educationQuery.isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading education data...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Failed to load education data</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Education</H4>

      <Text color="$color11" fontSize="$3" mb="$4">
        Your education history is displayed here. Edit entries in the left panel.
      </Text>

      {!educationQuery.data || educationQuery.data.length === 0 ? (
        <ProfileEmptyState
          icon={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <YStack gap="$3">
          {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
          {educationQuery.data.map((edu: any) => (
            <YStack
              key={edu.id}
              p="$4"
              gap="$3"
              bg="$background"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              hoverStyle={{
                borderColor: '$borderColorHover',
                bg: '$backgroundHover',
              }}
            >
              {/* Institution Name */}
              <YStack gap="$1">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  {edu.institution_name}
                </Text>

                {/* Degree Type */}
                {edu.degree_type && (
                  <Text fontSize="$4" fontWeight="600" color="$color11">
                    {edu.degree_type}
                  </Text>
                )}

                {/* Field of Study */}
                {edu.field_of_study && (
                  <Text fontSize="$3" color="$color11">
                    {edu.field_of_study}
                  </Text>
                )}
              </YStack>

              {/* Details */}
              <YStack gap="$2">
                {/* Dates */}
                {(edu.start_date || edu.end_date) && (
                  <YStack gap="$1">
                    <Calendar size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                    </Text>
                  </YStack>
                )}

                {/* Location */}
                {edu.location && (
                  <YStack gap="$1">
                    <MapPin size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      {edu.location}
                    </Text>
                  </YStack>
                )}

                {/* Description */}
                {edu.description && (
                  <YStack gap="$1">
                    <Text fontSize="$2" fontWeight="600" color="$color11">
                      Description:
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {edu.description}
                    </Text>
                  </YStack>
                )}
              </YStack>
            </YStack>
          ))}
        </YStack>
      )}
    </DashboardWidget>
  )
}
