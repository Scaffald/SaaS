import type { ProfileWizardStepId } from '@scf/supabase/client-types'
import { DashboardWidget } from '@scaffald/ui'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import {
  AnimatePresence,
  Button,
  Card,
  Progress,
  styled,
  Text,
  Row,
  Stack,
} from '@scaffald/ui'
import { resolveSectionMetadata } from '../constants/sectionMetadata'
import type { PersonalizedBenefit } from '../hooks/useCompletionNudges'
import type { CompletionStatus } from '../hooks/useCompletionStatus'
import { MilestoneBadge } from './MilestoneBadge'

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

const AnimatedSuggestion = styled(Stack, {
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

const SuggestionViewport = styled(Stack, {
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
  console.log('onOpenImport', onOpenImport)
  const showCarouselControls = hasMultipleBenefits && totalBenefits > 1
  const benefitDotIndices = useMemo(
    () => Array.from({ length: totalBenefits }, (_, idx) => idx),
    [totalBenefits]
  )

  const [suggestionHeight, setSuggestionHeight] = useState<number | null>(null)

  const handleSuggestionLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
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
    },
    []
  )

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
  }, [showCarouselControls, isBenefitLoading, advanceBenefit])

  if (isStatusLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          <Text color="$gray11">Loading profile insights...</Text>
        </Stack>
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
      <Stack gap={16}>
        <Stack gap={8}>
          <Text color="$gray11">Profile Progress</Text>
          <Text>{headline}</Text>
        </Stack>

        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text>{completionStatus.completionPercentage}%</Text>
            <Text color="$gray11">
              {completionStatus.incompleteSections.length} sections remaining
            </Text>
          </Row>
          <Progress
            size="sm"
            backgroundColor="$color4"
            borderRadius={20}
            height={18}
            value={completionStatus.completionPercentage}
          >
            <Progress.Indicator asChild>
              <LinearGradient start={[0, 1]} end={[1, 0]} colors={gradient} borderRadius={20} />
            </Progress.Indicator>
          </Progress>
        </Stack>

        <Card bordered backgroundColor="$color2">
          <Card.Header padded gap={12}>
            <Row justify="space-between" align="center">
              <Row gap={8} align="center">
                <Sparkles size="lg" color="$blue10" />
                <Text>Profile Suggestion</Text>
              </Row>

              {showCarouselControls && (
                <Row gap={4}>
                  <Button
                    size="sm"
                    chromeless
                    width={32}
                    height={32}
                    align="center"
                    justify="center"
                    iconStart={ChevronLeft}
                    disabled={isBenefitLoading}
                    accessibilityLabel="View previous profile suggestion"
                    onPress={retreatBenefit}
                  />
                  <Button
                    size="sm"
                    chromeless
                    width={32}
                    height={32}
                    align="center"
                    justify="center"
                    iconStart={ChevronRight}
                    disabled={isBenefitLoading}
                    accessibilityLabel="View next profile suggestion"
                    onPress={advanceBenefit}
                  />
                </Row>
              )}
            </Row>

            <Stack gap={12}>
              <SuggestionViewport
                height={suggestionHeight ?? undefined}
                justify="center"
                style={suggestionHeight == null ? suggestionFallbackStyle : undefined}
              >
                <AnimatePresence initial={false}>
                  {isBenefitLoading ? (
                    <AnimatedSuggestion key="loading" onLayout={handleSuggestionLayout}>
                      <Text color="$gray11">Gathering personalized suggestions…</Text>
                    </AnimatedSuggestion>
                  ) : currentBenefit ? (
                    <AnimatedSuggestion key={currentBenefit.id} onLayout={handleSuggestionLayout}>
                      <Text color="$gray11">{currentBenefit.title}</Text>
                      <Text color="$gray11">{currentBenefit.description}</Text>
                      <Text color="$gray11">
                        Suggested section: {(() => {
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
                      <Text color="$gray11">
                        Stay on track by finishing your remaining sections. We’ll surface targeted
                        ideas here once more data is available.
                      </Text>
                    </AnimatedSuggestion>
                  )}
                </AnimatePresence>
              </SuggestionViewport>

              {showCarouselControls && (
                <Row gap={8} justify="center" align="center">
                  {benefitDotIndices.map((dotIndex) => (
                    <Button
                      key={`profile-suggestion-dot-${dotIndex}`}
                      width={20}
                      height={20}
                      padding={0}
                      chromeless
                      disabled={isBenefitLoading}
                      accessibilityLabel={`View profile suggestion ${dotIndex + 1} of ${totalBenefits}`}
                      onPress={() => {
                        if (dotIndex !== currentBenefitIndex) {
                          goToBenefit(dotIndex)
                        }
                      }}
                    >
                      <Stack
                        width={8}
                        height={8}
                        borderRadius="$10"
                        backgroundColor={dotIndex === currentBenefitIndex ? '$blue9' : '$color6'}
                        opacity={dotIndex === currentBenefitIndex ? 1 : 0.4}
                      />
                    </Button>
                  ))}
                </Row>
              )}
            </Stack>
          </Card.Header>
        </Card>

        <Stack gap={12}>
          <Text>Milestones</Text>
          <Row wrap gap={8}>
            {completionStatus.milestoneBadges.map((milestone) => (
              <MilestoneBadge key={milestone.id} milestone={milestone} />
            ))}
          </Row>
        </Stack>

        <Row gap={12} wrap>
          <Button size="md" flex={1} themeInverse iconEnd={ChevronRight} onPress={onStartWizard}>
            Complete Profile
          </Button>
          {/* TODO: Uncomment this when we fix the route
          <Button size="md" flex={1} iconStart={UploadCloud} onPress={() => {}}>
            Import Data
          </Button>
          */}
        </Row>
      </Stack>
    </DashboardWidget>
  )
})
