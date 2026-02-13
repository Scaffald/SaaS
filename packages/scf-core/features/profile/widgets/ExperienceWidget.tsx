import { ROUTES } from '@scf/core/constants/routes'
import { useExperienceWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { Briefcase } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Separator, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { formatDate } from '../utils/date-formatting'
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
export function ExperienceWidget() {
  const { theme } = useThemeContext()
  userId,
  showEdit = false,
  variant = 'full',: ProfileWidgetProps) {
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
          <Text style={{ color: colors.text[theme].error }}>Failed to load experience</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="primary"
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
                  variant="primary"
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
                    <Text style={{ color: colors.text[theme].secondary }}>{exp.company_name}</Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>{formatDate(exp.start_date)}</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>-</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                    </Text>
                    {exp.is_current && (
                      <Row
                        style={{ backgroundColor: colors.bg[theme].info }}
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        borderWidth={1}
                        style={{ borderColor: colors.border[theme].info }}
                      >
                        <Text style={{ color: colors.text[theme].info }}>Current</Text>
                      </Row>
                    )}
                  </Row>

                  {/* Location & Employment Type */}
                  {(exp.location || exp.employment_type || exp.is_remote) && (
                    <Row gap={8} flexWrap="wrap">
                      {exp.location && <Text style={{ color: colors.text[theme].secondary }}>📍 {exp.location}</Text>}
                      {exp.employment_type && <Text style={{ color: colors.text[theme].secondary }}>• {exp.employment_type}</Text>}
                      {exp.is_remote && <Text style={{ color: colors.text[theme].secondary }}>• Remote</Text>}
                    </Row>
                  )}

                  {/* Description */}
                  {exp.description && !showCompact && (
                    <Text style={{ color: colors.text[theme].secondary }} lineHeight={12}>
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
                style={{ color: colors.border[theme].info }}
                cursor="pointer"
                hoverStyle={{ color: colors.border[theme].info }}
                pressStyle={{ color: colors.bg[theme].primary }}
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
