import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import type { PublicWorkLog, PublicWorkLogPhoto } from "@scf/schemas";
import { usePublicWorkLogsFeed } from "@scf/core/utils/work-logs-sdk-hooks";
import { ShieldCheck } from "lucide-react-native";
import { useMemo } from "react";
import { Image } from "react-native";
import { Card, Paragraph, Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface WorkLogPortfolioWidgetProps {
  userId: string;
}

export function WorkLogPortfolioWidget({
  userId,
}: WorkLogPortfolioWidgetProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const { data, isLoading } = usePublicWorkLogsFeed(
    userId ? { userId, limit: 12 } : undefined,
    {
      enabled: Boolean(userId),
      staleTime: 60_000,
    }
  );

  const workLogs: PublicWorkLog[] = (data as unknown as PublicWorkLog[]) ?? [];

  const groupedLogs = useMemo(() => {
    const groups = new Map<
      string,
      {
        projectName: string | null;
        organizationName: string | null;
        entries: PublicWorkLog[];
      }
    >();

    for (const log of workLogs) {
      const key = log.projectId ?? log.id;
      const existing = groups.get(key);
      if (existing) {
        existing.entries.push(log);
      } else {
        groups.set(key, {
          projectName: log.projectName,
          organizationName: log.organizationName,
          entries: [log],
        });
      }
    }

    return Array.from(groups.entries()).map(([key, value]) => ({
      id: key,
      projectName: value.projectName,
      organizationName: value.organizationName,
      entries: value.entries,
    }));
  }, [workLogs]);

  return (
    <Card borderColor={colors.border[t].default} borderWidth={1}>
      <Stack gap={16} padding="md">
        <Stack gap={8}>
          <Text>Verified work history</Text>
          <Paragraph color={colors.text[t].secondary}>
            Recent verified work logs selected by this worker. Projects appear
            here only when the worker has chosen to share them publicly.
          </Paragraph>
        </Stack>

        {isLoading ? (
          <Row gap={8} align="center">
            <Spinner size="sm" />
            <Text color={colors.text[t].secondary}>Loading work history…</Text>
          </Row>
        ) : workLogs.length === 0 ? (
          <Paragraph color={colors.text[t].secondary}>
            No verified work logs are currently visible on this profile.
          </Paragraph>
        ) : (
          <Stack gap={16}>
            {groupedLogs.map((group) => {
              const allDates = group.entries
                .map((entry) => entry.logDate)
                .filter((value): value is string => Boolean(value));
              const earliest = allDates.reduce<string | null>(
                (current, candidate) => {
                  if (!current) return candidate;
                  return current <= candidate ? current : candidate;
                },
                null
              );
              const latest = allDates.reduce<string | null>(
                (current, candidate) => {
                  if (!current) return candidate;
                  return current >= candidate ? current : candidate;
                },
                null
              );

              const dateLabel = (() => {
                if (!allDates.length) return "Date hidden by worker";
                if (earliest && latest && earliest !== latest) {
                  return `${formatDate(earliest)} – ${formatDate(latest)}`;
                }
                if (earliest) {
                  return formatDate(earliest);
                }
                return "Date hidden by worker";
              })();

              const photos = group.entries.flatMap(
                (entry) => entry.photos
              ) as PublicWorkLogPhoto[];

              return (
                <Stack
                  key={group.id}
                  borderWidth={1}
                  borderColor={colors.border[t].default}
                  borderRadius={16}
                  paddingHorizontal={12}
                  paddingVertical={12}
                  gap={12}
                  backgroundColor={colors.bg[t].subtle}
                >
                  <Row align="center" justify="space-between">
                    <Stack gap={4}>
                      <Text>{group.projectName ?? "Project"}</Text>
                      {group.organizationName ? (
                        <Text color={colors.text[t].secondary}>{group.organizationName}</Text>
                      ) : null}
                      <Text color={colors.text[t].secondary}>{dateLabel}</Text>
                    </Stack>
                    <Row
                      gap={8}
                      align="center"
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={16}
                      backgroundColor={t === 'dark' ? colors.green[900] : colors.green[50]}
                    >
                      <ShieldCheck size="md" color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                      <Text color={t === 'dark' ? colors.green[300] : colors.green[600]}>Verified by Scaffald</Text>
                    </Row>
                  </Row>

                  {photos.length > 0 ? (
                    <Row gap={8} wrap>
                      {photos.map((photo) => (
                        <Card
                          key={`${group.id}-${photo.id}`}
                          borderWidth={1}
                          style={{
                            width: "30%",
                            minWidth: 120,
                            height: 90,
                            overflow: "hidden",
                          }}
                        >
                          {photo.thumbnailSignedUrl || photo.signedUrl ? (
                            <Image
                              source={{
                                uri:
                                  photo.thumbnailSignedUrl ??
                                  photo.signedUrl ??
                                  undefined,
                              }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Stack
                              flex={1}
                              align="center"
                              justify="center"
                              backgroundColor={colors.bg[t].muted}
                            >
                              <Text color={colors.text[t].secondary}>Photo unavailable</Text>
                            </Stack>
                          )}
                        </Card>
                      ))}
                    </Row>
                  ) : (
                    <Paragraph color={colors.text[t].secondary}>
                      No photos were shared for this project.
                    </Paragraph>
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
