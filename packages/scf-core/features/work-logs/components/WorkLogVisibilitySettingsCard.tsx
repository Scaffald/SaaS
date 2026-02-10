import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { api } from '@scf/core/utils/api'

import { DashboardWidget, ToggleSwitch } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Button, Paragraph, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { WorkLogListItem } from '@scf/schemas'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

export function WorkLogVisibilitySettingsCard() {
  const router = useRouter()
  const toast = useToast()
  const trpcUtils = api.useContext()

  const listQuery = api.workLogs.list.useQuery(
    {
      pageSize: 10,
      sortField: 'updated_at',
      sortDirection: 'desc',
    },
    { staleTime: 30_000 }
  )

  const updateProfileVisibilityMutation = api.workLogs.updateProfileVisibility.useMutation({
    onSuccess: async () => {
      toast.show('Visibility updated')
      await trpcUtils.workLogs.list.invalidate()
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

  const items: WorkLogListItem[] = listQuery.data?.items ?? []

  return (
    <DashboardWidget>
      <Stack gap="$3">
        <Text fontSize="$6" fontWeight="700">
          Work log profile visibility
        </Text>
        <Paragraph color="$color10">
          Choose which verified work logs appear on your public profile. Manage individual entries
          and jump directly to the detailed view for more options.
        </Paragraph>

        {listQuery.isLoading ? (
          <Row gap="$2" alignItems="center">
            <Spinner size="small" />
            <Text color="$color10">Loading work logs…</Text>
          </Row>
        ) : items.length === 0 ? (
          <Paragraph color="$color10">
            Create and verify a work log to manage its public visibility.
          </Paragraph>
        ) : (
          <Stack gap="$3">
            {items.map((item) => {
              const isVerified = item.status === 'verified'
              const statusColor = getStatusColor(item.status)
              return (
                <Stack
                  key={item.id}
                  borderWidth={1}
                  borderColor="$color6"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$3"
                  gap="$3"
                  backgroundColor="$color2"
                >
                  <Row justifyContent="space-between" alignItems="center">
                    <Stack gap="$1" flex={1}>
                      <Text fontWeight="700">{item.project?.name ?? 'Work Log'}</Text>
                      <Text color="$color10">
                        {item.logDate ? formatDate(item.logDate) : 'Date not recorded'}
                      </Text>
                    </Stack>
                    <Text color={statusColor as never} fontWeight="600">
                      {getStatusLabel(item.status)}
                    </Text>
                  </Row>

                  <Row justifyContent="space-between" alignItems="center" gap="$4">
                    <Stack gap="$1" flex={1}>
                      <Text fontWeight="600">Show on public profile</Text>
                      <Paragraph color="$color10">
                        Only verified logs can be shown publicly. Disable to hide this entry.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={item.showOnProfile}
                      disabled={!isVerified || updateProfileVisibilityMutation.isPending}
                      onCheckedChange={(checked) => {
                        if (!isVerified && checked) {
                          toast.show({
          title: 'Pending verification',
          message: 'Work logs must be verified before they can appear on your profile.',
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

                  <Row justifyContent="space-between" alignItems="center" gap="$4">
                    <Stack gap="$1" flex={1}>
                      <Text fontWeight="600">Show date on profile</Text>
                      <Paragraph color="$color10">
                        Display the logged date alongside this entry on your public profile.
                      </Paragraph>
                    </Stack>
                    <ToggleSwitch
                      checked={item.showDateRangeOnProfile}
                      disabled={!item.showOnProfile || updateProfileVisibilityMutation.isPending}
                      onCheckedChange={(checked) => {
                        updateProfileVisibilityMutation.mutate({
                          workLogId: item.id,
                          showDateRangeOnProfile: checked,
                        })
                      }}
                      testID={`date-range-toggle-${item.id}`}
                    />
                  </Row>

                  <Row justifyContent="flex-end">
                    <Button
                      size="$3"
                      variant="outlined"
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
