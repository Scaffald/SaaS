import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { DashboardWidget } from '@unicornlove/ui'
import { CheckCircle, ChevronRight, Circle } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Button, H4, Progress, Text, XStack, YStack } from '@unicornlove/ui'
import type { ProfileWidgetProps } from './types'

/**
 * ProfileCompletionWidget Component
 *
 * Widget showing profile completion progress with checklist of missing sections.
 * Displays progress bar and list of incomplete sections with CTAs.
 *
 * @param userId - User ID (optional, defaults to current user)
 * @param showEdit - Whether to show edit actions
 * @param variant - Display variant (compact or full)
 */
export function ProfileCompletionWidget({
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  const router = useRouter()
  const toast = useToastController()
  const { completionData, isLoading } = useProfileCompletion()

  // Show toast prompts for incomplete sections
  useEffect(() => {
    if (!completionData || isLoading || variant !== 'full') return

    const incompleteItems = completionData.items.filter((item) => !item.complete)

    // Show toast if profile is less than 50% complete
    if (completionData.completionPercentage < 50 && incompleteItems.length > 0) {
      const nextItem = incompleteItems[0]
      toast.show('Complete Your Profile', {
        message: `Add your ${nextItem.title.toLowerCase()} to improve your profile visibility.`,
        duration: 8000,
      })
    }
  }, [completionData, isLoading, variant, toast])

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$4" alignItems="center" paddingVertical="$4">
          <Text color="$color11">Loading completion status...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!completionData) {
    return null
  }

  const incompleteItems = completionData.items.filter((item) => !item.complete)
  const nextIncompleteItem = incompleteItems[0]

  return (
    <DashboardWidget>
      <YStack gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <H4>Profile Completion</H4>
          {variant === 'full' && (
            <Text fontSize="$3" color="$color11">
              {completionData.totalComplete} of {completionData.totalItems} complete
            </Text>
          )}
        </XStack>

        {/* Progress Bar */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600" color="$color12">
              {completionData.completionPercentage}%
            </Text>
            {variant === 'full' && (
              <Text fontSize="$2" color="$color11">
                {completionData.completionPercentage < 100 ? 'Keep going!' : 'Profile complete!'}
              </Text>
            )}
          </XStack>
          <Progress
            value={completionData.completionPercentage}
            max={100}
            backgroundColor="$color4"
            size="$1"
          >
            <Progress.Indicator
              animation="bouncy"
              backgroundColor={completionData.completionPercentage === 100 ? '$green10' : '$blue10'}
            />
          </Progress>
        </YStack>

        {/* Next Steps */}
        {variant === 'full' && nextIncompleteItem && (
          <YStack
            gap="$3"
            padding="$3"
            backgroundColor="$color3"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text fontSize="$3" fontWeight="600" color="$color12">
              Next Step
            </Text>
            <XStack gap="$2" alignItems="center">
              <Circle size={16} color="$color10" />
              <YStack flex={1} gap="$1">
                <Text fontSize="$3" fontWeight="500">
                  {nextIncompleteItem.title}
                </Text>
                {nextIncompleteItem.description && (
                  <Text fontSize="$2" color="$color11">
                    {nextIncompleteItem.description}
                  </Text>
                )}
              </YStack>
              {showEdit && nextIncompleteItem.actionRoute && (
                <Button
                  size="$2"
                  theme="info"
                  icon={ChevronRight}
                  onPress={() => router.push(nextIncompleteItem.actionRoute as string)}
                >
                  Complete
                </Button>
              )}
            </XStack>
          </YStack>
        )}

        {/* Checklist (Full variant only) */}
        {variant === 'full' && (
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="600" color="$color12">
              Sections
            </Text>
            <YStack gap="$2">
              {completionData.items.map((item) => (
                <XStack
                  key={item.id}
                  gap="$2"
                  alignItems="center"
                  padding="$2"
                  backgroundColor={item.complete ? '$color2' : '$color3'}
                  borderRadius="$2"
                  opacity={item.complete ? 0.7 : 1}
                >
                  {item.complete ? (
                    <CheckCircle size={18} color="$green10" />
                  ) : (
                    <Circle size={18} color="$color10" />
                  )}
                  <YStack flex={1} gap="$1">
                    <Text
                      fontSize="$3"
                      fontWeight={item.complete ? 'normal' : '500'}
                      color={item.complete ? '$color11' : '$color12'}
                    >
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text fontSize="$2" color="$color10">
                        {item.description}
                      </Text>
                    )}
                  </YStack>
                  {!item.complete && showEdit && item.actionRoute && (
                    <Button
                      size="$2"
                      variant="outlined"
                      onPress={() => router.push(item.actionRoute as string)}
                    >
                      Add
                    </Button>
                  )}
                </XStack>
              ))}
            </YStack>
          </YStack>
        )}

        {/* Compact variant - just show progress and next step */}
        {variant === 'compact' && nextIncompleteItem && (
          <YStack gap="$2">
            {nextIncompleteItem.actionRoute && showEdit && (
              <Button
                size="$3"
                theme="info"
                onPress={() => router.push(nextIncompleteItem.actionRoute as string)}
              >
                Complete: {nextIncompleteItem.title}
              </Button>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
