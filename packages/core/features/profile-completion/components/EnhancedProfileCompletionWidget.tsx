import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import { AnimatePresence, Button, Card, Progress, Text, XStack, YStack, styled } from 'tamagui'
import { DashboardWidget } from '@app/ui'
import { Sparkles, UploadCloud, ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { LinearGradient } from '@tamagui/linear-gradient'
import type { PersonalizedBenefit } from '../hooks/useCompletionNudges'
import { resolveSectionMetadata } from '../constants/sectionMetadata'
import type { ProfileWizardStepId } from '@app/supabase/client-types'
import { MilestoneBadge } from './MilestoneBadge'
import type { CompletionStatus } from '../hooks/useCompletionStatus'

export interface EnhancedProfileCompletionWidgetProps {
  onStartWizard: () => void
  onOpenImport: () => void
  currentBenefit: PersonalizedBenefit | null
  advanceBenefit: () => void
  retreatBenefit: () => void
  goToBenefit: (index: number) => void
  currentBenefitIndex: number
  totalBenefits: number
  hasMultipleBenefits: boolean
  isBenefitLoading: boolean
  completionStatus: CompletionStatus | null
  isStatusLoading: boolean
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

const AnimatedSuggestion = styled(YStack, {
  name: 'AnimatedSuggestion',
  gap: '$2',
  animation: '200ms',
  enterStyle: { opacity: 0, y: -4 },
  exitStyle: { opacity: 0, y: 4 },
  opacity: 1,
  y: 0,
  position: 'absolute',
  inset: 0,
})

const SuggestionViewport = styled(YStack, {
  name: 'SuggestionViewport',
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
})

const suggestionFallbackStyle: ViewStyle = { minHeight: 64 }

export const EnhancedProfileCompletionWidget = memo(function EnhancedProfileCompletionWidget({
  onStartWizard,
  onOpenImport,
  currentBenefit,
  advanceBenefit,
  retreatBenefit,
  goToBenefit,
  currentBenefitIndex,
  totalBenefits,
  hasMultipleBenefits,
  isBenefitLoading,
  completionStatus,
  isStatusLoading,
}: EnhancedProfileCompletionWidgetProps) {
  const showCarouselControls = hasMultipleBenefits && totalBenefits > 1
  const benefitDotIndices = useMemo(
    () => Array.from({ length: totalBenefits }, (_, idx) => idx),
    [totalBenefits],
  )

  const [suggestionHeight, setSuggestionHeight] = useState<number | null>(null)

  const handleSuggestionLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const {
      nativeEvent: {
        layout: { height },
      },
    } = event
    setSuggestionHeight((previous) => {
      if (previous === null || Math.abs(previous - height) > 1) {
        return height
      }
      return previous
    })
  }, [])

  const rotationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current)
      rotationTimeoutRef.current = null
    }

    if (!showCarouselControls || isBenefitLoading) {
      return
    }

    rotationTimeoutRef.current = setTimeout(() => {
      advanceBenefit()
    }, 15_000)

    return () => {
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current)
        rotationTimeoutRef.current = null
      }
    }
  }, [showCarouselControls, isBenefitLoading, currentBenefitIndex, totalBenefits, advanceBenefit])

  if (isStatusLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$6">
          <Text color="$color11">Loading profile insights...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!completionStatus) {
    return null
  }

  const gradient = resolveProgressGradient(completionStatus.completionPercentage)
  const headline =
    completionStatus.completionPercentage < 25
      ? 'Let’s get your profile started'
      : completionStatus.completionPercentage < 50
        ? 'Making great progress!'
        : completionStatus.completionPercentage < 75
          ? 'Almost there—keep going!'
          : completionStatus.completionPercentage < 100
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
              {completionStatus.completionPercentage}%
            </Text>
            <Text fontSize="$2" color="$color10">
              {completionStatus.incompleteSections.length} sections remaining
            </Text>
          </XStack>
          <Progress
            size="$3"
            bg="$color4"
            rounded="$5"
            height={18}
            value={completionStatus.completionPercentage}
          >
            <Progress.Indicator asChild>
              <LinearGradient start={[0, 1]} end={[1, 0]} colors={gradient} rounded="$5" />
            </Progress.Indicator>
          </Progress>
        </YStack>

        <Card bordered bg="$color2">
          <Card.Header padded gap="$3">
            <XStack justify="space-between" items="center">
              <XStack gap="$2" items="center">
                <Sparkles size={20} color="$blue10" />
                <Text fontWeight="600" fontSize="$3">
                  Profile Suggestion
                </Text>
              </XStack>

              {showCarouselControls && (
                <XStack gap="$1">
                  <Button
                    size="$2"
                    circular
                    chromeless
                    width={32}
                    height={32}
                    items="center"
                    justify="center"
                    icon={ChevronLeft}
                    disabled={isBenefitLoading}
                    accessibilityLabel="View previous profile suggestion"
                    onPress={retreatBenefit}
                  />
                  <Button
                    size="$2"
                    circular
                    chromeless
                    width={32}
                    height={32}
                    items="center"
                    justify="center"
                    icon={ChevronRight}
                    disabled={isBenefitLoading}
                    accessibilityLabel="View next profile suggestion"
                    onPress={advanceBenefit}
                  />
                </XStack>
              )}
            </XStack>

            <YStack gap="$3">
              <SuggestionViewport
                height={suggestionHeight ?? undefined}
                justify="center"
                style={suggestionHeight == null ? suggestionFallbackStyle : undefined}
              >
                <AnimatePresence initial={false}>
                  {isBenefitLoading ? (
                    <AnimatedSuggestion key="loading" onLayout={handleSuggestionLayout}>
                      <Text fontSize="$3" color="$color10">
                        Gathering personalized suggestions…
                      </Text>
                    </AnimatedSuggestion>
                  ) : currentBenefit ? (
                    <AnimatedSuggestion key={currentBenefit.id} onLayout={handleSuggestionLayout}>
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {currentBenefit.title}
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        {currentBenefit.description}
                      </Text>
                      <Text fontSize="$3" color="$color10">
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
                    </AnimatedSuggestion>
                  ) : (
                    <AnimatedSuggestion key="empty" onLayout={handleSuggestionLayout}>
                      <Text fontSize="$3" color="$color11">
                        Stay on track by finishing your remaining sections. We’ll surface targeted ideas here once more data is available.
                      </Text>
                    </AnimatedSuggestion>
                  )}
                </AnimatePresence>
              </SuggestionViewport>

              {showCarouselControls && (
                <XStack gap="$2" justify="center" items="center">
                  {benefitDotIndices.map((dotIndex) => (
                    <Button
                      key={`profile-suggestion-dot-${dotIndex}`}
                      width={20}
                      height={20}
                      p={0}
                      circular
                      chromeless
                      disabled={isBenefitLoading}
                      accessibilityLabel={`View profile suggestion ${dotIndex + 1} of ${totalBenefits}`}
                      onPress={() => {
                        if (dotIndex !== currentBenefitIndex) {
                          goToBenefit(dotIndex)
                        }
                      }}
                    >
                      <YStack
                        width={8}
                        height={8}
                        rounded="$10"
                        bg={dotIndex === currentBenefitIndex ? '$blue9' : '$color6'}
                        opacity={dotIndex === currentBenefitIndex ? 1 : 0.4}
                      />
                    </Button>
                  ))}
                </XStack>
              )}
            </YStack>
          </Card.Header>
        </Card>

        <YStack gap="$3">
          <Text fontSize="$3" fontWeight="600">
            Milestones
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {completionStatus.milestoneBadges.map((milestone) => (
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
