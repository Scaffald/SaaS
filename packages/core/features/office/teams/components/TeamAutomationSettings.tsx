import { api } from '@app/core/utils/api'
import { ResponsiveSelect } from '@app/ui'
import { useDebounce } from '@app/core/utils/useDebounce'
import { useToastController } from '@tamagui/toast'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Switch, Text, XStack, YStack } from 'tamagui'

const WORKLOAD_STRATEGIES = [
  { value: 'manual', label: 'Manual assignment' },
  { value: 'round_robin', label: 'Round robin' },
  { value: 'load_balance', label: 'Load balance' },
]

interface TeamAutomationSettingsProps {
  teamId: string
  allowSelfJoin: boolean
  autoAssignJobs: boolean
  invitationExpirationDays: number
  workloadStrategy: string
  workloadSettings?: Record<string, unknown> | null
  analyticsRefreshIntervalMinutes: number
  canEdit?: boolean
}

type FormState = {
  allowSelfJoin: boolean
  autoAssignJobs: boolean
  invitationExpirationDays: number
  workloadStrategy: string
  workloadSettings: {
    maxActiveAssignments?: number
    maxPendingAssignments?: number
  }
  analyticsRefreshIntervalMinutes: number
}

const DEFAULT_FORM_STATE: FormState = {
  allowSelfJoin: false,
  autoAssignJobs: false,
  invitationExpirationDays: 7,
  workloadStrategy: 'manual',
  workloadSettings: {
    maxActiveAssignments: 10,
    maxPendingAssignments: 15,
  },
  analyticsRefreshIntervalMinutes: 60,
}

export function TeamAutomationSettings({
  teamId,
  allowSelfJoin,
  autoAssignJobs,
  invitationExpirationDays,
  workloadStrategy,
  workloadSettings,
  analyticsRefreshIntervalMinutes,
  canEdit = true,
}: TeamAutomationSettingsProps) {
  const toast = useToastController()
  const utils = api.useUtils()

  const initialState = useMemo<FormState>(
    () => ({
      allowSelfJoin,
      autoAssignJobs,
      invitationExpirationDays: Math.min(Math.max(invitationExpirationDays || 7, 1), 90),
      workloadStrategy: WORKLOAD_STRATEGIES.some((item) => item.value === workloadStrategy)
        ? workloadStrategy
        : 'manual',
      workloadSettings: {
        maxActiveAssignments: Number(
          (workloadSettings as Record<string, unknown> | undefined)?.maxActiveAssignments ?? 10
        ),
        maxPendingAssignments: Number(
          (workloadSettings as Record<string, unknown> | undefined)?.maxPendingAssignments ?? 15
        ),
      },
      analyticsRefreshIntervalMinutes: Math.min(
        Math.max(analyticsRefreshIntervalMinutes || 60, 5),
        1440
      ),
    }),
    [
      allowSelfJoin,
      autoAssignJobs,
      invitationExpirationDays,
      workloadStrategy,
      workloadSettings,
      analyticsRefreshIntervalMinutes,
    ]
  )

  const [formState, setFormState] = useState<FormState>(initialState)
  const debouncedFormState = useDebounce(formState, 500)
  const lastCommittedRef = useRef<string>(JSON.stringify(initialState))
  const hasMountedRef = useRef(false)

  useEffect(() => {
    setFormState(initialState)
    lastCommittedRef.current = JSON.stringify(initialState)
  }, [initialState])

  const updateMutation = api.teams.update.useMutation({
    onSuccess: async () => {
      lastCommittedRef.current = JSON.stringify(debouncedFormState)
      toast.show('Automation updated', {
        message: 'Team automation preferences saved.',
      })
      await utils.teams.byId.invalidate({ teamId })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Please try again shortly.'
      toast.show('Unable to update automation settings', {
        message,
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

    const serialized = JSON.stringify(debouncedFormState)
    if (serialized === lastCommittedRef.current) {
      return
    }

    updateMutation.mutate({
      teamId,
      allowSelfJoin: debouncedFormState.allowSelfJoin,
      autoAssignJobs: debouncedFormState.autoAssignJobs,
      invitationExpirationDays: debouncedFormState.invitationExpirationDays,
      workloadStrategy: debouncedFormState.workloadStrategy as 'manual' | 'round_robin' | 'load_balance',
      workloadSettings: debouncedFormState.workloadSettings,
      analyticsRefreshIntervalMinutes: debouncedFormState.analyticsRefreshIntervalMinutes,
    })
  }, [debouncedFormState, teamId, canEdit, updateMutation])

  const handleWorkloadSettingChange = (
    key: 'maxActiveAssignments' | 'maxPendingAssignments',
    value: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      workloadSettings: {
        ...prev.workloadSettings,
        [key]: value,
      },
    }))
  }

  const handleRangeInput = (
    updater: (value: number) => void,
    value: string,
    { min, max, fallback }: { min: number; max: number; fallback: number }
  ) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      updater(fallback)
      return
    }
    updater(Math.min(Math.max(parsed, min), max))
  }

  const statusLabel = updateMutation.isPending ? 'Saving changes…' : 'Settings up to date'

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Automation & workload
        </Text>
        <Text color="$color11">
          Configure how the team auto-assigns work and balances workloads across members.
        </Text>
      </YStack>

      <YStack gap="$3" opacity={canEdit ? 1 : 0.6}>
        <SettingsToggle
          label="Allow members to join without an invite"
          description="Let anyone with the link join the team without approval."
          value={formState.allowSelfJoin}
          onValueChange={(next) => setFormState((prev) => ({ ...prev, allowSelfJoin: next }))}
          disabled={!canEdit || updateMutation.isPending}
        />

        <SettingsToggle
          label="Automatically assign incoming jobs"
          description="When enabled, new jobs are automatically assigned to this team."
          value={formState.autoAssignJobs}
          onValueChange={(next) => setFormState((prev) => ({ ...prev, autoAssignJobs: next }))}
          disabled={!canEdit || updateMutation.isPending}
        />

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Invitation expiration (days)
          </Text>
          <Input
            keyboardType="numeric"
            value={String(formState.invitationExpirationDays)}
            disabled={!canEdit || updateMutation.isPending}
            onChangeText={(text) =>
              handleRangeInput(
                (value) =>
                  setFormState((prev) => ({
                    ...prev,
                    invitationExpirationDays: value,
                  })),
                text,
                { min: 1, max: 90, fallback: DEFAULT_FORM_STATE.invitationExpirationDays }
              )
            }
          />
          <Text fontSize="$3" color="$color10">
            Invitations expire automatically after this number of days.
          </Text>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Workload strategy
          </Text>
          <ResponsiveSelect
            value={formState.workloadStrategy}
            onValueChange={(value: string) =>
              setFormState((prev) => ({ ...prev, workloadStrategy: value }))
            }
            placeholder="Choose workload strategy"
            disabled={!canEdit || updateMutation.isPending}
            options={WORKLOAD_STRATEGIES.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <Text fontSize="$3" color="$color10">
            Choose how work should be distributed when new applications arrive.
          </Text>
        </YStack>

        {formState.workloadStrategy === 'load_balance' ? (
          <YStack gap="$3" pl="$2" borderLeftWidth={2} borderColor="$borderColor">
            <Text fontWeight="600">Load balance settings</Text>
            <YStack gap="$2">
              <Text fontSize="$3" color="$color11">
                Maximum active assignments
              </Text>
              <Input
                keyboardType="numeric"
                value={String(formState.workloadSettings.maxActiveAssignments ?? 10)}
                disabled={!canEdit || updateMutation.isPending}
                onChangeText={(text) =>
                  handleRangeInput(
                    (value) => handleWorkloadSettingChange('maxActiveAssignments', value),
                    text,
                    { min: 1, max: 50, fallback: 10 }
                  )
                }
              />
            </YStack>
            <YStack gap="$2">
              <Text fontSize="$3" color="$color11">
                Maximum pending assignments
              </Text>
              <Input
                keyboardType="numeric"
                value={String(formState.workloadSettings.maxPendingAssignments ?? 15)}
                disabled={!canEdit || updateMutation.isPending}
                onChangeText={(text) =>
                  handleRangeInput(
                    (value) => handleWorkloadSettingChange('maxPendingAssignments', value),
                    text,
                    { min: 1, max: 100, fallback: 15 }
                  )
                }
              />
            </YStack>
            <Text fontSize="$3" color="$color10">
              When a member reaches these limits, assignments roll to the next available teammate.
            </Text>
          </YStack>
        ) : null}

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Analytics refresh interval (minutes)
          </Text>
          <Input
            keyboardType="numeric"
            value={String(formState.analyticsRefreshIntervalMinutes)}
            disabled={!canEdit || updateMutation.isPending}
            onChangeText={(text) =>
              handleRangeInput(
                (value) =>
                  setFormState((prev) => ({
                    ...prev,
                    analyticsRefreshIntervalMinutes: value,
                  })),
                text,
                { min: 5, max: 1440, fallback: DEFAULT_FORM_STATE.analyticsRefreshIntervalMinutes }
              )
            }
          />
          <Text fontSize="$3" color="$color10">
            Controls how often analytics snapshots should refresh for this team.
          </Text>
        </YStack>
      </YStack>

      <XStack justify="space-between" items="center">
        <Text fontSize="$3" color="$color10">
          {statusLabel}
        </Text>
        <Button
          size="$2"
          variant="outlined"
          disabled={!canEdit || updateMutation.isPending}
          onPress={() => setFormState(DEFAULT_FORM_STATE)}
        >
          Reset automation
        </Button>
      </XStack>
    </YStack>
  )
}

function SettingsToggle({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <XStack justify="space-between" gap="$3" items="center" flexWrap="wrap">
      <YStack gap="$1" flex={1} style={{ minWidth: 200 }}>
        <Text fontWeight="600">{label}</Text>
        <Text fontSize="$3" color="$color10">
          {description}
        </Text>
      </YStack>
      <Switch
        size="$2"
        checked={value}
        disabled={disabled}
        onCheckedChange={(checked) => onValueChange(Boolean(checked))}
      >
        <Switch.Thumb animation="quick" />
      </Switch>
    </XStack>
  )
}
