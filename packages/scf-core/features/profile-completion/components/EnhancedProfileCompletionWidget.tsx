import type { ProfileWizardStepId } from "@scf/supabase/client-types";
import { DashboardWidget, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import { Button, Card, CardHeader, Text, Row, Stack } from "@scaffald/ui";
import { resolveSectionMetadata } from "../constants/sectionMetadata";
import type { PersonalizedBenefit } from "../hooks/useCompletionNudges";
import type { CompletionStatus } from "../hooks/useCompletionStatus";
import { MilestoneBadge } from "./MilestoneBadge";

export interface EnhancedProfileCompletionWidgetProps {
  onStartWizard: () => void;
  onOpenImport: () => void;
  currentBenefit: PersonalizedBenefit | null;
  advanceBenefit: () => void;
  retreatBenefit: () => void;
  goToBenefit: (index: number) => void;
  currentBenefitIndex: number;
  totalBenefits: number;
  hasMultipleBenefits: boolean;
  isBenefitLoading: boolean;
  completionStatus: CompletionStatus | null;
  isStatusLoading: boolean;
}

function buildProgressGradients(
  t: "light" | "dark"
): Array<{ threshold: number; colors: [string, string] }> {
  return [
    {
      threshold: 25,
      colors: [colors.error[t === "dark" ? 300 : 400], colors.error[500]],
    },
    {
      threshold: 50,
      colors: [colors.orange[500], colors.orange[600]],
    },
    {
      threshold: 75,
      colors: [
        t === "dark" ? colors.yellow[300] : colors.yellow[500],
        t === "dark" ? colors.yellow[400] : colors.yellow[600],
      ],
    },
    {
      threshold: 100,
      colors: [colors.green[500], colors.green[600]],
    },
  ];
}

function resolveProgressGradient(
  percentage: number,
  t: "light" | "dark"
): [string, string] {
  const gradients = buildProgressGradients(t);
  for (const gradient of gradients) {
    if (percentage <= gradient.threshold) {
      return gradient.colors;
    }
  }
  return gradients[gradients.length - 1].colors;
}

const _suggestionFallbackStyle: ViewStyle = { minHeight: 64 };

export const EnhancedProfileCompletionWidget = memo(
  function EnhancedProfileCompletionWidget({
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
    console.log("onOpenImport", onOpenImport);
    const { theme: t } = useThemeContext();
    const showCarouselControls = hasMultipleBenefits && totalBenefits > 1;
    const benefitDotIndices = useMemo(
      () => Array.from({ length: totalBenefits }, (_, idx) => idx),
      [totalBenefits]
    );

    const [suggestionHeight, setSuggestionHeight] = useState<number | null>(
      null
    );

    const handleSuggestionLayout = useCallback(
      (event: { nativeEvent: { layout: { height: number } } }) => {
        const {
          nativeEvent: {
            layout: { height },
          },
        } = event;
        setSuggestionHeight((previous) => {
          if (previous === null || Math.abs(previous - height) > 1) {
            return height;
          }
          return previous;
        });
      },
      []
    );

    const rotationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    useEffect(() => {
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current);
        rotationTimeoutRef.current = null;
      }

      if (!showCarouselControls || isBenefitLoading) {
        return;
      }

      rotationTimeoutRef.current = setTimeout(() => {
        advanceBenefit();
      }, 15_000);

      return () => {
        if (rotationTimeoutRef.current) {
          clearTimeout(rotationTimeoutRef.current);
          rotationTimeoutRef.current = null;
        }
      };
    }, [showCarouselControls, isBenefitLoading, advanceBenefit]);

    if (isStatusLoading) {
      return (
        <DashboardWidget>
          <Stack gap={16} align="center" paddingVertical={24}>
            <Text style={{ color: colors.text[t].secondary }}>
              Loading profile insights...
            </Text>
          </Stack>
        </DashboardWidget>
      );
    }

    if (!completionStatus) {
      return null;
    }

    const gradient = resolveProgressGradient(
      completionStatus.completionPercentage,
      t
    );
    const headline =
      completionStatus.completionPercentage < 25
        ? "Let's get your profile started"
        : completionStatus.completionPercentage < 50
        ? "Making great progress!"
        : completionStatus.completionPercentage < 75
        ? "Almost there—keep going!"
        : completionStatus.completionPercentage < 100
        ? "Finish strong to unlock full visibility"
        : "Profile complete!";

    return (
      <DashboardWidget>
        <Stack gap={16}>
          <Stack gap={8}>
            <Text style={{ color: colors.text[t].secondary }}>Profile Progress</Text>
            <Text>{headline}</Text>
          </Stack>

          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Text>{completionStatus.completionPercentage}%</Text>
              <Text style={{ color: colors.text[t].secondary }}>
                {completionStatus.incompleteSections.length} sections remaining
              </Text>
            </Row>
            <Stack style={{ height: 18, borderRadius: 20, overflow: "hidden" }}>
              <LinearGradient
                start={[0, 1]}
                end={[1, 0]}
                colors={gradient}
                style={{
                  flex: completionStatus.completionPercentage / 100,
                  height: "100%",
                }}
              />
            </Stack>
          </Stack>

          <Card variant="outlined">
            <CardHeader>
              <Stack gap={12}>
                <Row justify="space-between" align="center">
                  <Row gap={8} align="center">
                    <Sparkles size={20} color={colors.blue[500]} />
                    <Text>Profile Suggestion</Text>
                  </Row>

                  {showCarouselControls && (
                    <Row gap={4}>
                      <Button
                        size="sm"
                        variant="text"
                        style={{ width: 32, height: 32 }}
                        iconStart={ChevronLeft}
                        disabled={isBenefitLoading}
                        accessibilityLabel="View previous profile suggestion"
                        onPress={retreatBenefit}
                      />
                      <Button
                        size="sm"
                        variant="text"
                        style={{ width: 32, height: 32 }}
                        iconStart={ChevronRight}
                        disabled={isBenefitLoading}
                        accessibilityLabel="View next profile suggestion"
                        onPress={advanceBenefit}
                      />
                    </Row>
                  )}
                </Row>

                <Stack gap={12}>
                  <Stack
                    style={{
                      position: "relative",
                      width: "100%",
                      overflow: "hidden",
                      ...(suggestionHeight != null
                        ? { height: suggestionHeight }
                        : { minHeight: 64 }),
                    }}
                  >
                    {isBenefitLoading ? (
                      <Stack gap={4} onLayout={handleSuggestionLayout}>
                        <Text style={{ color: colors.text[t].secondary }}>
                          Gathering personalized suggestions…
                        </Text>
                      </Stack>
                    ) : currentBenefit ? (
                      <Stack
                        key={currentBenefit.id}
                        gap={4}
                        onLayout={handleSuggestionLayout}
                      >
                        <Text style={{ color: colors.text[t].secondary }}>
                          {currentBenefit.title}
                        </Text>
                        <Text style={{ color: colors.text[t].secondary }}>
                          {currentBenefit.description}
                        </Text>
                        <Text style={{ color: colors.text[t].secondary }}>
                          Suggested section:{" "}
                          {(() => {
                            try {
                              const sectionId =
                                currentBenefit.relatedSection as ProfileWizardStepId;
                              const metadata =
                                resolveSectionMetadata(sectionId);
                              return metadata.title;
                            } catch {
                              return currentBenefit.relatedSection;
                            }
                          })()}
                          {currentBenefit.opportunityCount > 0
                            ? ` • Unlock ${
                                currentBenefit.opportunityCount
                              } new opportunity${
                                currentBenefit.opportunityCount === 1
                                  ? ""
                                  : "ies"
                              }`
                            : ""}
                        </Text>
                      </Stack>
                    ) : (
                      <Stack gap={4} onLayout={handleSuggestionLayout}>
                        <Text style={{ color: colors.text[t].secondary }}>
                          Stay on track by finishing your remaining sections.
                          We'll surface targeted ideas here once more data is
                          available.
                        </Text>
                      </Stack>
                    )}
                  </Stack>

                  {showCarouselControls && (
                    <Row gap={8} justify="center" align="center">
                      {benefitDotIndices.map((dotIndex) => (
                        <Button
                          key={`profile-suggestion-dot-${dotIndex}`}
                          style={{ width: 20, height: 20, padding: 0 }}
                          variant="text"
                          disabled={isBenefitLoading}
                          accessibilityLabel={`View profile suggestion ${
                            dotIndex + 1
                          } of ${totalBenefits}`}
                          onPress={() => {
                            if (dotIndex !== currentBenefitIndex) {
                              goToBenefit(dotIndex);
                            }
                          }}
                        >
                          <Stack
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              backgroundColor:
                                dotIndex === currentBenefitIndex
                                  ? colors.blue[500]
                                  : colors.gray[400],
                              opacity:
                                dotIndex === currentBenefitIndex ? 1 : 0.4,
                            }}
                          />
                        </Button>
                      ))}
                    </Row>
                  )}
                </Stack>
              </Stack>
            </CardHeader>
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
            <Button
              size="md"
              style={{ flex: 1 }}
              variant="filled"
              color="primary"
              iconEnd={ChevronRight}
              onPress={onStartWizard}
            >
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
    );
  }
);
