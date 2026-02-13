import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { DashboardWidget } from '@unicornlove/beyond-ui'
import { CheckCircle, ChevronRight, Circle } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Button, H4, Progress, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
  const toast = useToast()
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
        <Stack gap={16} align="center" paddingVertical={16}>
          <Text color="gray">Loading completion status...</Text>
        </Stack>
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
      <Stack gap={16}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Profile Completion</H4>
          {variant === 'full' && (
            <Text color="gray">
              {completionData.totalComplete} of {completionData.totalItems} complete
            </Text>
          )}
        </Row>

        {/* Progress Bar */}
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text color="gray">{completionData.completionPercentage}%</Text>
            {variant === 'full' && (
              <Text color="gray">
                {completionData.completionPercentage < 100 ? 'Keep going!' : 'Profile complete!'}
              </Text>
            )}
          </Row>
          <Progress
            value={completionData.completionPercentage}
            max={100}
            backgroundColor="$color4"
            size={4}
          >
            <Progress.Indicator
              animation="bouncy"
              backgroundColor={completionData.completionPercentage === 100 ? '$green10' : '$blue10'}
            />
          </Progress>
        </Stack>

        {/* Next Steps */}
        {variant === 'full' && nextIncompleteItem && (
          <Stack
            gap={12}
            padding={12}
            backgroundColor="$color3"
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text color="gray">Next Step</Text>
            <Row gap={8} align="center">
              <Circle size={16} color="gray" />
              <Stack flex={1} gap={4}>
                <Text>{nextIncompleteItem.title}</Text>
                {nextIncompleteItem.description && (
                  <Text color="gray">{nextIncompleteItem.description}</Text>
                )}
              </Stack>
              {showEdit && nextIncompleteItem.actionRoute && (
                <Button
                  size={8}
                  theme="info"
                  icon={ChevronRight}
                  onPress={() => router.push(nextIncompleteItem.actionRoute as string)}
                >
                  Complete
                </Button>
              )}
            </Row>
          </Stack>
        )}

        {/* Checklist (Full variant only) */}
        {variant === 'full' && (
          <Stack gap={8}>
            <Text color="gray">Sections</Text>
            <Stack gap={8}>
              {completionData.items.map((item) => (
                <Row
                  key={item.id}
                  gap={8}
                  align="center"
                  padding={8}
                  backgroundColor={item.complete ? '$color2' : '$color3'}
                  borderRadius={8}
                  opacity={item.complete ? 0.7 : 1}
                >
                  {item.complete ? (
                    <CheckCircle size={18} color="$green10" />
                  ) : (
                    <Circle size={18} color="gray" />
                  )}
                  <Stack flex={1} gap={4}>
                    <Text color={item.complete ? '$color11' : '$color12'}>{item.title}</Text>
                    {item.description && <Text color="gray">{item.description}</Text>}
                  </Stack>
                  {!item.complete && showEdit && item.actionRoute && (
                    <Button
                      size={8}
                      variant="outline"
                      onPress={() => router.push(item.actionRoute as string)}
                    >
                      Add
                    </Button>
                  )}
                </Row>
              ))}
            </Stack>
          </Stack>
        )}

        {/* Compact variant - just show progress and next step */}
        {variant === 'compact' && nextIncompleteItem && (
          <Stack gap={8}>
            {nextIncompleteItem.actionRoute && showEdit && (
              <Button
                size={12}
                theme="info"
                onPress={() => router.push(nextIncompleteItem.actionRoute as string)}
              >
                Complete: {nextIncompleteItem.title}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
