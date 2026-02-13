import { useUpdateTeam } from '@scaffald/sdk/react'
import { ResponsiveSelect, useThemeContext } from '@unicornlove/beyond-ui'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Switch, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
  const toast = useToast()

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

  const updateMutation = useUpdateTeam({
    onSuccess: () => {
      lastCommittedRef.current = JSON.stringify(debouncedFormState)
      toast.show({
        title: 'Automation updated',
        message: 'Team automation preferences saved.',
        variant: 'success',
      })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Please try again shortly.'
      toast.show({
        title: 'Unable to update automation settings',
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

    const serialized = JSON.stringify(debouncedFormState)
    if (serialized === lastCommittedRef.current) {
      return
    }

    updateMutation.mutate({
      id: teamId,
      params: {
        allowSelfJoin: debouncedFormState.allowSelfJoin,
        autoAssignJobs: debouncedFormState.autoAssignJobs,
        invitationExpirationDays: debouncedFormState.invitationExpirationDays,
        workloadStrategy: debouncedFormState.workloadStrategy as
          | 'manual'
          | 'round_robin'
          | 'load_balance',
        workloadSettings: debouncedFormState.workloadSettings,
        analyticsRefreshIntervalMinutes: debouncedFormState.analyticsRefreshIntervalMinutes,
      },
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
    <Stack gap={16}>
      <Stack gap={8}>
        <Text>Automation & workload</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Configure how the team auto-assigns work and balances workloads across members.
        </Text>
      </Stack>

      <Stack gap={12} opacity={canEdit ? 1 : 0.6}>
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

        <Stack gap={8}>
          <Text>Invitation expiration (days)</Text>
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
          <Text style={{ color: colors.text[theme].secondary }}>
            Invitations expire automatically after this number of days.
          </Text>
        </Stack>

        <Stack gap={8}>
          <Text>Workload strategy</Text>
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
          <Text style={{ color: colors.text[theme].secondary }}>
            Choose how work should be distributed when new applications arrive.
          </Text>
        </Stack>

        {formState.workloadStrategy === 'load_balance' ? (
          <Stack
            gap={12}
            paddingLeft={8}
            borderLeftWidth={2}
            borderColor={colors.border[theme].default}
          >
            <Text>Load balance settings</Text>
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
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
            </Stack>
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
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
            </Stack>
            <Text style={{ color: colors.text[theme].secondary }}>
              When a member reaches these limits, assignments roll to the next available teammate.
            </Text>
          </Stack>
        ) : null}

        <Stack gap={8}>
          <Text>Analytics refresh interval (minutes)</Text>
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
          <Text style={{ color: colors.text[theme].secondary }}>
            Controls how often analytics snapshots should refresh for this team.
          </Text>
        </Stack>
      </Stack>

      <Row justify="space-between" align="center">
        <Text style={{ color: colors.text[theme].secondary }}>{statusLabel}</Text>
        <Button
          size="xs"
          variant="outline"
          disabled={!canEdit || updateMutation.isPending}
          onPress={() => setFormState(DEFAULT_FORM_STATE)}
        >
          Reset automation
        </Button>
      </Row>
    </Stack>
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
    <Row justify="space-between" gap={12} align="center" flexWrap="wrap">
      <Stack gap={4} flex={1} style={{ minWidth: 200 }}>
        <Text>{label}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
      </Stack>
      <Switch
        size="xs"
        checked={value}
        disabled={disabled}
        onChange={(checked) => onValueChange(Boolean(checked))}
      >
        <Switch.Thumb animation="quick" />
      </Switch>
    </Row>
  )
}
