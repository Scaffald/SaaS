import { memo } from 'react'
import { Button, Card, Progress, Text, XStack, YStack } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { Sparkles, UploadCloud, ChevronRight } from '@tamagui/lucide-icons'
import { LinearGradient } from '@tamagui/linear-gradient'
import { useCompletionStatus } from '../hooks/useCompletionStatus'
import type { PersonalizedBenefit } from '../hooks/useCompletionNudges'
import { resolveSectionMetadata } from '../constants/sectionMetadata'
import type { ProfileWizardStepId } from '@app/supabase/client-types'
import { MilestoneBadge } from './MilestoneBadge'

export interface EnhancedProfileCompletionWidgetProps {
  onStartWizard: () => void
  onOpenImport: () => void
  currentBenefit: PersonalizedBenefit | null
  advanceBenefit: () => void
  hasMultipleBenefits: boolean
  isBenefitLoading: boolean
}

const PROGRESS_GRADIENTS: Array<{ threshold: number; colors: [string, string] }> = [
  { threshold: 25, colors: ['$red9', '$red10'] },
  { threshold: 50, colors: ['$orange9', '$orange10'] },
  { threshold: 75, colors: ['$yellow9', '$yellow10'] },
  { threshold: 100, colors: ['$green9', '$green10'] },
]

function resolveProgressGradient(percentage: number): [string, string] {
  for (const gradient of PROGRESS_GRADIENTS) {
    if (percentage <= gradient.threshold) {
      return gradient.colors
    }
  }
  return PROGRESS_GRADIENTS[PROGRESS_GRADIENTS.length - 1].colors
}

export const EnhancedProfileCompletionWidget = memo(function EnhancedProfileCompletionWidget({
  onStartWizard,
  onOpenImport,
  currentBenefit,
  advanceBenefit,
  hasMultipleBenefits,
  isBenefitLoading,
}: EnhancedProfileCompletionWidgetProps) {
  const { status, isLoading } = useCompletionStatus()

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$6">
          <Text color="$color11">Loading profile insights...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!status) {
    return null
  }

  const gradient = resolveProgressGradient(status.completionPercentage)
  const headline =
    status.completionPercentage < 25
      ? 'Let’s get your profile started'
      : status.completionPercentage < 50
        ? 'Making great progress!'
        : status.completionPercentage < 75
          ? 'Almost there—keep going!'
          : status.completionPercentage < 100
            ? 'Finish strong to unlock full visibility'
            : 'Profile complete!'

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            Profile Progress
          </Text>
          <Text fontSize="$6" fontWeight="700">
            {headline}
          </Text>
        </YStack>

        <YStack gap="$3">
          <XStack justify="space-between" items="center">
            <Text fontSize="$5" fontWeight="600">
              {status.completionPercentage}%
            </Text>
            <Text fontSize="$2" color="$color10">
              {status.incompleteSections.length} sections remaining
            </Text>
          </XStack>
          <Progress
            size="$3"
            bg="$color4"
            rounded="$5"
            height={18}
            value={status.completionPercentage}
          >
            <Progress.Indicator asChild>
              <LinearGradient start={[0, 1]} end={[1, 0]} colors={gradient} rounded="$5" />
            </Progress.Indicator>
          </Progress>
        </YStack>

        <Card bordered bg="$color2">
          <Card.Header padded gap="$3">
            <XStack gap="$2" items="center">
              <Sparkles size={20} color="$blue10" />
              <Text fontWeight="600" fontSize="$3">
                Smart Suggestions
              </Text>
            </XStack>

            <YStack gap="$2">
              {isBenefitLoading ? (
                <Text fontSize="$2" color="$color10">
                  Gathering personalized suggestions…
                </Text>
              ) : currentBenefit ? (
                <>
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    {currentBenefit.title}
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    {currentBenefit.description}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    Suggested section:{' '}
                    {(() => {
                      try {
                        const sectionId = currentBenefit.relatedSection as ProfileWizardStepId
                        const metadata = resolveSectionMetadata(sectionId)
                        return metadata.title
                      } catch {
                        return currentBenefit.relatedSection
                      }
                    })()}
                    {currentBenefit.opportunityCount > 0
                      ? ` • Unlock ${currentBenefit.opportunityCount} new opportunity${currentBenefit.opportunityCount === 1 ? '' : 'ies'}`
                      : ''}
                  </Text>
                  {hasMultipleBenefits && (
                    <Button size="$2" variant="outlined" onPress={advanceBenefit}>
                      Show another tip
                    </Button>
                  )}
                </>
              ) : (
                <Text fontSize="$2" color="$color11">
                  Stay on track by finishing your remaining sections. We’ll surface targeted ideas here once more data is available.
                </Text>
              )}
            </YStack>
          </Card.Header>
        </Card>

        <YStack gap="$3">
          <Text fontSize="$3" fontWeight="600">
            Milestones
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {status.milestoneBadges.map((milestone) => (
              <MilestoneBadge key={milestone.id} milestone={milestone} />
            ))}
          </XStack>
        </YStack>

        <XStack gap="$3" flexWrap="wrap">
          <Button size="$4" flex={1} themeInverse iconAfter={ChevronRight} onPress={onStartWizard}>
            Complete Profile
          </Button>
          <Button size="$4" flex={1} icon={UploadCloud} onPress={onOpenImport}>
            Import Data
          </Button>
        </XStack>
      </YStack>
    </DashboardWidget>
  )
})
