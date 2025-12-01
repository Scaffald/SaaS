import { ROUTES, buildPath } from '@app/core/constants/routes'
import { formatDate } from '@app/core/features/profile/utils/date-formatting'
import { api } from '@app/core/utils/api'

import { DashboardWidget, ToggleSwitch } from '@unicornlove/ui'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { Button, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type { WorkLogListItem } from '../schemas'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

export function WorkLogVisibilitySettingsCard() {
  const router = useRouter()
  const toast = useToastController()
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
      toast.show('Unable to update visibility', {
        message: message ?? 'Please try again.',
      })
    },
  })

  const items: WorkLogListItem[] = listQuery.data?.items ?? []

  return (
    <DashboardWidget>
      <YStack gap="$3">
        <Text fontSize="$6" fontWeight="700">
          Work log profile visibility
        </Text>
        <Paragraph color="$color10">
          Choose which verified work logs appear on your public profile. Manage individual entries
          and jump directly to the detailed view for more options.
        </Paragraph>

        {listQuery.isLoading ? (
          <XStack gap="$2" items="center">
            <Spinner size="small" />
            <Text color="$color10">Loading work logs…</Text>
          </XStack>
        ) : items.length === 0 ? (
          <Paragraph color="$color10">
            Create and verify a work log to manage its public visibility.
          </Paragraph>
        ) : (
          <YStack gap="$3">
            {items.map((item) => {
              const isVerified = item.status === 'verified'
              const statusColor = getStatusColor(item.status)
              return (
                <YStack
                  key={item.id}
                  borderWidth={1}
                  borderColor="$color6"
                  rounded="$4"
                  px="$3"
                  py="$3"
                  gap="$3"
                  bg="$color2"
                >
                  <XStack justify="space-between" items="center">
                    <YStack gap="$1" flex={1}>
                      <Text fontWeight="700">{item.project?.name ?? 'Work Log'}</Text>
                      <Text color="$color10">
                        {item.logDate ? formatDate(item.logDate) : 'Date not recorded'}
                      </Text>
                    </YStack>
                    <Text color={statusColor as never} fontWeight="600">
                      {getStatusLabel(item.status)}
                    </Text>
                  </XStack>

                  <XStack justify="space-between" items="center" gap="$4">
                    <YStack gap="$1" flex={1}>
                      <Text fontWeight="600">Show on public profile</Text>
                      <Paragraph color="$color10">
                        Only verified logs can be shown publicly. Disable to hide this entry.
                      </Paragraph>
                    </YStack>
                    <ToggleSwitch
                      checked={item.showOnProfile}
                      disabled={!isVerified || updateProfileVisibilityMutation.isPending}
                      onCheckedChange={(checked) => {
                        if (!isVerified && checked) {
                          toast.show('Pending verification', {
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
                  </XStack>

                  <XStack justify="space-between" items="center" gap="$4">
                    <YStack gap="$1" flex={1}>
                      <Text fontWeight="600">Show date on profile</Text>
                      <Paragraph color="$color10">
                        Display the logged date alongside this entry on your public profile.
                      </Paragraph>
                    </YStack>
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
                  </XStack>

                  <XStack justify="flex-end">
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
                  </XStack>
                </YStack>
              )
            })}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
