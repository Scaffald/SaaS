import { ROUTES } from "@scf/core/constants/routes";
import { useEducationWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import {
  Button,
  DashboardWidget,
  EmptyState,
  H4,
  Separator,
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { GraduationCap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors } from "@scaffald/ui/tokens";
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
  const { data, isLoading, error, refetch, isFetching } = useEducationWidget(
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
            <Skeleton width={80} height={20} shape="text" />
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
        <Row justify="space-between" align="center">
          <H4>Education</H4>
          {showEdit && (
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)
              }
            >
              Edit
            </Button>
          )}
        </Row>

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
                      router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path),
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
                      <Row
                        paddingHorizontal={8}
                        paddingVertical={2}
                        borderRadius={8}
                        borderWidth={1}
                        style={{
                          backgroundColor: colors.blue[200],
                          borderColor: colors.blue[700],
                        }}
                      >
                        <Text style={{ color: colors.blue[700] }}>Current</Text>
                      </Row>
                    )}
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Text style={{ color: colors.text[theme].secondary }}>📍 {edu.location}</Text>
                  )}

                  {/* Description */}
                  {edu.description && !showCompact && (
                    <Text style={{ color: colors.text[theme].secondary, lineHeight: 12 }}>
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
                style={{ color: colors.blue[700], cursor: "pointer" }}
                onPress={() =>
                  router.push(ROUTES.DASHBOARD.PROFILE.EDUCATION.path)
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
