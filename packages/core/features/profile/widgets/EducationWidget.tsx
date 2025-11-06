import { YStack, XStack, Text, Spinner, Separator } from 'tamagui'
import { DashboardWidget, Button } from '@app/ui'
import { Heading } from '@app/ui/components/typography/Heading'
import { LoadingState } from '@app/ui/components/states/LoadingState'
import { EmptyState } from '@app/ui/components/states/EmptyState'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { spacing } from '@/tokens/design-tokens'
import { GraduationCap } from '@tamagui/lucide-icons'
import type { ProfileWidgetProps } from './types'
import { formatDate } from '../utils/date-formatting'

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
  const { data, isLoading, error } = api.profile.widgets.getEducation.useQuery(
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
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load education</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  const education = data || []
  const showCompact = variant === 'compact'

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Education</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="small"
              onPress={() => router.push('/dashboard/profile/education')}
            >
              Edit
            </Button>
          )}
        </XStack>

        {education.length === 0 ? (
          <EmptyState
            icon={<GraduationCap />}
            title="No education added yet"
            description="Add your education history to complete your profile"
            action={
              showEdit ? (
                <Button variant="primary" onPress={() => router.push('/dashboard/profile/education')}>
                  Add Education
                </Button>
              ) : undefined
            }
          />
        ) : (
          <YStack gap="$4">
            {education
              .slice(0, showCompact ? 2 : undefined)
              .map((edu: UserEducation, index: number) => (
                <YStack key={edu.id} gap="$2">
                  {/* Degree & Field */}
                  <YStack gap="$1">
                    <Text fontSize="$4" fontWeight="600">
                      {edu.degree_type || 'Degree'}
                      {edu.field_of_study && ` in ${edu.field_of_study}`}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {edu.institution_name || 'Institution'}
                    </Text>
                  </YStack>

                  {/* Duration */}
                  <XStack gap="$2" items="center">
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
                      <XStack
                        bg="$teal2"
                        px="$2"
                        py="$0.5"
                        rounded="$2"
                        borderWidth={1}
                        borderColor="$teal7"
                      >
                        <Text color="$teal11" fontSize="$1" fontWeight="600">
                          Current
                        </Text>
                      </XStack>
                    )}
                  </XStack>

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
                  {index < education.length - 1 && <Separator my="$2" />}
                </YStack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && education.length > 2 && (
              <Text
                color="$teal7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$teal8' }}
                pressStyle={{ color: '$teal9' }}
                onPress={() => router.push('/dashboard/profile/education')}
              >
                View all {education.length} entries →
              </Text>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
