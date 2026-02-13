import { useExperience, useExperienceSummary } from '@scf/core/utils/profile-experience-sdk-hooks'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import { Briefcase, Calendar, MapPin, Pencil } from 'lucide-react-native'
import { Button, H4, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { ProfileEmptyState } from './components'
import { useExperienceEdit } from './contexts/experience-edit-context'
import { formatDateRange } from './utils/date-formatting'

/**
 * Experience entry from API response
 * Based on experienceEntrySchema from the router
 */
type ExperienceEntry = {
  id?: string
  user_id?: string
  organization_id?: string | null
  job_title: string
  company_name: string
  employment_type?: string | null
  location?: string | object | null
  is_remote: boolean
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  description?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Location formatting helper
 */
function formatLocationForDisplay(
  location: string | object | null | undefined,
  isRemote: boolean
): string {
  if (!location) return ''

  if (typeof location === 'string') {
    return isRemote ? `${location} (Remote)` : location
  }

  if (typeof location === 'object' && location !== null) {
    const addr = location as Record<string, unknown>

    // If formattedAddress exists (backward compatibility), use it
    if ('formattedAddress' in addr && typeof addr.formattedAddress === 'string') {
      const locationStr = addr.formattedAddress || ''
      return isRemote ? `${locationStr} (Remote)` : locationStr
    }

    // Otherwise, compute from standard address fields
    const street = typeof addr.street === 'string' ? addr.street : ''
    const city = typeof addr.city === 'string' ? addr.city : ''
    const state = typeof addr.state === 'string' ? addr.state : ''
    const zip = typeof addr.zip === 'string' ? addr.zip : ''

    // Build formatted address from available parts
    const addressParts = [street, city, state, zip].filter(Boolean)
    const locationStr =
      addressParts.length > 0
        ? addressParts.join(', ')
        : city && state
          ? `${city}, ${state}`
          : city || state || ''

    return isRemote ? `${locationStr} (Remote)` : locationStr
  }

  return ''
}

/**
 * Profile Experience Right Component
 * Displays saved work experience entries in the right column
 */
export function ProfileExperienceRight() {
  const { startEditing } = useExperienceEdit()

  // Query saved experience data
  const experienceQuery = useExperience()
  const experienceSummaryQuery = useExperienceSummary()
  const experienceEntries = experienceQuery.data || []

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={16}>
          <Spinner size="lg" />
          <Text color="gray">Loading experience data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={16}>
          <Text color="$red10">Failed to load experience data</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Work Experience</H4>

      <Text color="gray" marginBottom={16}>
        Your work experience history is displayed here. Edit entries in the left panel.
      </Text>

      {/* Experience Summary Section */}
      <Stack
        gap={12}
        marginBottom={16}
        padding={12}
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={16}
      >
        <H4>Experience Summary</H4>
        {experienceSummaryQuery.data?.career_level ? (
          <Text color="gray">
            Career Level: <Text>{experienceSummaryQuery.data.career_level}</Text>
          </Text>
        ) : (
          <Text color="gray">Add a career level to highlight your experience level</Text>
        )}
      </Stack>

      {experienceEntries.length === 0 ? (
        <ProfileEmptyState
          icon={Briefcase}
          message="No work experience saved yet. Add your first position in the left panel."
        />
      ) : (
        <Stack gap={12}>
          {(experienceEntries as ExperienceEntry[]).map((exp) => {
            const locationDisplay = formatLocationForDisplay(exp.location, exp.is_remote || false)

            return (
              <Stack
                key={exp.id}
                padding={16}
                gap={12}
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={16}
                hoverStyle={{
                  borderColor: '$borderColorHover',
                  backgroundColor: '$backgroundHover',
                }}
              >
                {/* Job Title */}
                <Stack gap={4}>
                  <Text color="gray">{exp.job_title}</Text>

                  {/* Company Name */}
                  <Row gap={8} align="center" flexWrap="wrap">
                    <Text color="gray">{exp.company_name}</Text>
                    {exp.employment_type && (
                      <>
                        <Text color="gray">•</Text>
                        <Text color="gray">{exp.employment_type}</Text>
                      </>
                    )}
                  </Row>

                  {/* Current Position Badge */}
                  {exp.is_current && (
                    <Row gap={4} align="center">
                      <Text color="$blue10">Current Position</Text>
                    </Row>
                  )}
                </Stack>

                {/* Details */}
                <Stack gap={8}>
                  {/* Date Range */}
                  {(exp.start_date || exp.end_date || exp.is_current) && (
                    <Row gap={8} align="center">
                      <Calendar size={16} color="gray" />
                      <Text color="gray">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </Text>
                    </Row>
                  )}

                  {/* Location */}
                  {locationDisplay && (
                    <Row gap={8} align="center">
                      <MapPin size={16} color="gray" />
                      <Text color="gray">{locationDisplay}</Text>
                    </Row>
                  )}

                  {/* Description */}
                  {exp.description && (
                    <Stack gap={4}>
                      <Text color="gray">Description:</Text>
                      <Text color="gray">
                        {exp.description.length > 200
                          ? `${exp.description.substring(0, 200)}...`
                          : exp.description}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {/* Edit Button */}
                <Row justify="flex-end" marginTop={8}>
                  <Button
                    size={8}
                    variant="outline"
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
                </Row>
              </Stack>
            )
          })}
        </Stack>
      )}
    </DashboardWidget>
  )
}
