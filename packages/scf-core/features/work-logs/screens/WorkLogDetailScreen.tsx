import { ROUTES } from "@scf/core/constants/routes";
import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import {
  useWorkLog,
  useWorkLogConversation,
  useWorkLogCollaborators,
  useWorkLogProjectOptions,
  useAddWorkLogCommentMutation,
  useExportWorkLogMutation,
  useAddWorkLogCollaboratorMutation,
  useUpdateWorkLogCollaboratorMutation,
  useRemoveWorkLogCollaboratorMutation,
  useUpdateWorkLogProfileVisibilityMutation,
  useUpdateWorkLogPhotoVisibilityMutation,
} from "@scf/core/utils/work-logs-sdk-hooks";
import { useUserSkills } from "@scf/core/utils/profile-skills-sdk-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { buildSkillLookup } from "../utils/data-normalizers";
import { ToggleSwitch } from "@scaffald/ui";
import {
  Activity,
  DownloadCloud,
  Edit,
  FileText,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { useToast } from "@scaffald/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Linking, ScrollView } from "react-native";
import {
  Button,
  Card,
  Input,
  Paragraph,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

import { PhotoGallery } from "../components/PhotoGallery";
import { getStatusColor, getStatusLabel } from "../utils/status-formatting";

type IconRenderer = typeof Activity;

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

interface CollaboratorRecord {
  id?: string;
  collaborator_user_id?: string | null;
  permission_level?: "view" | "edit" | null;
  user?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

interface ConversationEntryRecord {
  id?: string;
  user_id?: string | null;
  message?: string | null;
  created_at?: string | null;
  is_system_message?: boolean | null;
  user?: {
    display_name?: string | null;
    username?: string | null;
  } | null;
}

export function WorkLogDetailScreen() {
  const { workLogId } = useLocalSearchParams<{ workLogId: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { theme } = useThemeContext();

  const workLogQuery = useWorkLog(
    workLogId && typeof workLogId === "string" ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  );

  const conversationQuery = useWorkLogConversation(
    workLogId && typeof workLogId === "string" ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  );

  const collaboratorsQuery = useWorkLogCollaborators(
    workLogId && typeof workLogId === "string" ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  );

  const projectOptionsQuery = useWorkLogProjectOptions(undefined, {
    staleTime: 120_000,
  });

  const skillsQuery = useUserSkills({
    staleTime: 120_000,
  });

  const addCommentMutation = useAddWorkLogCommentMutation({
    onSuccess: () => {
      void conversationQuery.refetch();
      setCommentDraft("");
    },
    onError: (error) => {
      toast.show({
        title: "Unable to add comment",
        message: error?.message ?? "Please try again.",
        variant: "error",
      });
    },
  });

  const exportMutation = useExportWorkLogMutation({
    onSuccess: async (data, variables) => {
      toast.show({
        title: "Export ready",
        message: `Download ${variables.format.toUpperCase()} export.`,
      });
      if (data.downloadUrl) {
        try {
          await Linking.openURL(data.downloadUrl);
        } catch (error) {
          console.warn("[WorkLogDetail] Unable to open download URL", error);
        }
      }
    },
    onError: (error) => {
      toast.show({
        title: "Export failed",
        message: error?.message ?? "Unable to export work log.",
        variant: "error",
      });
    },
  });

  const addCollaboratorMutation = useAddWorkLogCollaboratorMutation({
    onSuccess: () => {
      setCollaboratorIdInput("");
      void collaboratorsQuery.refetch();
      toast.show({
        title: "Collaborator added",
        message: "They now have access to this work log.",
      });
    },
    onError: (error) => {
      toast.show({
        title: "Unable to add collaborator",
        message: error?.message ?? "Check the user ID and try again.",
        variant: "error",
      });
    },
  });

  const updateCollaboratorMutation = useUpdateWorkLogCollaboratorMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch();
    },
    onError: (error) => {
      toast.show({
        title: "Unable to update collaborator",
        message: error?.message ?? "Please try again.",
        variant: "error",
      });
    },
  });

  const removeCollaboratorMutation = useRemoveWorkLogCollaboratorMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch();
      toast.show({
        title: "Collaborator removed",
        message: "They no longer have access to this work log.",
      });
    },
    onError: (error) => {
      toast.show({
        title: "Unable to remove collaborator",
        message: error?.message ?? "Please try again.",
        variant: "error",
      });
    },
  });

  const updateProfileVisibilityMutation =
    useUpdateWorkLogProfileVisibilityMutation({
      onSuccess: async () => {
        toast.show({ title: "Profile visibility updated", message: "" });
        await Promise.all([
          workLogQuery.refetch(),
          queryClient.invalidateQueries({ queryKey: ["workLogs", "list"] }),
        ]);
      },
      onError: (error) => {
        toast.show({
          title: "Unable to update visibility",
          message: error?.message ?? "Please try again.",
          variant: "error",
        });
      },
    });

  const updatePhotoVisibilityMutation = useUpdateWorkLogPhotoVisibilityMutation(
    {
      onSuccess: async () => {
        toast.show({ title: "Photo visibility updated", message: "" });
        await workLogQuery.refetch();
      },
      onError: (error) => {
        toast.show({
          title: "Unable to update photo",
          message: error?.message ?? "Please try again.",
          variant: "error",
        });
      },
    }
  );

  const [commentDraft, setCommentDraft] = useState("");
  const [collaboratorIdInput, setCollaboratorIdInput] = useState("");
  const [collaboratorPermission, setCollaboratorPermission] = useState<
    "view" | "edit"
  >("view");

  const workLog = workLogQuery.data;

  const project = useMemo(() => {
    if (!workLog?.project_id) return null;
    return (
      projectOptionsQuery.data?.find(
        (candidate) => candidate.id === workLog.project_id
      ) ?? null
    );
  }, [projectOptionsQuery.data, workLog?.project_id]);

  const totalHours = useMemo(() => {
    const raw = workLog?.total_hours;
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }, [workLog?.total_hours]);

  const timeEntries = useMemo(() => {
    if (!workLog?.time_entries || !Array.isArray(workLog.time_entries)) {
      return [];
    }
    return workLog.time_entries.map((entry) => ({
      start: entry.start_time,
      end: entry.end_time,
    }));
  }, [workLog?.time_entries]);

  const timeEntryItems = useMemo(
    () =>
      timeEntries.map((entry, index) => ({
        key: `${workLog?.id ?? workLogId ?? "work-log"}-entry-${index}`,
        start: entry.start,
        end: entry.end,
      })),
    [timeEntries, workLog?.id, workLogId]
  );

  const tasksCompleted = Array.isArray(workLog?.tasks_completed)
    ? (workLog?.tasks_completed as string[])
    : [];

  const taskItems = useMemo(
    () =>
      tasksCompleted.map((task, index) => ({
        key: `${workLog?.id ?? workLogId ?? "work-log"}-task-${index}`,
        task,
      })),
    [tasksCompleted, workLog?.id, workLogId]
  );

  const photos =
    ((workLog as unknown as Record<string, unknown>)?.photos as
      | Array<Record<string, unknown>>
      | undefined) ?? [];

  const skillsLookup = useMemo(
    () => buildSkillLookup(skillsQuery.data),
    [skillsQuery.data]
  );

  const skillNames = useMemo(() => {
    if (!Array.isArray(workLog?.skills_used)) {
      return [];
    }
    return (workLog.skills_used as string[])
      .map((id) => skillsLookup.get(id) ?? id)
      .filter(Boolean);
  }, [skillsLookup, workLog?.skills_used]);

  if (workLogQuery.isLoading) {
    return (
      <Stack flex={1} justify="center" align="center" gap={12}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading work log…</Text>
      </Stack>
    );
  }

  if (!workLog) {
    return (
      <Stack flex={1} justify="center" align="center" gap={12} padding="md">
        <Text>Work log not found</Text>
        <Paragraph style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
          This work log may have been deleted or you no longer have access.
        </Paragraph>
        <Button
          size="md"
          onPress={() => router.replace(ROUTES.DASHBOARD.WORK_LOGS.path)}
        >
          Back to work logs
        </Button>
      </Stack>
    );
  }

  const handleAddComment = () => {
    if (!commentDraft.trim()) {
      return;
    }
    addCommentMutation.mutate({
      workLogId: String(workLogId),
      content: commentDraft.trim(),
    });
  };

  const handleAddCollaborator = () => {
    if (!collaboratorIdInput.trim()) {
      toast.show({
        title: "Enter a collaborator ID",
        message: "Provide a valid user ID to grant access.",
      });
      return;
    }

    if (!isUuid(collaboratorIdInput.trim())) {
      Alert.alert(
        "Invalid ID format",
        "Collaborator user IDs must be valid UUID values."
      );
      return;
    }

    addCollaboratorMutation.mutate({
      workLogId: String(workLogId),
      collaboratorUserId: collaboratorIdInput.trim(),
    });
  };

  const handleTogglePermission = (collaborator: CollaboratorRecord) => {
    const collaboratorId = collaborator.id;
    if (!collaboratorId) {
      return;
    }
    const nextLevel =
      collaborator.permission_level === "edit" ? "view" : "edit";
    updateCollaboratorMutation.mutate({
      collaboratorId,
      role: nextLevel,
    });
  };

  const handleRemoveCollaborator = (collaborator: CollaboratorRecord) => {
    const collaboratorId = collaborator.id;
    if (!collaboratorId) {
      return;
    }
    removeCollaboratorMutation.mutate(collaboratorId);
  };

  const conversation = (conversationQuery.data ??
    []) as ConversationEntryRecord[];
  const collaborators = (collaboratorsQuery.data ?? []) as CollaboratorRecord[];
  const isVerified = workLog?.status === "verified";
  const includeOnProfile = Boolean(workLog?.show_on_profile);
  const showDateRange = Boolean(workLog?.show_date_range_on_profile);
  const isPublicVisibility = workLog?.visibility === "public";
  const visibilityMutationPending = updateProfileVisibilityMutation.isPending;
  const photoVisibilityMutationPending =
    updatePhotoVisibilityMutation.isPending;

  const handleShowOnProfileToggle = (next: boolean) => {
    if (!workLogId) return;
    if (next && !isVerified) {
      toast.show({
        title: "Pending verification",
        message:
          "Work logs must be verified before they can appear on your profile.",
      });
      return;
    }
    updateProfileVisibilityMutation.mutate({
      workLogId: String(workLogId),
      showOnProfile: next,
    });
  };

  const handleShowDateRangeToggle = (next: boolean) => {
    if (!workLogId) return;
    updateProfileVisibilityMutation.mutate({
      workLogId: String(workLogId),
      showOnProfile: includeOnProfile,
      showDateRangeOnProfile: next,
    });
  };

  const handlePhotoVisibilityToggle = (
    photoId: string,
    showOnProfile: boolean
  ) => {
    updatePhotoVisibilityMutation.mutate({
      photoId,
      visibility: showOnProfile ? "public" : "private",
    });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Stack padding="md" gap={16}>
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Stack gap={4} flex={1}>
              <Text>{project?.name ?? "Work Log"}</Text>
              <Text style={{ color: colors.text[theme].secondary }}>
                Logged{" "}
                {workLog.log_date
                  ? formatDate(workLog.log_date)
                  : "Date unknown"}
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              iconStart={Edit}
              onPress={() => workLogQuery.refetch()}
            >
              Refresh
            </Button>
          </Row>
          <Text style={{ color: getStatusColor(workLog.status, theme) }}>
            {getStatusLabel(workLog.status)}
          </Text>
        </Stack>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Text>Summary</Text>
            <Row gap={16} wrap>
              <SummaryMetric
                icon={Activity}
                label="Total hours"
                value={`${totalHours.toFixed(2)}h`}
              />
              <SummaryMetric
                icon={FileText}
                label="Entry type"
                value={workLog.entry_type ?? "Daily"}
              />
              <SummaryMetric
                icon={ShieldCheck}
                label="Visibility"
                value={workLog.visibility === "public" ? "Public" : "Private"}
              />
            </Row>
            <Separator />
            <Stack gap={8}>
              <Text>Description</Text>
              <Paragraph style={{ color: colors.text[theme].secondary }}>
                {workLog.work_description || "No description provided."}
              </Paragraph>
            </Stack>
          </Stack>
        </Card>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Text>Profile visibility</Text>
            <Paragraph style={{ color: colors.text[theme].secondary }}>
              Control how this work log appears on your public profile.
            </Paragraph>
            {!isVerified && (
              <Paragraph style={{ color: theme === 'dark' ? colors.yellow[300] : colors.yellow[600] }}>
                This work log must be verified before it can be shared publicly.
              </Paragraph>
            )}
            <Stack gap={16}>
              <Row justify="space-between" align="center" gap={16}>
                <Stack gap={4} flex={1}>
                  <Text>Show on public profile</Text>
                  <Paragraph style={{ color: colors.text[theme].secondary }}>
                    Display this work log on your public profile. Only verified
                    work is eligible.
                  </Paragraph>
                </Stack>
                <ToggleSwitch
                  checked={includeOnProfile}
                  disabled={!isVerified || visibilityMutationPending}
                  onChange={handleShowOnProfileToggle}
                />
              </Row>

              <Row justify="space-between" align="center" gap={16}>
                <Stack gap={4} flex={1}>
                  <Text>Show date on profile</Text>
                  <Paragraph style={{ color: colors.text[theme].secondary }}>
                    When enabled, the logged date is shown on your public
                    profile.
                  </Paragraph>
                </Stack>
                <ToggleSwitch
                  checked={showDateRange}
                  disabled={!includeOnProfile || visibilityMutationPending}
                  onChange={handleShowDateRangeToggle}
                />
              </Row>

              <Row justify="space-between" align="center">
                <Stack gap={4}>
                  <Text>Verification status</Text>
                  <Paragraph style={{ color: colors.text[theme].secondary }}>
                    {isVerified
                      ? 'Verified entries display a "Verified by Scaffald" badge on your public profile.'
                      : "Awaiting verification. Visibility controls unlock once this log is verified."}
                  </Paragraph>
                </Stack>
                <Text
                  style={{
                    backgroundColor: isVerified
                      ? (theme === "dark" ? colors.green[900] : colors.green[100])
                      : (theme === "dark" ? colors.yellow[900] : colors.yellow[100]),
                    color: isVerified
                      ? (theme === "dark" ? colors.green[300] : colors.green[700])
                      : (theme === "dark" ? colors.yellow[300] : colors.yellow[700]),
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 16,
                  }}
                >
                  {isVerified ? "Verified" : "Pending"}
                </Text>
              </Row>

              <Row justify="space-between" align="center">
                <Stack gap={4}>
                  <Text>Current visibility</Text>
                  <Paragraph style={{ color: colors.text[theme].secondary }}>
                    {isPublicVisibility
                      ? "This work log is set to public visibility."
                      : "This work log is currently private."}
                  </Paragraph>
                </Stack>
              </Row>
            </Stack>
          </Stack>
        </Card>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Text>Time entries</Text>
            <Stack gap={8}>
              {timeEntryItems.length === 0 ? (
                <Paragraph style={{ color: colors.text[theme].secondary }}>No time entries recorded.</Paragraph>
              ) : (
                timeEntryItems.map((entry) => (
                  <Row
                    key={entry.key}
                    justify="space-between"
                    style={{ backgroundColor: colors.bg[theme].muted }}
                    paddingHorizontal={12}
                    paddingVertical={8}
                    borderRadius={16}
                  >
                    <Text>
                      {entry.start}–{entry.end}
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {computeEntryHours(entry.start, entry.end)}h
                    </Text>
                  </Row>
                ))
              )}
            </Stack>
          </Stack>
        </Card>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Text>Tasks completed</Text>
            {taskItems.length === 0 ? (
              <Paragraph style={{ color: colors.text[theme].secondary }}>
                No tasks recorded for this entry.
              </Paragraph>
            ) : (
              <Stack gap={8}>
                {taskItems.map((task) => (
                  <Row
                    key={task.key}
                    style={{ backgroundColor: colors.bg[theme].muted }}
                    paddingHorizontal={12}
                    paddingVertical={8}
                    borderRadius={16}
                  >
                    <Text>{task.task}</Text>
                  </Row>
                ))}
              </Stack>
            )}
            <Separator />
            <Text>Skills used</Text>
            {skillNames.length === 0 ? (
              <Paragraph style={{ color: colors.text[theme].secondary }}>
                No skills associated with this log.
              </Paragraph>
            ) : (
              <Row gap={8} wrap>
                {skillNames.map((skill) => (
                  <Text
                    key={skill}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 16,
                      backgroundColor: colors.bg[theme].muted,
                    }}
                  >
                    {skill}
                  </Text>
                ))}
              </Row>
            )}
          </Stack>
        </Card>

        {photos.length > 0 && (
          <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
            <Stack gap={12} padding="sm">
              <Text>Photos</Text>
              <PhotoGallery
                disabled={photoVisibilityMutationPending}
                onToggleVisibility={handlePhotoVisibilityToggle}
                photos={photos.map((photo) => ({
                  id: String(photo.id),
                  workLogId: String(workLogId),
                  filePath: String(photo.file_path ?? ""),
                  mediumPath: (photo.medium_path as string) ?? null,
                  thumbnailPath: (photo.thumbnail_path as string) ?? null,
                  caption: (photo.caption as string) ?? null,
                  photoType:
                    (photo.photo_type as import("../types/photos").WorkLogPhotoType) ??
                    null,
                  displayOrder:
                    typeof photo.display_order === "number"
                      ? photo.display_order
                      : 0,
                  showOnProfile: Boolean(photo.show_on_profile),
                  fileSizeBytes:
                    typeof photo.file_size_bytes === "number"
                      ? photo.file_size_bytes
                      : 0,
                  takenAt: (photo.taken_at as string) ?? null,
                  createdAt: (photo.created_at as string) ?? null,
                  updatedAt: (photo.updated_at as string) ?? null,
                  signedUrl: null,
                  isRefreshingUrl: false,
                }))}
              />
            </Stack>
          </Card>
        )}

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Row justify="space-between" align="center">
              <Text>Collaborators</Text>
              <Button
                size="sm"
                iconStart={Users}
                variant="outline"
                onPress={() => collaboratorsQuery.refetch()}
              >
                Refresh
              </Button>
            </Row>
            <Paragraph style={{ color: colors.text[theme].secondary }}>
              Share this work log with teammates to give them edit or view
              access.
            </Paragraph>
            <Stack gap={8}>
              {collaborators.length === 0 ? (
                <Paragraph style={{ color: colors.text[theme].secondary }}>No collaborators yet.</Paragraph>
              ) : (
                collaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.id}
                    collaborator={collaborator}
                    isUpdating={
                      updateCollaboratorMutation.isPending ||
                      removeCollaboratorMutation.isPending
                    }
                    onTogglePermission={() =>
                      handleTogglePermission(collaborator)
                    }
                    onRemove={() => handleRemoveCollaborator(collaborator)}
                  />
                ))
              )}
            </Stack>
            <Separator />
            <Stack gap={8}>
              <Text>Add collaborator</Text>
              <Input
                placeholder="Collaborator user ID"
                value={collaboratorIdInput}
                onChangeText={setCollaboratorIdInput}
              />
              <Row gap={8}>
                <Button
                  style={{ flex: 1 }}
                  size="sm"
                  variant={
                    collaboratorPermission === "view" ? "filled" : "outline"
                  }
                  onPress={() => setCollaboratorPermission("view")}
                >
                  View
                </Button>
                <Button
                  style={{ flex: 1 }}
                  size="sm"
                  variant={
                    collaboratorPermission === "edit" ? "filled" : "outline"
                  }
                  onPress={() => setCollaboratorPermission("edit")}
                >
                  Edit
                </Button>
              </Row>
              <Button
                size="sm"
                iconStart={Users}
                loading={addCollaboratorMutation.isPending}
                onPress={handleAddCollaborator}
              >
                Add collaborator
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Row justify="space-between" align="center">
              <Text>Conversation</Text>
              <Button
                size="sm"
                iconStart={MessageSquare}
                variant="outline"
                onPress={() => conversationQuery.refetch()}
              >
                Refresh
              </Button>
            </Row>
            <Stack gap={12}>
              {conversation.length === 0 ? (
                <Paragraph style={{ color: colors.text[theme].secondary }}>
                  No messages yet. Start the conversation to give additional
                  context.
                </Paragraph>
              ) : (
                conversation.map((entry) => (
                  <ConversationEntry
                    key={entry.id}
                    entry={entry}
                    currentUserId={workLog.user_id}
                  />
                ))
              )}
            </Stack>
            <Separator />
            <Stack gap={8}>
              <Text>Add message</Text>
              <Input
                multiline
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Share an update or ask a question…"
              />
              <Button
                size="sm"
                iconStart={MessageSquare}
                loading={addCommentMutation.isPending}
                onPress={handleAddComment}
              >
                Post message
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Card style={{ borderColor: colors.border[theme].default, borderWidth: 1 }}>
          <Stack gap={12} padding="sm">
            <Text>Exports</Text>
            <Paragraph style={{ color: colors.text[theme].secondary }}>
              Generate a shareable export for reporting or offline records.
              Links expire after ten minutes.
            </Paragraph>
            <Row gap={12} wrap>
              <Button
                size="md"
                iconStart={DownloadCloud}
                loading={
                  exportMutation.isPending &&
                  exportMutation.variables?.format === "pdf"
                }
                onPress={() =>
                  exportMutation.mutate({
                    workLogId: String(workLogId),
                    format: "pdf",
                  })
                }
              >
                Export PDF
              </Button>
              <Button
                size="md"
                iconStart={DownloadCloud}
                variant="outline"
                loading={
                  exportMutation.isPending &&
                  exportMutation.variables?.format === "csv"
                }
                onPress={() =>
                  exportMutation.mutate({
                    workLogId: String(workLogId),
                    format: "csv",
                  })
                }
              >
                Export CSV
              </Button>
            </Row>
          </Stack>
        </Card>
      </Stack>
    </ScrollView>
  );
}

interface SummaryMetricProps {
  icon: IconRenderer;
  label: string;
  value: string;
}

function SummaryMetric({
  icon: IconComponent,
  label,
  value,
}: SummaryMetricProps) {
  const { theme } = useThemeContext();
  return (
    <Row
      style={{ backgroundColor: colors.bg[theme].muted }}
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={16}
      gap={8}
      align="center"
    >
      <IconComponent size="md" color={colors.icon[theme].default} />
      <Stack gap={4}>
        <Text>{value}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{label}</Text>
      </Stack>
    </Row>
  );
}

interface CollaboratorRowProps {
  collaborator: CollaboratorRecord;
  isUpdating: boolean;
  onTogglePermission: () => void;
  onRemove: () => void;
}

function CollaboratorRow({
  collaborator,
  isUpdating,
  onTogglePermission,
  onRemove,
}: CollaboratorRowProps) {
  const { theme } = useThemeContext();
  const displayName =
    (collaborator?.user?.display_name as string) ??
    (collaborator?.user?.username as string) ??
    collaborator.collaborator_user_id ??
    "Team member";
  const permission = collaborator.permission_level ?? "view";

  return (
    <Card style={{ borderWidth: 1, borderColor: colors.border[theme].default }}>
      <Stack gap={8} padding="sm">
        <Text>{displayName}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Permission: {permission === "edit" ? "Can edit" : "View only"}
        </Text>
        <Row gap={8}>
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onPress={onTogglePermission}
          >
            Toggle permission
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="error"
            disabled={isUpdating}
            onPress={onRemove}
          >
            Remove
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}

interface ConversationEntryProps {
  entry: ConversationEntryRecord;
}

function ConversationEntry({ entry }: ConversationEntryProps) {
  const { theme } = useThemeContext();
  const authorName =
    (entry.user?.display_name as string) ??
    (entry.user?.username as string) ??
    "Collaborator";
  const isSystemMessage = entry.is_system_message === true;

  return (
    <Stack
      style={{
        backgroundColor: isSystemMessage
          ? colors.bg[theme].subtle
          : colors.bg[theme].muted,
      }}
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={16}
      gap={4}
    >
      <Row justify="space-between">
        <Text>{authorName}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          {entry.created_at ? formatDate(entry.created_at) : ""}
        </Text>
      </Row>
      <Paragraph>{entry.message}</Paragraph>
    </Stack>
  );
}

const computeEntryHours = (start: string, end: string): number => {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  if (endMinutes <= startMinutes) {
    return 0;
  }

  return (endMinutes - startMinutes) / 60;
};
