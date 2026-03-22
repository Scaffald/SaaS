import { ROUTES, buildPath } from "@scf/core/constants/routes";
import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import {
  useWorkLogs,
  useUpdateWorkLogProfileVisibilityMutation,
} from "@scf/core/utils/work-logs-sdk-hooks";
import { useQueryClient } from "@tanstack/react-query";

import { DashboardWidget, ToggleSwitch } from "@scaffald/ui";
import { useToast } from "@scaffald/ui";
import { useRouter } from "expo-router";
import {
  Button,
  Paragraph,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import type { WorkLogListItem } from "@scaffald/sdk";
import { getStatusColor, getStatusLabel } from "../utils/status-formatting";

export function WorkLogVisibilitySettingsCard() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const listQuery = useWorkLogs(
    {
      pageSize: 10,
      sortField: "updated_at",
      sortDirection: "desc",
    },
    { staleTime: 30_000 }
  );

  const updateProfileVisibilityMutation =
    useUpdateWorkLogProfileVisibilityMutation({
      onSuccess: async () => {
        toast.show({ title: "Visibility updated", message: "" });
        await queryClient.invalidateQueries({ queryKey: ["workLogs", "list"] });
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : undefined;
        toast.show({
          title: "Unable to update visibility",
          message: message ?? "Please try again.",
          variant: "error",
        });
      },
    });

  const items: WorkLogListItem[] = listQuery.data?.workLogs ?? [];

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Text>Work log profile visibility</Text>
        <Paragraph style={{ color: colors.text[t].secondary }}>
          Choose which verified work logs appear on your public profile. Manage
          individual entries and jump directly to the detailed view for more
          options.
        </Paragraph>

        {listQuery.isLoading ? (
          <Row gap={8} align="center">
            <Spinner variant="ios" size="sm" />
            <Text style={{ color: colors.text[t].secondary }}>Loading work logs…</Text>
          </Row>
        ) : items.length === 0 ? (
          <Paragraph style={{ color: colors.text[t].secondary }}>
            Create and verify a work log to manage its public visibility.
          </Paragraph>
        ) : (
          <Stack gap={12}>
            {items.map((item) => {
              const isVerified = item.status === "verified";
              const statusColor = getStatusColor(item.status, theme);
              return (
                <Stack
                  key={item.id}
                  borderRadius={16}
                  paddingHorizontal={12}
                  paddingVertical={12}
                  gap={12}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border[t].default,
                    backgroundColor: colors.bg[t].muted,
                  }}
                >
                  <Row justify="space-between" align="center">
                    <Stack gap={4} flex={1}>
                      <Text>{"Work Log"}</Text>
                      <Text style={{ color: colors.text[t].secondary }}>
                        {item.log_date
                          ? formatDate(item.log_date)
                          : "Date not recorded"}
                      </Text>
                    </Stack>
                    <Text color={statusColor as never}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </Row>

                  <Row justify="space-between" align="center" gap={16}>
                    <Stack gap={4} flex={1}>
                      <Text>Show on public profile</Text>
                      <Paragraph style={{ color: colors.text[t].secondary }}>
                        Only verified logs can be shown publicly. Disable to
                        hide this entry.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={item.show_on_profile}
                      disabled={
                        !isVerified || updateProfileVisibilityMutation.isPending
                      }
                      onChange={(checked) => {
                        if (!isVerified && checked) {
                          toast.show({
                            title: "Pending verification",
                            message:
                              "Work logs must be verified before they can appear on your profile.",
                          });
                          return;
                        }
                        updateProfileVisibilityMutation.mutate({
                          workLogId: item.id,
                          showOnProfile: checked,
                        });
                      }}
                    />
                  </Row>

                  <Row justify="space-between" align="center" gap={16}>
                    <Stack gap={4} flex={1}>
                      <Text>Show date on profile</Text>
                      <Paragraph style={{ color: colors.text[t].secondary }}>
                        Display the logged date alongside this entry on your
                        public profile.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={Boolean(item.show_date_range_on_profile)}
                      disabled={
                        !item.show_on_profile ||
                        updateProfileVisibilityMutation.isPending
                      }
                      onChange={(checked) => {
                        updateProfileVisibilityMutation.mutate({
                          workLogId: item.id,
                          showOnProfile: item.show_on_profile,
                          showDateRangeOnProfile: checked,
                        });
                      }}
                    />
                  </Row>

                  <Row justify="flex-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() =>
                        router.push(
                          buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, {
                            workLogId: item.id,
                          })
                        )
                      }
                    >
                      View details
                    </Button>
                  </Row>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  );
}
