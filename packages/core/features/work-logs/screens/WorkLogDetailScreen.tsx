// @ts-nocheck

import { ROUTES } from '@app/core/constants/routes'
import { formatDate } from '@app/core/features/profile/utils/date-formatting'
import { api } from '@app/core/utils/api'
import { buildSkillLookup } from '../utils/data-normalizers'
import { ToggleSwitch } from '@unicornlove/ui'
import {
  Activity,
  DownloadCloud,
  Edit,
  FileText,
  MessageSquare,
  ShieldCheck,
  Users,
} from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Linking, ScrollView } from 'react-native'
import { Button, Card, Input, Paragraph, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

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
  const toast = useToastController()
  const trpcUtils = api.useContext()

  const workLogQuery = api.workLogs.getById.useQuery(
    { workLogId: String(workLogId) },
    { enabled: Boolean(workLogId) }
  )

  const conversationQuery = api.workLogs.getConversation.useQuery(
    { workLogId: String(workLogId) },
    { enabled: Boolean(workLogId) }
  )

  const collaboratorsQuery = api.workLogs.getCollaborators.useQuery(
    { workLogId: String(workLogId) },
    { enabled: Boolean(workLogId) }
  )

  const projectOptionsQuery = api.workLogs.getProjectOptions.useQuery(undefined, {
    staleTime: 120_000,
  })

  const skillsQuery = api.profile.skills.getUserSkills.useQuery(undefined, {
    staleTime: 120_000,
  })

  const addCommentMutation = api.workLogs.addComment.useMutation({
    onSuccess: () => {
      void conversationQuery.refetch()
      setCommentDraft('')
    },
    onError: (error) => {
      toast.show('Unable to add comment', {
        message: error?.message ?? 'Please try again.',
      })
    },
  })

  const exportMutation = api.workLogs.exportWorkLog.useMutation({
    onSuccess: async (data, variables) => {
      toast.show('Export ready', {
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
      toast.show('Export failed', {
        message: error?.message ?? 'Unable to export work log.',
      })
    },
  })

  const addCollaboratorMutation = api.workLogs.addCollaborator.useMutation({
    onSuccess: () => {
      setCollaboratorIdInput('')
      void collaboratorsQuery.refetch()
      toast.show('Collaborator added', {
        message: 'They now have access to this work log.',
      })
    },
    onError: (error) => {
      toast.show('Unable to add collaborator', {
        message: error?.message ?? 'Check the user ID and try again.',
      })
    },
  })

  const updateCollaboratorMutation = api.workLogs.updateCollaborator.useMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch()
    },
    onError: (error) => {
      toast.show('Unable to update collaborator', {
        message: error?.message ?? 'Please try again.',
      })
    },
  })

  const removeCollaboratorMutation = api.workLogs.removeCollaborator.useMutation({
    onSuccess: () => {
      void collaboratorsQuery.refetch()
      toast.show('Collaborator removed', {
        message: 'They no longer have access to this work log.',
      })
    },
    onError: (error) => {
      toast.show('Unable to remove collaborator', {
        message: error?.message ?? 'Please try again.',
      })
    },
  })

  const updateProfileVisibilityMutation = api.workLogs.updateProfileVisibility.useMutation({
    onSuccess: async () => {
      toast.show('Profile visibility updated')
      await Promise.all([workLogQuery.refetch(), trpcUtils.workLogs.list.invalidate()])
    },
    onError: (error) => {
      toast.show('Unable to update visibility', {
        message: error?.message ?? 'Please try again.',
      })
    },
  })

  const updatePhotoVisibilityMutation = api.workLogs.updatePhotoVisibility.useMutation({
    onSuccess: async () => {
      toast.show('Photo visibility updated')
      await workLogQuery.refetch()
    },
    onError: (error) => {
      toast.show('Unable to update photo', {
        message: error?.message ?? 'Please try again.',
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
      projectOptionsQuery.data?.projects?.find(
        (candidate) => candidate.id === workLog.project_id
      ) ?? null
    )
  }, [projectOptionsQuery.data?.projects, workLog?.project_id])

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
      <YStack flex={1} justifyContent="center" items="center" gap="$3">
        <Spinner size="large" />
        <Text color="$color10">Loading work log…</Text>
      </YStack>
    )
  }

  if (!workLog) {
    return (
      <YStack flex={1} justifyContent="center" items="center" gap="$3" p="$4">
        <Text fontSize="$6" fontWeight="700">
          Work log not found
        </Text>
        <Paragraph color="$color10" style={{ textAlign: 'center' }}>
          This work log may have been deleted or you no longer have access.
        </Paragraph>
        <Button size="$4" onPress={() => router.replace(ROUTES.DASHBOARD.WORK_LOGS.path)}>
          Back to work logs
        </Button>
      </YStack>
    )
  }

  const handleAddComment = () => {
    if (!commentDraft.trim()) {
      return
    }
    addCommentMutation.mutate({
      workLogId: String(workLogId),
      message: commentDraft.trim(),
    })
  }

  const handleAddCollaborator = () => {
    if (!collaboratorIdInput.trim()) {
      toast.show('Enter a collaborator ID', {
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
      permissionLevel: collaboratorPermission,
    })
  }

  const handleTogglePermission = (collaborator: CollaboratorRecord) => {
    const collaboratorUserId = collaborator.collaborator_user_id
    if (!collaboratorUserId) {
      return
    }
    const nextLevel = collaborator.permission_level === 'edit' ? 'view' : 'edit'
    updateCollaboratorMutation.mutate({
      workLogId: String(workLogId),
      collaboratorUserId,
      permissionLevel: nextLevel,
    })
  }

  const handleRemoveCollaborator = (collaborator: CollaboratorRecord) => {
    const collaboratorUserId = collaborator.collaborator_user_id
    if (!collaboratorUserId) {
      return
    }
    removeCollaboratorMutation.mutate({
      workLogId: String(workLogId),
      collaboratorUserId,
    })
  }

  const conversation = (conversationQuery.data ?? []) as ConversationEntryRecord[]
  const collaborators = (collaboratorsQuery.data ?? []) as CollaboratorRecord[]
  const isVerified = workLog?.status === 'verified'
  const includeOnProfile = Boolean(workLog?.show_on_profile)
  const showDateRange = Boolean(workLog?.show_date_range_on_profile)
  const isPublicVisibility = workLog?.visibility === 'public'
  const visibilityMutationPending = updateProfileVisibilityMutation.isLoading
  const photoVisibilityMutationPending = updatePhotoVisibilityMutation.isLoading

  const handleShowOnProfileToggle = (next: boolean) => {
    if (!workLogId) return
    if (next && !isVerified) {
      toast.show('Pending verification', {
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

  const handlePhotoVisibilityToggle = (photoId: string, showOnProfileValue: boolean) => {
    updatePhotoVisibilityMutation.mutate({
      photoId,
      showOnProfile: showOnProfileValue,
    })
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <YStack p="$4" gap="$4">
        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <YStack gap="$1" flex={1}>
              <Text fontSize="$7" fontWeight="700">
                {project?.name ?? 'Work Log'}
              </Text>
              <Text color="$color10">
                Logged {workLog.log_date ? formatDate(workLog.log_date) : 'Date unknown'}
              </Text>
            </YStack>
            <Button size="$3" variant="outlined" icon={Edit} onPress={() => workLogQuery.refetch()}>
              Refresh
            </Button>
          </XStack>
          <Text color={getStatusColor(workLog.status)} fontWeight="600">
            {getStatusLabel(workLog.status)}
          </Text>
        </YStack>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <Text fontSize="$6" fontWeight="700">
              Summary
            </Text>
            <XStack gap="$4" flexWrap="wrap">
              <SummaryMetric
                icon={Activity}
                label="Total hours"
                value={`${totalHours.toFixed(2)}h`}
              />
              <SummaryMetric
                icon={FileText}
                label="Entry type"
                value={workLog.entry_type ?? 'Daily'}
              />
              <SummaryMetric
                icon={ShieldCheck}
                label="Visibility"
                value={workLog.visibility === 'public' ? 'Public' : 'Private'}
              />
            </XStack>
            <Separator />
            <YStack gap="$2">
              <Text fontWeight="600">Description</Text>
              <Paragraph color="$color10">
                {workLog.work_description || 'No description provided.'}
              </Paragraph>
            </YStack>
          </YStack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <Text fontSize="$6" fontWeight="700">
              Profile visibility
            </Text>
            <Paragraph color="$color10">
              Control how this work log appears on your public profile.
            </Paragraph>
            {!isVerified && (
              <Paragraph color="$orange10" fontWeight="600">
                This work log must be verified before it can be shared publicly.
              </Paragraph>
            )}
            <YStack gap="$4">
              <XStack justify="space-between" items="center" gap="$4">
                <YStack gap="$1" flex={1}>
                  <Text fontWeight="600">Show on public profile</Text>
                  <Paragraph color="$color10">
                    Display this work log on your public profile. Only verified work is eligible.
                  </Paragraph>
                </YStack>
                <ToggleSwitch
                  checked={includeOnProfile}
                  disabled={!isVerified || visibilityMutationPending}
                  onCheckedChange={handleShowOnProfileToggle}
                  testID="work-log-profile-toggle"
                />
              </XStack>

              <XStack justify="space-between" items="center" gap="$4">
                <YStack gap="$1" flex={1}>
                  <Text fontWeight="600">Show date on profile</Text>
                  <Paragraph color="$color10">
                    When enabled, the logged date is shown on your public profile.
                  </Paragraph>
                </YStack>
                <ToggleSwitch
                  checked={showDateRange}
                  disabled={!includeOnProfile || visibilityMutationPending}
                  onCheckedChange={handleShowDateRangeToggle}
                  testID="work-log-date-toggle"
                />
              </XStack>

              <XStack justify="space-between" items="center">
                <YStack gap="$1">
                  <Text fontWeight="600">Verification status</Text>
                  <Paragraph color="$color10">
                    {isVerified
                      ? 'Verified entries display a “Verified by Scaffald” badge on your public profile.'
                      : 'Awaiting verification. Visibility controls unlock once this log is verified.'}
                  </Paragraph>
                </YStack>
                <Text
                  bg={isVerified ? '$green4' : '$yellow4'}
                  color={isVerified ? '$green11' : '$yellow11'}
                  px="$3"
                  py="$1"
                  rounded="$4"
                  fontWeight="600"
                >
                  {isVerified ? 'Verified' : 'Pending'}
                </Text>
              </XStack>

              <XStack justify="space-between" items="center">
                <YStack gap="$1">
                  <Text fontWeight="600">Current visibility</Text>
                  <Paragraph color="$color10">
                    {isPublicVisibility
                      ? 'This work log is set to public visibility.'
                      : 'This work log is currently private.'}
                  </Paragraph>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <Text fontSize="$6" fontWeight="700">
              Time entries
            </Text>
            <YStack gap="$2">
              {timeEntryItems.length === 0 ? (
                <Paragraph color="$color10">No time entries recorded.</Paragraph>
              ) : (
                timeEntryItems.map((entry) => (
                  <XStack
                    key={entry.key}
                    justify="space-between"
                    bg="$color3"
                    px="$3"
                    py="$2"
                    rounded="$4"
                  >
                    <Text fontWeight="600">
                      {entry.start}–{entry.end}
                    </Text>
                    <Text color="$color10">{computeEntryHours(entry.start, entry.end)}h</Text>
                  </XStack>
                ))
              )}
            </YStack>
          </YStack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <Text fontSize="$6" fontWeight="700">
              Tasks completed
            </Text>
            {taskItems.length === 0 ? (
              <Paragraph color="$color10">No tasks recorded for this entry.</Paragraph>
            ) : (
              <YStack gap="$2">
                {taskItems.map((task) => (
                  <XStack key={task.key} bg="$color3" px="$3" py="$2" rounded="$4">
                    <Text>{task.task}</Text>
                  </XStack>
                ))}
              </YStack>
            )}
            <Separator />
            <Text fontSize="$6" fontWeight="700">
              Skills used
            </Text>
            {skillNames.length === 0 ? (
              <Paragraph color="$color10">No skills associated with this log.</Paragraph>
            ) : (
              <XStack gap="$2" flexWrap="wrap">
                {skillNames.map((skill) => (
                  <Text key={skill} bg="$color3" px="$3" py="$1" rounded="$4">
                    {skill}
                  </Text>
                ))}
              </XStack>
            )}
          </YStack>
        </Card>

        {photos.length > 0 && (
          <Card borderColor="$color6" borderWidth={1}>
            <YStack gap="$3" p="$3">
              <Text fontSize="$6" fontWeight="700">
                Photos
              </Text>
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
            </YStack>
          </Card>
        )}

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <XStack justify="space-between" items="center">
              <Text fontSize="$6" fontWeight="700">
                Collaborators
              </Text>
              <Button
                size="$3"
                icon={Users}
                variant="outlined"
                onPress={() => collaboratorsQuery.refetch()}
              >
                Refresh
              </Button>
            </XStack>
            <Paragraph color="$color10">
              Share this work log with teammates to give them edit or view access.
            </Paragraph>
            <YStack gap="$2">
              {collaborators.length === 0 ? (
                <Paragraph color="$color10">No collaborators yet.</Paragraph>
              ) : (
                collaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.id}
                    collaborator={collaborator}
                    isUpdating={
                      updateCollaboratorMutation.isLoading || removeCollaboratorMutation.isLoading
                    }
                    onTogglePermission={() => handleTogglePermission(collaborator)}
                    onRemove={() => handleRemoveCollaborator(collaborator)}
                  />
                ))
              )}
            </YStack>
            <Separator />
            <YStack gap="$2">
              <Text fontWeight="600">Add collaborator</Text>
              <Input
                placeholder="Collaborator user ID"
                value={collaboratorIdInput}
                onChangeText={setCollaboratorIdInput}
              />
              <XStack gap="$2">
                <Button
                  flex={1}
                  size="$3"
                  variant={collaboratorPermission === 'view' ? 'default' : 'outlined'}
                  onPress={() => setCollaboratorPermission('view')}
                >
                  View
                </Button>
                <Button
                  flex={1}
                  size="$3"
                  variant={collaboratorPermission === 'edit' ? 'default' : 'outlined'}
                  onPress={() => setCollaboratorPermission('edit')}
                >
                  Edit
                </Button>
              </XStack>
              <Button
                size="$3"
                icon={Users}
                loading={addCollaboratorMutation.isLoading}
                onPress={handleAddCollaborator}
              >
                Add collaborator
              </Button>
            </YStack>
          </YStack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <XStack justify="space-between" items="center">
              <Text fontSize="$6" fontWeight="700">
                Conversation
              </Text>
              <Button
                size="$3"
                icon={MessageSquare}
                variant="outlined"
                onPress={() => conversationQuery.refetch()}
              >
                Refresh
              </Button>
            </XStack>
            <YStack gap="$3">
              {conversation.length === 0 ? (
                <Paragraph color="$color10">
                  No messages yet. Start the conversation to give additional context.
                </Paragraph>
              ) : (
                conversation.map((entry) => (
                  <ConversationEntry key={entry.id} entry={entry} currentUserId={workLog.user_id} />
                ))
              )}
            </YStack>
            <Separator />
            <YStack gap="$2">
              <Text fontWeight="600">Add message</Text>
              <Input
                multiline
                numberOfLines={4}
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Share an update or ask a question…"
              />
              <Button
                size="$3"
                icon={MessageSquare}
                loading={addCommentMutation.isLoading}
                onPress={handleAddComment}
              >
                Post message
              </Button>
            </YStack>
          </YStack>
        </Card>

        <Card borderColor="$color6" borderWidth={1}>
          <YStack gap="$3" p="$3">
            <Text fontSize="$6" fontWeight="700">
              Exports
            </Text>
            <Paragraph color="$color10">
              Generate a shareable export for reporting or offline records. Links expire after ten
              minutes.
            </Paragraph>
            <XStack gap="$3" flexWrap="wrap">
              <Button
                size="$4"
                icon={DownloadCloud}
                loading={exportMutation.isLoading && exportMutation.variables?.format === 'pdf'}
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
                size="$4"
                icon={DownloadCloud}
                variant="outlined"
                loading={exportMutation.isLoading && exportMutation.variables?.format === 'csv'}
                onPress={() =>
                  exportMutation.mutate({
                    workLogId: String(workLogId),
                    format: 'csv',
                  })
                }
              >
                Export CSV
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
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
    <XStack bg="$color3" px="$3" py="$2" rounded="$4" gap="$2" items="center">
      <IconComponent size={16} color="currentColor" />
      <YStack gap="$1">
        <Text fontWeight="600">{value}</Text>
        <Text fontSize="$3" color="$color10">
          {label}
        </Text>
      </YStack>
    </XStack>
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
      <YStack gap="$2" p="$3">
        <Text fontWeight="600">{displayName}</Text>
        <Text color="$color10">Permission: {permission === 'edit' ? 'Can edit' : 'View only'}</Text>
        <XStack gap="$2">
          <Button size="$3" variant="outlined" disabled={isUpdating} onPress={onTogglePermission}>
            Toggle permission
          </Button>
          <Button
            size="$3"
            variant="outlined"
            color="$red10"
            disabled={isUpdating}
            onPress={onRemove}
          >
            Remove
          </Button>
        </XStack>
      </YStack>
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
    <YStack
      bg={isSystemMessage ? '$color4' : isOwner ? '$color3' : '$color2'}
      px="$3"
      py="$2"
      rounded="$4"
      gap="$1"
    >
      <XStack justify="space-between">
        <Text fontWeight="600">{authorName}</Text>
        <Text color="$color10">{entry.created_at ? formatDate(entry.created_at) : ''}</Text>
      </XStack>
      <Paragraph>{entry.message}</Paragraph>
    </YStack>
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
