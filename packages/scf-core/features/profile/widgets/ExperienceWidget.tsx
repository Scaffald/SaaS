import { ROUTES } from "@scf/core/constants/routes";
import { useExperienceWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  EmptyState,
  H4,
  LoadingState,
  useThemeContext,
} from "@scaffald/ui";
import { Briefcase } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Separator, Skeleton, SkeletonAvatar, SkeletonText, Text, Row, Stack } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { formatDate } from "../utils/date-formatting";
import type { ProfileWidgetProps } from "./types";
import type { ExperienceWidgetEntry } from "@scaffald/sdk";

type UserExperience = ExperienceWidgetEntry;

/**
 * ExperienceWidget
 * Displays user's work experience in timeline format
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function ExperienceWidget({
  userId,
  showEdit = false,
  variant = "full",
}: ProfileWidgetProps) {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { data, isLoading, error, refetch, isFetching } = useExperienceWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Skeleton width={120} height={20} shape="text" />
          </Row>
          {[0, 1].map((i) => (
            <Row key={i} gap={12} align="flex-start">
              <SkeletonAvatar size={40} />
              <SkeletonText lines={2} style={{ flex: 1 }} />
            </Row>
          ))}
        </Stack>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load experience</Text>
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

  const experiences = data || [];
  const showCompact = variant === "compact";

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Work Experience</H4>
          {showEdit && (
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)
              }
            >
              Edit
            </Button>
          )}
        </Row>

        {experiences.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No work experience added yet"
            description="Add your work experience to showcase your career history"
            action={
              showEdit
                ? {
                    label: "Add Experience",
                    onPress: () =>
                      router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path),
                  }
                : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {experiences
              .slice(0, showCompact ? 3 : undefined)
              .map((exp: UserExperience, index: number) => (
                <Stack key={exp.id} gap={8}>
                  {/* Job Title & Company */}
                  <Stack gap={4}>
                    <Text>{exp.job_title}</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>{exp.company_name}</Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {formatDate(exp.start_date)}
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }}>-</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {exp.is_current ? "Present" : formatDate(exp.end_date)}
                    </Text>
                    {exp.is_current && (
                      <Row
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        style={{
                          backgroundColor: colors.blue[50],
                          borderWidth: 1,
                          borderColor: colors.blue[500],
                        }}
                      >
                        <Text style={{ color: colors.blue[700] }}>Current</Text>
                      </Row>
                    )}
                  </Row>

                  {/* Location & Employment Type */}
                  {(exp.location || exp.employment_type || exp.is_remote) && (
                    <Row gap={8} wrap>
                      {exp.location && (
                        <Text style={{ color: colors.text[theme].secondary }}>
                          📍 {exp.location}
                        </Text>
                      )}
                      {exp.employment_type && (
                        <Text style={{ color: colors.text[theme].secondary }}>
                          • {exp.employment_type}
                        </Text>
                      )}
                      {exp.is_remote && (
                        <Text style={{ color: colors.text[theme].secondary }}>• Remote</Text>
                      )}
                    </Row>
                  )}

                  {/* Description */}
                  {exp.description && !showCompact && (
                    <Text style={{ color: colors.text[theme].secondary, lineHeight: 20 }}>
                      {exp.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < experiences.length - 1 && (
                    <Separator style={{ marginVertical: 8 }} />
                  )}
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && experiences.length > 3 && (
              <Text
                style={{ color: colors.blue[500] }}
                onPress={() =>
                  router.push(ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path)
                }
              >
                View all {experiences.length} positions →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
