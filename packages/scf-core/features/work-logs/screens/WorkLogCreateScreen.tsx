import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { Button, Separator, Text, Stack } from '@scaffald/ui'

import { WorkLogForm } from '../components/WorkLogForm'

export function WorkLogCreateScreen() {
  const router = useRouter()
  const toast = useToast()

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Stack padding="md" gap={16}>
        <Stack gap={4}>
          <Text>Record work log</Text>
          <Text color="$gray11">
            Document the work performed today, capture time entries, tasks, and skills used.
          </Text>
        </Stack>

        <Separator />

        <WorkLogForm
          submitLabel="Save Work Log"
          onSubmitSuccess={(workLogId) => {
            toast.show({
              title: 'Work log saved',
              message: 'You can review or edit this entry at any time.',
              variant: 'success',
            })
            router.replace(buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId }))
          }}
        />

        <Button size="sm" variant="outline" onPress={() => router.back()}>
          Cancel
        </Button>
      </Stack>
    </ScrollView>
  )
}
