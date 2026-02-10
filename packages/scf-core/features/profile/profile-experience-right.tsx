import { api } from '@scf/core/utils/api'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import { Briefcase, Calendar, MapPin, Pencil } from '@tamagui/lucide-icons'
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
  const experienceQuery = api.profile.experience.getExperience.useQuery()
  const experienceSummaryQuery = api.profile.experience.getExperienceSummary.useQuery()
  const experienceEntries = experienceQuery.data || []

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading experience data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Text color="$red10">Failed to load experience data</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Work Experience</H4>

      <Text color="$color11" fontSize="$3" marginBottom="$4">
        Your work experience history is displayed here. Edit entries in the left panel.
      </Text>

      {/* Experience Summary Section */}
      <Stack
        gap="$3"
        marginBottom="$4"
        padding="$3"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
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
      </Stack>

      {experienceEntries.length === 0 ? (
        <ProfileEmptyState
          icon={Briefcase}
          message="No work experience saved yet. Add your first position in the left panel."
        />
      ) : (
        <Stack gap="$3">
          {(experienceEntries as ExperienceEntry[]).map((exp) => {
            const locationDisplay = formatLocationForDisplay(exp.location, exp.is_remote || false)

            return (
              <Stack
                key={exp.id}
                padding="$4"
                gap="$3"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                hoverStyle={{
                  borderColor: '$borderColorHover',
                  backgroundColor: '$backgroundHover',
                }}
              >
                {/* Job Title */}
                <Stack gap="$1">
                  <Text fontSize="$6" fontWeight="700" color="$color12">
                    {exp.job_title}
                  </Text>

                  {/* Company Name */}
                  <Row gap="$2" alignItems="center" flexWrap="wrap">
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
                  </Row>

                  {/* Current Position Badge */}
                  {exp.is_current && (
                    <Row gap="$1" alignItems="center">
                      <Text fontSize="$2" fontWeight="600" color="$blue10">
                        Current Position
                      </Text>
                    </Row>
                  )}
                </Stack>

                {/* Details */}
                <Stack gap="$2">
                  {/* Date Range */}
                  {(exp.start_date || exp.end_date || exp.is_current) && (
                    <Row gap="$2" alignItems="center">
                      <Calendar size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </Text>
                    </Row>
                  )}

                  {/* Location */}
                  {locationDisplay && (
                    <Row gap="$2" alignItems="center">
                      <MapPin size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {locationDisplay}
                      </Text>
                    </Row>
                  )}

                  {/* Description */}
                  {exp.description && (
                    <Stack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Description:
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {exp.description.length > 200
                          ? `${exp.description.substring(0, 200)}...`
                          : exp.description}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {/* Edit Button */}
                <Row justifyContent="flex-end" marginTop="$2">
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
                </Row>
              </Stack>
            )
          })}
        </Stack>
      )}
    </DashboardWidget>
  )
}
