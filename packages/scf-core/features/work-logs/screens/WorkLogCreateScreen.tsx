import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { Button, Stack } from '@scaffald/ui'

import { WorkLogForm } from '../components/WorkLogForm'

/** Shown in the shared header by the routes that render this screen. */
export const WORK_LOG_CREATE_TIP =
  'Document the work performed today, capture time entries, tasks, and skills used.'

export function WorkLogCreateScreen() {
  const router = useRouter()
  const toast = useToast()

  return (
    // No ScrollView, padding or title of its own: DashboardPage scrolls,
    // supplies the gutter and draws the title, so each was paid twice and the
    // form sat ~32px inside every edge at 390 (#1126). The routes pass the
    // tip as `screenTip`.
    <Stack gap={16}>
      <WorkLogForm
        submitLabel="Save Work Log"
        onSubmitSuccess={(workLogId) => {
          toast.show({
            title: 'Work log saved',
            message: 'You can review or edit this entry at any time.',
            variant: 'success',
          })
          router.replace(buildPath(ROUTES.EMPLOYERS.LOGS.DETAIL, { workLogId }))
        }}
      />

      <Button size="sm" variant="outline" onPress={() => router.back()}>
        Cancel
      </Button>
    </Stack>
  )
}
