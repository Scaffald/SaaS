import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { DashboardWidget } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { CheckCircle, ChevronRight, Circle } from 'lucide-react-native'
import { useToast } , useThemeContext } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Button, H4, Progress, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'

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
export function ProfileCompletionWidget() {
  const { theme } = useThemeContext()
  showEdit = false,
  variant = 'full',: ProfileWidgetProps) {
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
  }, [completionData, isLoading, toast])

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={16}>
          <Text style={{ color: colors.text[theme].secondary }}>Loading completion status...</Text>
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
            <Text style={{ color: colors.text[theme].secondary }}>
              {completionData.totalComplete} of {completionData.totalItems} complete
            </Text>
          )}
        </Row>

        {/* Progress Bar */}
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text style={{ color: colors.text[theme].secondary }}>{completionData.completionPercentage}%</Text>
            {variant === 'full' && (
              <Text style={{ color: colors.text[theme].secondary }}>
                {completionData.completionPercentage < 100 ? 'Keep going!' : 'Profile complete!'}
              </Text>
            )}
          </Row>
          <Progress
            value={completionData.completionPercentage}
            max={100}
            backgroundColor={colors.bg[theme].default}
            size={4}
          >
            <Progress.Indicator
              animation="bouncy"
              backgroundColor={completionData.completionPercentage === 100 ? colors.bg[theme].success : '$blue10'}
            />
          </Progress>
        </Stack>

        {/* Next Steps */}
        {variant === 'full' && nextIncompleteItem && (
          <Stack
            gap={12}
            padding="sm"
            backgroundColor={colors.bg[theme].muted}
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].default }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>Next Step</Text>
            <Row gap={8} align="center">
              <Circle size="md" style={{ color: colors.text[theme].secondary }} />
              <Stack flex={1} gap={4}>
                <Text>{nextIncompleteItem.title}</Text>
                {nextIncompleteItem.description && (
                  <Text style={{ color: colors.text[theme].secondary }}>{nextIncompleteItem.description}</Text>
                )}
              </Stack>
              {showEdit && nextIncompleteItem.actionRoute && (
                <Button
                  size="xs"
                  theme="info"
                  iconStart={ChevronRight}
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
            <Text style={{ color: colors.text[theme].secondary }}>Sections</Text>
            <Stack gap={8}>
              {completionData.items.map((item) => (
                <Row
                  key={item.id}
                  gap={8}
                  align="center"
                  padding="xs"
                  backgroundColor={item.complete ? '$color2' : colors.bg[theme].muted}
                  borderRadius={8}
                  opacity={item.complete ? 0.7 : 1}
                >
                  {item.complete ? (
                    <CheckCircle size={18} style={{ color: colors.text[theme].success }} />
                  ) : (
                    <Circle size={18} style={{ color: colors.text[theme].secondary }} />
                  )}
                  <Stack flex={1} gap={4}>
                    <Text color={item.complete ? colors.text[theme].secondary : colors.text[theme].primary}>{item.title}</Text>
                    {item.description && <Text style={{ color: colors.text[theme].secondary }}>{item.description}</Text>}
                  </Stack>
                  {!item.complete && showEdit && item.actionRoute && (
                    <Button
                      size="xs"
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
                size="sm"
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
