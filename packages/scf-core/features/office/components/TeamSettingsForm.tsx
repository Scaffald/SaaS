import { useUpdateTeam } from '@scaffald/sdk/react'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react-native'
import { useToast , useThemeContext} from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Control, Controller, useForm } from 'react-hook-form'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { Button, Card, Separator, Spinner, Switch, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { z } from 'zod'
import { useTeamFormOptions } from '../teams/hooks/useTeamFormOptions'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
  const toast = useToast()

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

  const updateMutation = useUpdateTeam({
    onSuccess: () => {
      setStatus('saved')
      lastSavedRef.current = JSON.stringify(debouncedValues)
      const committedMetadata = pendingMetadataRef.current ?? metadataState
      setMetadataState(committedMetadata)
      pendingMetadataRef.current = null
      if (onSettingsSaved) {
        onSettingsSaved(committedMetadata)
      }
      setTimeout(() => setStatus('idle'), 2000)
    },
    onError: (error: unknown) => {
      setStatus('error')
      pendingMetadataRef.current = null
      toast.show({
        title: 'Unable to update settings',
        message: error instanceof Error ? error.message : 'Please try again shortly.',
        variant: 'error',
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
      id: teamId,
      params: {
        // Metadata structure stored as JSON - compatible with mutation input
        metadata: nextMetadata,
      },
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

  const statusColor = status === 'error' ? '$red10' : status === 'saved' ? '$green10' : colors.text[theme].secondary

  return (
    <Card
      padding="md"
      borderWidth={1}
      borderColor={colors.border[theme].default}
      gap={16}
      style={{ backgroundColor: colors.bg[theme].subtle }}
    >
      <Stack gap={8}>
        <Text>Team settings</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Configure defaults and collaboration preferences for this team. Changes are saved
          automatically.
        </Text>
      </Stack>

      {!canEdit ? <PermissionBanner /> : null}

      <Separator />

      <Stack gap={16} opacity={canEdit ? 1 : 0.6}>
        <Stack gap={8}>
          <Text>Default role for new members</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
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
        </Stack>

        <Stack gap={12}>
          <Text>Notification preferences</Text>
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
        </Stack>

        <Stack gap={12}>
          <Text>Assignment rules</Text>
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
        </Stack>
      </Stack>

      <Separator />

      <Row justify="space-between" align="center" flexWrap="wrap" gap={12}>
        <Row gap={8} align="center">
          {updateMutation.isPending ? <Spinner size="sm" /> : null}
          <Text color={statusColor}>{statusLabel}</Text>
        </Row>
        <Button
          size="sm"
          variant="outline"
          onPress={handleReset}
          disabled={!canEdit || updateMutation.isPending}
        >
          Reset to defaults
        </Button>
      </Row>
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
        <Card
          borderWidth={1}
          borderColor={colors.border[theme].default}
          style={{ backgroundColor: colors.bg[theme].muted }}
          padding="sm"
          gap={8}
        >
          <Row justify="space-between" align="center" gap={12}>
            <Stack flex={1} gap={4}>
              <Text>{label}</Text>
              <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
            </Stack>
            <Switch
              checked={field.value}
              onChange={(value) => field.onChange(Boolean(value))}
              disabled={disabled}
              size="sm"
            >
              <Switch.Thumb />
            </Switch>
          </Row>
        </Card>
      )}
    />
  )
}

function PermissionBanner() {
  return (
    <Row
      gap={12}
      align="center"
      borderWidth={1}
      borderColor={colors.border[theme].default}
      style={{ backgroundColor: colors.bg[theme].muted }}
      borderRadius={16}
      paddingHorizontal={12}
      paddingVertical={8}
    >
      <Info size={18} style={{ color: colors.text[theme].secondary }} />
      <Stack gap={4}>
        <Text>View only</Text>
        <Text style={{ color: colors.text[theme].secondary }}>You need team admin permissions to update settings for this team.</Text>
      </Stack>
    </Row>
  )
}
