import { ROUTES } from '@scf/core/constants/routes'
import { useEducationWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} from '@scaffald/ui'
import { GraduationCap } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Separator, Text, Row, Stack } from '@scaffald/ui'
import { formatDate } from '../utils/date-formatting'
import type { ProfileWidgetProps } from './types'
import type { EducationWidgetEntry } from '@scaffald/sdk'

type UserEducation = EducationWidgetEntry

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
  const { data, isLoading, error, refetch, isFetching } = useEducationWidget(
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
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text color="$red10">Failed to load education</Text>
          <Text color="$gray11">{error.message}</Text>
          <Button
            variant="filled" color="primary"
            size="sm"
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
        <Row justify="space-between" align="center">
          <Heading variant="h4">Education</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        {education.length === 0 ? (
          <EmptyState
            iconStart={<GraduationCap />}
            title="No education added yet"
            description="Add your education history to complete your profile"
            action={
              showEdit ? (
                <Button
                  variant="filled" color="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)}
                >
                  Add Education
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {education
              .slice(0, showCompact ? 2 : undefined)
              .map((edu: UserEducation, index: number) => (
                <Stack key={edu.id} gap={8}>
                  {/* Degree & Field */}
                  <Stack gap={4}>
                    <Text>
                      {edu.degree_type || 'Degree'}
                      {edu.field_of_study && ` in ${edu.field_of_study}`}
                    </Text>
                    <Text color="$gray11">{edu.institution_name || 'Institution'}</Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text color="$gray11">{formatDate(edu.start_date)}</Text>
                    <Text color="$gray11">-</Text>
                    <Text color="$gray11">
                      {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </Text>
                    {edu.is_current && (
                      <Row
                        backgroundColor="$blue2"
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        borderWidth={1}
                        borderColor="$blue7"
                      >
                        <Text color="$blue11">Current</Text>
                      </Row>
                    )}
                  </Row>

                  {/* Location */}
                  {edu.location && <Text color="$gray11">📍 {edu.location}</Text>}

                  {/* Description */}
                  {edu.description && !showCompact && (
                    <Text color="$gray11" lineHeight={12}>
                      {edu.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < education.length - 1 && <Separator marginVertical={8} />}
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && education.length > 2 && (
              <Text
                color="$blue7"
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
