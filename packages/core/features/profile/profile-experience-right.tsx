import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'
import { AlertCircle, Briefcase, Calendar, MapPin, Pencil } from '@tamagui/lucide-icons'
import { Button, H4, Spinner, Text, XStack, YStack } from 'tamagui'
import { ProfileEmptyState } from './components'
import { useExperienceEdit } from './contexts/experience-edit-context'
import { formatDateRange } from './utils/date-formatting'

/**
 * Location formatting helper
 */
function formatLocationForDisplay(
  location: string | object | null | undefined,
  isRemote: boolean
): string {
  if (!location) return ''
  const locationStr =
    typeof location === 'string'
      ? location
      : typeof location === 'object' && 'formattedAddress' in location
        ? (location.formattedAddress as string) ||
          ('city' in location && 'state' in location
            ? `${(location.city as string) || ''}, ${(location.state as string) || ''}`.trim()
            : '')
        : ''
  return isRemote ? `${locationStr} (Remote)` : locationStr
}

/**
 * Profile Experience Right Component
 * Displays saved work experience entries in the right column
 */
export function ProfileExperienceRight() {
  const { startEditing } = useExperienceEdit()

  // Query saved experience data
  const experienceQuery = api.profile.getExperience.useQuery()
  const experienceSummaryQuery = api.profile.getExperienceSummary.useQuery()
  const experienceEntries = experienceQuery.data || []

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading experience data...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Failed to load experience data</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Work Experience</H4>

      <Text color="$color11" fontSize="$3" mb="$4">
        Your work experience history is displayed here. Edit entries in the left panel.
      </Text>

      {/* Experience Summary Section */}
      <YStack
        gap="$3"
        mb="$4"
        p="$3"
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$4"
      >
        <H4 fontSize="$5">Experience Summary</H4>
        {experienceSummaryQuery.data?.career_level ? (
          <Text fontSize="$3" color="$color11">
            Career Level: <Text fontWeight="600">{experienceSummaryQuery.data.career_level}</Text>
          </Text>
        ) : (
          <Text color="$color11" fontSize="$3">
            Add a career level to highlight your experience level
          </Text>
        )}
      </YStack>

      {experienceEntries.length === 0 ? (
        <ProfileEmptyState
          icon={Briefcase}
          message="No work experience saved yet. Add your first position in the left panel."
        />
      ) : (
        <YStack gap="$3">
          {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
          {experienceEntries.map((exp: any) => {
            const locationDisplay = formatLocationForDisplay(exp.location, exp.is_remote || false)

            return (
              <YStack
                key={exp.id}
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
                {/* Job Title */}
                <YStack gap="$1">
                  <Text fontSize="$6" fontWeight="700" color="$color12">
                    {exp.job_title}
                  </Text>

                  {/* Company Name */}
                  <XStack gap="$2" items="center" flexWrap="wrap">
                    <Text fontSize="$4" fontWeight="600" color="$color11">
                      {exp.company_name}
                    </Text>
                    {exp.employment_type && (
                      <>
                        <Text color="$color11" fontSize="$2">
                          •
                        </Text>
                        <Text color="$color11" fontSize="$2">
                          {exp.employment_type}
                        </Text>
                      </>
                    )}
                  </XStack>

                  {/* Current Position Badge */}
                  {exp.is_current && (
                    <XStack gap="$1" items="center">
                      <Text fontSize="$2" fontWeight="600" color="$blue10">
                        Current Position
                      </Text>
                    </XStack>
                  )}
                </YStack>

                {/* Details */}
                <YStack gap="$2">
                  {/* Date Range */}
                  {(exp.start_date || exp.end_date || exp.is_current) && (
                    <XStack gap="$2" items="center">
                      <Calendar size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </Text>
                    </XStack>
                  )}

                  {/* Location */}
                  {locationDisplay && (
                    <XStack gap="$2" items="center">
                      <MapPin size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {locationDisplay}
                      </Text>
                    </XStack>
                  )}

                  {/* Description */}
                  {exp.description && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Description:
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {exp.description.length > 200
                          ? `${exp.description.substring(0, 200)}...`
                          : exp.description}
                      </Text>
                    </YStack>
                  )}
                </YStack>

                {/* Edit Button */}
                <XStack justify="flex-end" mt="$2">
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={Pencil}
                    aria-label={`Edit ${exp.job_title} at ${exp.company_name}`}
                    accessibilityLabel={`Edit ${exp.job_title} at ${exp.company_name}`}
                    onPress={() => {
                      if (exp.id) {
                        startEditing(exp.id)
                      }
                    }}
                  >
                    Edit
                  </Button>
                </XStack>
              </YStack>
            )
          })}
        </YStack>
      )}
    </DashboardWidget>
  )
}
