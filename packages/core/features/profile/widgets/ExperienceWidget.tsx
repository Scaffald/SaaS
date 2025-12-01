import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} from '@unicornlove/ui'
import { Briefcase } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Separator, Text, XStack, YStack } from '@unicornlove/ui'
import { formatDate } from '../utils/date-formatting'
import type { ProfileWidgetProps } from './types'

interface UserExperience {
  id: string
  job_title: string
  company_name: string
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  location: string | null
  employment_type: string | null
  is_remote: boolean | null
  description: string | null
}

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
  const { data, isLoading, error, refetch, isFetching } =
    api.profile.widgets.getExperience.useQuery(
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
        <YStack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load experience</Text>
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
        </YStack>
      </DashboardWidget>
    )
  }

  const experiences = data || []
  const showCompact = variant === 'compact'

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Work Experience</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)}
            >
              Edit
            </Button>
          )}
        </XStack>

        {experiences.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
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
          <YStack gap="$4">
            {experiences
              .slice(0, showCompact ? 3 : undefined)
              .map((exp: UserExperience, index: number) => (
                <YStack key={exp.id} gap="$2">
                  {/* Job Title & Company */}
                  <YStack gap="$1">
                    <Text fontSize="$4" fontWeight="600">
                      {exp.job_title}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {exp.company_name}
                    </Text>
                  </YStack>

                  {/* Duration */}
                  <XStack gap="$2" alignItems="center">
                    <Text fontSize="$2" color="$color10">
                      {formatDate(exp.start_date)}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      -
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                    </Text>
                    {exp.is_current && (
                      <XStack
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
                      </XStack>
                    )}
                  </XStack>

                  {/* Location & Employment Type */}
                  {(exp.location || exp.employment_type || exp.is_remote) && (
                    <XStack gap="$2" flexWrap="wrap">
                      {exp.location && (
                        <Text fontSize="$2" color="$color10">
                          📍 {exp.location}
                        </Text>
                      )}
                      {exp.employment_type && (
                        <Text fontSize="$2" color="$color10">
                          • {exp.employment_type}
                        </Text>
                      )}
                      {exp.is_remote && (
                        <Text fontSize="$2" color="$color10">
                          • Remote
                        </Text>
                      )}
                    </XStack>
                  )}

                  {/* Description */}
                  {exp.description && !showCompact && (
                    <Text fontSize="$3" color="$color11" lineHeight="$3">
                      {exp.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < experiences.length - 1 && <Separator marginVertical="$2" />}
                </YStack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && experiences.length > 3 && (
              <Text
                color="$blue7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$blue8' }}
                pressStyle={{ color: '$blue9' }}
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)}
              >
                View all {experiences.length} positions →
              </Text>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
