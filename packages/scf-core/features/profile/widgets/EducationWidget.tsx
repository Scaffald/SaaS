import { ROUTES } from "@scf/core/constants/routes";
import { useEducationWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  EmptyState,
  Separator,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { GraduationCap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors } from "@scaffald/ui/tokens";
import { workerPalette } from "@scf/core/components/ui/styles";
import { Pill } from "@scf/core/components/ui/CardPrimitives";
import { formatDate } from "../utils/date-formatting";
import type { ProfileWidgetProps } from "./types";
import type { EducationWidgetEntry } from "@scaffald/sdk";

type UserEducation = EducationWidgetEntry;

/**
 * EducationWidget
 * Displays user's education history
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function EducationWidget({
  userId,
  showEdit = false,
  variant = "full",
}: ProfileWidgetProps) {
  const router = useRouter();
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light" as const;
  const pal = workerPalette[t];
  const { data, isLoading, error, refetch, isFetching } = useEducationWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={12} animation="wave">
          <Skeleton width={80} height={20} shape="text" />
          {[0, 1].map((i) => (
            <Row key={i} gap={12} align="flex-start">
              <SkeletonAvatar size={40} />
              <SkeletonText lines={2} style={{ flex: 1 }} />
            </Row>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load education</Text>
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

  const education = data || [];
  const showCompact = variant === "compact";

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* Header */}
        <DashboardWidgetHeader
          title="Education"
          action={
            showEdit ? (
              <Button
                variant="outline"
                size="sm"
                onPress={() =>
                  router.push(ROUTES.PROFILE.EDUCATION.path)
                }
              >
                Edit
              </Button>
            ) : undefined
          }
        />

        {education.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No education added yet"
            description="Add your education history to complete your profile"
            action={
              showEdit
                ? {
                    label: "Add Education",
                    onPress: () =>
                      router.push(ROUTES.PROFILE.EDUCATION.path),
                  }
                : undefined
            }
          />
        ) : (
          <Stack gap={16}>
            {education
              .slice(0, showCompact ? 2 : undefined)
              .map((edu: UserEducation, index: number) => (
                <Stack key={edu.id} gap={8}>
                  {/* Degree & Field */}
                  <Stack gap={4}>
                    <Text>
                      {edu.degree_type || "Degree"}
                      {edu.field_of_study && ` in ${edu.field_of_study}`}
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.institution_name || "Institution"}
                    </Text>
                  </Stack>

                  {/* Duration */}
                  <Row gap={8} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {formatDate(edu.start_date)}
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }}>-</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {edu.is_current ? "Present" : formatDate(edu.end_date)}
                    </Text>
                    {edu.is_current && (
                      <Pill label="Current" bgColor={pal.pillBg} textColor={pal.pillText} />
                    )}
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Text style={{ color: colors.text[theme].secondary }}>📍 {edu.location}</Text>
                  )}

                  {/* Description */}
                  {edu.description && !showCompact && (
                    <Text style={{ color: colors.text[theme].secondary, lineHeight: 20 }}>
                      {edu.description}
                    </Text>
                  )}

                  {/* Separator between items */}
                  {index < education.length - 1 && (
                    <Separator marginVertical={8} />
                  )}
                </Stack>
              ))}

            {/* Show More link for compact view */}
            {showCompact && education.length > 2 && (
              <Text
                style={{ color: pal.accent, cursor: "pointer" }}
                onPress={() =>
                  router.push(ROUTES.PROFILE.EDUCATION.path)
                }
              >
                View all {education.length} entries →
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
