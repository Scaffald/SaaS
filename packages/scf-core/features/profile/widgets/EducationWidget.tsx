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
import { GraduationCap } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { formatDate } from '../utils/date-formatting'
import type { ProfileWidgetProps } from './types'

interface UserEducation {
  id: string
  degree_type: string | null
  field_of_study: string | null
  institution_name: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  description: string | null
  location: string | null
}

/**
 * EducationWidget
 * Displays user's education history
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function EducationWidget({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  const router = useRouter()
  const { data, isLoading, error, refetch, isFetching } = api.profile.widgets.getEducation.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading education..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load education</Text>
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

  const education = data || []
  const showCompact = variant === 'compact'

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Education</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        {education.length === 0 ? (
          <EmptyState
            icon={<GraduationCap />}
            title="No education added yet"
            description="Add your education history to complete your profile"
            action={
              showEdit ? (
                <Button
                  variant="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)}
                >
                  Add Education
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack gap="$4">
            {education
              .slice(0, showCompact ? 2 : undefined)
              .map((edu: UserEducation, index: number) => (
                <Stack key={edu.id} gap="$2">
                  {/* Degree & Field */}
                  <Stack gap="$1">
                    <Text fontSize="$4" fontWeight="600">
                      {edu.degree_type || 'Degree'}
                      {edu.field_of_study && ` in ${edu.field_of_study}`}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {edu.institution_name || 'Institution'}
                    </Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap="$2" alignItems="center">
                    <Text fontSize="$2" color="$color10">
                      {formatDate(edu.start_date)}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      -
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </Text>
                    {edu.is_current && (
                      <Row
                        backgroundColor="$blue2"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        borderWidth={1}
                        borderColor="$blue7"
                      >
                        <Text color="$blue11" fontSize="$1" fontWeight="600">
                          Current
                        </Text>
                      </Row>
                    )}
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Text fontSize="$2" color="$color10">
                      📍 {edu.location}
                    </Text>
                  )}

                  {/* Description */}
                  {edu.description && !showCompact && (
                    <Text fontSize="$3" color="$color11" lineHeight="$3">
                      {edu.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < education.length - 1 && <Separator marginVertical="$2" />}
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && education.length > 2 && (
              <Text
                color="$blue7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$blue8' }}
                pressStyle={{ color: '$blue9' }}
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)}
              >
                View all {education.length} entries →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
