import { useProfileCompletion } from "@scf/core/features/dashboard/completion/useProfileCompletion";
import { DashboardWidget } from "@scaffald/ui";
import { CheckCircle, ChevronRight, Circle } from "lucide-react-native";
import { useToast } from "@scaffald/ui";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, H4, ProgressBar, Text, Row, Stack } from "@scaffald/ui";
import type { ProfileWidgetProps } from "./types";

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
export function ProfileCompletionWidget({
  showEdit = false,
  variant = "full",
}: ProfileWidgetProps) {
  const router = useRouter();
  const toast = useToast();
  const { completionData, isLoading } = useProfileCompletion();

  // Show toast prompts for incomplete sections
  useEffect(() => {
    if (!completionData || isLoading || variant !== "full") return;

    const incompleteItems = completionData.items.filter(
      (item) => !item.complete
    );

    // Show toast if profile is less than 50% complete
    if (
      completionData.completionPercentage < 50 &&
      incompleteItems.length > 0
    ) {
      const nextItem = incompleteItems[0];
      toast.show({
        title: "Complete Your Profile",
        message: `Add your ${nextItem.title.toLowerCase()} to improve your profile visibility.`,
        duration: 8000,
      });
    }
  }, [completionData, isLoading, variant, toast]);

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={16}>
          <Text style={{ color: "#414e62" }}>Loading completion status...</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  if (!completionData) {
    return null;
  }

  const incompleteItems = completionData.items.filter((item) => !item.complete);
  const nextIncompleteItem = incompleteItems[0];

  return (
    <DashboardWidget>
      <Stack gap={16}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Profile Completion</H4>
          {variant === "full" && (
            <Text style={{ color: "#414e62" }}>
              {completionData.totalComplete} of {completionData.totalItems}{" "}
              complete
            </Text>
          )}
        </Row>

        {/* Progress Bar */}
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text style={{ color: "#414e62" }}>
              {completionData.completionPercentage}%
            </Text>
            {variant === "full" && (
              <Text style={{ color: "#414e62" }}>
                {completionData.completionPercentage < 100
                  ? "Keep going!"
                  : "Profile complete!"}
              </Text>
            )}
          </Row>
          <ProgressBar
            value={completionData.completionPercentage}
            color={
              completionData.completionPercentage === 100
                ? "success"
                : "primary"
            }
            showLabel={false}
            showIndicator={false}
          />
        </Stack>

        {/* Next Steps */}
        {variant === "full" && nextIncompleteItem && (
          <Stack
            gap={12}
            padding="sm"
            borderRadius={12}
            style={{ borderWidth: 1, borderColor: "#e2e8f0" }}
          >
            <Text style={{ color: "#414e62" }}>Next Step</Text>
            <Row gap={8} align="center">
              <Circle size={20} color="#414e62" />
              <Stack flex={1} gap={4}>
                <Text>{nextIncompleteItem.title}</Text>
                {nextIncompleteItem.description && (
                  <Text style={{ color: "#414e62" }}>
                    {nextIncompleteItem.description}
                  </Text>
                )}
              </Stack>
              {showEdit && nextIncompleteItem.actionRoute && (
                <Button
                  size="sm"
                  color="primary"
                  iconStart={ChevronRight}
                  onPress={() =>
                    router.push(nextIncompleteItem.actionRoute as string)
                  }
                >
                  Complete
                </Button>
              )}
            </Row>
          </Stack>
        )}

        {/* Checklist (Full variant only) */}
        {variant === "full" && (
          <Stack gap={8}>
            <Text style={{ color: "#414e62" }}>Sections</Text>
            <Stack gap={8}>
              {completionData.items.map((item) => (
                <Row
                  key={item.id}
                  gap={8}
                  align="center"
                  padding="xs"
                  borderRadius={8}
                  style={{ opacity: item.complete ? 0.7 : 1 }}
                >
                  {item.complete ? (
                    <CheckCircle size={18} color="#16a34a" />
                  ) : (
                    <Circle size={18} color="#414e62" />
                  )}
                  <Stack flex={1} gap={4}>
                    <Text>{item.title}</Text>
                    {item.description && (
                      <Text style={{ color: "#414e62" }}>
                        {item.description}
                      </Text>
                    )}
                  </Stack>
                  {!item.complete && showEdit && item.actionRoute && (
                    <Button
                      size="sm"
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
        {variant === "compact" && nextIncompleteItem && (
          <Stack gap={8}>
            {nextIncompleteItem.actionRoute && showEdit && (
              <Button
                size="sm"
                color="primary"
                onPress={() =>
                  router.push(nextIncompleteItem.actionRoute as string)
                }
              >
                Complete: {nextIncompleteItem.title}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
