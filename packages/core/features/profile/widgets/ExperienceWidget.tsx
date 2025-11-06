import { YStack, XStack, Text, H4, Spinner, Button, Separator } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import type { ProfileWidgetProps } from './types'
import { formatDate } from '../utils/date-formatting'

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
  const { data, isLoading, error } = api.profile.widgets.getExperience.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Spinner size="large" />
          <Text color="$color11">Loading experience...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load experience</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  const experiences = data || []
  const showCompact = variant === 'compact'

  return (
    <DashboardWidget>
      <YStack gap="$4">
        {/* Header */}
        <XStack justify="space-between" items="center">
          <H4>Work Experience</H4>
          {showEdit && (
            <Button
              size="$2"
              chromeless
              onPress={() => router.push('/dashboard/profile/experience')}
            >
              Edit
            </Button>
          )}
        </XStack>

        {experiences.length === 0 ? (
          <YStack gap="$2" items="center" py="$4">
            <Text color="$color11">No work experience added yet</Text>
            {showEdit && (
              <Button size="$2" onPress={() => router.push('/dashboard/profile/experience')}>
                Add Experience
              </Button>
            )}
          </YStack>
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
                  <XStack gap="$2" items="center">
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
                        bg="$blue3"
                        px="$2"
                        py="$0.5"
                        rounded="$2"
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
                  {index < experiences.length - 1 && <Separator my="$2" />}
                </YStack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && experiences.length > 3 && (
              <Button
                size="$2"
                chromeless
                onPress={() => router.push('/dashboard/profile/experience')}
              >
                View all {experiences.length} positions
              </Button>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
