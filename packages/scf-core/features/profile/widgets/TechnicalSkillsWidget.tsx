import { ROUTES } from "@scf/core/constants/routes";
import { useSkillsWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  EmptyState,
  H4,
  LoadingState,
  useThemeContext,
} from "@scaffald/ui";
import { CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Skeleton, SkeletonBox, SkeletonGroup, Text, Row, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { getProficiencyLabel } from "../constants/proficiency-levels";
import type { ProfileWidgetProps } from "./types";
import type { SkillWidgetEntry } from "@scaffald/sdk";

type EnrichedUserSkill = SkillWidgetEntry;

/**
 * TechnicalSkillsWidget
 * Displays user's technical skills grouped by taxonomy
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function TechnicalSkillsWidget({
  userId,
  showEdit = false,
  variant = "full",
}: ProfileWidgetProps) {
  const router = useRouter();
  const { theme } = useThemeContext();

  // Fetch technical skills
  const { data, isLoading, error, refetch, isFetching } = useSkillsWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <Skeleton width={60} height={20} shape="text" />
          <SkeletonGroup direction="row" gap={8} style={{ flexWrap: 'wrap' }}>
            {[100, 80, 120, 90, 110].map((w, i) => (
              <SkeletonBox key={i} width={w} height={32} borderRadius={99} />
            ))}
          </SkeletonGroup>
        </Stack>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load skills</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    );
  }

  const skills = (data || []) as EnrichedUserSkill[];
  const showCompact = variant === "compact";

  // Group skills by taxonomy
  const groupedSkills = skills.reduce(
    (acc: Record<string, EnrichedUserSkill[]>, skill: EnrichedUserSkill) => {
      const taxonomy = skill.taxonomy || "Other";
      if (!acc[taxonomy]) {
        acc[taxonomy] = [];
      }
      acc[taxonomy].push(skill);
      return acc;
    },
    {}
  );

  const taxonomyOrder = ["onet", "csi", "Other"];
  const sortedTaxonomies = Object.keys(groupedSkills).sort((a, b) => {
    const aIndex = taxonomyOrder.indexOf(a);
    const bIndex = taxonomyOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Technical Skills</H4>
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

        {/* Skills Content */}
        {skills.length === 0 ? (
          <EmptyState
            title="No skills added yet"
            description="Add your skills to showcase your expertise"
            action={
              showEdit
                ? {
                    label: "Add Skills",
                    onPress: () =>
                      router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path),
                  }
                : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {sortedTaxonomies
              .slice(0, showCompact ? 1 : undefined)
              .map((taxonomy) => (
                <Stack key={taxonomy} gap={8}>
                  {/* Taxonomy Header */}
                  <Text
                    style={{ color: colors.text[theme].secondary, textTransform: "uppercase" }}
                  >
                    {taxonomy === "onet"
                      ? "O*NET"
                      : taxonomy === "csi"
                      ? "CSI"
                      : taxonomy}
                  </Text>

                  {/* Skills in this taxonomy */}
                  <Row gap={8} wrap>
                    {groupedSkills[taxonomy]
                      .slice(0, showCompact ? 5 : undefined)
                      .map((skill: EnrichedUserSkill) => (
                        <Row
                          key={skill.id}
                          paddingHorizontal={12}
                          paddingVertical={8}
                          borderRadius={12}
                          borderWidth={1}
                          gap={8}
                          align="center"
                          style={{
                            backgroundColor: colors.blue[200],
                            borderColor: skill.verified ? colors.blue[700] : colors.blue[500],
                          }}
                        >
                          {skill.verified && (
                            <CheckCircle size={16} color={colors.blue[700]} />
                          )}
                          <Stack gap={2}>
                            <Text style={{ color: colors.blue[700] }}>
                              {skill.name}
                            </Text>
                            {!showCompact && (
                              <Row gap={8}>
                                {skill.proficiency > 0 && (
                                  <Text style={{ color: colors.blue[800] }}>
                                    {getProficiencyLabel(skill.proficiency)}
                                  </Text>
                                )}
                                {skill.yearsExperience !== null &&
                                  skill.yearsExperience > 0 && (
                                    <Text style={{ color: colors.blue[800] }}>
                                      • {skill.yearsExperience}y
                                    </Text>
                                  )}
                              </Row>
                            )}
                          </Stack>
                        </Row>
                      ))}
                  </Row>
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && skills.length > 5 && (
              <Text
                style={{ color: colors.blue[700], cursor: "pointer" }}
                onPress={() =>
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }
              >
                View all {skills.length} skills →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
