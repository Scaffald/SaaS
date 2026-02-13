import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import {
  useWorkLogs,
  useUpdateWorkLogProfileVisibilityMutation,
} from '@scf/core/utils/work-logs-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'

import { DashboardWidget, ToggleSwitch } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Button, Paragraph, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { WorkLogListItem } from '@scf/schemas'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

export function WorkLogVisibilitySettingsCard() {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const listQuery = useWorkLogs(
    {
      pageSize: 10,
      sortField: 'updated_at',
      sortDirection: 'desc',
    },
    { staleTime: 30_000 }
  )

  const updateProfileVisibilityMutation = useUpdateWorkLogProfileVisibilityMutation({
    onSuccess: async () => {
      toast.show({ title: 'Visibility updated' })
      await queryClient.invalidateQueries({ queryKey: ['workLogs', 'list'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined
      toast.show({
        title: 'Unable to update visibility',
        message: message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const items: WorkLogListItem[] = listQuery.data?.workLogs ?? []

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <Text>Work log profile visibility</Text>
        <Paragraph color="$gray11">
          Choose which verified work logs appear on your public profile. Manage individual entries
          and jump directly to the detailed view for more options.
        </Paragraph>

        {listQuery.isLoading ? (
          <Row gap={8} align="center">
            <Spinner size="sm" />
            <Text color="$gray11">Loading work logs…</Text>
          </Row>
        ) : items.length === 0 ? (
          <Paragraph color="$gray11">
            Create and verify a work log to manage its public visibility.
          </Paragraph>
        ) : (
          <Stack gap={12}>
            {items.map((item) => {
              const isVerified = item.status === 'verified'
              const statusColor = getStatusColor(item.status)
              return (
                <Stack
                  key={item.id}
                  borderWidth={1}
                  borderColor="$color6"
                  borderRadius={16}
                  paddingHorizontal={12}
                  paddingVertical={12}
                  gap={12}
                  backgroundColor="$color2"
                >
                  <Row justify="space-between" align="center">
                    <Stack gap={4} flex={1}>
                      <Text>{item.project?.name ?? 'Work Log'}</Text>
                      <Text color="$gray11">
                        {item.logDate ? formatDate(item.logDate) : 'Date not recorded'}
                      </Text>
                    </Stack>
                    <Text color={statusColor as never}>{getStatusLabel(item.status)}</Text>
                  </Row>

                  <Row justify="space-between" align="center" gap={16}>
                    <Stack gap={4} flex={1}>
                      <Text>Show on public profile</Text>
                      <Paragraph color="$gray11">
                        Only verified logs can be shown publicly. Disable to hide this entry.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={item.showOnProfile}
                      disabled={!isVerified || updateProfileVisibilityMutation.isPending}
                      onChange={(checked) => {
                        if (!isVerified && checked) {
                          toast.show({
                            title: 'Pending verification',
                            message:
                              'Work logs must be verified before they can appear on your profile.',
                          })
                          return
                        }
                        updateProfileVisibilityMutation.mutate({
                          workLogId: item.id,
                          showOnProfile: checked,
                          visibility: checked ? 'public' : 'private',
                        })
                      }}
                      testID={`profile-visibility-toggle-${item.id}`}
                    />
                  </Row>

                  <Row justify="space-between" align="center" gap={16}>
                    <Stack gap={4} flex={1}>
                      <Text>Show date on profile</Text>
                      <Paragraph color="$gray11">
                        Display the logged date alongside this entry on your public profile.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={item.showDateRangeOnProfile}
                      disabled={!item.showOnProfile || updateProfileVisibilityMutation.isPending}
                      onChange={(checked) => {
                        updateProfileVisibilityMutation.mutate({
                          workLogId: item.id,
                          showDateRangeOnProfile: checked,
                        })
                      }}
                      testID={`date-range-toggle-${item.id}`}
                    />
                  </Row>

                  <Row justify="flex-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() =>
                        router.push(
                          buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId: item.id })
                        )
                      }
                    >
                      View details
                    </Button>
                  </Row>
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
