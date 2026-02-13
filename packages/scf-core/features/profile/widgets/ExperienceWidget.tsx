import { ROUTES } from '@scf/core/constants/routes'
import { useExperienceWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} from '@scaffald/ui'
import { Briefcase } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Separator, Text, Row, Stack } from '@scaffald/ui'
import { formatDate } from '../utils/date-formatting'
import type { ProfileWidgetProps } from './types'
import type { ExperienceWidgetEntry } from '@scaffald/sdk'

type UserExperience = ExperienceWidgetEntry

/**
 * ExperienceWidget
 * Displays user's work experience in timeline format
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function ExperienceWidget({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  const router = useRouter()
  const { data, isLoading, error, refetch, isFetching } = useExperienceWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading experience..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text color="$red10">Failed to load experience</Text>
          <Text color="$gray11">{error.message}</Text>
          <Button
            variant="filled" color="primary"
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

  const experiences = data || []
  const showCompact = variant === 'compact'

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Heading variant="h4">Work Experience</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="xs"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)}
            >
              Edit
            </Button>
          )}
        </Row>

        {experiences.length === 0 ? (
          <EmptyState
            iconStart={<Briefcase />}
            title="No work experience added yet"
            description="Add your work experience to showcase your career history"
            action={
              showEdit ? (
                <Button
                  variant="filled" color="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)}
                >
                  Add Experience
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {experiences
              .slice(0, showCompact ? 3 : undefined)
              .map((exp: UserExperience, index: number) => (
                <Stack key={exp.id} gap={8}>
                  {/* Job Title & Company */}
                  <Stack gap={4}>
                    <Text>{exp.job_title}</Text>
                    <Text color="$gray11">{exp.company_name}</Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text color="$gray11">{formatDate(exp.start_date)}</Text>
                    <Text color="$gray11">-</Text>
                    <Text color="$gray11">
                      {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                    </Text>
                    {exp.is_current && (
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

                  {/* Location & Employment Type */}
                  {(exp.location || exp.employment_type || exp.is_remote) && (
                    <Row gap={8} flexWrap="wrap">
                      {exp.location && <Text color="$gray11">📍 {exp.location}</Text>}
                      {exp.employment_type && <Text color="$gray11">• {exp.employment_type}</Text>}
                      {exp.is_remote && <Text color="$gray11">• Remote</Text>}
                    </Row>
                  )}

                  {/* Description */}
                  {exp.description && !showCompact && (
                    <Text color="$gray11" lineHeight={12}>
                      {exp.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < experiences.length - 1 && <Separator marginVertical={8} />}
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && experiences.length > 3 && (
              <Text
                color="$blue7"
                cursor="pointer"
                hoverStyle={{ color: '$blue8' }}
                pressStyle={{ color: '$blue9' }}
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)}
              >
                View all {experiences.length} positions →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
