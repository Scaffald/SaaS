import { api } from '@app/core/utils/api'
import { useDebounce } from '@app/core/utils/useDebounce'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Control, Controller, useForm } from 'react-hook-form'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Card, Separator, Spinner, Switch, Text, XStack, YStack } from 'tamagui'
import { z } from 'zod'
import { useTeamFormOptions } from '../teams/hooks/useTeamFormOptions'

const DEFAULT_SETTINGS = {
  defaultRoleId: null as string | null,
  notifications: {
    newMember: true,
    memberRemoved: true,
    jobAssigned: true,
    applicationAssigned: false,
  },
  jobAssignment: {
    autoAssignApplications: false,
    requireApproval: false,
  },
}

const teamSettingsSchema = z.object({
  defaultRoleId: z.string().uuid().nullable(),
  notifications: z.object({
    newMember: z.boolean(),
    memberRemoved: z.boolean(),
    jobAssigned: z.boolean(),
    applicationAssigned: z.boolean(),
  }),
  jobAssignment: z.object({
    autoAssignApplications: z.boolean(),
    requireApproval: z.boolean(),
  }),
})

type TeamSettingsFormValues = z.infer<typeof teamSettingsSchema>

interface TeamSettingsFormProps {
  teamId: string
  organizationId: string
  metadata?: Record<string, unknown> | null
  fallbackRoleId?: string | null
  canEdit: boolean
  onSettingsSaved?: (metadata: Record<string, unknown>) => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function TeamSettingsForm({
  teamId,
  organizationId,
  metadata,
  fallbackRoleId,
  canEdit,
  onSettingsSaved,
}: TeamSettingsFormProps) {
  const toast = useToastController()
  const utils = api.useUtils()

  const [metadataState, setMetadataState] = useState<Record<string, unknown>>(
    () => (metadata ?? {}) as Record<string, unknown>
  )
  const [status, setStatus] = useState<SaveStatus>('idle')

  const lastSavedRef = useRef<string>(JSON.stringify(DEFAULT_SETTINGS))
  const lastMetadataRef = useRef<string>(JSON.stringify(metadata ?? {}))
  const hasMountedRef = useRef(false)
  const pendingMetadataRef = useRef<Record<string, unknown> | null>(null)

  const { roles, isLoading: isLoadingRoles } = useTeamFormOptions({ organizationId })

  const initialValues = useMemo(
    () => resolveSettings(metadataState, fallbackRoleId),
    [metadataState, fallbackRoleId]
  )

  const {
    control,
    watch,
    reset,
    formState: { isDirty },
    setValue,
  } = useForm<TeamSettingsFormValues>({
    resolver: zodResolver(teamSettingsSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  })

  useEffect(() => {
    const serializedMetadata = JSON.stringify(metadata ?? {})
    if (serializedMetadata === lastMetadataRef.current) {
      return
    }
    lastMetadataRef.current = serializedMetadata
    const nextValues = resolveSettings((metadata ?? {}) as Record<string, unknown>, fallbackRoleId)
    lastSavedRef.current = JSON.stringify(nextValues)
    setMetadataState((metadata ?? {}) as Record<string, unknown>)
    reset(nextValues, { keepDirty: false })
  }, [metadata, fallbackRoleId, reset])

  const watchedValues = watch()
  const debouncedValues = useDebounce(watchedValues, 800)

  const updateMutation = api.teams.update.useMutation({
    onSuccess: async () => {
      setStatus('saved')
      lastSavedRef.current = JSON.stringify(debouncedValues)
      const committedMetadata = pendingMetadataRef.current ?? metadataState
      setMetadataState(committedMetadata)
      pendingMetadataRef.current = null
      if (onSettingsSaved) {
        onSettingsSaved(committedMetadata)
      }
      await utils.teams.byId.invalidate({ teamId })
      setTimeout(() => setStatus('idle'), 2000)
    },
    // biome-ignore lint/suspicious/noExplicitAny: Mutation error type from tRPC
    onError: (error: any) => {
      setStatus('error')
      pendingMetadataRef.current = null
      toast.show('Unable to update settings', {
        message: error?.message ?? 'Please try again shortly.',
        type: 'error',
      })
    },
  })

  useEffect(() => {
    if (!canEdit) {
      return
    }
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    const serialized = JSON.stringify(debouncedValues)
    if (!isDirty || serialized === lastSavedRef.current || updateMutation.isPending) {
      return
    }

    const nextMetadata: Record<string, unknown> = {
      ...metadataState,
      settings: debouncedValues,
    }

    setStatus('saving')
    pendingMetadataRef.current = nextMetadata
    updateMutation.mutate({
      teamId,
      // biome-ignore lint/suspicious/noExplicitAny: Metadata structure stored as JSON
      metadata: nextMetadata as any,
    })
  }, [canEdit, debouncedValues, isDirty, metadataState, teamId, updateMutation])

  const handleReset = () => {
    if (!canEdit) {
      return
    }
    setValue('defaultRoleId', DEFAULT_SETTINGS.defaultRoleId, {
      shouldDirty: true,
      shouldTouch: true,
    })

    const notificationDefaults = DEFAULT_SETTINGS.notifications
    setValue('notifications.newMember', notificationDefaults.newMember, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue('notifications.memberRemoved', notificationDefaults.memberRemoved, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue('notifications.jobAssigned', notificationDefaults.jobAssigned, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue('notifications.applicationAssigned', notificationDefaults.applicationAssigned, {
      shouldDirty: true,
      shouldTouch: true,
    })

    const jobAssignmentDefaults = DEFAULT_SETTINGS.jobAssignment
    setValue('jobAssignment.autoAssignApplications', jobAssignmentDefaults.autoAssignApplications, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue('jobAssignment.requireApproval', jobAssignmentDefaults.requireApproval, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const statusLabel = (() => {
    switch (status) {
      case 'saving':
        return 'Saving changes…'
      case 'saved':
        return 'All changes saved'
      case 'error':
        return 'Changes not saved'
      default:
        return isDirty ? 'Unsaved changes' : 'Up to date'
    }
  })()

  const statusColor = status === 'error' ? '$red10' : status === 'saved' ? '$green10' : '$color11'

  return (
    <Card p="$4" borderWidth={1} borderColor="$borderColor" gap="$4" bg="$color2">
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700">
          Team settings
        </Text>
        <Text color="$color11">
          Configure defaults and collaboration preferences for this team. Changes are saved
          automatically.
        </Text>
      </YStack>

      {!canEdit ? <PermissionBanner /> : null}

      <Separator />

      <YStack gap="$4" opacity={canEdit ? 1 : 0.6}>
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Default role for new members
          </Text>
          <Text color="$color11">
            Select which role is assigned when a member is added without specifying a role.
          </Text>
          <Controller
            control={control}
            name="defaultRoleId"
            render={({ field }) => (
              <ResponsiveSelect
                value={field.value ?? 'none'}
                onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)}
                placeholder="Select a role"
                label="Default role for new members"
                disabled={!canEdit || updateMutation.isPending || isLoadingRoles}
                options={[
                  { value: 'none', label: 'Use organization default' },
                  ...roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  })),
                ]}
              />
            )}
          />
        </YStack>

        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600">
            Notification preferences
          </Text>
          <SettingsToggle
            label="Notify team when a new member joins"
            description="Send in-app notifications for new members."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="notifications.newMember"
          />
          <SettingsToggle
            label="Notify when a member is removed"
            description="Alert team admins when someone loses access."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="notifications.memberRemoved"
          />
          <SettingsToggle
            label="Notify when a job is assigned to the team"
            description="Keep the team updated on new job assignments."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="notifications.jobAssigned"
          />
          <SettingsToggle
            label="Notify when an application is assigned"
            description="Send alerts when applications are routed to this team."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="notifications.applicationAssigned"
          />
        </YStack>

        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600">
            Assignment rules
          </Text>
          <SettingsToggle
            label="Auto-assign applications to team members"
            description="Distribute applications evenly across team recruiters."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="jobAssignment.autoAssignApplications"
          />
          <SettingsToggle
            label="Require approval before assignments"
            description="Hold assignments until a team admin approves them."
            disabled={!canEdit || updateMutation.isPending}
            control={control}
            name="jobAssignment.requireApproval"
          />
        </YStack>
      </YStack>

      <Separator />

      <XStack justify="space-between" items="center" flexWrap="wrap" gap="$3">
        <XStack gap="$2" items="center">
          {updateMutation.isPending ? <Spinner size="small" /> : null}
          <Text fontSize="$3" color={statusColor}>
            {statusLabel}
          </Text>
        </XStack>
        <Button
          size="$3"
          variant="outlined"
          onPress={handleReset}
          disabled={!canEdit || updateMutation.isPending}
        >
          Reset to defaults
        </Button>
      </XStack>
    </Card>
  )
}

function resolveSettings(
  metadata: Record<string, unknown>,
  fallbackRoleId: string | null | undefined
): TeamSettingsFormValues {
  const settings = (metadata.settings as Partial<TeamSettingsFormValues> | undefined) ?? {}
  return {
    defaultRoleId:
      typeof settings.defaultRoleId === 'string'
        ? settings.defaultRoleId
        : (fallbackRoleId ?? DEFAULT_SETTINGS.defaultRoleId),
    notifications: {
      newMember: Boolean(
        settings.notifications?.newMember ?? DEFAULT_SETTINGS.notifications.newMember
      ),
      memberRemoved: Boolean(
        settings.notifications?.memberRemoved ?? DEFAULT_SETTINGS.notifications.memberRemoved
      ),
      jobAssigned: Boolean(
        settings.notifications?.jobAssigned ?? DEFAULT_SETTINGS.notifications.jobAssigned
      ),
      applicationAssigned: Boolean(
        settings.notifications?.applicationAssigned ??
          DEFAULT_SETTINGS.notifications.applicationAssigned
      ),
    },
    jobAssignment: {
      autoAssignApplications: Boolean(
        settings.jobAssignment?.autoAssignApplications ??
          DEFAULT_SETTINGS.jobAssignment.autoAssignApplications
      ),
      requireApproval: Boolean(
        settings.jobAssignment?.requireApproval ?? DEFAULT_SETTINGS.jobAssignment.requireApproval
      ),
    },
  }
}

function SettingsToggle({
  label,
  description,
  disabled,
  control,
  name,
}: {
  label: string
  description: string
  disabled: boolean
  control: Control<TeamSettingsFormValues>
  name:
    | 'notifications.newMember'
    | 'notifications.memberRemoved'
    | 'notifications.jobAssigned'
    | 'notifications.applicationAssigned'
    | 'jobAssignment.autoAssignApplications'
    | 'jobAssignment.requireApproval'
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Card borderWidth={1} borderColor="$borderColor" bg="$color3" p="$3" gap="$2">
          <XStack justify="space-between" items="center" gap="$3">
            <YStack flex={1} gap="$1">
              <Text fontWeight="600">{label}</Text>
              <Text fontSize="$3" color="$color11">
                {description}
              </Text>
            </YStack>
            <Switch
              checked={field.value}
              onCheckedChange={(value) => field.onChange(Boolean(value))}
              disabled={disabled}
              size="$3"
            >
              <Switch.Thumb />
            </Switch>
          </XStack>
        </Card>
      )}
    />
  )
}

function PermissionBanner() {
  return (
    <XStack
      gap="$3"
      items="center"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$color3"
      rounded="$4"
      px="$3"
      py="$2"
    >
      <Info size={18} color="$color11" />
      <YStack gap="$1">
        <Text fontWeight="600">View only</Text>
        <Text fontSize="$3" color="$color11">
          You need team admin permissions to update settings for this team.
        </Text>
      </YStack>
    </XStack>
  )
}
