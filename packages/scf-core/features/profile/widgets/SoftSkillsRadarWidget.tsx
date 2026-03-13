import { ROUTES } from "@scf/core/constants/routes";
import { useSoftSkills } from "@scf/core/utils/profile-skills-sdk-hooks";
import { SoftSkillsRadarGrid } from "@scf/core/components/ui";
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from "../components/SoftSkillsCategoryTabs";
import type { SoftSkill } from "../components/SoftSkillsCategoryTabs";
import { Pressable } from "react-native";
import {
  Button,
  DashboardWidget,
  EmptyState,
  H4,
  Skeleton,
  SkeletonBox,
  ResponsiveModal,
  useThemeContext,
} from "@scaffald/ui";
import { RadarChart } from "@scaffald/ui/chart";
import { colors } from "@scaffald/ui/tokens";
import { BarChart3, Download } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useToast } from "@scaffald/ui";
import { useCallback, useMemo, useState, type FC } from "react";
import { Separator, Text, Row, Stack } from "@scaffald/ui";
import { useSoftSkillsComparison } from "@scf/core/utils/profile-skills-sdk-hooks";
import type { ProfileWidgetProps } from "./types";

/**
 * SoftSkillsRadarWidget component
 *
 * Main soft skills radar chart widget for profile display.
 * Shows 4-category overview with self/peer overlay and interactive drill-down.
 */
export const SoftSkillsRadarWidget: FC<ProfileWidgetProps> = ({
  userId,
  showEdit = false,
  variant = "full",
}) => {
  const router = useRouter();
  const toast = useToast();
  const { theme } = useThemeContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<SoftSkillCategory>("reliability");
  const [activeCategory, setActiveCategory] =
    useState<SoftSkillCategory>("reliability");

  const [showPeerOverlay, setShowPeerOverlay] = useState(false);

  // Fetch soft skills data
  const {
    data,
    isPending: isLoading,
    error,
  } = useSoftSkills(userId ? { userId } : undefined, {
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch peer comparison data for radar overlay
  const { data: comparisonData } = useSoftSkillsComparison({
    enabled: !!userId,
  });

  // Prepare skills for display
  const skills = useMemo<SoftSkill[]>(() => {
    if (!data) return [];

    // Note: getSoftSkillsComparison returns category averages, not individual skill ratings
    // So we only show self ratings in the drill-down grid
    return data.skills
      .filter((skill) => skill.rating !== null && skill.rating !== undefined)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        selfRating: skill.rating ?? 0,
        peerRating: undefined, // Individual peer ratings not available
        versionHistory: undefined, // Not needed for widget
      }));
  }, [data]);

  // Build radar chart axes from category averages
  const CATEGORY_LABELS: Record<string, string> = {
    reliability: "Reliability",
    collaboration: "Collaboration",
    professionalism: "Professionalism",
    technical: "Technical",
  };

  const radarAxes = useMemo(() => {
    if (!data?.categoryAverages) return [];
    const categories = Object.keys(CATEGORY_LABELS);
    return categories.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      value:
        data.categoryAverages[cat as keyof typeof data.categoryAverages] ?? 0,
      maxValue: 5,
    }));
  }, [data?.categoryAverages]);

  const radarComparison = useMemo(() => {
    if (!showPeerOverlay || !comparisonData?.peer) return undefined;
    const categories = Object.keys(CATEGORY_LABELS);
    return categories.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      value:
        comparisonData.peer?.[cat as keyof typeof comparisonData.peer] ?? 0,
    }));
  }, [showPeerOverlay, comparisonData?.peer]);

  // Handle export (placeholder for now)
  const handleExport = useCallback(() => {
    toast.show({
      title: "Export",
      message: "Chart export functionality coming soon!",
    });
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <Skeleton width={120} height={20} shape="text" />
          <SkeletonBox width="100%" height={200} borderRadius={12} />
        </Stack>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text color="$red10">Failed to load soft skills</Text>
          <Text color="$gray11">{error.message}</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  if (!data || data.skills.length === 0) {
    return (
      <DashboardWidget>
        <EmptyState
          title="No soft skills assessment"
          description="Complete your soft skills assessment to see your profile"
        />
      </DashboardWidget>
    );
  }

  const showCompact = variant === "compact";

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Soft Skills</H4>
          <Row gap={8} align="center">
            {!showCompact && (
              <Button
                variant="outline"
                size="sm"
                iconStart={Download}
                onPress={handleExport}
                testID="soft-skills-export-button"
              >
                Export
              </Button>
            )}
            {showEdit && (
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path);
                }}
              >
                Edit
              </Button>
            )}
          </Row>
        </Row>

        {/* Radar Chart */}
        {radarAxes.length >= 3 && (
          <>
            <Stack align="center" paddingVertical={8}>
              <RadarChart
                axes={radarAxes}
                comparison={radarComparison}
                size={showCompact ? "sm" : "md"}
                showLabels
                showValues={!showCompact}
              />
            </Stack>

            {/* Peer overlay toggle + legend */}
            {comparisonData?.peer && (
              <Row gap={12} justify="center" align="center">
                <Pressable
                  onPress={() => setShowPeerOverlay(!showPeerOverlay)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 4,
                    backgroundColor: showPeerOverlay
                      ? colors.primary[50]
                      : colors.bg[theme].subtle,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: showPeerOverlay
                        ? colors.primary[600]
                        : colors.text[theme].secondary,
                    }}
                  >
                    {showPeerOverlay ? "Self + Peer" : "Self Only"}
                  </Text>
                </Pressable>
                {showPeerOverlay && (
                  <Row gap={12}>
                    <Row gap={4} align="center">
                      <Stack
                        style={{
                          width: 10,
                          height: 3,
                          backgroundColor: colors.primary[500],
                          borderRadius: 2,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.text[theme].tertiary,
                        }}
                      >
                        Self
                      </Text>
                    </Row>
                    <Row gap={4} align="center">
                      <Stack
                        style={{
                          width: 10,
                          height: 3,
                          backgroundColor: colors.orange[500],
                          borderRadius: 2,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.text[theme].tertiary,
                        }}
                      >
                        Peer
                      </Text>
                    </Row>
                  </Row>
                )}
              </Row>
            )}

            <Separator />
          </>
        )}

        {/* Category Tabs */}
        {skills.length > 0 && (
          <>
            <SoftSkillsCategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <Separator />
          </>
        )}

        {/* Skills Grid */}
        {skills.length > 0 && (
          <SoftSkillsRadarGrid
            skills={skills}
            activeCategory={activeCategory}
            isLoading={false}
          />
        )}

        {/* View Full Analytics Link */}
        {!showCompact && (
          <Button
            variant="text"
            size="sm"
            iconStart={BarChart3}
            onPress={() =>
              router.push(ROUTES.DASHBOARD.ASSESSMENTS.path)
            }
          >
            View Full Analytics
          </Button>
        )}

        {/* Drill-down Modal */}
        <ResponsiveModal
          open={drillDownOpen}
          onOpenChange={setDrillDownOpen}
          title="Soft Skills Details"
          size="lg"
        >
          <Stack gap={16} padding="md">
            {/* Category Tabs */}
            <SoftSkillsCategoryTabs
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Skills Grid */}
            <SoftSkillsRadarGrid
              skills={skills}
              activeCategory={selectedCategory}
              isLoading={false}
            />
          </Stack>
        </ResponsiveModal>
      </Stack>
    </DashboardWidget>
  );
};
