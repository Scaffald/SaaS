import { ROUTES } from '@scf/core/constants/routes'
import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
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
} from '@scf/core/utils/work-logs-sdk-hooks'
import { useUserSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { buildSkillLookup } from '../utils/data-normalizers'
import { ToggleSwitch } from '@scaffald/ui'
import {
  Activity,
  DownloadCloud,
  Edit,
  FileText,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Linking, ScrollView } from 'react-native'
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
} from '@scaffald/ui'

import { PhotoGallery } from '../components/PhotoGallery'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

interface CollaboratorRecord {
  id?: string
  collaborator_user_id?: string | null
  permission_level?: 'view' | 'edit' | null
  user?: {
    display_name?: string | null
    username?: string | null
  } | null
}

interface ConversationEntryRecord {
  id?: string
  user_id?: string | null
  message?: string | null
  created_at?: string | null
  is_system_message?: boolean | null
  user?: {
    display_name?: string | null
    username?: string | null
  } | null
}

export function WorkLogDetailScreen() {
  const { workLogId } = useLocalSearchParams<{ workLogId: string }>()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const workLogQuery = useWorkLog(
    workLogId && typeof workLogId === 'string' ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  )

  const conversationQuery = useWorkLogConversation(
    workLogId && typeof workLogId === 'string' ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  )

  const collaboratorsQuery = useWorkLogCollaborators(
    workLogId && typeof workLogId === 'string' ? workLogId : undefined,
    { enabled: Boolean(workLogId) }
  )

  const projectOptionsQuery = useWorkLogProjectOptions(undefined, {
    staleTime: 120_000,
  })

  const skillsQuery = useUserSkills(undefined, {
    staleTime: 120_000,
  })

  const addCommentMutation = useAddWorkLogCommentMutation({
    onSuccess: () => {
      void conversationQuery.refetch()
      setCommentDraft('')
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to add comment',
        message: error?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const exportMutation = useExportWorkLogMutation({
    onSuccess: async (data, variables) => {
      toast.show({
        title: 'Export ready',
        message: `Download ${variables.format.toUpperCase()} export.`,
      })
      if (data.downloadUrl) {
        try {
          await Linking.openURL(data.downloadUrl)
        } catch (error) {
          console.warn('[WorkLogDetail] Unable to open download URL', error)
        }
      }
    },
    onError: (error) => {
      toast.show({
        title: 'Export failed',
        message: error?.message ?? 'Unable to export work log.',
        variant: 'error',
      })
    },
  })

  const addCollaboratorMutation = useAddWorkLogCollaboratorMutation({
    onSuccess: () => {
      setCollaboratorIdInput('')
      void collaboratorsQuery.refetch()
      toast.show({
        title: 'Collaborator added',
        message: 'They now have access to this work log.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to add collaborator',
        message: error?.message ?? 'Check the user ID and try again.',
        variant: 'error',
      })
    },
  })

  const updateCollaboratorMutation = useUpdateWorkLogCollaboratorMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch()
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to update collaborator',
        message: error?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const removeCollaboratorMutation = useRemoveWorkLogCollaboratorMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch()
      toast.show({
        title: 'Collaborator removed',
        message: 'They no longer have access to this work log.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to remove collaborator',
        message: error?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const updateProfileVisibilityMutation = useUpdateWorkLogProfileVisibilityMutation({
    onSuccess: async () => {
      toast.show({ title: 'Profile visibility updated' })
      await Promise.all([
        workLogQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['workLogs', 'list'] }),
      ])
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to update visibility',
        message: error?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const updatePhotoVisibilityMutation = useUpdateWorkLogPhotoVisibilityMutation({
    onSuccess: async () => {
      toast.show({ title: 'Photo visibility updated' })
      await workLogQuery.refetch()
    },
    onError: (error) => {
      toast.show({
        title: 'Unable to update photo',
        message: error?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const [commentDraft, setCommentDraft] = useState('')
  const [collaboratorIdInput, setCollaboratorIdInput] = useState('')
  const [collaboratorPermission, setCollaboratorPermission] = useState<'view' | 'edit'>('view')

  const workLog = workLogQuery.data

  const project = useMemo(() => {
    if (!workLog?.project_id) return null
    return (
      projectOptionsQuery.data?.find((candidate) => candidate.id === workLog.project_id) ?? null
    )
  }, [projectOptionsQuery.data, workLog?.project_id])

  const totalHours = useMemo(() => {
    const raw = workLog?.total_hours
    if (typeof raw === 'number') return raw
    if (typeof raw === 'string') {
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }, [workLog?.total_hours])

  const timeEntries = useMemo(() => {
    if (!workLog?.time_entries || !Array.isArray(workLog.time_entries)) {
      return []
    }
    return workLog.time_entries as Array<{ start: string; end: string }>
  }, [workLog?.time_entries])

  const timeEntryItems = useMemo(
    () =>
      timeEntries.map((entry, index) => ({
        key: `${workLog?.id ?? workLogId ?? 'work-log'}-entry-${index}`,
        start: entry.start,
        end: entry.end,
      })),
    [timeEntries, workLog?.id, workLogId]
  )

  const tasksCompleted = Array.isArray(workLog?.tasks_completed)
    ? (workLog?.tasks_completed as string[])
    : []

  const taskItems = useMemo(
    () =>
      tasksCompleted.map((task, index) => ({
        key: `${workLog?.id ?? workLogId ?? 'work-log'}-task-${index}`,
        task,
      })),
    [tasksCompleted, workLog?.id, workLogId]
  )

  const photos = (workLog?.photos as Array<Record<string, unknown>> | undefined) ?? []

  const skillsLookup = useMemo(() => buildSkillLookup(skillsQuery.data), [skillsQuery.data])

  const skillNames = useMemo(() => {
    if (!Array.isArray(workLog?.skills_used)) {
      return []
    }
    return (workLog.skills_used as string[]).map((id) => skillsLookup.get(id) ?? id).filter(Boolean)
  }, [skillsLookup, workLog?.skills_used])

  if (workLogQuery.isLoading) {
    return (
      <Stack flex={1} justify="center" align="center" gap={12}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading work log…</Text>
      </Stack>
    )
  }

  if (!workLog) {
    return (
      <Stack flex={1} justify="center" align="center" gap={12} padding="md">
        <Text>Work log not found</Text>
        <Paragraph color="$gray11" style={{ textAlign: 'center' }}>
          This work log may have been deleted or you no longer have access.
        </Paragraph>
        <Button size="md" onPress={() => router.replace(ROUTES.DASHBOARD.WORK_LOGS.path)}>
          Back to work logs
        </Button>
      </Stack>
    )
  }

  const handleAddComment = () => {
    if (!commentDraft.trim()) {
      return
    }
    addCommentMutation.mutate({
      workLogId: String(workLogId),
      content: commentDraft.trim(),
    })
  }

  const handleAddCollaborator = () => {
    if (!collaboratorIdInput.trim()) {
      toast.show({
        title: 'Enter a collaborator ID',
        message: 'Provide a valid user ID to grant access.',
      })
      return
    }

    if (!isUuid(collaboratorIdInput.trim())) {
      Alert.alert('Invalid ID format', 'Collaborator user IDs must be valid UUID values.')
      return
    }

    addCollaboratorMutation.mutate({
      workLogId: String(workLogId),
      collaboratorUserId: collaboratorIdInput.trim(),
    })
  }

  const handleTogglePermission = (collaborator: CollaboratorRecord) => {
    const collaboratorId = collaborator.id
    if (!collaboratorId) {
      return
    }
    const nextLevel = collaborator.permission_level === 'edit' ? 'view' : 'edit'
    updateCollaboratorMutation.mutate({
      collaboratorId,
      role: nextLevel,
    })
  }

  const handleRemoveCollaborator = (collaborator: CollaboratorRecord) => {
    const collaboratorId = collaborator.id
    if (!collaboratorId) {
      return
    }
    removeCollaboratorMutation.mutate(collaboratorId)
  }

  const conversation = (conversationQuery.data ?? []) as ConversationEntryRecord[]
  const collaborators = (collaboratorsQuery.data ?? []) as CollaboratorRecord[]
  const isVerified = workLog?.status === 'verified'
  const includeOnProfile = Boolean(workLog?.show_on_profile)
  const showDateRange = Boolean(workLog?.show_date_range_on_profile)
  const isPublicVisibility = workLog?.visibility === 'public'
  const visibilityMutationPending = updateProfileVisibilityMutation.isPending
  const photoVisibilityMutationPending = updatePhotoVisibilityMutation.isPending

  const handleShowOnProfileToggle = (next: boolean) => {
    if (!workLogId) return
    if (next && !isVerified) {
      toast.show({
        title: 'Pending verification',
        message: 'Work logs must be verified before they can appear on your profile.',
      })
      return
    }
    updateProfileVisibilityMutation.mutate({
      workLogId: String(workLogId),
      showOnProfile: next,
      visibility: next ? 'public' : 'private',
    })
  }

  const handleShowDateRangeToggle = (next: boolean) => {
    if (!workLogId) return
    updateProfileVisibilityMutation.mutate({
      workLogId: String(workLogId),
      showDateRangeOnProfile: next,
    })
  }

  const handlePhotoVisibilityToggle = (
    photoId: string,
    visibility: 'private' | 'organization' | 'public'
  ) => {
    updatePhotoVisibilityMutation.mutate({
      photoId,
      visibility,
    })
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Stack padding="md" gap={16}>
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Stack gap={4} flex={1}>
              <Text>{project?.name ?? 'Work Log'}</Text>
              <Text color="$gray11">
                Logged {workLog.log_date ? formatDate(workLog.log_date) : 'Date unknown'}
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
          <Text color={getStatusColor(workLog.status)}>{getStatusLabel(workLog.status)}</Text>
        </Stack>

        <Card borderColor="$color6" borderWidth={1}>
          <Stack gap={12} padding="sm">
            <Text>Summary</Text>
            <Row gap={16} wrap>
              <SummaryMetric
                iconStart={Activity}
                label="Total hours"
                value={`${totalHours.toFixed(2)}h`}
              />
              <SummaryMetric
                iconStart={FileText}
                label="Entry type"
                value={workLog.entry_type ?? 'Daily'}
              />
              <SummaryMetric
                iconStart={ShieldCheck}
                label="Visibility"
                value={workLog.visibility === 'public' ? 'Public' : 'Private'}
              />
            </Row>
            <Separator />
            <Stack gap={8}>
              <Text>Description</Text>
              <Paragraph color="$gray11">
                {workLog.work_description || 'No description provided.'}
              </Paragraph>
            </Stack>
          </Stack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <Stack gap={12} padding="sm">
            <Text>Profile visibility</Text>
            <Paragraph color="$gray11">
              Control how this work log appears on your public profile.
            </Paragraph>
            {!isVerified && (
              <Paragraph color="$orange10">
                This work log must be verified before it can be shared publicly.
              </Paragraph>
            )}
            <Stack gap={16}>
              <Row justify="space-between" align="center" gap={16}>
                <Stack gap={4} flex={1}>
                  <Text>Show on public profile</Text>
                  <Paragraph color="$gray11">
                    Display this work log on your public profile. Only verified work is eligible.
                  </Paragraph>
                </Stack>
                <ToggleSwitch
                  checked={includeOnProfile}
                  disabled={!isVerified || visibilityMutationPending}
                  onChange={handleShowOnProfileToggle}
                  testID="work-log-profile-toggle"
                />
              </Row>

              <Row justify="space-between" align="center" gap={16}>
                <Stack gap={4} flex={1}>
                  <Text>Show date on profile</Text>
                  <Paragraph color="$gray11">
                    When enabled, the logged date is shown on your public profile.
                  </Paragraph>
                </Stack>
                <ToggleSwitch
                  checked={showDateRange}
                  disabled={!includeOnProfile || visibilityMutationPending}
                  onChange={handleShowDateRangeToggle}
                  testID="work-log-date-toggle"
                />
              </Row>

              <Row justify="space-between" align="center">
                <Stack gap={4}>
                  <Text>Verification status</Text>
                  <Paragraph color="$gray11">
                    {isVerified
                      ? 'Verified entries display a “Verified by Scaffald” badge on your public profile.'
                      : 'Awaiting verification. Visibility controls unlock once this log is verified.'}
                  </Paragraph>
                </Stack>
                <Text
                  backgroundColor={isVerified ? '$green4' : '$yellow4'}
                  color={isVerified ? '$green11' : '$yellow11'}
                  paddingHorizontal={12}
                  paddingVertical={4}
                  borderRadius={16}
                >
                  {isVerified ? 'Verified' : 'Pending'}
                </Text>
              </Row>

              <Row justify="space-between" align="center">
                <Stack gap={4}>
                  <Text>Current visibility</Text>
                  <Paragraph color="$gray11">
                    {isPublicVisibility
                      ? 'This work log is set to public visibility.'
                      : 'This work log is currently private.'}
                  </Paragraph>
                </Stack>
              </Row>
            </Stack>
          </Stack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <Stack gap={12} padding="sm">
            <Text>Time entries</Text>
            <Stack gap={8}>
              {timeEntryItems.length === 0 ? (
                <Paragraph color="$gray11">No time entries recorded.</Paragraph>
              ) : (
                timeEntryItems.map((entry) => (
                  <Row
                    key={entry.key}
                    justify="space-between"
                    backgroundColor="$color3"
                    paddingHorizontal={12}
                    paddingVertical={8}
                    borderRadius={16}
                  >
                    <Text>
                      {entry.start}–{entry.end}
                    </Text>
                    <Text color="$gray11">{computeEntryHours(entry.start, entry.end)}h</Text>
                  </Row>
                ))
              )}
            </Stack>
          </Stack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <Stack gap={12} padding="sm">
            <Text>Tasks completed</Text>
            {taskItems.length === 0 ? (
              <Paragraph color="$gray11">No tasks recorded for this entry.</Paragraph>
            ) : (
              <Stack gap={8}>
                {taskItems.map((task) => (
                  <Row
                    key={task.key}
                    backgroundColor="$color3"
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
              <Paragraph color="$gray11">No skills associated with this log.</Paragraph>
            ) : (
              <Row gap={8} wrap>
                {skillNames.map((skill) => (
                  <Text
                    key={skill}
                    backgroundColor="$color3"
                    paddingHorizontal={12}
                    paddingVertical={4}
                    borderRadius={16}
                  >
                    {skill}
                  </Text>
                ))}
              </Row>
            )}
          </Stack>
        </Card>

        {photos.length > 0 && (
          <Card borderColor="$color6" borderWidth={1}>
            <Stack gap={12} padding="sm">
              <Text>Photos</Text>
              <PhotoGallery
                disabled={photoVisibilityMutationPending}
                onToggleVisibility={handlePhotoVisibilityToggle}
                photos={photos.map((photo) => ({
                  id: String(photo.id),
                  workLogId: String(workLogId),
                  filePath: String(photo.file_path ?? ''),
                  mediumPath: (photo.medium_path as string) ?? null,
                  thumbnailPath: (photo.thumbnail_path as string) ?? null,
                  caption: (photo.caption as string) ?? null,
                  photoType: (photo.photo_type as string | null) ?? null,
                  displayOrder: typeof photo.display_order === 'number' ? photo.display_order : 0,
                  showOnProfile: Boolean(photo.show_on_profile),
                  fileSizeBytes:
                    typeof photo.file_size_bytes === 'number' ? photo.file_size_bytes : 0,
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

        <Card borderColor="$color6" borderWidth={1}>
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
            <Paragraph color="$gray11">
              Share this work log with teammates to give them edit or view access.
            </Paragraph>
            <Stack gap={8}>
              {collaborators.length === 0 ? (
                <Paragraph color="$gray11">No collaborators yet.</Paragraph>
              ) : (
                collaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.id}
                    collaborator={collaborator}
                    isUpdating={
                      updateCollaboratorMutation.isPending || removeCollaboratorMutation.isPending
                    }
                    onTogglePermission={() => handleTogglePermission(collaborator)}
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
                  flex={1}
                  size="sm"
                  variant={collaboratorPermission === 'view' ? 'default' : 'outline'}
                  onPress={() => setCollaboratorPermission('view')}
                >
                  View
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  variant={collaboratorPermission === 'edit' ? 'default' : 'outline'}
                  onPress={() => setCollaboratorPermission('edit')}
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

        <Card borderColor="$color6" borderWidth={1}>
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
                <Paragraph color="$gray11">
                  No messages yet. Start the conversation to give additional context.
                </Paragraph>
              ) : (
                conversation.map((entry) => (
                  <ConversationEntry key={entry.id} entry={entry} currentUserId={workLog.user_id} />
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

        <Card borderColor="$color6" borderWidth={1}>
          <Stack gap={12} padding="sm">
            <Text>Exports</Text>
            <Paragraph color="$gray11">
              Generate a shareable export for reporting or offline records. Links expire after ten
              minutes.
            </Paragraph>
            <Row gap={12} wrap>
              <Button
                size="md"
                iconStart={DownloadCloud}
                loading={exportMutation.isPending && exportMutation.variables?.format === 'pdf'}
                onPress={() =>
                  exportMutation.mutate({
                    workLogId: String(workLogId),
                    format: 'pdf',
                  })
                }
              >
                Export PDF
              </Button>
              <Button
                size="md"
                iconStart={DownloadCloud}
                variant="outline"
                loading={exportMutation.isPending && exportMutation.variables?.format === 'csv'}
                onPress={() =>
                  exportMutation.mutate({
                    workLogId: String(workLogId),
                    format: 'csv',
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
  )
}

interface SummaryMetricProps {
  icon: IconRenderer
  label: string
  value: string
}

function SummaryMetric({ icon: IconComponent, label, value }: SummaryMetricProps) {
  return (
    <Row
      backgroundColor="$color3"
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={16}
      gap={8}
      align="center"
    >
      <IconComponent size="md" color="currentColor" />
      <Stack gap={4}>
        <Text>{value}</Text>
        <Text color="$gray11">{label}</Text>
      </Stack>
    </Row>
  )
}

interface CollaboratorRowProps {
  collaborator: CollaboratorRecord
  isUpdating: boolean
  onTogglePermission: () => void
  onRemove: () => void
}

function CollaboratorRow({
  collaborator,
  isUpdating,
  onTogglePermission,
  onRemove,
}: CollaboratorRowProps) {
  const displayName =
    (collaborator?.user?.display_name as string) ??
    (collaborator?.user?.username as string) ??
    collaborator.collaborator_user_id ??
    'Team member'
  const permission = collaborator.permission_level ?? 'view'

  return (
    <Card borderWidth={1} borderColor="$color6">
      <Stack gap={8} padding="sm">
        <Text>{displayName}</Text>
        <Text color="$gray11">Permission: {permission === 'edit' ? 'Can edit' : 'View only'}</Text>
        <Row gap={8}>
          <Button size="sm" variant="outline" disabled={isUpdating} onPress={onTogglePermission}>
            Toggle permission
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="$red10"
            disabled={isUpdating}
            onPress={onRemove}
          >
            Remove
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}

interface ConversationEntryProps {
  entry: ConversationEntryRecord
  currentUserId: string
}

function ConversationEntry({ entry, currentUserId }: ConversationEntryProps) {
  const authorName =
    (entry.user?.display_name as string) ?? (entry.user?.username as string) ?? 'Collaborator'
  const isOwner = entry.user_id === currentUserId
  const isSystemMessage = entry.is_system_message === true

  return (
    <Stack
      backgroundColor={isSystemMessage ? '$color4' : isOwner ? '$color3' : '$color2'}
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={16}
      gap={4}
    >
      <Row justify="space-between">
        <Text>{authorName}</Text>
        <Text color="$gray11">{entry.created_at ? formatDate(entry.created_at) : ''}</Text>
      </Row>
      <Paragraph>{entry.message}</Paragraph>
    </Stack>
  )
}

const computeEntryHours = (start: string, end: string): number => {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0
  }

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  if (endMinutes <= startMinutes) {
    return 0
  }

  return (endMinutes - startMinutes) / 60
}
