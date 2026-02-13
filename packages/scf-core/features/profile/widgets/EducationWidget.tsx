import { ROUTES } from '@scf/core/constants/routes'
import { useEducationWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { GraduationCap } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Separator, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
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
export function EducationWidget() {
  const { theme } = useThemeContext()
{
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
          <Text style={{ color: colors.text[theme].error }}>Failed to load education</Text>
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
              size="xs"
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
                  variant="primary"
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
                    <Text style={{ color: colors.text[theme].secondary }}>{edu.institution_name || 'Institution'}</Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>{formatDate(edu.start_date)}</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>-</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </Text>
                    {edu.is_current && (
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

                  {/* Location */}
                  {edu.location && <Text style={{ color: colors.text[theme].secondary }}>📍 {edu.location}</Text>}

                  {/* Description */}
                  {edu.description && !showCompact && (
                    <Text style={{ color: colors.text[theme].secondary }} lineHeight={12}>
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
                style={{ color: colors.border[theme].info }}
                cursor="pointer"
                hoverStyle={{ color: colors.border[theme].info }}
                pressStyle={{ color: colors.bg[theme].primary }}
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
